# Google Sign-In Not Working After Deploy

When "Continue with Google" works locally but fails in production, you need to allow your **production URL** in both Supabase and Google Cloud.

## "It just loads forever" / "I never see Google's page"

The app must **redirect the browser** to the URL Supabase returns from `signInWithOAuth` (`data.url`). If that redirect doesn't happen, the button stays on "Signing in…" and nothing else occurs. The code does this explicitly: after calling `signInWithOAuth`, if `data.url` is present, it sets `window.location.href = data.url` so you are sent to Google, then back to the app. If you still see infinite loading after deploying, check the steps below (Supabase redirect URLs and Google origins).

## 1. Supabase Dashboard

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **URL Configuration**.
3. Set **Site URL** to your production URL (no trailing slash), e.g.:
   - `https://yourdomain.com`
   - or `https://your-app.vercel.app`
4. Under **Redirect URLs**, add:
   - `https://yourdomain.com/auth/callback`
   - or `https://your-app.vercel.app/auth/callback`  
   Add every domain you use (custom domain, Vercel URL, etc.). You can use a wildcard for previews, e.g. `https://*.vercel.app/**`, but for production prefer the exact callback URL.

Without these, Supabase will reject the redirect back to your app after Google signs the user in.

## 2. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Open your **OAuth 2.0 Client ID** (the one whose Client ID/Secret are configured in Supabase → Authentication → Providers → Google).
3. Under **Authorized JavaScript origins**, add your **production origin** (no path, no trailing slash), e.g.:
   - `https://yourdomain.com`
   - `https://your-app.vercel.app`  
   Keep `http://localhost:3000` (or your local URL) for development.
4. Under **Authorized redirect URIs** you should already have:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`  
   That one is used by Supabase and is the same for local and production; do not remove it.

If the production origin is missing, Google will block the sign-in request when users open your app from the deployed URL.

## 3. Environment variable (optional but recommended)

In your deployment (e.g. Vercel → Project → Settings → Environment Variables), set:

- **Name:** `NEXT_PUBLIC_SITE_URL`  
- **Value:** your production URL, e.g. `https://yourdomain.com` (no trailing slash)

This is used for auth redirects so the callback always sends users back to the correct domain. On Vercel you can rely on `VERCEL_URL` instead, but setting `NEXT_PUBLIC_SITE_URL` explicitly is more reliable if you use a custom domain.

## Checklist

- [ ] Supabase → **Site URL** = production URL  
- [ ] Supabase → **Redirect URLs** includes `https://<your-production-domain>/auth/callback`  
- [ ] Google Cloud → **Authorized JavaScript origins** includes `https://<your-production-domain>`  
- [ ] Deployment env has `NEXT_PUBLIC_SITE_URL` set to production URL (optional)

After changing Supabase or Google settings, try signing in with Google again in production; no redeploy is needed for those changes.
