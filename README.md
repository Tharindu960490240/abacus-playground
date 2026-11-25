# Abacus Playground

Soroban (abacus) mental-maths site: Anzan and Dictation games with levels, times tables,
number bonds, a virtual soroban, printable papers, a step-by-step course, tutorials,
a forum and a leaderboard. Teachers manage students, levels, papers, the course and tutorials.

**Stack:** Next.js 16 (React 19, App Router) · Material UI 9 · MongoDB (Mongoose 9) ·
Vercel Blob for uploads · `docx` for Word papers. One project, deployed to Vercel.

This replaces the old `wmathteacher` (Angular 8) and `bmathteacher` (Express) apps. It
uses the **same MongoDB collections**, so the existing database keeps working. See
[`CHANGES.md`](CHANGES.md) for every issue that was fixed.

---

## 1. Before anything else: rotate the leaked secrets

The old repo had the MongoDB Atlas password in `README.md` and the JWT key in
`config/default.json`. Anyone who saw that repo can reach the database.

1. In Atlas → Database Access, change the password of the `loons_math` user (or create a new user and delete the old one).
2. Make sure the old repo is not public, and remove the secrets from its history if it ever was.
3. Use a brand new random `AUTH_SECRET` here (below). Old logins will not carry over, which is fine.

## 2. Run it locally

Needs Node 20 or later.

```bash
cp .env.example .env.local     # then fill in the values
npm install
npm run dev                    # http://localhost:3000
```

| Variable | What it is |
|---|---|
| `MONGODB_URI` | Atlas connection string (include the database name, e.g. `/mathteacher`) |
| `AUTH_SECRET` | 32+ random characters: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token. Locally you can leave it empty: uploads go to `public/uploads/` |
| `APP_URL` | Optional. Your site address, used to block cross-site form posts |

## 3. Deploy to Vercel

1. Push this folder to a GitHub repo and import it at <https://vercel.com/new>. Vercel detects Next.js; no build settings needed.
2. **Database:** Project → Storage / Marketplace → *MongoDB Atlas* (or paste your own `MONGODB_URI` into Settings → Environment Variables). In Atlas → Network Access, allow Vercel to connect (`0.0.0.0/0`, or Vercel's static IPs on paid plans).
3. **Files:** Project → Storage → *Create Blob store* and connect it. This adds `BLOB_READ_WRITE_TOKEN`.
4. **Secret:** add `AUTH_SECRET` (and optionally `APP_URL`) in Settings → Environment Variables for Production and Preview.
5. Deploy. Tip: put the Vercel Functions region (Settings → Functions) close to your Atlas region.

## 4. One-off setup scripts

Run these from your computer with the production variables set:

```bash
# Load the game levels from "game mode data.docx" (levels 15 → 1, Dan 1–5).
# Only adds missing levels; --force overwrites, --pass=60 sets the pass mark (% of max score).
MONGODB_URI=... npm run seed:levels

# Give a teacher account admin rights (register it on the site first).
MONGODB_URI=... npm run make-admin -- teacher@example.com

# Copy profile pictures, tutorial images and course PDFs from the old server's
# upload/ folder into Vercel Blob, and lower-case stored emails.
MONGODB_URI=... BLOB_READ_WRITE_TOKEN=... npm run migrate:uploads -- /path/to/old/bmathteacher
```

## 5. Checks

```bash
npm test        # maths engine, papers/Word export, game marking and access rules
npm run lint
npm run build
```

## Project layout

```
src/app/            pages (React) and src/app/api/ (server routes)
src/components/     shared UI: AppShell, Soroban, games, your CustomSnackbar,
                    LoadingSpinner and PasswordStrength
src/lib/shared/     code used by both browser and server (question generator, scoring, password rules)
src/lib/server/     database models, auth, uploads, Word paper builder
scripts/            seed / admin / migration scripts
```

### Using the toast and loader anywhere

```js
const { notify, notifyError, withLoading } = useNotify();
notify("Saved", "success");                 // CustomSnackbar
await withLoading(api.post("/api/..."));   // LoadingSpinner while it runs
```

### Notes

- Replace `public/assets/afc-icon.svg` and `afc-icon-white.svg` with your real AFC icons (the files there are placeholders).
- Text is set up for translation with `react-i18next` (`src/i18n.js`); only the loader and password checklist strings are in it so far.
- Game levels: the spec lists three sections (add/sub, ×, ÷) per level with 20–50 questions each, so a full level game is 70–110 questions. Trim them in **Teacher → Game levels** if that is too long.
