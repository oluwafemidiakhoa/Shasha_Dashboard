// scripts/sendDailyDigestSMTP.js  
// Updated version using SMTP instead of Resend
import nodemailer from 'nodemailer';
import { format } from 'date-fns';

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';
const FX_BASE = 'https://api.exchangerate.host';

const SERIES = {
  CPI: { id: 'CPIAUCSL', label: 'Consumer Price Index', unit: 'index' },
  UNRATE: { id: 'UNRATE', label: 'Unemployment Rate', unit: 'percent' },
  DGS10: { id: 'DGS10', label: '10-Year Treasury', unit: 'percent' },
  DGS3MO: { id: 'DGS3MO', label: '3-Month Treasury', unit: 'percent' },
  MORTGAGE30US: { id: 'MORTGAGE30US', label: '30-Year Mortgage Rate', unit: 'percent' }
};

function pct(n) { return Number.isFinite(n) ? (n * 100) : NaN; }
function safeNum(x) { const n = Number(x); return Number.isFinite(n) ? n : NaN; }
function last(arr, k = 1) { return arr[arr.length - k]; }

async function fetchFredSeries(seriesId, apiKey, months = 60) {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(end.getMonth() - months - 1);
  const qs = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: 'json',
    observation_start: start.toISOString().slice(0, 10),
    observation_end: end.toISOString().slice(0, 10)
  });
  const res = await fetch(`${FRED_BASE}?${qs}`);
  if (!res.ok) throw new Error(`FRED ${seriesId} ${res.status}`);
  const json = await res.json();
  const series = (json.observations || [])
    .map(o => ({ date: o.date, value: safeNum(o.value) }))
    .filter(p => Number.isFinite(p.value));
  return series;
}

function computeDeltas(series) {
  if (!series || series.length < 13) return { latest: NaN, yoy: NaN, mom: NaN };
  const latest = last(series).value;
  const m1 = last(series, 2)?.value;
  const y1 = series[series.length - 13]?.value;
  const mom = m1 ? ((latest / m1) - 1) * 100 : NaN;
  const yoy = y1 ? ((latest / y1) - 1) * 100 : NaN;
  return { latest, mom, yoy };
}

function stdev(arr) {
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  const v = arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
  return Math.sqrt(v);
}

function detectTrend(series, mom, unit) {
  if (!Number.isFinite(mom)) return 'STABLE';
  const last7 = series.slice(-7).map((_, i, a) => {
    if (i === 0) return null; const prev = a[i - 1].value; const cur = a[i].value;
    return ((cur / prev) - 1) * 100;
  }).filter(Boolean);
  const vol = stdev(last7 || [0]);
  const eps = unit === 'index' ? 0.1 : 0.15; // pp
  if (Math.abs(mom) <= eps) return 'STABLE';
  if (Math.abs(mom) > 1.25 * vol) return mom > 0 ? 'VOLATILE_UP' : 'VOLATILE_DOWN';
  return mom > 0 ? 'RISING' : 'FALLING';
}

function ideas(ind, fx) {
  const out = [];
  const d3 = ind.DGS3MO, d10 = ind.DGS10, cpi = ind.CPI, un = ind.UNRATE, m30 = ind.MORTGAGE30US;
  if (d3.latest >= 4.5) out.push({
    title: 'Earn yield on idle cash',
    rationale: 'Short T-Bills/HYSA may offer attractive yields versus checking accounts.',
    confidence: 0.9
  });
  if (d3.latest >= d10.latest && cpi.yoy >= 0) out.push({
    title: 'Stay short duration',
    rationale: 'Yield curve inversion with non-falling inflation favors short-duration over long bonds.',
    confidence: 0.7
  });
  if (un.yoy <= -0.2 && cpi.mom <= 0) out.push({
    title: 'Risk-on DCA',
    rationale: 'Improving labor + non-accelerating inflation supports steady DCA into broad equities.',
    confidence: 0.6
  });
  if (m30.mom <= -0.25) out.push({
    title: 'Refi check',
    rationale: 'Mortgage rates dropped ≥25bp MoM; consider a refinance quote.',
    confidence: 0.65
  });
  if (Math.abs(fx.USDNGN.mom) >= 3) out.push({
    title: 'Optimize USD↔NGN conversions',
    rationale: 'Use big monthly moves to batch or stagger transfers depending on direction.',
    confidence: 0.8
  });
  return out.slice(0, 5);
}

