const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/authMiddleware');
const { sendRegistrationAlert, sendActivationEmail, sendPasswordResetEmail } = require('../services/emailService');

const router = express.Router();
const prisma = new PrismaClient();

// Only the login route itself is rate-limited — /captcha and /me must stay unrestricted
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many login attempts. Try again in 15 minutes.' } });

// GET /api/auth/captcha — issue a signed math challenge (stateless, no server-side storage)
router.get('/captcha', (req, res) => {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const token = jwt.sign({ type: 'captcha', answer: a + b }, process.env.JWT_SECRET, { expiresIn: '5m' });
  res.json({ question: `${a} + ${b}`, token });
});

// POST /api/auth/register — client self-registration, pending admin approval
router.post('/register', loginLimiter, [
  body('username').trim().notEmpty().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('password').notEmpty().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('captchaToken').notEmpty().withMessage('CAPTCHA is required'),
  body('captchaAnswer').notEmpty().withMessage('CAPTCHA answer is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { username, email, password, captchaToken, captchaAnswer } = req.body;

    let captchaPayload;
    try {
      captchaPayload = jwt.verify(captchaToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ error: 'CAPTCHA expired. Please try again.' });
    }
    if (captchaPayload.type !== 'captcha' || Number(captchaAnswer) !== captchaPayload.answer) {
      return res.status(400).json({ error: 'Incorrect CAPTCHA answer.' });
    }

    const existing = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
    if (existing) return res.status(409).json({ error: 'Username or email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, email, passwordHash, role: 'CLIENT', approved: false },
      select: { id: true, username: true, email: true }
    });

    const approveToken = jwt.sign({ type: 'approve-user', userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const approveUrl = `${req.protocol}://${req.get('host')}/api/auth/approve/${approveToken}`;
    sendRegistrationAlert({ username: user.username, email: user.email, approveUrl }); // fire-and-forget, don't make the client wait on Brevo

    res.status(201).json({ message: 'Registration submitted. You will be notified by email once your account is approved.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/approve/:token — one-click admin approval from the registration email
router.get('/approve/:token', async (req, res) => {
  const sendPage = (title, message, color) => res.send(`
    <!DOCTYPE html>
    <html><head><title>${title}</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body style="font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8f9fa;">
      <div style="text-align: center; padding: 40px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 400px;">
        <h2 style="color: ${color}; margin-top: 0;">${title}</h2>
        <p style="color: #666;">${message}</p>
        <a href="${process.env.CLIENT_URL}/admin" style="color: #1F5C99;">Go to Admin Dashboard →</a>
      </div>
    </body></html>
  `);

  let payload;
  try {
    payload = jwt.verify(req.params.token, process.env.JWT_SECRET);
  } catch {
    return sendPage('Link Expired', 'This approval link has expired or is invalid. Please approve this account from the admin dashboard instead.', '#c62828');
  }
  if (payload.type !== 'approve-user') {
    return sendPage('Invalid Link', 'This link is not a valid approval link.', '#c62828');
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return sendPage('Account Not Found', 'This account no longer exists.', '#c62828');
    if (user.approved) return sendPage('Already Approved', `${user.username} was already approved.`, '#2e7d32');

    const updated = await prisma.user.update({ where: { id: user.id }, data: { approved: true } });
    if (updated.email) sendActivationEmail({ username: updated.username, email: updated.email });

    sendPage('Account Approved ✓', `${updated.username} can now log in to the portal.`, '#2e7d32');
  } catch (err) {
    console.error(err);
    sendPage('Error', 'Something went wrong approving this account. Please try from the admin dashboard.', '#c62828');
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('captchaToken').notEmpty().withMessage('CAPTCHA is required'),
  body('captchaAnswer').notEmpty().withMessage('CAPTCHA answer is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { username, password, captchaToken, captchaAnswer } = req.body;

    let captchaPayload;
    try {
      captchaPayload = jwt.verify(captchaToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ error: 'CAPTCHA expired. Please try again.' });
    }
    if (captchaPayload.type !== 'captcha' || Number(captchaAnswer) !== captchaPayload.answer) {
      return res.status(400).json({ error: 'Incorrect CAPTCHA answer.' });
    }

    // Admin logs in by email OR username; clients by username
    const user = await prisma.user.findFirst({
      where: { OR: [{ username }, { email: username }] }
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.role === 'CLIENT' && !user.approved) {
      return res.status(403).json({ error: 'Your account is pending admin approval. You will receive an email once approved.' });
    }
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

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

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => res.json({ user: req.user }));

module.exports = router;
