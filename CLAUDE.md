# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

BIS Client Portal for Absolute Veritas (a BIS/FMCS certification consultancy) — a private web app where clients fill out a multi-tab certification form and upload supporting documents, and staff review/export submissions. Not a public product.

## Commands

There is no root-level tooling — `client/` and `server/` are independent npm projects with their own `node_modules`. The root `package.json` is a vestigial leftover (not installed, nothing runs from it) — ignore it.

**Server** (`server/`):
```bash
npm run dev          # nodemon src/index.js — dev server on PORT (default 5000)
npm run start         # node src/index.js — prod
npx prisma generate   # regenerate Prisma client after schema.prisma changes
npx prisma db push    # push schema to DATABASE_URL (no migration files are used — db push only)
npx prisma studio     # inspect/edit DB data visually
```

**Client** (`client/`):
```bash
npm run dev      # vite dev server, http://localhost:5173
npm run build    # vite build → dist/
npm run preview  # preview a production build locally
```

**No test suite exists** — both `package.json`s have a stub `test` script that just exits 1. **No lint config exists** either (no `.eslintrc*`/`eslint.config.js` in the repo despite eslint appearing transitively in `node_modules`). Don't invent lint/test commands that aren't there; verify changes by running the dev servers and exercising the flow instead.

Required env vars are documented in `server/.env.example` (DATABASE_URL, DIRECT_URL, JWT_SECRET, CLIENT_URL, BREVO_API_KEY, ADMIN_EMAIL, R2_* for Cloudflare object storage). Client only needs `VITE_API_URL` (see gotcha below); with it unset, axios falls back to relative `/api`.

## Architecture

### Data model (server/prisma/schema.prisma)

`User` (role `ADMIN`|`CLIENT`, `approved` bool for self-registration gating) → has many `Submission` → has many `Document`. One login can own **multiple independent submissions** ("forms") — each `Submission` has its own `label`, `status` (`NOT_STARTED`|`IN_PROGRESS`|`SUBMITTED`), and a single `formData Json` blob. There are no separate tables per form section; the entire 9-tab form is one JSON object keyed by section, e.g. `formData.organization`, `formData.management`. New forms can optionally clone `formData` from an existing submission (`POST /api/submissions` with `cloneFromId`) so a client isn't re-typing shared info.

### Backend (server/src)

- `index.js` — Express bootstrap. `app.set('trust proxy', 1)` is required (Render sits behind a reverse proxy) for correct `req.protocol` in email links and correct per-client IPs in `express-rate-limit`. `/api/health` deliberately runs `SELECT 1` so an external uptime pinger hitting it every few minutes keeps Render's free tier from sleeping *and* resets Supabase's 7-day free-tier auto-pause clock at the same time.
- `routes/auth.js` — public. `/captcha` issues a **stateless** self-hosted CAPTCHA: a signed JWT carrying the answer, verified without server-side storage. `/register` creates an unapproved `User` and fires (not awaits) a registration-alert email to the admin containing a one-click `/approve/:token` link (JWT type `approve-user`, 7-day expiry) so admin can approve without logging into the dashboard. `/login` blocks unapproved clients with 403.
- `routes/admin.js` — everything behind `router.use(adminMiddleware)`. Client management, submission review, Excel export (`services/excelExport.js`), per-submission ZIP of all documents (`archiver`, streamed straight from R2), and `/unlock` to let a client re-edit a `SUBMITTED` form.
- `routes/submissions.js` — client-owned, ID-scoped (`/api/submissions/:id/...`). `ownSubmission(userId, submissionId)` is the single ownership-check chokepoint every route calls through — extend it rather than re-checking `submission.userId` inline in a new route. A submitted form (`status === 'SUBMITTED'`) rejects further writes/uploads until admin unlocks it.
- `services/emailService.js` — Brevo transactional email. All send calls at the route level are **fire-and-forget** (`sendXxx(...)`, not awaited) — each function catches its own errors internally, and awaiting them previously blocked HTTP responses for several seconds when Brevo was slow.
- `services/storage.js` — Cloudflare R2 via `@aws-sdk/client-s3` (R2 is S3-compatible). Multer uses `memoryStorage()` — files are buffered then streamed straight to R2, never touching local disk (Render's disk is ephemeral and wipes on every redeploy).

### Frontend (client/src)

- `lib/axios.js` — single axios instance; `baseURL = VITE_API_URL`. **Gotcha**: this value must include the `/api` suffix (e.g. `https://api.example.com/api`, not just `https://api.example.com`) or every request 404s/CORS-fails. Vite bakes this in at build time — changing the env var on Vercel requires an explicit Redeploy, not just a save.
- `lib/AuthContext.jsx` — JWT in `localStorage`, hydrated via `GET /auth/me` on load. A 401 response interceptor in `axios.js` force-clears the session and redirects to `/login`.
- `App.jsx` — role-gated routing: `/admin*` for `ADMIN`, `/portal` (form picker) and `/portal/:submissionId/*` (the wizard) for `CLIENT`.
- `pages/portal/PortalLayout.jsx` — owns the 9-tab wizard for one submission: loads `formData` on mount, debounces autosave 2s after any `updateSection` call (`PUT /submissions/:id`), and renders the active tab via nested `<Routes>`. Provides `submissionId` through `SubmissionIdContext` (from `components/FormField.jsx`) so none of the 9 tab components need it prop-drilled — they only need it to upload documents.
- `pages/portal/tabs/*.jsx` — one file per form tab, all following the same shape: read `formData[section]`, write via `set(key, val) => updateSection(section, { ...data, [key]: val })`. Follow this pattern exactly when adding a field or a new tab; don't invent a different state shape per tab.
- `components/FormField.jsx` — shared primitives (`Field`, `Select`, `FileUpload`) used across every tab. `FileUpload` pulls `submissionId` from context and calls `/submissions/:id/documents` directly.

### Deployment topology

Vercel (frontend, static Vite build, `client/vercel.json` SPA rewrite) + Render (backend, Node) + Supabase (Postgres) + Cloudflare R2 (documents) + Brevo (email) + Cloudflare DNS (custom subdomain in front of Vercel). Backend `CLIENT_URL` drives both the CORS `origin` and every email link URL — it must exactly match whatever origin the frontend is actually served from, and needs updating (with a Render redeploy) whenever the frontend's domain changes.