async function fxTimeseries(base = 'USD', symbols = ['NGN','GBP','EUR'], months = 13) {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(end.getMonth() - months);
  const qs = new URLSearchParams({ base, symbols: symbols.join(','), start_date: start.toISOString().slice(0,10), end_date: end.toISOString().slice(0,10) });
  const res = await fetch(`${FX_BASE}/timeseries?${qs}`);
  if (!res.ok) throw new Error(`FX ${res.status}`);
  const json = await res.json();
  // fold into series per symbol
  const map = {};
  for (const sym of symbols) map[sym] = [];
  const dates = Object.keys(json.rates || {}).sort();
  for (const d of dates) {
    const row = json.rates[d];
    for (const sym of symbols) {
      const val = row?.[sym];
      if (typeof val === 'number') map[sym].push({ date: d, value: val });
    }
  }
  return map; // { NGN: [{date,value}], GBP: [...], ... }
}

function computeFxDeltas(series) {
  const latest = last(series)?.value;
  const m1 = last(series, 2)?.value;
  const y1 = series[series.length - 13]?.value;
  const mom = m1 ? ((latest / m1) - 1) * 100 : NaN;
  const yoy = y1 ? ((latest / y1) - 1) * 100 : NaN;
  return { latest, mom, yoy };
}

function fmtPct(n) { return Number.isFinite(n) ? `${n.toFixed(1)}%` : '—'; }
function fmtNum(n, unit) {
  if (!Number.isFinite(n)) return '—';
  if (unit === 'index') return n.toFixed(1);
  return `${n.toFixed(2)}%`;
}

function renderEmail({ date, timezone, indicators, fx, dashboardUrl }) {
  const indRows = Object.values(indicators).map(i =>
    `<tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 8px; font-weight: 600;">${i.label}</td><td style="padding: 8px;">${fmtNum(i.latest, i.unit)}</td><td style="padding: 8px; color: ${i.yoy >= 0 ? '#059669' : '#dc2626'};">${fmtPct(i.yoy)}</td><td style="padding: 8px; color: ${i.mom >= 0 ? '#059669' : '#dc2626'};">${fmtPct(i.mom)}</td><td style="padding: 8px;"><span style="background: ${getTrendBgColor(i.trend)}; color: ${getTrendTextColor(i.trend)}; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">${i.trend}</span></td></tr>`
  ).join('');
  
  const fxRows = Object.entries(fx).filter(([k]) => k !== 'ideas').map(([pair, v]) =>
    `<li style="margin: 8px 0; padding: 8px; background: #f9fafb; border-radius: 4px;"><strong>${pair}</strong> — ${v.latest?.toFixed(4) ?? '—'} (MoM <span style="color: ${v.mom >= 0 ? '#059669' : '#dc2626'};">${fmtPct(v.mom)}</span>, YoY <span style="color: ${v.yoy >= 0 ? '#059669' : '#dc2626'};">${fmtPct(v.yoy)}</span>)</li>`
  ).join('');
  
  const ideasList = (fx.ideas || []).map(x =>
    `<li style="margin: 12px 0; padding: 12px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;"><strong style="color: #1f2937;">${x.title}</strong><span style="background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${Math.round(x.confidence * 100)}%</span></div><p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">${x.rationale}</p></li>`
  ).join('');
  
  return `<!doctype html><html><head><meta charset="utf-8"><title>Morning Macro Brief</title></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
<div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
<header style="text-align: center; margin-bottom: 32px;">
<h1 style="color: #1f2937; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">Morning Macro Brief</h1>
<p style="color: #6b7280; margin: 0; font-size: 14px;">${date} (${timezone})</p>
</header>
<div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px; margin-bottom: 24px;">
<p style="margin: 0; font-size: 13px; color: #92400e;"><strong>Snapshot of key indicators with quick ideas. Not financial advice.</strong></p>
</div>
<section style="margin-bottom: 32px;">
<h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Economic Indicators</h2>
<table style="width: 100%; border-collapse: collapse; font-size: 14px;">
<thead><tr style="background: #f3f4f6;"><th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Indicator</th><th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Latest</th><th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">YoY</th><th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">MoM</th><th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Trend</th></tr></thead>
<tbody>${indRows}</tbody>
</table>
</section>
<section style="margin-bottom: 32px;">
<h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Exchange Rates</h2>
<ul style="list-style: none; padding: 0; margin: 0;">${fxRows}</ul>
</section>
<section style="margin-bottom: 32px;">
<h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Market Insights</h2>
<ol style="padding-left: 0; margin: 0;">${ideasList}</ol>
</section>
<div style="text-align: center; margin: 32px 0;">
<a href="${dashboardUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Open Full Dashboard</a>
</div>
<footer style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 32px;">
<p style="font-size: 11px; color: #6b7280; text-align: center; margin: 0;"><strong>Disclaimer:</strong> This email is for informational purposes only and not investment advice.<br>Data sources: Federal Reserve Economic Data (FRED), exchangerate.host</p>
</footer>
</div>
</body></html>`;
}

