# Deployment – Fix 404 on Refresh

Your SPA shows "404 Page Not Found" when refreshing on routes like `/categories`. This is fixed by telling the server to serve `index.html` for all routes.

## Config Files Added

| File | Platform |
|------|----------|
| `frontend/public/_redirects` | **Netlify** – auto-applied when you deploy |
| `frontend/public/.htaccess` | **Apache** (cPanel, shared hosting) |
| `frontend/vercel.json` | **Vercel** |
| `frontend/netlify.toml` | **Netlify** (alternative to _redirects) |

## After Adding These Files

1. **Redeploy** so the new config is used.
2. **Netlify** – Deploy from the `frontend` folder:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/build` or `build`
3. **Vercel** – If root is `frontend`, `vercel.json` there will be used.
4. **Apache/cPanel** – Ensure `mod_rewrite` is enabled and `.htaccess` is in the public HTML folder (where `index.html` is).

## Nginx (if you use it)

Add inside your `server` block:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Testing

After redeploy:

1. Open `https://dashkan.net/`
2. Go to a subpage (e.g. `/categories`)
3. Refresh the page – it should load instead of 404.
