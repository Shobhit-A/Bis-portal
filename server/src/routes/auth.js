const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/authMiddleware');
const { sendRegistrationAlert } = require('../services/emailService');

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

    sendRegistrationAlert({ username: user.username, email: user.email }); // fire-and-forget, don't make the client wait on Brevo

    res.status(201).json({ message: 'Registration submitted. You will be notified by email once your account is approved.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
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

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => res.json({ user: req.user }));

module.exports = router;
