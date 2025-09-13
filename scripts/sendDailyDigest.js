// scripts/sendDailyDigest.js
// Node 20+: uses built-in fetch. Minimal deps: `npm i resend date-fns`
import { Resend } from 'resend';
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
    `<tr><td><strong>${i.label}</strong></td><td>${fmtNum(i.latest, i.unit)}</td><td>${fmtPct(i.yoy)}</td><td>${fmtPct(i.mom)}</td><td>${i.trend}</td></tr>`
  ).join('');
  const fxRows = Object.entries(fx).filter(([k]) => k !== 'ideas').map(([pair, v]) =>
    `<li>${pair} — ${v.latest?.toFixed(4) ?? '—'} (MoM ${fmtPct(v.mom)}, YoY ${fmtPct(v.yoy)})</li>`
  ).join('');
  const ideasList = (fx.ideas || []).map(x =>
    `<li><strong>${x.title}</strong> — ${x.rationale} (confidence ${x.confidence})</li>`
  ).join('');
  return `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif">
  <h2>Morning Macro Brief — ${date} (${timezone})</h2>
  <p>Snapshot of key indicators with quick ideas. Not financial advice.</p>
  <table role="presentation" width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse">
    <tr><th>Indicator</th><th>Latest</th><th>YoY</th><th>MoM</th><th>Trend</th></tr>
    ${indRows}
  </table>
  <h3>FX</h3>
  <ul>${fxRows}</ul>
  <h3>Ideas</h3>
  <ol>${ideasList}</ol>
  <p><a href="${dashboardUrl}">Open dashboard</a></p>
  <hr/><small>This email is for informational purposes only and not investment advice.</small>
</body></html>`;
}

async function main() {
  const {
    VITE_FRED_API_KEY: FRED_KEY,
    RESEND_API_KEY,
    RESEND_FROM = 'alerts@example.com',
    DAILY_DIGEST_TO = '',
    TIMEZONE = 'America/New_York',
    DASHBOARD_URL = 'http://localhost:3000'
  } = process.env;
  if (!FRED_KEY) throw new Error('Missing FRED key');
  if (!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');

  // Fetch indicators
  const entries = await Promise.all(Object.entries(SERIES).map(async ([key, meta]) => {
    const series = await fetchFredSeries(meta.id, FRED_KEY);
    const { latest, mom, yoy } = computeDeltas(series);
    const trend = detectTrend(series, mom, meta.unit);
    return [key, { ...meta, latest, mom, yoy, trend, updatedAt: last(series)?.date, series }];
  }));
  const indicators = Object.fromEntries(entries);

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

  const resend = new Resend(RESEND_API_KEY);
  const toList = DAILY_DIGEST_TO.split(',').map(s => s.trim()).filter(Boolean);
  if (toList.length === 0) throw new Error('No recipients in DAILY_DIGEST_TO');

  await resend.emails.send({
    from: RESEND_FROM,
    to: toList,
    subject: 'Morning Macro Brief',
    html
  });

  console.log('Digest sent to', toList.join(', '));
}

main().catch(err => { console.error(err); process.exit(1); });