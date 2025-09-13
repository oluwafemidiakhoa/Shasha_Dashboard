import { Resend } from 'resend';
import type { Indicator, FxRate, Idea } from '../types';
import { formatNumber, formatPercentage } from '../utils/formatters';

export interface DigestData {
  indicators: Indicator[];
  fx: FxRate[];
  ideas: Idea[];
  date: string;
  timezone: string;
  dashboardUrl: string;
}

export function generateEmailHTML(data: DigestData): string {
  const indicatorRows = data.indicators.map(indicator =>
    `<tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 8px; font-weight: 600;">${indicator.label}</td>
      <td style="padding: 8px;">${formatNumber(indicator.latest, indicator.unit)}</td>
      <td style="padding: 8px; color: ${indicator.yoy >= 0 ? '#059669' : '#dc2626'};">
        ${formatPercentage(indicator.yoy)}
      </td>
      <td style="padding: 8px; color: ${indicator.mom >= 0 ? '#059669' : '#dc2626'};">
        ${formatPercentage(indicator.mom)}
      </td>
      <td style="padding: 8px;">
        <span style="background: ${getTrendBgColor(indicator.trend)}; color: ${getTrendTextColor(indicator.trend)}; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
          ${indicator.trend}
        </span>
      </td>
    </tr>`
  ).join('');

  const fxRows = data.fx.map(fx =>
    `<li style="margin: 8px 0; padding: 8px; background: #f9fafb; border-radius: 4px;">
      <strong>${fx.pair}</strong> — ${fx.latest.toFixed(4)} 
      (MoM <span style="color: ${fx.mom >= 0 ? '#059669' : '#dc2626'};">${formatPercentage(fx.mom)}</span>, 
      YoY <span style="color: ${fx.yoy >= 0 ? '#059669' : '#dc2626'};">${formatPercentage(fx.yoy)}</span>)
    </li>`
  ).join('');

  const ideaItems = data.ideas.map(idea =>
    `<li style="margin: 12px 0; padding: 12px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <strong style="color: #1f2937;">${idea.title}</strong>
        <span style="background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">
          ${Math.round(idea.confidence * 100)}%
        </span>
      </div>
      <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
        ${idea.rationale}
      </p>
    </li>`
  ).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Morning Macro Brief</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
    <header style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #1f2937; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
        Morning Macro Brief
      </h1>
      <p style="color: #6b7280; margin: 0; font-size: 14px;">
        ${data.date} (${data.timezone})
      </p>
    </header>

    <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 13px; color: #92400e;">
        <strong>Snapshot of key indicators with quick ideas. Not financial advice.</strong>
      </p>
    </div>

    <section style="margin-bottom: 32px;">
      <h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
        Economic Indicators
      </h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Indicator</th>
            <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Latest</th>
            <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">YoY</th>
            <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">MoM</th>
            <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Trend</th>
          </tr>
        </thead>
        <tbody>
          ${indicatorRows}
        </tbody>
      </table>
    </section>

    <section style="margin-bottom: 32px;">
      <h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
        Exchange Rates
      </h2>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${fxRows}
      </ul>
    </section>

    <section style="margin-bottom: 32px;">
      <h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
        Market Insights
      </h2>
      <ol style="padding-left: 0; margin: 0;">
        ${ideaItems}
      </ol>
    </section>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.dashboardUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
        Open Full Dashboard
      </a>
    </div>

    <footer style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 32px;">
      <p style="font-size: 11px; color: #6b7280; text-align: center; margin: 0;">
        <strong>Disclaimer:</strong> This email is for informational purposes only and not investment advice.<br>
        Data sources: Federal Reserve Economic Data (FRED), exchangerate.host
      </p>
    </footer>
  </div>
</body>
</html>`;
}

function getTrendBgColor(trend: string): string {
  switch (trend) {
    case 'RISING': return '#d1fae5';
    case 'FALLING': return '#fee2e2';
    case 'VOLATILE_UP': return '#fef3c7';
    case 'VOLATILE_DOWN': return '#fed7aa';
    case 'STABLE': return '#f3f4f6';
    default: return '#f3f4f6';
  }
}

function getTrendTextColor(trend: string): string {
  switch (trend) {
    case 'RISING': return '#065f46';
    case 'FALLING': return '#991b1b';
    case 'VOLATILE_UP': return '#92400e';
    case 'VOLATILE_DOWN': return '#9a3412';
    case 'STABLE': return '#374151';
    default: return '#374151';
  }
}

export async function sendDailyDigest(
  resendApiKey: string,
  from: string,
  to: string[],
  data: DigestData
): Promise<void> {
  const resend = new Resend(resendApiKey);
  const html = generateEmailHTML(data);

  await resend.emails.send({
    from,
    to,
    subject: `Morning Macro Brief — ${data.date}`,
    html
  });
}