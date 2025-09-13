# Economic Dashboard

A professional-grade React dashboard that fetches and visualizes real-time economic data from FRED and foreign exchange rates, computes trends, and sends automated daily email digests with market insights.

![Economic Dashboard](https://img.shields.io/badge/status-production-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)

## Features

- 📊 **Live Economic Indicators**: CPI, Unemployment Rate, 10Y/3M Treasury, 30Y Mortgage Rate
- 💱 **FX Rates**: USD/NGN, USD/GBP, USD/EUR with historical data
- 📈 **Trend Analysis**: YoY/MoM calculations with volatility detection
- 📧 **Daily Email Digest**: Automated morning reports with market insights
- 📱 **Responsive UI**: Modern dashboard with interactive charts
- 📂 **CSV Export**: Download current and historical data
- 🧪 **Well Tested**: Comprehensive test coverage with Vitest

## Quick Start

### Prerequisites

- Node.js 20+
- FRED API Key (free from https://fred.stlouisfed.org/docs/api/api_key.html)
- Optional: Resend API Key for email functionality

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd shasha-dashboard/src/Shasha

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your API keys to .env
VITE_FRED_API_KEY=your_fred_api_key_here
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Type check
npm run lint
```

Visit `http://localhost:3000` to see the dashboard.

## Environment Variables

### Required
- `VITE_FRED_API_KEY`: Your Federal Reserve Economic Data API key

### Optional (for email functionality)
- `RESEND_API_KEY`: Resend service API key for sending emails
- `RESEND_FROM`: Email sender address (e.g., alerts@yourdomain.com)
- `DAILY_DIGEST_TO`: Comma-separated list of recipient emails
- `TIMEZONE`: Timezone for email scheduling (default: America/New_York)
- `DASHBOARD_URL`: URL to include in emails

## Email Automation

### Daily Digest
The system can send automated daily email reports at 7am local time with:
- Current indicator values and trends
- FX rate movements
- Market insights and actionable tips
- Links back to the dashboard

### Local Testing
```bash
# Test email generation locally
VITE_FRED_API_KEY=xxx RESEND_API_KEY=xxx RESEND_FROM=alerts@yourdomain.com DAILY_DIGEST_TO=you@domain.com node scripts/sendDailyDigest.js
```

### GitHub Actions Setup
1. Set the following secrets in your GitHub repository:
   - `FRED_API_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM`
   - `DAILY_DIGEST_TO`
   - `DASHBOARD_URL`

2. The workflow in `.github/workflows/daily-digest.yml` will automatically send emails daily.

## Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **Data**: FRED API, exchangerate.host API
- **Email**: Resend
- **Testing**: Vitest, React Testing Library
- **Build**: Vite

### Project Structure
```
src/
├── components/          # React components
│   ├── DashboardCards.tsx
│   ├── TimeSeriesChart.tsx
│   ├── ExchangeRates.tsx
│   ├── IdeasPanel.tsx
│   └── Controls.tsx
├── services/           # API services
│   ├── economicDataService.ts
│   ├── fxService.ts
│   └── emailService.ts
├── utils/              # Utilities
│   ├── trends.ts
│   ├── formatters.ts
│   └── csvExport.ts
├── hooks/              # React hooks
│   └── useIndicators.ts
└── types/              # TypeScript types
    └── index.ts
```

## Data Sources

### Economic Indicators (FRED)
- **CPI (CPIAUCSL)**: Consumer Price Index for All Urban Consumers
- **UNRATE**: Unemployment Rate
- **DGS10**: 10-Year Treasury Constant Maturity Rate
- **DGS3MO**: 3-Month Treasury Constant Maturity Rate
- **MORTGAGE30US**: 30-Year Fixed Rate Mortgage Average

### Foreign Exchange (exchangerate.host)
- USD/NGN (US Dollar to Nigerian Naira)
- USD/GBP (US Dollar to British Pound)
- USD/EUR (US Dollar to Euro)

## Trend Analysis

The system computes several trend indicators:

- **YoY**: Year-over-year percentage change
- **MoM**: Month-over-month percentage change
- **Trend Classification**:
  - `RISING`: Positive momentum
  - `FALLING`: Negative momentum
  - `VOLATILE_UP`: High volatility with upward bias
  - `VOLATILE_DOWN`: High volatility with downward bias
  - `STABLE`: Minimal change

## Market Insights Engine

The dashboard includes a rule-based system that generates actionable insights:

1. **Cash vs Bonds**: Yield curve analysis and duration recommendations
2. **Equity Positioning**: Risk-on/risk-off signals based on macro conditions
3. **Mortgage/Refinancing**: Rate change notifications
4. **FX Optimization**: Currency conversion timing for USD/NGN
5. **Cash Management**: High-yield opportunities

⚠️ **Disclaimer**: All insights are for educational purposes only and not financial advice.

## CSV Export

Export functionality includes:
- Current indicator snapshot
- Historical time series data
- FX rate history

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
1. Check the [troubleshooting guide](OPERATIONS.md)
2. Open an issue on GitHub
3. Review the [API documentation](https://fred.stlouisfed.org/docs/api/)

---

**Data Sources**: Federal Reserve Economic Data (FRED), exchangerate.host  
**Built with**: React, TypeScript, Chart.js, Tailwind CSS  
**Hosted on**: Vercel/Netlify compatible"# Shasha_Dashboard" 
