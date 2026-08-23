# 1. Push the Project to GitHub

Both Vercel and Render deploy by connecting to a GitHub repository, so this
is the first step.

## 1.1 Create a repository

1. Go to https://github.com and log in (create a free account if you don't have one).
2. Click the **+** icon top-right → **New repository**.
3. Repository name: `sbg-army` (or anything you like).
4. Choose **Private** (recommended, since the repo will contain your source
   code) or Public.
5. Do **not** check "Add a README" — this project already has one.
6. Click **Create repository**. Keep the page open — it shows the commands
   you need next.

## 1.2 Push this project from Replit

Open the Shell in Replit (or use the Replit Git pane) and run:

```bash
git init                     # only if this project isn't already a git repo
git add .
git commit -m "Initial production-ready commit"
git branch -M main
git remote add origin https://github.com/<your-username>/sbg-army.git
git push -u origin main
```

If prompted for credentials, GitHub requires a **Personal Access Token**
(not your password): GitHub → Settings → Developer settings → Personal
access tokens → Generate new token (classic), scope `repo`, then paste the
token as the password when git asks.

## 1.3 Verify

Refresh the GitHub repository page — you should see all your project files
(the `artifacts/`, `lib/`, `docs/`, `deploy/` folders, etc.).

## 1.4 Future updates

Any time you make changes you want deployed:

```bash
git add .
git commit -m "Describe what changed"
git push
```

Vercel and Render (once connected in the next steps) will automatically
redeploy on every push to `main`.