function getTrendBgColor(trend) {
  switch (trend) {
    case 'RISING': return '#d1fae5';
    case 'FALLING': return '#fee2e2';
    case 'VOLATILE_UP': return '#fef3c7';
    case 'VOLATILE_DOWN': return '#fed7aa';
    case 'STABLE': return '#f3f4f6';
    default: return '#f3f4f6';
  }
}

function getTrendTextColor(trend) {
  switch (trend) {
    case 'RISING': return '#065f46';
    case 'FALLING': return '#991b1b';
    case 'VOLATILE_UP': return '#92400e';
    case 'VOLATILE_DOWN': return '#9a3412';
    case 'STABLE': return '#374151';
    default: return '#374151';
  }
}

async function main() {
  const {
    VITE_FRED_API_KEY: FRED_KEY,
    SMTP_USER = 'foundryai@getfoundryai.com',
    SMTP_PASS = 'Flindell1977@',
    DAILY_DIGEST_TO = 'foundryai@getfoundryai.com',
    TIMEZONE = 'America/New_York',
    DASHBOARD_URL = 'http://localhost:3000'
  } = process.env;
  
  if (!FRED_KEY) throw new Error('Missing FRED key');

  console.log('Fetching economic data...');
  
  // Fetch indicators
  const entries = await Promise.all(Object.entries(SERIES).map(async ([key, meta]) => {
    const series = await fetchFredSeries(meta.id, FRED_KEY);
    const { latest, mom, yoy } = computeDeltas(series);
    const trend = detectTrend(series, mom, meta.unit);
    return [key, { ...meta, latest, mom, yoy, trend, updatedAt: last(series)?.date, series }];
  }));
  const indicators = Object.fromEntries(entries);

  console.log('Fetching FX data...');
  
  // FX
  const fxSeries = await fxTimeseries('USD', ['NGN','GBP','EUR']);
  const fx = {
    USDNGN: computeFxDeltas(fxSeries.NGN),
    USDGBP: computeFxDeltas(fxSeries.GBP),
    USDEUR: computeFxDeltas(fxSeries.EUR)
  };

  const tipList = ideas(indicators, { USDNGN: fx.USDNGN });
  const html = renderEmail({
    date: format(new Date(), 'yyyy-MM-dd'),
    timezone: TIMEZONE,
    indicators,
    fx: { USDNGN: fx.USDNGN, USDGBP: fx.USDGBP, USDEUR: fx.USDEUR, ideas: tipList },
    dashboardUrl: DASHBOARD_URL
  });

  console.log('Setting up email transporter...');
  
  // Create transporter for Zoho SMTP  
  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 587,
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Verify connection
  try {
    await transporter.verify();
    console.log('SMTP connection verified');
  } catch (error) {
    console.error('SMTP verification failed:', error);
    throw error;
  }

  const toList = DAILY_DIGEST_TO.split(',').map(s => s.trim()).filter(Boolean);
  if (toList.length === 0) throw new Error('No recipients in DAILY_DIGEST_TO');

  console.log('Sending email to:', toList.join(', '));

  await transporter.sendMail({
    from: SMTP_USER,
    to: toList.join(','),
    subject: 'Morning Macro Brief',
    html
  });

  console.log('✅ Digest sent successfully!');
}

main().catch(err => { 
  console.error('❌ Error:', err.message); 
  process.exit(1); 
});