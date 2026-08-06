# Forgot Password + Confirm Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add self-service password reset (email link) and a confirm-password retype field on Register and the new Reset Password page.

**Architecture:** Two new stateless-JWT-backed routes on the backend (same pattern as the existing CAPTCHA and approve-user tokens — no new DB tables or fields), one new Brevo email template, two new frontend pages, and small additions to `Login.jsx`/`Register.jsx`/`App.jsx`.

**Tech Stack:** Express + jsonwebtoken + bcryptjs + express-validator (backend), React + react-router-dom (frontend). No test framework in this repo — verification is manual (`CLAUDE.md`).

**Spec:** `docs/superpowers/specs/2026-08-06-forgot-password-confirm-password-design.md`

---

### Task 1: Backend — password reset email

**Files:**
- Modify: `server/src/services/emailServ

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = FROM;
  sendSmtpEmail.to = [{ email }];
  sendSmtpEmail.subject = 'Reset Your Absolute Veritas Portal Password';
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1F5C99; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Absolute Veritas Portal</h1>
      </div>
      <div style="padding: 32px; background: #f8f9fa;">
        <h2 style="color: #1A1A2E; margin-top: 0;">Password Reset Requested</h2>
        <p style="color: #333;">Hi ${username}, we received a request to reset your portal password. This link expires in 1 hour.</p>
        <div style="margin-top: 24px;">
          <a href="${resetUrl}" style="background: #1F5C99; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password →</a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
      <div style="padding: 16px; background: #e9ecef; text-align: center; font-size: 12px; color: #666;">
        Absolute Veritas — BIS Certification Consultancy
      </div>
    </div>
  `;
  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Password reset email sent');
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}
```

- [ ] **Step 2: Export it**

Change:
```javascript
module.exports = { sendAdminAlert, sendRegistrationAlert, sendActivationEmail };
```
to:
```javascript
module.exports = { sendAdminAlert, sendRegistrationAlert, sendActivationEmail, sendPasswordResetEmail };
```

- [ ] **Step 3: Commit**

```bash
git add server/src/services/emailService.js
git commit -m "Add password reset email template"
```

---

### Task 2: Backend — forgot-password and reset-password routes

**Files:**
- Modify: `server/src/routes/auth.js`

- [ ] **Step 1: Import the new email function**

Change:
```javascript
const { sendRegistrationAlert, sendActivationEmail } = require('../services/emailService');
```
to:
```javascript
const { sendRegistrationAlert, sendActivationEmail, sendPasswordResetEmail } = require('../services/emailService');
```

- [ ] **Step 2: Add the two routes**

Insert this right after the `POST /login` route (before `GET /me`):

```javascript
// POST /api/auth/forgot-password — request a password reset link. Always returns the same
// generic message regardless of whether the account exists or has an email on file, so the
// response never reveals which usernames are registered.
router.post('/forgot-password', loginLimiter, [
  body('username').trim().notEmpty().withMessage('Username is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const GENERIC_MESSAGE = "If an account with that username has an email on file, a password reset link has been sent. If you don't have an email on file, contact info@absoluteveritas.com to reset your password.";
  try {
    const user = await prisma.user.findUnique({ where: { username: req.body.username.trim() } });
    if (user?.email) {
      const token = jwt.sign({ type: 'reset-password', userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
      sendPasswordResetEmail({ username: user.username, email: user.email, resetUrl }); // fire-and-forget, don't make the client wait on Brevo
    }
    res.json({ message: GENERIC_MESSAGE });
  } catch (err) {
    console.error(err);
    res.json({ message: GENERIC_MESSAGE }); // never leak whether the lookup itself failed
  }
});

// POST /api/auth/reset-password/:token — set a new password from a reset link
router.post('/reset-password/:token', loginLimiter, [
  body('password').notEmpty().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  let payload;
  try {
    payload = jwt.verify(req.params.token, process.env.JWT_SECRET);
  } catch {
    return res.status(400).json({ error: 'Reset link expired or invalid. Please request a new one.' });
  }
  if (payload.type !== 'reset-password') return res.status(400).json({ error: 'Invalid reset link.' });

  try {
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(400).json({ error: 'Reset link expired or invalid. Please request a new one.' });

    const passwordHash = await bcrypt.hash(req.body.password, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
```

- [ ] **Step 3: Verify locally with curl**

With the dev server running (`cd server && npm run dev`):

```bash
# Forgot-password for a username WITHOUT an email on file (e.g. an admin-created client account)
curl -s -X POST http://localhost:5000/api/auth/forgot-password -H "Content-Type: application/json" \
  -d '{"username":"<some-admin-created-client-username>"}'
```
Expected: `200` with the generic message — same shape as below.

```bash
# Forgot-password for a username that doesn't exist at all
curl -s -X POST http://localhost:5000/api/auth/forgot-password -H "Content-Type: application/json" \
  -d '{"username":"definitely_not_a_real_user_xyz"}'
```
Expected: identical `200` response to the previous command — confirms no enumeration leak.

```bash
# Forgot-password for a username WITH an email — check server console for "Password reset email sent"
curl -s -X POST http://localhost:5000/api/auth/forgot-password -H "Content-Type: application/json" \
  -d '{"username":"<a-self-registered-or-admin-username>"}'
```
Expected: same `200` generic message, and the server's console log shows `Password reset email sent` (confirming the email branch actually fired).

```bash
# Reset with an invalid token
curl -s -i -X POST http://localhost:5000/api/auth/reset-password/not-a-real-token -H "Content-Type: application/json" \
  -d '{"password":"newpassword123"}'
```
Expected: `400` with `{"error":"Reset link expired or invalid. Please request a new one."}`.

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/auth.js
git commit -m "Add forgot-password and reset-password routes"
```

---

### Task 3: Frontend — Forgot Password page

**Files:**
- Create: `client/src/pages/ForgotPassword.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { username: username.trim() });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="bg-primary px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">AV</span>
        </div>
        <span className="text-white font-semibold text-sm tracking-wide">ABSOLUTE VERITAS</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="card p-8">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-gray-900">Forgot password</h1>
              <p className="text-sm text-gray-500 mt-1">Enter your username and we'll email you a reset link.</p>
            </div>

            {message ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                {message}
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label">Username <span className="required">*</span></label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Enter your username"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      autoComplete="username"
                      autoFocus
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Remembered your password?{' '}
            <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="py-4 text-center text-xs text-gray-400 border-t border-border">
        © {new Date().getFullYear()} Absolute Veritas · BIS Certification Consultancy · New Delhi, India
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/ForgotPassword.jsx
git commit -m "Add Forgot Password page"
```

---

### Task 4: Frontend — Reset Password page

**Files:**
- Create: `client/src/pages/ResetPassword.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      toast.success('Password reset successful. Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="bg-primary px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">AV</span>
        </div>
        <span className="text-white font-semibold text-sm tracking-wide">ABSOLUTE VERITAS</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="card p-8">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-gray-900">Reset your password</h1>
              <p className="text-sm text-gray-500 mt-1">Choose a new password for your account.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
                {error.toLowerCase().includes('expired') && (
                  <>{' '}<Link to="/forgot-password" className="underline font-medium">Request a new link</Link></>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">New Password <span className="required">*</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Set a new password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirm Password <span className="required">*</span></label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="Retype the new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            <Link to="/login" className="text-primary hover:underline">Back to sign in</Link>
          </p>
        </div>
      </div>

      <div className="py-4 text-center text-xs text-gray-400 border-t border-border">
        © {new Date().getFullYear()} Absolute Veritas · BIS Certification Consultancy · New Delhi, India
      </div>
    </div>
  );
}
```

Note: both password fields share the single `showPassword` toggle — one eye icon reveals/hides
both at once. This is intentional (fewer moving parts than two independent toggles) and matches
how tightly-coupled the two fields already are (Register.jsx's Password/Confirm Password will
do the same).

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/ResetPassword.jsx
git commit -m "Add Reset Password page"
```

---

### Task 5: Frontend — "Forgot password?" link on Login

**Files:**
- Modify: `client/src/pages/Login.jsx`

- [ ] **Step 1: Add the link next to the Password label**

Change:
```jsx
              <div>
                <label className="label">Password <span className="required">*</span></label>
                <div className="relative">
```
to:
```jsx
              <div>
                <div className="flex items-center justify-between">
                  <label className="label">Password <span className="required">*</span></label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
```

(`Link` is already imported in this file — `import { useNavigate, Link } from 'react-router-dom';` — no import change needed.)

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Login.jsx
git commit -m "Add Forgot password link to Login page"
```

---

### Task 6: Frontend — Confirm Password on Register

**Files:**
- Modify: `client/src/pages/Register.jsx`

- [ ] **Step 1: Add `confirmPassword` to form state**

Change:
```jsx
  const [form, setForm] = useState({ username: '', email: '', password: '' });
```
to:
```jsx
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
```

- [ ] **Step 2: Validate the match before submitting**

Change:
```jsx
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
```
to:
```jsx
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
```

- [ ] **Step 3: Add the Confirm Password field**

Change:
```jsx
                  <div>
                    <label className="label">Password <span className="required">*</span></label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="input pr-10"
                        placeholder="Set a password"
                        value={form.password}
                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label">Security Check <span className="required">*</span></label>
```
to:
```jsx
                  <div>
                    <label className="label">Password <span className="required">*</span></label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="input pr-10"
                        placeholder="Set a password"
                        value={form.password}
                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label">Confirm Password <span className="required">*</span></label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input"
                      placeholder="Retype the password"
                      value={form.confirmPassword}
                      onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Security Check <span className="required">*</span></label>
```

(Same shared-`showPassword`-toggle approach as `ResetPassword.jsx` — no separate toggle state needed for the confirm field.)

- [ ] **Step 4: Verify in the browser**

`cd client && npm run dev`, go to `/register`, enter mismatched passwords, submit — confirm the
red "Passwords do not match" banner shows and no network request fires (check DevTools
Network tab). Then fix them to match and confirm registration still works as before.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Register.jsx
git commit -m "Add Confirm Password field to Register page"
```

---

### Task 7: Frontend — wire up routing

**Files:**
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Import the two new pages**

Change:
```jsx
import RegisterPage from './pages/Register';
```
to:
```jsx
import RegisterPage from './pages/Register';
import ForgotPasswordPage from './pages/ForgotPassword';
import ResetPasswordPage from './pages/ResetPassword';
```

- [ ] **Step 2: Add the two routes**

Change:
```jsx
      <Route path="/register" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/portal'} /> : <RegisterPage />} />
```
to:
```jsx
      <Route path="/register" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/portal'} /> : <RegisterPage />} />
      <Route path="/forgot-password" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/portal'} /> : <ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/portal'} /> : <ResetPasswordPage />} />
```

- [ ] **Step 3: Verify build**

Run: `cd client && npm run build` — expected: succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/App.jsx
git commit -m "Wire forgot-password and reset-password routes into App"
```

---

### Task 8: Manual QA

**Files:** none (verification only)

- [ ] **Step 1:** Register a new client with mismatched Password/Confirm Password — confirm
      the inline error fires and no request is sent (check Network tab).
- [ ] **Step 2:** Register successfully with matching passwords — confirm unchanged behavior
      from before this branch.
- [ ] **Step 3:** Forgot-password with a username that has an email on file — confirm the
      generic message shows in the UI, and the email actually arrives in a real inbox with a
      working reset link.
- [ ] **Step 4:** Click the reset link, submit mismatched New/Confirm Password — confirm the
      inline error, no request sent. Then submit matching passwords — confirm success, redirect
      to `/login`, and log in with the new password to confirm it actually took effect.
- [ ] **Step 5:** Forgot-password with a username that has no email on file, and separately
      with a username that doesn't exist — confirm the exact same generic message in both
      cases (no observable difference between them).
- [ ] **Step 6:** Visit an expired or hand-edited `/reset-password/:token` URL directly —
      confirm the clear "expired or invalid" error with a working "Request a new link" link,
      not a crash or blank page.
- [ ] **Step 7:** Visit `/forgot-password` and `/reset-password/anything` while already logged
      in — confirm both redirect away, matching `/login`/`/register`'s existing behavior.
- [ ] **Step 8:** Merge to `main` once all of the above pass:
  ```bash
  git checkout main
  git pull
  git merge feature/forgot-password-confirm-password
  git push
  ```
