# Vercel Deployment – Notifications Checklist

Your frontend is at **https://dashkan.net** (or https://idiscount.vercel.app). For notifications when the app is closed, all items below must be set.

## 1. Vercel environment variables

In the Vercel project: **Settings → Environment Variables**, add:

| Variable | Value | Required |
|----------|-------|----------|
| `REACT_APP_API_BASE_URL` | `https://YOUR-BACKEND-URL/api` | **Yes** |
| `REACT_APP_BACKEND_URL` | `https://YOUR-BACKEND-URL` | **Yes** |

Replace `YOUR-BACKEND-URL` with your real backend (e.g. `https://your-app.onrender.com`).

- If these are missing, the app will call `http://localhost:5000/api`, which fails in production.
- After changing env vars, trigger a new deployment (Redeploy).

## 2. Backend deployment

The Express backend must be deployed on a platform that supports Node servers:

- **Render** (render.com), **Railway**, **Heroku**, etc.
- Vercel is for static sites and serverless; it does not run your Express server.

## 3. Backend configuration

On the backend server:

**`.env` (or platform env vars):**

```
VAPID_PUBLIC_KEY=<from: npm run generate-vapid>
VAPID_PRIVATE_KEY=<from: npm run generate-vapid>
```

**CORS** allows `https://dashkan.net`, `https://www.dashkan.net`, and `*.vercel.app` (see server.js).

## 4. Quick test

1. Open https://dashkan.net/ (or your deployed URL)
2. Tap **Enable** → **Allow** in the browser prompt
3. In Admin → Notifications, send a test notification
4. If you see “(X to notification center)” with X > 0, push is being sent
5. Close the tab or app, then send another notification – it should appear on the lock screen or notification shade

## 5. Mobile "Network Error" – Troubleshooting

If the app works on laptop but shows "Network error" on mobile:

1. **HTTPS only**: `REACT_APP_API_BASE_URL` and `REACT_APP_BACKEND_URL` must use **HTTPS** (not `http://`). Mixed content (HTTPS page + HTTP API) is blocked on mobile.
2. **Env vars**: In Vercel → Settings → Environment Variables, set both for Production. Redeploy after changing.
3. **Backend reachable**: Test the API URL directly on mobile (e.g. open `https://YOUR-BACKEND/api/stores` in the mobile browser).
4. **Slow networks**: The app retries failed requests once after 1.5s and uses a 30s timeout to help with slow mobile connections.

## 6. If it still fails

- Confirm backend URL in Vercel env vars and that the backend is reachable.
- Open DevTools → Application → Service Workers: check that the service worker is active.
- Open DevTools → Network: when you tap Enable, check that requests to `/notifications/vapid-public` and `/users/push-subscribe` succeed.
- Confirm VAPID keys are set and correct on the backend.
