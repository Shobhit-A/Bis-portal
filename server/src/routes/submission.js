const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { sendAdminAlert } = require('../services/emailService');

const router = express.Router();
const prisma = new PrismaClient();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads', req.user.id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname.replace(/\s+/g, '_')}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, JPG, PNG files are allowed'));
  }
});

// GET /api/submission — get own submission
router.get('/', async (req, res) => {
  try {
    let submission = await prisma.submission.findUnique({
      where: { userId: req.user.id },
      include: { documents: { orderBy: { uploadedAt: 'desc' } } }
    });
    if (!submission) {
      submission = await prisma.submission.create({ data: { userId: req.user.id, formData: {} }, include: { documents: true } });
    }
    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/submission — auto-save form data
router.put('/', async (req, res) => {
  try {
    const { formData } = req.body;
    const submission = await prisma.submission.findUnique({ where: { userId: req.user.id } });
    if (submission?.status === 'SUBMITTED') return res.status(403).json({ error: 'Form already submitted. Contact admin to unlock.' });

    const updated = await prisma.submission.upsert({
      where: { userId: req.user.id },
      update: { formData, status: 'IN_PROGRESS' },
      create: { userId: req.user.id, formData, status: 'IN_PROGRESS' }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Save failed' });
  }
});

// POST /api/submission/submit — final submit
router.post('/submit', async (req, res) => {
  try {
    const { formData } = req.body;
    const submission = await prisma.submission.findUnique({ where: { userId: req.user.id } });
    if (submission?.status === 'SUBMITTED') return res.status(400).json({ error: 'Already submitted' });

    const updated = await prisma.submission.upsert({
      where: { userId: req.user.id },
      update: { formData: formData || submission?.formData || {}, status: 'SUBMITTED' },
      create: { userId: req.user.id, formData: formData || {}, status: 'SUBMITTED' },
      include: { user: true }
    });

    // Send admin email alert
    await sendAdminAlert({
      clientUsername: updated.user.username,
      submittedAt: updated.updatedAt
    });

    res.json({ message: 'Form submitted successfully', submission: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Submit failed' });
  }
});

// POST /api/submission/documents — upload a document
router.post('/documents', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const { fieldKey, fieldLabel } = req.body;
    if (!fieldKey) return res.status(400).json({ error: 'fieldKey is required' });

    let submission = await prisma.submission.findUnique({ where: { userId: req.user.id } });
    if (!submission) {
      submission = await prisma.submission.create({ data: { userId: req.user.id, formData: {} } });
    }
    if (submission.status === 'SUBMITTED') {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Form already submitted. Contact admin to unlock.' });
    }

    // Remove old doc for same fieldKey if exists
    const existing = await prisma.document.findFirst({ where: { submissionId: submission.id, fieldKey } });
    if (existing) {
      const oldPath = path.join(__dirname, '../../uploads', existing.filePath);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      await prisma.document.delete({ where: { id: existing.id } });
    }

    const relPath = path.join(req.user.id, req.file.filename);
    const doc = await prisma.document.create({
      data: {
        submissionId: submission.id,
        fieldKey,
        fieldLabel: fieldLabel || fieldKey,
        fileName: req.file.originalname,
        filePath: relPath,
        mimeType: req.file.mimetype,
        fileSize: req.file.size
      }
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// DELETE /api/submission/documents/:id
router.delete('/documents/:id', async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id }, include: { submission: true } });
    if (!doc || doc.submission.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    const filePath = path.join(__dirname, '../../uploads', doc.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
