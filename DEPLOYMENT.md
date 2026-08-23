# SBG ARMY / SBG ESPORTS — BEGINNER-FRIENDLY PRODUCTION DEPLOYMENT GUIDE

This guide provides step-by-step, beginner-friendly instructions to deploy your full-stack SBG ARMY / SBG ESPORTS application to production.

---

## DEPLOYMENT ARCHITECTURE

```
                  +-----------------------------------+
                  |         PUBLIC WEBSITE            |
                  |     (Hosted on Vercel)            |
                  +-----------------+-----------------+
                                    |
                        API / REST  | HTTPS Requests
                                    v
                  +-----------------+-----------------+
                  |          BACKEND API              |
                  |     (Hosted on Render)            |
                  +-----------------+-----------------+
                                    |
                    Firebase Admin  | TLS
                     Firestore SDK  v
                  +-----------------+-----------------+
                  |   FIREBASE FIRESTORE DATABASE     |
                  |   (Persistent Storage & Engine)   |
                  +-----------------------------------+
```

---

## STEP 1: PUSH YOUR REPOSITORY TO GITHUB

1. **Open AI Studio Settings**:
   - In the top menu bar of AI Studio, click on **Settings** / **Export**.
   - Select **Export to GitHub** (or **Download ZIP** and upload to GitHub manually).

2. **Create a GitHub Repository**:
   - Go to [GitHub.com](https://github.com) and log in.
   - Click the **+** icon in the top-right corner and select **New repository**.
   - Name your repository `sbg-army-esports`.
   - Keep it **Private** (recommended) or **Public**.
   - Click **Create repository**.

3. **Push Code to `main` Branch**:
   - If using Git from your local machine, run:
     ```bash
     git remote add origin https://github.com/YOUR_GITHUB_USERNAME/sbg-army-esports.git
     git branch -M main
     git push -u origin main
     ```
   - *Note: `.gitignore` automatically prevents sensitive files, `.env`, and `node_modules` from being uploaded.*

---

## STEP 2: CONFIGURE RENDER FOR BACKEND (`artifacts/api-server`)

Render will host your Express API server and connect directly to Firebase Firestore.

1. **Sign Up / Log In to Render**:
   - Go to [Render.com](https://render.com) and sign in (you can use "Sign in with GitHub").

2. **Create a New Web Service**:
   - Click **New +** > **Web Service**.
   - Select **Build and deploy from a Git repository**.
   - Connect your GitHub repository `sbg-army-esports`.

3. **Configure Web Service Settings**:
   - **Name**: `sbg-army-api`
   - **Region**: Select a region close to your users (e.g., Oregon US West, Frankfurt, or Singapore).
   - **Branch**: `main`
   - **Root Directory**: `artifacts/api-server` *(CRITICAL: Type this exact path)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`

4. **Add Production Environment Variables**:
   Under the **Environment** tab, click **Add Environment Variable** for each of the following:

   | Variable Name | Example / Instruction |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `3000` |
   | `SESSION_SECRET` | Paste a long, randomly generated secret string (e.g. `sbg_prod_sec_key_983274981273918237` or generate using `openssl rand -hex 32`) |
   | `FIREBASE_SERVICE_ACCOUNT_JSON` | Paste your minified single-line Firebase Service Account JSON (see Step 4 below) |
   | `CORS_ORIGIN` | `https://sbg-army-esports.vercel.app` *(update with your exact Vercel frontend URL after Step 3)* |

5. **Deploy**:
   - Click **Create Web Service**.
   - Wait for Render to finish building. Once complete, copy your Render API URL (e.g., `https://sbg-army-api.onrender.com`).

---

## STEP 3: CONFIGURE VERCEL FOR FRONTEND (`artifacts/sbg-army`)

Vercel will host your high-performance React + Vite + Tailwind frontend SPA.

1. **Sign Up / Log In to Vercel**:
   - Go to [Vercel.com](https://vercel.com) and sign in using your GitHub account.

2. **Import Your GitHub Repository**:
   - Click **Add New...** > **Project**.
   - Import your `sbg-army-esports` repository.

3. **Configure Project Settings**:
   - **Framework Preset**: Select **Vite**.
   - **Root Directory**: Click *Edit* and select/type `artifacts/sbg-army` *(CRITICAL: Type this exact path)*.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Add Environment Variable**:
   Under **Environment Variables**, add:

   | Variable Name | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://sbg-army-api.onrender.com` *(Use your exact Render backend URL from Step 2)* |

5. **Deploy**:
   - Click **Deploy**.
   - Vercel will build and assign a production URL (e.g., `https://sbg-army-esports.vercel.app`).

---

## STEP 4: FIREBASE FIRESTORE CREDENTIALS & SECURITY

Your persistent database uses **Firebase Firestore** (`sbg-army-web`).

1. **Obtain Your Firebase Service Account JSON**:
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Select your project (`sbg-army-web`).
   - Click the gear icon ⚙️ next to Project Overview > **Project settings**.
   - Go to the **Service accounts** tab.
   - Click **Generate new private key**. A `.json` file will download to your computer.

2. **Minify JSON into a Single Line**:
   - Open the downloaded `.json` file in a text editor (Notepad, VS Code, or TextEdit).
   - Minify the contents into a single continuous line without newlines (you can use a free tool like `jsonminify.com` or replace newlines with spaces).
   - Example format:
     ```json
     {"type":"service_account","project_id":"sbg-army-web","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"..."}
     ```

3. **Set `FIREBASE_SERVICE_ACCOUNT_JSON` on Render**:
   - Paste this single-line JSON as the value for `FIREBASE_SERVICE_ACCOUNT_JSON` in Render's Environment Variables settings.
   - **CRITICAL**: Never commit this file or JSON string into GitHub or Vercel environment variables.

---

## STEP 5: FINAL VERIFICATION & CHECKLIST

Once Vercel and Render finished deploying:

1. **Update `CORS_ORIGIN` on Render**:
   - Go to Render > your Web Service > Environment.
   - Set `CORS_ORIGIN` to your exact Vercel URL (e.g. `https://sbg-army-esports.vercel.app`).
   - Click **Save Changes**. Render will automatically redeploy.

2. **Test Public Website**:
   - Open your Vercel URL (`https://sbg-army-esports.vercel.app`).
   - Confirm page sections, roster, matches, and news render without network errors.

3. **Test Admin Control Center**:
   - Navigate to `/sbg-admin` on your deployed site.
   - Log in using your admin credentials.
   - Edit or add a record (e.g., update site settings, players, or sponsors).
   - Refresh the page and confirm the data persists from Firestore.

---

## TROUBLESHOOTING & COMMON FIXES

- **CORS Error / Unable to fetch API**: Ensure `CORS_ORIGIN` on Render matches your Vercel URL exactly (including `https://` with no trailing slash).
- **Admin Login fails with 503**: Ensure `SESSION_SECRET` is set in Render environment variables.
- **Data not saving to Firestore**: Verify `FIREBASE_SERVICE_ACCOUNT_JSON` on Render is valid JSON and contains the correct `private_key`.
