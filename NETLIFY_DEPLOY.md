# 🚀 Deplopying to Netlify Guide

This application is fully configured for seamless deployment on **Netlify** with single-page application routing, serverless Netlify Functions for the backend APIs (`/api/*`), Supabase cloud database, and Razorpay payment gateway.

---

## 🛠️ Step-by-Step Deployment Steps

### Method 1: Deploy via GitHub & Netlify Dashboard (Recommended)

1. **Push your code to GitHub / Git repository**
2. Log into your [Netlify Dashboard](https://app.netlify.com/).
3. Click **"Add new site"** ➔ **"Import an existing project"** ➔ Select **GitHub**.
4. Choose this repository.
5. Netlify will automatically detect configuration from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
6. Click **"Deploy Site"**.

---

### Method 2: Deploy via Netlify CLI

Run the following in your terminal:
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --build --prod
```

---

## 🔐 Environment Variables Configuration

Set these environment variables in your Netlify site settings (**Site configuration ➔ Environment variables**):

| Variable | Description | Example / Value |
| :--- | :--- | :--- |
| `SUPABASE_URL` | Supabase Cloud Database URL | `https://kefxydzqwdjzlmvnrjbt.supabase.co` |
| `SUPABASE_KEY` | Supabase Secret or Anon Key | `sb_publishable_...` |
| `VITE_SUPABASE_URL` | Public Supabase URL | `https://kefxydzqwdjzlmvnrjbt.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase Key | `sb_publishable_...` |
| `RAZORPAY_KEY_ID` | Razorpay Merchant Key ID | `rzp_live_xxxxxxxx` or `rzp_test_xxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `xxxxxxxxxxxxxxxx` |
| `VITE_RAZORPAY_KEY_ID` | Public Razorpay Key ID | `rzp_live_xxxxxxxx` or `rzp_test_xxxxxxxx` |

---

## 📁 Included Netlify Setup Files

- `netlify.toml`: Pre-configured build settings, Netlify Functions path (`netlify/functions`), and SPA fallback redirects.
- `public/_redirects`: Guarantees `/api/*` proxies to Netlify Serverless Functions and `/*` redirects to `index.html`.
- `netlify/functions/api.ts`: Wraps Express backend endpoints into serverless Netlify functions.
