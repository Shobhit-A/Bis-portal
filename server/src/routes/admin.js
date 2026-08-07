const express = require('express');
const bcrypt = require('bcryptjs');
const archiver = require('archiver');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { adminMiddleware } = require('../middleware/authMiddleware');
const { generateExcel } = require('../services/excelExport');
const { getObjectStream } = require('../services/storage');
const { sendActivationEmail } = require('../services/emailService');

const router = express.Router();
const prisma = new PrismaClient();

// All admin routes require admin role
router.use(adminMiddleware);

// GET /api/admin/users — list all clients
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: {
        id: true, username: true, email: true, createdAt: true, approved: true,
        submissions: { select: { id: true, label: true, formType: true, status: true, updatedAt: true }, orderBy: { updatedAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/users — create client account
router.post('/users', [
  body('username').trim().notEmpty().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').notEmpty().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { username, password } = req.body;
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) return res.status(409).json({ error: 'Username already taken' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, passwordHash, role: 'CLIENT' },
      select: { id: true, username: true, role: true, createdAt: true, approved: true }
    });
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/users/:id/approve — approve a self-registered client
router.patch('/users/:id/approve', async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { approved: true }
    });
    if (user.email) sendActivationEmail({ username: user.username, email: user.email }); // fire-and-forget, don't make the admin wait on Brevo
    res.json({ message: 'Account approved', user: { id: user.id, username: user.username, approved: user.approved } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/users/:id/password — reset client password
router.patch('/users/:id/password', [
  body('password').notEmpty().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } });
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/submissions — all submissions
router.get('/submissions', async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      include: {
        user: { select: { id: true, username: true } },
        documents: { select: { id: true, fieldKey: true, fieldLabel: true, fileName: true, uploadedAt: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/submissions/:id — single submission
router.get('/submissions/:id', async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, username: true } },
        documents: true
      }
    });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/submissions/:id/documents/:docId — download a single document
router.get('/submissions/:id/documents/:docId', async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.docId } });
    if (!doc || doc.submissionId !== req.params.id) return res.status(404).json({ error: 'Document not found' });
    const stream = await getObjectStream(doc.filePath);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
    stream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: 'File missing on storage' });
  }
});

// GET /api/admin/submissions/:id/excel — download as Excel
router.get('/submissions/:id/excel', async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: { user: true, documents: true }
    });
    if (!submission) return res.status(404).json({ error: 'Not found' });
    if (submission.formType === 'ISI') {
      return res.status(501).json({ error: 'Excel export for ISI forms is not yet available. Contact the developer to enable it.' });
    }
    const wb = await generateExcel(submission);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${submission.user.username}_BIS_Form.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
});

// GET /api/admin/submissions/:id/docs — download all docs as ZIP
router.get('/submissions/:id/docs', async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: { user: true, documents: true }
    });
    if (!submission) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${submission.user.username}_documents.zip"`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    for (const doc of submission.documents) {
      try {
        const stream = await getObjectStream(doc.filePath);
        archive.append(stream, { name: `${doc.fieldLabel}/${doc.fileName}` });
      } catch (err) {
        console.error(`Skipping missing document ${doc.filePath}:`, err.message);
      }
    }
    await archive.finalize();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ZIP export failed' });
  }
});

// PATCH /api/admin/submissions/:id/unlock — allow client to re-edit
router.patch('/submissions/:id/unlock', async (req, res) => {
  try {
    const submission = await prisma.submission.update({
      where: { id: req.params.id },
      data: { status: 'IN_PROGRESS' }
    });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
