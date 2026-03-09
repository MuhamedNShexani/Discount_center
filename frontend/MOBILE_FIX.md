# Mobile "Network Error" Fix – Proxy Setup

If the app works on **laptop** but shows **"Network error"** on **mobile** (iOS/Android), use the **proxy setup** below. This routes API requests through your frontend domain, avoiding CORS and mixed content issues on mobile.

## Step 1: Edit `vercel.json`

Replace `YOUR-BACKEND.onrender.com` with your actual backend host in **both** rewrites in `vercel.json`.

**Example:** If your backend is `https://idiscount-api.onrender.com`:
- Change to: `"destination": "https://idiscount-api.onrender.com/api/:path*"`
- And: `"destination": "https://idiscount-api.onrender.com/uploads/:path*"`

## Step 2: Vercel Environment Variables

In Vercel → your project → **Settings → Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `REACT_APP_USE_PROXY` | `true` |
| `REACT_APP_BACKEND_URL` | *(leave empty or delete)* |

When using the proxy, `REACT_APP_BACKEND_URL` should be empty so images load from the same origin via the proxy.

## Step 3: Redeploy

Trigger a new deployment (Deployments → ⋮ → Redeploy).

## How it works

- **Before:** Frontend calls `https://backend.com/api/stores` → cross-origin, can fail on mobile
- **After:** Frontend calls `https://dashkan.net/api/stores` → same-origin, Vercel proxies to backend

No CORS, no mixed content, and mobile browsers treat it as same-origin.
