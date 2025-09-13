# Claude Project Brief — **Professional Economic Dashboard**

> **Goal**: Evolve the existing React dashboard into a production‑grade, automated economic intelligence system. It should fetch and visualize real‑time macro data (FRED + FX), compute trends (YoY / MoM / volatility), and **email a daily morning report** with concise analysis and **risk‑aware money‑making ideas** (not financial advice). Provide clean code, tests, docs, and one‑click deploys.

---

## TL;DR for Claude
- Stack: **React (Vite or CRA)** UI, optional **Node/Express** API for server tasks (email, caching, cron). Testing with **Vitest**. Charts with **Chart.js**. Email via **Resend**.
- Data: FRED series (CPIAUCSL, UNRATE, DGS10, DGS3MO, MORTGAGE30US) + **exchangerate.host** for USD/NGN, USD/GBP, USD/EUR.
- Key features:
  1) Live indicators + trend labels (RISING/FALLING/VOLATILE_[UP|DOWN]).
  2) Historical charts + export CSV.
  3) **Daily 7am local‑time email** summary to configured recipients with short actionable insights.
  4) Threshold alerts (optional) + simple rules engine for **money‑making tips**.
- Automation: GitHub Action (or Vercel/Netlify Scheduled Function) runs a Node script to send the morning email.
- Deliverables: working app, tested, with **`README.md` + `OPERATIONS.md` + this `claude.md` kept in sync**.

---

## Repository Layout (proposed)
```
shasha-dashboard/
├─ src/
│  ├─ components/
│  │  ├─ DashboardCards.tsx
│  │  ├─ TimeSeriesChart.tsx
│  │  ├─ ExchangeRates.tsx
│  │  └─ EmailSubscribe.tsx
│  ├─ services/
│  │  ├─ economicDataService.ts   # FRED integration + trend calc + caching
│  │  ├─ fxService.ts             # exchangerate.host wrapper
│  │  └─ emailService.ts          # Resend client + templates
│  ├─ utils/
│  │  ├─ trends.ts                # YoY/MoM/volatility + labels
│  │  ├─ csvExport.ts             # CSV helpers
│  │  └─ formatters.ts            # numbers, pct, dates
│  ├─ hooks/
│  │  └─ useIndicators.ts
│  ├─ pages/
│  │  └─ Home.tsx
│  ├─ styles/
│  └─ App.tsx
├─ server/                        # Optional Node API (if not on serverless)
│  ├─ index.ts                    # Express app
│  ├─ routes/
│  │  ├─ indicators.ts
│  │  ├─ fx.ts
│  │  ├─ export.ts
│  │  └─ email.ts
│  ├─ jobs/
│  │  └─ sendDailyDigest.ts       # callable from cron or serverless schedule
│  └─ templates/
│     └─ dailyDigest.html
├─ scripts/
│  └─ sendDailyDigest.ts          # thin wrapper to run the job standalone
├─ __tests__/
│  ├─ trends.test.ts
│  ├─ formatters.test.ts
│  └─ services.test.ts
├─ public/
├─ .env.example
├─ vite.config.ts (or CRA config)
├─ package.json
├─ README.md
├─ OPERATIONS.md
└─ claude.md
```

---

## Environment & Secrets
Create `.env` (and CI/CD secrets):
```
# FRED (required)
REACT_APP_FRED_API_KEY=xxxx

# Resend (optional but recommended for email)
RESEND_API_KEY=xxxx
RESEND_FROM=alerts@yourdomain.com
DAILY_DIGEST_TO=oluwafemi@yourdomain.com, team@yourdomain.com

# Scheduling
TIMEZONE=America/New_York          # override as needed
DIGEST_CRON=0 7 * * *              # local server cron (server timezone)

# Misc
CACHE_TTL_MIN=5                    # UI cache for indicators (minutes)
FX_CACHE_TTL_MIN=60
```
> **Note**: In CRA, only `REACT_APP_*` is exposed to the browser. Keep mail keys on server / serverless! If deploying serverless, set secrets in provider (Vercel, Netlify, Fly, Render, etc.).

---

## Data Contracts
### FRED Series
- **CPIAUCSL** — Consumer Price Index
- **UNRATE** — Unemployment Rate
- **DGS10** — 10‑Year Treasury
- **DGS3MO** — 3‑Month Treasury
- **MORTGAGE30US** — 30‑Year Mortgage Rate

### FX Pairs (exchangerate.host)
- USD/NGN, USD/GBP, USD/EUR — **latest** and **timeseries** endpoints

