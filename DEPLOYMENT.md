# Deployment Guide - Economic Dashboard

## ✅ Quick Deploy to Vercel (Recommended)

### 1. Deploy to Vercel
```bash
npm i -g vercel
vercel --prod
```

### 2. Set Environment Variables in Vercel Dashboard
Navigate to your project settings and add:

```
VITE_FRED_API_KEY=92178d5a14c61213ed4188f94d4b6326
SMTP_USER=foundryai@getfoundryai.com  
SMTP_PASS=Flindell1977@
DAILY_DIGEST_TO=foundryai@getfoundryai.com
DASHBOARD_URL=https://your-project.vercel.app
TIMEZONE=America/New_York
```

### 3. Enable Vercel Cron Jobs
The `vercel.json` is already configured to run daily emails at 7am EST.

---

## 🔧 Alternative: GitHub Actions (Current Setup)

### Required GitHub Secrets
In your repository settings → Secrets and variables → Actions, add:

| Secret Name | Value |
|-------------|-------|
| `FRED_API_KEY` | `92178d5a14c61213ed4188f94d4b6326` |
| `SMTP_USER` | `foundryai@getfoundryai.com` |
| `SMTP_PASS` | `Flindell1977@` |
| `DAILY_DIGEST_TO` | `foundryai@getfoundryai.com` |
| `DASHBOARD_URL` | Your deployed dashboard URL |

The workflow will automatically send emails daily at 7am EST.

---

## 📧 Email Configuration

### Zoho SMTP Settings (Already Configured)
- **Host**: smtp.zoho.com
- **Port**: 587 (STARTTLS)
- **Username**: foundryai@getfoundryai.com
- **Password**: Flindell1977@

### Test Email Locally
```bash
cd C:\Users\adminidiakhoa\dash\shasha-dashboard\src\Shasha
VITE_FRED_API_KEY=92178d5a14c61213ed4188f94d4b6326 SMTP_USER=foundryai@getfoundryai.com SMTP_PASS=Flindell1977@ DAILY_DIGEST_TO=foundryai@getfoundryai.com node scripts/sendDailyDigestSMTP.js
```

---

## 🚀 Production URLs

Once deployed, update these URLs:
- **Dashboard**: `https://your-project.vercel.app` 
- **API Cron**: `https://your-project.vercel.app/api/cron`

---

## 🔐 Security Recommendations

**IMMEDIATE ACTION REQUIRED:**
1. Change Zoho password after deployment
2. Enable 2FA on Zoho account
3. Use app-specific passwords if available
4. Monitor email sending quotas

---

## 📊 What's Working Now

✅ **Dashboard**: Real-time economic data  
✅ **Charts**: Interactive historical charts  
✅ **Email**: Daily digest via Zoho SMTP  
✅ **Export**: CSV download functionality  
✅ **Tests**: All 37 tests passing  
✅ **Build**: Production ready  

The system is fully operational and ready for production deployment!