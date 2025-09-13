# Operations Guide

This document covers deployment, monitoring, and maintenance procedures for the Economic Dashboard.

## Deployment

### Vercel Deployment

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy to Vercel
   vercel --prod
   ```

2. **Environment Variables**
   Set these in Vercel dashboard:
   ```
   VITE_FRED_API_KEY=your_fred_key
   ```

3. **Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm ci`

### Netlify Deployment

1. **Connect Repository** via Netlify dashboard

2. **Build Settings**
   - Build Command: `npm run build`
   - Publish Directory: `dist`

3. **Environment Variables**
   Add in Netlify dashboard:
   ```
   VITE_FRED_API_KEY=your_fred_key
   ```

### Self-Hosted Deployment

```bash
# Build the application
npm run build

# Serve static files with your preferred server
# nginx, Apache, or simple Node.js server
```

## Email Automation Setup

### GitHub Actions Secrets

Set these secrets in your GitHub repository settings:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `FRED_API_KEY` | FRED API key | `abcd1234...` |
| `RESEND_API_KEY` | Resend service key | `re_xxx...` |
| `RESEND_FROM` | Sender email | `alerts@yourdomain.com` |
| `DAILY_DIGEST_TO` | Recipients (comma-sep) | `user1@domain.com,user2@domain.com` |
| `DASHBOARD_URL` | Production URL | `https://dashboard.yourdomain.com` |

### Resend Setup

1. **Create Account** at https://resend.com
2. **Verify Domain** for sending emails
3. **Generate API Key** with send permissions
4. **Test Email** functionality locally

### Scheduling Options

#### GitHub Actions (Recommended)
- Runs daily at 11:00 UTC (7:00 AM ET)
- No server required
- Built-in retry logic
- Free tier: 2000 minutes/month

#### Vercel Cron Jobs
```javascript
// api/cron.js
export default async function handler(req, res) {
  // Import and run sendDailyDigest logic
  res.status(200).json({ success: true });
}
```

Add to `vercel.json`:
```json
{
  "functions": {
    "api/cron.js": {
      "maxDuration": 60
    }
  },
  "crons": [{
    "path": "/api/cron",
    "schedule": "0 11 * * *"
  }]
}
```

#### Netlify Scheduled Functions
```javascript
// netlify/functions/scheduled-digest.js
exports.handler = async (event, context) => {
  // Run digest logic
  return { statusCode: 200 };
};
```

Add to `netlify.toml`:
```toml
[build.environment]
  NODE_VERSION = "18"

[[plugins]]
  package = "@netlify/plugin-scheduled-functions"

[[plugins.inputs.functions]]
  path = "netlify/functions/scheduled-digest.js"
  schedule = "0 11 * * *"
```

## Monitoring

### Email Delivery

**GitHub Actions Monitoring:**
- Check Actions tab for failed runs
- Set up notifications for failures
- Monitor email delivery reports in Resend

**Key Metrics:**
- Email delivery rate
- API error rates
- Data freshness

### Application Health

**Frontend Monitoring:**
- Check for API key expiration
- Monitor FRED API rate limits (120 requests/minute)
- Verify FX API availability

**Dashboard Checks:**
- Data loading errors
- Chart rendering issues
- Export functionality

### Alerting Setup

**GitHub Actions Notifications:**
```yaml
# Add to workflow file
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

**Uptime Monitoring:**
- Use UptimeRobot or similar for dashboard availability
- Set up SSL certificate monitoring
- Monitor API endpoint responses

## Maintenance

### API Key Rotation (Quarterly)

1. **FRED API Key**
   ```bash
   # Generate new key at: https://fred.stlouisfed.org/docs/api/api_key.html
   # Update in .env and deployment secrets
   ```

2. **Resend API Key**
   ```bash
   # Create new key in Resend dashboard
   # Update in GitHub secrets and deployment
   ```

### Data Quality Checks

**Weekly Reviews:**
- Verify indicator values against official sources
- Check for data gaps or anomalies
- Review trend classifications for accuracy

**Monthly Reviews:**
- Update FX pairs if needed
- Review and update market insights rules
- Performance optimization

### Backup Procedures

**Configuration Backup:**
```bash
# Export environment variables
echo "VITE_FRED_API_KEY=$VITE_FRED_API_KEY" > backup.env

# Backup email templates
cp scripts/sendDailyDigest.js backup/
```

**Data Export:**
```bash
# Run manual data export
node scripts/dataBackup.js
```

## Troubleshooting

### Common Issues

**1. Email Not Sending**
```bash
# Check GitHub Actions logs
# Verify API keys are set correctly
# Test locally:
VITE_FRED_API_KEY=xxx RESEND_API_KEY=xxx node scripts/sendDailyDigest.js
```

**2. FRED API Errors**
- Check API key validity
- Verify rate limits not exceeded
- Confirm series IDs are correct

**3. FX API Issues**
- exchangerate.host occasionally has downtime
- Implement fallback to cached data
- Consider alternative providers

**4. Chart Not Loading**
- Check browser console for errors
- Verify Chart.js dependencies
- Test with sample data

### Performance Issues

**Slow Loading:**
- Check API response times
- Implement request caching
- Optimize chart rendering

**High Memory Usage:**
- Limit historical data points
- Implement data pagination
- Clean up chart instances

### Recovery Procedures

**Service Outage:**
1. Check status of external APIs
2. Switch to cached data if available
3. Notify users of service degradation
4. Implement manual data updates if needed

**Data Corruption:**
1. Verify data sources
2. Clear application cache
3. Re-fetch from APIs
4. Compare with known good data

## Security

### API Key Management
- Use environment variables only
- Never commit keys to repository
- Rotate keys regularly
- Use least-privilege access

### Email Security
- Verify sender domain
- Use SPF/DKIM records
- Monitor for abuse
- Implement rate limiting

### Application Security
- Keep dependencies updated
- Use HTTPS only
- Implement CSP headers
- Regular security audits

## Scaling

### High Traffic
- Implement CDN for static assets
- Add request caching layer
- Consider API gateway
- Monitor rate limits

### Multiple Environments
```bash
# Development
VITE_FRED_API_KEY=dev_key npm run dev

# Staging
VITE_FRED_API_KEY=staging_key npm run build

# Production
VITE_FRED_API_KEY=prod_key npm run build
```

### Team Access
- Use shared secret management
- Implement role-based deployments
- Document access procedures
- Regular access reviews

## Cost Management

### API Costs
- FRED API: Free (with rate limits)
- exchangerate.host: Free tier available
- Resend: $20/month for 100k emails
- GitHub Actions: 2000 minutes free

### Optimization
- Cache API responses
- Minimize email frequency
- Optimize chart rendering
- Use compression for assets

---

For urgent issues, contact: [admin@yourdomain.com]