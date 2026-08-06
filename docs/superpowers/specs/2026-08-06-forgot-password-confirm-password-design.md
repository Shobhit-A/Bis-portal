# Design: Forgot Password + Confirm Password

Date: 2026-08-06
Status: Approved — ready for implementation plan

## 1. Goal

Add two standard auth conveniences to the existing username/password + CAPTCHA login flow:
a self-service "forgot password" reset link (email-based), and a "confirm password" retype
field on the two places a user sets their own password (Register, and the new Reset Password
page).

## 2. Constraint driving the design

Not every account has an email on file. Admin-created client accounts (via the dashboard's
"New Account" modal) capture only a username and password — `User.email` is `null` for those.
Only self-registered clients and the admin account have an email. Forgot-password therefore
can't guarantee a working reset link for every account.

**Decision (confirmed with user):** no changes to the admin Create Account form. Forgot-password
works for accounts with an email on file; for accounts without one, the response is a single
generic message that covers both "link sent" and "no email on file" cases without revealing
which applies (avoids leaking which usernames exist in the system):

> "If an account with that username has an email on file, a password reset link has been sent.
> If you don't have an email on file, contact info@absoluteveritas.com to reset your password."

## 3. Backend — `server/src/routes/auth.js`

Two new routes, both behind the existing `loginLimiter` (same 10/15min limiter already applied
to `/login` and `/register` — prevents reset-spam abuse):

**`POST /forgot-password`** — body `{ username }`.
- Look up user by username. If found and `user.email` is set: sign a JWT
  `{ type: 'reset-password', userId: user.id }`, `expiresIn: '1h'` (shorter than the 7-day
  approve-user link — this is more sensitive). Build
  `resetUrl = ${process.env.CLIENT_URL}/reset-password/${token}` — this link is a client-side
  React route the user fills in a form on, unlike the admin approve-link (which is a one-click
  backend-rendered page), so it points at `CLIENT_URL`, not the backend's own host. Fire-and-forget
  `sendPasswordResetEmail({ username, email, resetUrl })`.
- Always responds `200` with the generic message above, regardless of whether the user exists,
  has an email, or the email send succeeds — same non-enumeration shape either way.

**`POST /reset-password/:token`** — body `{ password }`, validated `isLength({ min: 6 })` via
express-validator (matching the existing register/login password rule).
- `jwt.verify(req.params.token, JWT_SECRET)`; catch → `400 { error: 'Reset link expired or invalid. Please request a new one.' }`.
- Reject if `payload.type !== 'reset-password'` → `400 { error: 'Invalid reset link.' }`.
- Look up `payload.userId`; if the user no longer exists → same invalid-link error.
- Hash the new password (`bcrypt.hash(password, 12)`, matching every other password write in
  this codebase), update `passwordHash`, respond `200 { message: 'Password reset successful. You can now log in.' }`.

No token storage needed — same stateless-JWT pattern already used for CAPTCHA and the
approve-user email link (`authMiddleware.js` / `auth.js` already establish this convention).

## 4. Email — `server/src/services/emailService.js`

New `sendPasswordResetEmail({ username, email, resetUrl })`, modeled directly on the existing
`sendActivationEmail` (same header/footer markup, single primary-color CTA button "Reset
Password →" linking to `resetUrl`, subject "Reset Your Absolute Veritas Portal Password").
Sent from the same `FROM` constant every other email in this file already uses (which now
resolves to `info@absoluteveritas.com` via `ADMIN_EMAIL`, per the separate email-address
cleanup already committed on `main`) — no new sender configuration needed.

## 5. Frontend — new pages

**`client/src/pages/ForgotPassword.jsx`** (new) — mirrors `Login.jsx`'s shell/header/footer.
One field: Username. Submits to `POST /auth/forgot-password`, then swaps to a success view
showing the generic message returned by the server (same "success" pattern `Register.jsx`
already uses after registering). Link back to `/login`.

**`client/src/pages/ResetPassword.jsx`** (new) — route `/reset-password/:token`, token read via
`useParams()`. Two fields: New Password, Confirm Password (both with the existing show/hide
eye-icon toggle pattern from `Login.jsx`/`Register.jsx`). On submit: client-side check
`password === confirmPassword` first (if not, show the existing red error-banner pattern
inline, don't call the API); then `POST /auth/reset-password/:token { password }`. On success,
toast + `navigate('/login')`. On a server error (expired/invalid token), show the error banner
with a link to `/forgot-password` to request a new one.

## 6. Frontend — existing page changes

**`Login.jsx`**: add a small "Forgot password?" link, right-aligned next to the "Password"
field label (standard placement), linking to `/forgot-password`.

**`Register.jsx`**: add a "Confirm Password" field directly after "Password" (same show/hide
toggle pattern). On submit, before calling the API: if `password !== confirmPassword`, set the
existing error state to `"Passwords do not match"` and return early — no new UI pattern needed,
reuses the error banner already on this page.

Per explicit confirmation, confirm-password is **not** added to the admin's Create Account or
Reset Password modals (`Dashboard.jsx`) — those are unaffected by this feature.

## 7. Routing — `client/src/App.jsx`

Two new public routes, following the exact same "redirect away if already logged in" pattern
already used for `/login` and `/register`:

```
/forgot-password       → ForgotPassword.jsx
/reset-password/:token → ResetPassword.jsx
```

## 8. Manual QA (no automated test suite in this repo, per `CLAUDE.md`)

1. Register a new client with mismatched Password/Confirm Password — confirm the inline error
   fires and no request is sent (check network tab).
2. Register successfully with matching passwords — unchanged from current behavior.
3. Forgot-password with a username that has an email on file — confirm the generic message
   shows, and the email actually arrives (real inbox check) with a working reset link.
4. Click the reset link, set a new password with mismatched confirm — confirm inline error,
   no request sent. Then matching passwords — confirm success, redirect to `/login`, and the
   new password actually logs in.
5. Forgot-password with a username that has no email on file (or a username that doesn't
   exist at all) — confirm the exact same generic message shows either way (no way to
   distinguish the two cases from the response).
6. Visit an expired or tampered `/reset-password/:token` URL directly — confirm the clear
   "expired or invalid" error, not a crash or a silent failure.
7. Confirm `/forgot-password` and `/reset-password/:token` both redirect away if visited while
   already logged in, matching `/login`/`/register`'s existing behavior.
