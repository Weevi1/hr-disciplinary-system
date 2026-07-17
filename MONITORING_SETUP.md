# Backend Error Alerting — one-time setup (needs Riaan's Google account)

*Created 2026-07-17 (pre-launch hardening). Status: ⏳ NOT YET DONE — the Firebase admin
service account doesn't have Monitoring permissions, so this needs your owner account once.*

**Why:** Cloud Functions currently have NO error alerting. If warning-delivery emails, PDF
generation, or the employee respond endpoints start failing in production, nothing tells you —
you'd only find out from a client. Frontend Sentry is already wired (DSN confirmed in the
production bundle); this closes the backend half.

## Option A — Console (≈5 minutes, recommended)

1. Open https://console.cloud.google.com/monitoring/alerting/notifications?project=hr-disciplinary-system
   → **Edit notification channels** → **Email** → **Add new** → `riaan@fifo.systems` → Save.
2. Open https://console.cloud.google.com/logs/query?project=hr-disciplinary-system and paste this query:
   ```
   resource.type="cloud_run_revision" severity>=ERROR
   ```
   (all 2nd-gen Cloud Functions run on Cloud Run, so this covers every function)
3. Click **Create log alert** (in the Logs Explorer toolbar → "Create alert").
   - Name: `Cloud Functions errors`
   - Policy severity: leave default
   - Notification frequency: `5 min` between notifications; autoclose default
   - Notification channel: the email channel from step 1
   - Save.

## Option B — gcloud (after `gcloud auth login` with your account)

```bash
# 1. Email channel
gcloud beta monitoring channels create \
  --project=hr-disciplinary-system \
  --display-name="Riaan email" \
  --type=email \
  --channel-labels=email_address=riaan@fifo.systems

# 2. Note the channel ID it prints (projects/.../notificationChannels/NNN), then:
gcloud alpha monitoring policies create \
  --project=hr-disciplinary-system \
  --display-name="Cloud Functions errors" \
  --notification-channels=<CHANNEL_ID> \
  --condition-display-name="Any function logs ERROR" \
  --condition-filter='resource.type="cloud_run_revision" severity>=ERROR' \
  --combiner=OR \
  --if=absent  # placeholder; use the console flow above if this flag syntax fights you
```

(The console flow in Option A is genuinely easier — log-based alerts have a dedicated UI.)

## Verify it works

Trigger a test error and confirm the email arrives (allow ~5 min):

```bash
# Hit a public endpoint with garbage that reaches an error path, e.g.:
curl -s -X POST https://us-central1-hr-disciplinary-system.cloudfunctions.net/submitEmployeeResponse \
  -H 'Content-Type: application/json' -d '{"token":"nonexistent-token-forces-404"}'
# 404s don't log ERROR — instead, temporarily check with an intentional test:
# Cloud Console → any function → Logs → confirm the alert fires on a real severity>=ERROR entry.
```

Practical check: after the next deploy, watch for the first alert email within a day or two —
several functions log ERROR on transient conditions, which doubles as a liveness check for the alert.

## Already verified (no action)

- **Frontend Sentry**: `frontend/.env.local` carries the real DSN and Vite includes `.env.local`
  in production builds — confirmed present in `dist/` bundle 2026-07-17. Keep building/deploying
  from this machine, or copy `.env.local` to any new build machine (it's gitignored).
