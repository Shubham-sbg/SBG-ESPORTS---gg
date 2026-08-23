# SBG ARMY / SBG ESPORTS - BEGINNER-FRIENDLY STEP-BY-STEP DEPLOYMENT GUIDE

This guide provides a beginner-friendly, step-by-step walkthrough to deploy your full-stack SBG ARMY / SBG ESPORTS application to production using **GitHub**, **Vercel** (Frontend), **Render** (Backend), and **Firebase Firestore** (Persistent Database & Storage).

---

## ARCHITECTURE OVERVIEW

```
       +------------------------------------+
       |          PUBLIC WEBSITE            |
       |      (Hosted on Vercel)            |
       +-----------------+------------------+
                         |
             API / REST  | HTTPS
                         v
       +-----------------+------------------+
       |           BACKEND API              |
       |      (Hosted on Render)            |
       +-----------------+------------------+
                         |
           SDK / Driver  | TLS
                         v
       +-----------------+------------------+
       |   FIREBASE FIRESTORE DATABASE      |
       |  (Durable Storage & Data Engine)   |
       +------------------------------------+
```

---

## STEP 1: PREPARE GITHUB REPOSITORY

1. Go to [GitHub](https://github.com) and sign in to your account.
2. Click **New Repository**.
3. Name your repository `sbg-army-esports` and keep it **Private** or **Public**.
4. Push your complete project codebase to the `main` branch of this repository.

---

## STEP 2: SETUP FIREBASE FIRESTORE (PERSISTENT DATABASE)

Your application is already configured with a persistent Firestore database:
- **Project ID**: `sbg-army-web`
- **Database ID**: `ai-studio-sbgarmygg-50d61416-99c8-4021-beb1-783af9dce49c`

### To obtain service account credentials for Render:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select project `sbg-army-web`.
3. Navigate to **Project Settings** > **Service Accounts**.
4. Click **Generate New Private Key**.
5. Save the downloaded JSON file. You will minify this JSON string into a single line for the `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable on Render.

---

## STEP 3: DEPLOY BACKEND API TO RENDER

1. Sign up or log in to [Render](https://render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository `sbg-army-esports`.
4. Configure the Web Service settings:
   - **Name**: `sbg-army-api`
   - **Region**: Oregon (US West) or your preferred region
   - **Branch**: `main`
   - **Root Directory**: `artifacts/api-server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
5. Add **Environment Variables** under the "Environment" tab:
   - `NODE_ENV` = `production`
   - `SESSION_SECRET` = `sbg_army_admin_jwt_secret_key_2026_prod`
   - `FIREBASE_SERVICE_ACCOUNT_JSON` = `{...your minified service account json...}`
6. Click **Create Web Service**.
7. Note down your backend URL once deployed (e.g., `https://sbg-army-api.onrender.com`).

---

## STEP 4: DEPLOY FRONTEND TO VERCEL

1. Sign up or log in to [Vercel](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository `sbg-army-esports`.
4. Configure the Project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `artifacts/sbg-army`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add **Environment Variables**:
   - `VITE_API_URL` = `https://sbg-army-api.onrender.com` (Your Render API URL)
6. Click **Deploy**.
7. Vercel will build and assign a domain (e.g., `https://sbg-army-esports.vercel.app`).

---

## STEP 5: CORS & DOMAIN VERIFICATION

1. In your backend environment variables on Render, set `CORS_ORIGIN` to your Vercel URL:
   - `CORS_ORIGIN` = `https://sbg-army-esports.vercel.app`
2. Save environment variables on Render. Render will automatically redeploy.

---

## STEP 6: PRODUCTION VERIFICATION CHECKLIST

- [x] Open `https://sbg-army-esports.vercel.app`
- [x] Verify public website loads cleanly without console errors
- [x] Log into Admin Panel at `/sbg-admin`
- [x] Add a test record or update website settings
- [x] Refresh browser & verify session and data persist
- [x] Restart backend on Render & verify data persists from Firestore

---

## EMERGENCY ROLLBACK PROCEDURE

If a bug or issue occurs after deployment:
1. Go to Vercel Dashboard > **Deployments**.
2. Select the previous working build and click **Promote to Production**.
3. On Render, go to **Events** and click **Rollback** to revert the backend.
