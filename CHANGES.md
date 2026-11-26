# What changed from the old app

The Angular 8 frontend (`wmathteacher`) and Express backend (`bmathteacher`) are replaced by
one Next.js + Material UI project. Every issue found in the review is listed here with what
happened to it.

## Security

| Old problem | Now |
|---|---|
| MongoDB Atlas password in `README.md`; JWT key `"testkey"` in `config/default.json` | Secrets only come from environment variables; `.env*` is git-ignored. **Rotate the old password** (see README). |
| `admin` middleware sent 403 and then called `next()`, so admin routes ran for students | `requireAdmin()` throws; checked in every teacher route (covered by tests) |
| `GET /api/user/all` and `/allstudent` were public and returned password hashes and guardian phone numbers | Teacher-only, and only name/email/group/scores are returned. Password hashes are never selected |
| Course and chapter delete/view routes had no login check | Teacher-only |
| `GET /api/game/save` was public and wrote game records | Removed. Levels are edited in Teacher → Game levels or seeded by script |
| `POST /api/paper/marks/add` had no login check | Teacher-only |
| Any student could read any student's profile, papers, scores and answer keys | Students can only see their own; answer keys are teacher-only |
| Any student could edit or delete anyone's forum posts | Owner or teacher only |
| Any student could upload tutorial images | Teacher-only |
| Game scores signed in the browser with a key the server sent, so any score could be forged; keys could be replayed | Server generates and stores the questions, marks the answers itself, sessions are single-use and expire |
| JWT never expired, stored in `localStorage` (readable by any script) | 7-day session in an httpOnly, SameSite cookie; changing password signs out other devices |
| Login had no rate limit and its error messages showed which emails were registered | 8 attempts per 15 min per email and per IP; one generic error message |
| Passwords only needed 6 characters | Same 5 rules as your PasswordStrength checklist, enforced on the server too |
| CORS `*` | Same-origin only; cross-site form posts are rejected |
| Uploads trusted the browser's file type; PDFs kept the uploader's file name (overwrites) | File signatures checked; random names in Vercel Blob; size limits enforced before reading |
| `/pic/have` sent the server's file path to the browser | Removed |
| Tutorial HTML shown as-is | Sanitised when saved and again when shown |
| No security headers on the API | `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` on every response |

## Bugs

| Old problem | Now |
|---|---|
| Random number bounds swapped: 1-digit questions never used 1 or 2; 2-digit never 10 or 11; minus signs 11% of the time instead of 30% | Fixed and unit-tested |
| Shared global variables (`questions`, `paper`, `answers`, `result`, `tmpArray`…) mixed up concurrent requests | No globals; every request is independent |
| Division papers produced decimal answers | Division is always exact |
| Subtraction could go below zero | Running total never goes negative |
| Mixed-digit questions could have fewer rows than requested | Always the requested number of rows |
| Every `date` was the server's start time (`default: Date.now()`) | Uses the function (`Date.now`), so each record gets its own time |
| New students never got their first course chapter/lesson (array compared to `"null"`) | Progress is created and repaired automatically |
| "Next lesson" mixed lessons from all chapters and sometimes never replied | Ordered by level → chapter → lesson; always replies |
| Chapter lessons never loaded (virtual added after the model was built, virtuals not in JSON) | Fixed |
| Saving a paper template never stored its level, so "create my paper" crashed | Level is required; builder warns about old templates without one |
| `/paper/generate` returned `{}` (promise not awaited); `/download` defined twice | Fixed / removed duplicate |
| `.save()` not awaited in many routes; `notFoundError` called without `res` or undefined; wrong `error2` destructuring | Fixed; one error handler turns all errors into clean JSON |
| Async route errors left requests hanging (no error handler in Express 4) | Every route is wrapped |
| Crashes when a score, game key, paper level or chapter was missing | Checked, with readable messages |
| One missing profile picture stopped the whole thumbnails request | Pictures are plain URLs now |
| `db/init.js` ignored config and always connected to `localhost` | Uses `MONGODB_URI`, with a connection cached between requests |
| `async` used but not in `package.json`; Node 10, Mongoose 5, Joi 14, unmaintained `officegen`; unused `twilio`, `nodemailer`, `xml2json`… | Node 20+, current packages only; Word files built with `docx` |
| Local `upload/` folder (does not survive on Vercel or Heroku) | Vercel Blob; migration script copies old files |
| Leaderboard loaded the whole collection to find one rank; group filter ignored | Counted in the database; group filter works |

## Frontend

- Angular 8 + AngularJS Material + Angular Material 7 + Bootstrap + MDBootstrap + jQuery → **React 19 + Material UI 9** only.
- Your **CustomSnackbar**, **LoadingSpinner** and **PasswordStrength** are used app-wide (`useNotify()`), with light/dark theme via `data-theme`.
- Light, dark and system themes; works on phones.
- All screens rebuilt: home, play hub, Anzan, Dictation, times tables, number bonds, soroban, leaderboard, papers, profile, forum, tutorials, course, and teacher pages for students, papers, game levels, course and tutorials.
- New: a game-level editor (levels used to be inserted into the database by hand) and a seed script built from `game mode data.docx`.
- Old route typos (`dictaion`, `multificationdivition`) gone; admin pages are guarded in the UI and on the server.

## Small changes to your components

- **LoadingSpinner:** `process.env.PUBLIC_URL` (Create React App) → icons load from `/assets/…`.
- **PasswordStrength:** rules imported from `src/lib/shared/password.js` (same rules, same exports) so the server uses the exact same list; dark-mode colours use `theme.applyStyles`, because `palette.mode` does not change with CSS-variable themes.
- **CustomSnackbar:** unchanged.

## Design refresh ("beads and ink")

- **Theme:** Material 3 style: AFC navy as the main colour, bead red for actions, a soroban-wood accent, cool paper backgrounds, a full dark mode, and the Lexend typeface with lined-up numbers. Corner rounding follows hierarchy (large panels 28px, cards 20px, small items 12px, pill-shaped buttons). Adds a "tonal" button style: `<Button variant="tonal">`.
- **Navigation:** new top bar with pill-shaped links and a Teacher menu. On phones and tablets: a bottom navigation bar (Home, Play, Course, Ranks, More) and a "More" sheet for everything else. Adds a skip-to-content link.
- **Bead progress:** a new `BeadProgress` component shows a student's level as beads on a rod. It appears on the home page and the play hub.
- **Pages:**
  - Home: a hero whose soroban slides its beads into place once on load (visitors), or a "welcome back" panel with bead progress (students).
  - Login and register: two-panel layout.
  - Play: tiles showing each game's progress.
  - Leaderboard: a 2-1-3 podium and a phone-friendly table.
  - Course: levels shown as a vertical path.
  - Tutorials: numbered covers.
  - Soroban: a larger wooden-style abacus.
- **Small changes:** avatars get a colour of their own (always the same for each person), game numbers use bold Lexend instead of the LCD font, and the logo is drawn inline so it follows the theme.

## File uploads

- Works with **public and private** Vercel Blob stores (detected on the first upload, or set `BLOB_ACCESS`). With a private store, files are served by `/api/files/…`: profile photos and course PDFs need a login, tutorial images are visible to anyone.
- On Vercel, uploads no longer need `BLOB_READ_WRITE_TOKEN` to be set; the Blob SDK signs in on its own.
- A failed upload now shows the real reason (for example "Could not save the file: Access denied…") instead of "Something went wrong".
