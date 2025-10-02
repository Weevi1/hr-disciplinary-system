# 🔍 Sentry Error Tracking Setup Guide

## Quick Setup (5 minutes)

### 1. Create Sentry Account

1. Go to [https://sentry.io/signup/](https://sentry.io/signup/)
2. Sign up with your email (or use GitHub/Google)
3. Choose **Free plan** (5K errors/month - perfect for starting)

### 2. Create New Project

1. Click "Create Project"
2. Select **React** as platform
3. Set alert frequency: **On every new issue**
4. Name it: `hr-disciplinary-system`
5. Click **Create Project**

### 3. Get Your DSN

After project creation, you'll see your DSN (Data Source Name):

```
https://xxxxxxxxxxxx@o000000.ingest.sentry.io/0000000
```

**Copy this DSN** - you'll need it next.

### 4. Add DSN to Environment Variables

#### **Local Development** (.env.local):

Create `/frontend/.env.local` (gitignored):

```bash
VITE_SENTRY_DSN=https://your-dsn-here@sentry.io/project-id
VITE_APP_VERSION=1.0.0
```

#### **Production** (GitHub Secrets):

1. Go to GitHub repository settings
2. Secrets and variables → Actions
3. New repository secret:
   - Name: `VITE_SENTRY_DSN`
   - Value: `https://your-dsn-here@sentry.io/project-id`

4. Update deploy workflow (`.github/workflows/deploy.yml`):

```yaml
- name: Build frontend
  working-directory: ./frontend
  run: npm run build
  env:
    VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
    VITE_APP_VERSION: ${{ github.sha }}
```

### 5. Verify Setup

#### **Test Error Tracking:**

Add this test button to any component:

```tsx
<button onClick={() => { throw new Error('Sentry Test Error!'); }}>
  Test Sentry
</button>
```

Click it → Check Sentry dashboard → You should see the error!

---

## Sentry Features Configured

### ✅ What's Tracked:

1. **JavaScript Errors** - Unhandled exceptions, promise rejections
2. **React Component Errors** - Error boundaries, render errors
3. **Network Errors** - Failed API calls (except ignored)
4. **Performance Issues** - Slow transactions (10% sample)
5. **Session Replays** - 10% of sessions, 100% with errors

### ✅ User Context:

Automatically attached to every error:
- User ID
- Email
- Name
- Organization ID

### ✅ Ignored Errors:

- Browser extensions
- Network timeouts (handled separately)
- Random plugin errors
- Facebook SDK errors

---

## Usage in Code

### **Manual Error Logging:**

```tsx
import { logError, logMessage } from '@/config/sentry';

try {
  // risky operation
  await createWarning(data);
} catch (error) {
  logError(error as Error, {
    component: 'WarningWizard',
    action: 'createWarning',
    userId: user.id
  });
  toast.error('Failed to create warning');
}
```

### **Info Messages:**

```tsx
import { logMessage } from '@/config/sentry';

logMessage('User completed onboarding', 'info');
logMessage('Payment method updated', 'warning');
```

### **Set User Context (on login):**

```tsx
import { setUserContext, clearUserContext } from '@/config/sentry';

// On login
setUserContext({
  id: user.uid,
  email: user.email,
  name: `${user.firstName} ${user.lastName}`
});

// On logout
clearUserContext();
```

---

## Sentry Dashboard Features

### **Issues Tab**

- See all errors with stack traces
- Filter by: User, URL, Release, Environment
- View frequency graphs
- Assign to team members

### **Performance Tab**

- Transaction traces
- Slow database queries
- API call durations
- Frontend render times

### **Replays Tab**

- Watch user sessions
- See exactly what user did before error
- Console logs + network activity
- DOM mutations

---

## Alerts & Notifications

### **Recommended Alerts:**

1. **New Issue** → Slack/Email immediately
2. **Issue frequency spike** → Email if >100/hour
3. **Performance degradation** → Email if p95 >3s

### **Set Up Alerts:**

1. Sentry Dashboard → Alerts
2. Create Alert Rule
3. Conditions: "When a new issue is created"
4. Actions: Send email to team
5. Save

---

## Cost Planning

### **Free Tier** (Current):
- 5,000 errors/month
- 1,000 replay sessions/month
- 10,000 performance units/month
- **$0/month**

### **When to Upgrade:**

If you exceed free tier:
- **Team ($26/month)** - 50K errors
- **Business ($80/month)** - 250K errors

**Recommendation:** Start with free tier, monitor usage in Settings → Usage Stats

---

## Production Deployment

### **Before First Deploy:**

✅ Add `VITE_SENTRY_DSN` to GitHub Secrets
✅ Update `.github/workflows/deploy.yml` with env vars
✅ Test locally with `.env.local`
✅ Verify Sentry dashboard receives test error

### **After Deploy:**

1. Check Sentry dashboard for real errors
2. Set up Slack notifications
3. Create on-call rotation (if team)
4. Review errors weekly

---

## Troubleshooting

### **No errors showing in Sentry:**

1. Check DSN is correct
2. Verify `NODE_ENV=production` or `MODE=production`
3. Check browser console for Sentry init message
4. Test with manual `throw new Error('test')`

### **Too many errors:**

1. Add ignore patterns in `sentry.ts`
2. Adjust sample rates
3. Filter out specific error types
4. Use `beforeSend` to drop noisy errors

### **Source maps not working:**

1. Install Sentry Vite plugin: `npm install @sentry/vite-plugin`
2. Add to `vite.config.ts`
3. Set `SENTRY_AUTH_TOKEN` in GitHub Secrets
4. Enable source maps in build

---

## Files Modified

✅ `/frontend/src/config/sentry.ts` - Sentry configuration
✅ `/frontend/src/main.tsx` - Sentry initialization
✅ `/frontend/package.json` - Sentry dependencies
✅ `/SENTRY_SETUP.md` - This guide

---

## Next Steps

1. [ ] Create Sentry account
2. [ ] Get DSN from Sentry dashboard
3. [ ] Add DSN to `.env.local` and GitHub Secrets
4. [ ] Deploy to production
5. [ ] Verify errors are tracked
6. [ ] Set up Slack alerts

---

**Status**: ✅ Code integrated, waiting for DSN
**Time to complete**: 5 minutes
**Cost**: $0/month (free tier)
