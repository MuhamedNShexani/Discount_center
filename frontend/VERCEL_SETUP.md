# Vercel Deployment – Notifications Checklist

Your frontend is at **https://idiscount.vercel.app/** and the service worker loads correctly. For notifications when the app is closed, all items below must be set.

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

**CORS** must allow `https://idiscount.vercel.app`:

```js
// In server.js or cors config
app.use(cors({
  origin: ['https://idiscount.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

## 4. Quick test

1. Open https://idiscount.vercel.app/
2. Tap **Enable** → **Allow** in the browser prompt
3. In Admin → Notifications, send a test notification
4. If you see “(X to notification center)” with X > 0, push is being sent
5. Close the tab or app, then send another notification – it should appear on the lock screen or notification shade

## 5. If it still fails

- Confirm backend URL in Vercel env vars and that the backend is reachable.
- Open DevTools → Application → Service Workers: check that the service worker is active.
- Open DevTools → Network: when you tap Enable, check that requests to `/notifications/vapid-public` and `/users/push-subscribe` succeed.
- Confirm VAPID keys are set and correct on the backend.