### UI Indicator Model
```ts
export type Indicator = {
  id: 'CPI' | 'UNRATE' | 'DGS10' | 'DGS3MO' | 'MORTGAGE30US';
  label: string;
  unit: 'index' | 'percent' | 'rate';
  latest: number;            // current value
  yoy: number;               // % change YoY
  mom: number;               // % change MoM
  trend: 'RISING'|'FALLING'|'VOLATILE_UP'|'VOLATILE_DOWN'|'STABLE';
  updatedAt: string;         // ISO
  series: Array<{date: string; value: number}>; // 24–60 months
};
```

---

## Trend Logic (rules)
Implement in `utils/trends.ts`:
- **YoY** = (latest / value_12m_ago − 1) × 100
- **MoM** = (latest / value_1m_ago − 1) × 100
- **Volatility**: use rolling stdev over last 6 months; mark **VOLATILE_UP/DOWN** if |MoM| > (1.25 × stdev) and sign dictates up/down.
- **STABLE** if |MoM| < ε (default 0.15pp for rates, 0.1% for CPI index). Otherwise **RISING**/**FALLING** by MoM sign.
- Provide tunables via `THRESHOLDS` constant; unit‑aware.

---

## Money‑Making Tips Engine (rule‑based, conservative)
> Output is **educational**; include disclaimer in UI & emails: *Not financial advice; for informational purposes only.*

Implement `getIdeas(indicators, fx)` that returns 3–5 bullet ideas with rationale & confidence (0–1):

1. **Cash vs Bonds tilt**
   - If **DGS3MO ≥ DGS10** (inversion) and **CPI YoY rising** → prefer short‑duration cash/T‑Bills/high‑yield savings; avoid duration risk.  
   - If **DGS10 falling** and **UNRATE ≤ 4%** → duration OK; consider intermediate bond exposure.

2. **Risk‑on / risk‑off equity posture**
   - **UNRATE falling** (>0.2pp YoY down) and **CPI stable/falling** → moderate risk‑on tilt (broad indices/DCA).  
   - **CPI rising** (>0.3pp MoM) or **VOLATILE_UP** in rates → de‑risk (increase cash buffer / defensive sectors).

3. **Mortgage/Refi nudge (US)**
   - If **MORTGAGE30US** falling > 25bp MoM → suggest refi check for homeowners.

4. **FX (USD/NGN)**
   - If **NGN weakening > 3% MoM** → suggest hedging NGN expenses, batch USD conversions judiciously; diaspora remittances might prefer staged transfers.  
   - If **NGN strengthening** and user holds USD for near‑term NGN spend → consider converting a tranche.

5. **Income on idle cash**
   - If **DGS3MO > 4.5%** → highlight T‑Bill yields and short‑term instruments as yield opportunities vs checking accounts.

Return format:
```ts
export type Idea = { title: string; rationale: string; confidence: number };
```

---

## Email: Daily Morning Digest
- Sender: `RESEND_FROM`
- Recipients: `DAILY_DIGEST_TO` (comma‑sep)
- Time: **07:00 local** (use `TIMEZONE` env or server timezone)
- Content blocks:
  1. **Headline** snapshot (CPI, UNRATE, DGS10, DGS3MO, MORTGAGE30US)
  2. **Trends** (YoY/MoM badges + trend words)
  3. **FX** for USD/NGN, USD/GBP, USD/EUR
  4. **Ideas** (3–5 bullets from rules engine)
  5. **Chart teaser** (static sparkline images are optional; link to app)
  6. Footer with disclaimer + manage subscription

### Template variables
```
{{date}} {{timezone}}
{{indicators[]}}  // label, latest, yoy, mom, trend
{{fx[]}}          // pair, latest, mom, yoy
{{ideas[]}}       // title, rationale, confidence
{{dashboardUrl}}
```

### Minimal HTML (server/templates/dailyDigest.html)
```html
<!doctype html>
<html><body style="font-family:Inter,Arial,sans-serif">
  <h2>Morning Macro Brief — {{date}} ({{timezone}})</h2>
  <p>Snapshot of key indicators with quick ideas. Not financial advice.</p>
  <table role="presentation" width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse">
    {{#each indicators}}
      <tr>
        <td><strong>{{label}}</strong></td>
        <td>{{latest}}</td>
        <td>YoY {{yoy}}%</td>
        <td>MoM {{mom}}%</td>
        <td>{{trend}}</td>
      </tr>
    {{/each}}
  </table>
  <h3>FX</h3>
  <ul>
    {{#each fx}}<li>{{pair}} — {{latest}} (MoM {{mom}}%, YoY {{yoy}}%)</li>{{/each}}
  </ul>
  <h3>Ideas</h3>
  <ol>
    {{#each ideas}}<li><strong>{{title}}</strong> — {{rationale}} (confidence {{confidence}})</li>{{/each}}
  </ol>
  <p><a href="{{dashboardUrl}}">Open dashboard</a></p>
  <hr/>
  <small>This email is for informational purposes only and not investment advice.</small>
</body></html>
```

---

## API Endpoints (if using Node/Express)
```
GET  /api/indicators           -> Indicator[] (server caches FRED; UI stays light)
GET  /api/fx?pairs=USDNGN,...  -> FX quotes + series
GET  /api/export?type=current  -> CSV of current indicators
GET  /api/export?type=history  -> CSV of historical series
POST /api/email/digest         -> Trigger email now (admin only)
POST /api/alerts/subscribe     -> { email }
```

> For serverless, map each route to a function. Ensure Resend key only lives on the server side.

---

## Scheduling
### GitHub Actions (runs every day 11:00 UTC ≈ 7am ET)
`.github/workflows/daily-digest.yml`
```yaml
name: daily-digest
on:
  schedule:
    - cron: '0 11 * * *'
  workflow_dispatch: {}
jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build --if-present
      - run: node scripts/sendDailyDigest.js
        env:
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          RESEND_FROM: ${{ secrets.RESEND_FROM }}
          DAILY_DIGEST_TO: ${{ secrets.DAILY_DIGEST_TO }}
          REACT_APP_FRED_API_KEY: ${{ secrets.FRED_API_KEY }}
          TIMEZONE: 'America/New_York'
```

### Alternative: Vercel/Netlify Scheduled Functions
- Implement `server/jobs/sendDailyDigest.ts` as a handler.
- Configure schedule in provider UI.

---

## Tasks for Claude (implement in this order)
1. **Set up project** (Vite + React + TS; or continue existing CRA). Install deps: `chart.js`, `react-chartjs-2`, `vitest`, `zod`, `date-fns`, `@resend/node`.
2. **Economic service**: Fetch FRED series; normalize data; compute YoY/MoM; cache in memory + optional file cache. Add zod schemas.
3. **FX service**: Latest + timeseries for USD/NGN, USD/GBP, USD/EUR with 12m history.
4. **Trends util**: Implement rules + tests.
5. **UI**: Dashboard cards + multi‑series time‑chart. Proper formatting & badges.
6. **CSV export** (current + history) with headers and units.
7. **Email**: Resend client + HTML template above. Add `scripts/sendDailyDigest.ts` to assemble data + ideas + send mail.
8. **Scheduler**: Add GitHub Action and document secret setup in `OPERATIONS.md`.
9. **Alerts** (optional): Threshold config in JSON; subscribe/unsubscribe endpoints; basic confirmation email.
10. **Hardening**: Error boundaries, retries/backoff, rate‑limit etiquette, 5‑minute UI cache.
11. **Tests**: Vitest coverage for trend math, services, and email assembly (snapshot HTML).
12. **Docs**: Update `README.md` and `OPERATIONS.md` with env, commands, troubleshooting.

---

## Commands
```bash
# Dev
npm run dev

# Build
npm run build

# Tests
npm test
npm run test:coverage

# Lint/format (add ESLint + Prettier)
npm run lint
npm run format

# Send digest now (locally)
node scripts/sendDailyDigest.js
```

---

## Coding Standards
- TypeScript everywhere (except tiny scripts). Strict mode.
- Functional components + hooks; keep components small and pure.
- Avoid exposing secrets to the client.
- Zod for runtime validation of API responses.
- Commit style: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`; small PRs with tests.

---

## Testing Strategy
- **Unit**: `trends.ts` (edge cases: flat series, spikes, NaN guards), formatters, CSV export.
- **Integration**: mock FRED/FX with MSW; render dashboard; assert cards, badges, and chart series.
- **Email**: assemble digest → snapshot test of HTML to prevent regressions.

---

## CSV Export Contract
### Current Indicators
```
indicator,label,latest,yoy,mom,trend,updatedAt,unit
CPI,Consumer Price Index,307.7,-0.4,0.4,VOLATILE_DOWN,2025-09-12,index
...
```

### Historical Series
```
indicator,date,value,unit
CPI,2025-09-01,307.7,index
CPI,2025-08-01,306.4,index
...
```

### FX Series
```
pair,date,rate
USD/NGN,2025-09-12,1735.50
...
```

---

## Error Handling & Observability
- Wrap fetches with retries and exponential backoff; fast‑fail to cached data.
- Show graceful placeholders on UI with last good timestamp.
- Add lightweight logging (console + server logs). Optional: Sentry/Logtail.

---

## Security
- Never commit API keys.
- Validate and sanitize emails.
- Rate limit `/email/digest` and subscription endpoints.
- CORS: allow only app origin.

---

## Operations Playbook (summary)
- **Rotate keys**: every 90 days.
- **Monitor**: setup Action failure notifications.
- **Backfill**: if FRED outages occur, re‑run job once service restored.

---

## Product Polish Ideas (backlog)
- Add **annotation markers** on chart for CPI release dates.
- Add **copy to clipboard** on each card.
- Add **scenario toggles** (e.g., soft‑landing vs re‑acceleration) that adjust ideas rules.
- Add **Nigeria‑specific** view (NG macro proxies, FX parallel rate note if available).
- Add **PDF export** of the morning brief.

---

## Prompts & Workflows for Claude
### 1) Ship daily digest end‑to‑end
> *"Implement the daily morning digest: create templates/server job, wire to Resend, add GitHub Action schedule, and document secrets. Use rules in `getIdeas`. Write unit tests for trend math and HTML snapshot, then open a PR titled `feat(email): daily morning macro digest`."*

### 2) Improve trend detection
> *"Refactor `trends.ts` to use 6‑month rolling stdev and add VOLATILE_UP/DOWN. Update cards to show the tag. Add tests with synthetic datasets that trigger each state."*

### 3) Expand FX coverage
> *"Add USD/ZAR and USD/JPY with the same service abstractions, update charts and export. Include MoM/YoY deltas and flags for >3% monthly moves."*

### 4) Build alert thresholds
> *"Implement `/alerts` with JSON config: notify when indicator crosses configurable MoM or YoY deltas. Add double‑opt‑in email flow."*

---

## Disclaimer
This system provides **educational, informational** insights derived from public macro data. It is **not investment advice**. Always consider your personal circumstances and consult a licensed professional.


---

# Zero‑Touch Automation Setup (Copy/Paste)

> This section adds **fully automated** emailing + rule‑driven tips + optional monetization hooks. Copy these files into your repo as‑is and set the listed secrets.

## 1) Daily Digest Script (Node 20, no extra build)
Create **`scripts/sendDailyDigest.js`**:

```js
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
  const fxRows = Object.entries(fx).map(([pair, v]) =>
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
    REACT_APP_FRED_API_KEY: FRED_KEY,
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
```

**Install deps:**
```bash
npm i resend date-fns
```

**Local test:**
```bash
REACT_APP_FRED_API_KEY=xxx RESEND_API_KEY=xxx RESEND_FROM=alerts@yourdomain.com DAILY_DIGEST_TO=you@domain.com node scripts/sendDailyDigest.js
```

---

## 2) GitHub Action (runs every morning)
Create **`.github/workflows/daily-digest.yml`** (if not already):
```yaml
name: daily-digest
on:
  schedule:
    - cron: '0 11 * * *'   # ~07:00 America/New_York
  workflow_dispatch: {}
jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci --ignore-scripts
      - run: node scripts/sendDailyDigest.js
        env:
          REACT_APP_FRED_API_KEY: ${{ secrets.FRED_API_KEY }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          RESEND_FROM: ${{ secrets.RESEND_FROM }}
          DAILY_DIGEST_TO: ${{ secrets.DAILY_DIGEST_TO }}
          TIMEZONE: 'America/New_York'
          DASHBOARD_URL: ${{ secrets.DASHBOARD_URL }}
```
**Set GitHub secrets:** `FRED_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM`, `DAILY_DIGEST_TO`, `DASHBOARD_URL`.

---

## 3) Optional: Monetization Hooks (no extra ops)
- **Stripe Checkout link**: create a product + monthly price; copy Checkout URL. Put this link in your dashboard and email footer (`Subscribe for full brief`).
- After purchase, show a **thank-you page** with a form to collect the email → append to `DAILY_DIGEST_TO` (manual at first). When ready, add a small serverless webhook to auto-append subscribers to a store (Supabase/Airtable) that your script reads.
- Keep everything low‑touch: the Action sends emails; you only manage refunds/support occasionally.

**Webhook sketch (advanced, optional):**
```js
// server/webhooks/stripe.js (Vercel/Netlify func)
// Receives checkout.session.completed and upserts email into a subscribers table
```

---

## 4) Email Template (standalone file)
Optionally create **`server/templates/dailyDigest.html`** with the template from earlier. The script above renders HTML inline, so this file is optional.

---

## 5) Guardrails baked into automation
- Disclaimers in every email.
- Cap allocation suggestions to gentle nudges; no position sizing.
- If trends whipsaw, tips appear but you decide execution cadence (weekly recap preferred).

---

## 6) One‑click sanity checklist
- [ ] Secrets set in GitHub.
- [ ] Action turned on.
- [ ] `DAILY_DIGEST_TO` contains your email(s).
- [ ] Local test succeeded once.
- [ ] Dashboard URL set for CTA.

> With this, your system is **fully automated**: data fetch → trend calc → tips → email → every morning, hands‑off. 
