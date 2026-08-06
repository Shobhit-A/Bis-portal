const express = require('express');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { sendAdminAlert } = require('../services/emailService');
const { uploadObject, deleteObject } = require('../services/storage');

const router = express.Router();
const prisma = new PrismaClient();

// Multer config — buffer in memory, then streamed to R2 (no local disk involved)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, JPG, PNG files are allowed'));
  }
});

// Fetch a submission the logged-in user owns, or null. Every route below uses this
// as the single ownership-check chokepoint instead of repeating the guard per route.
async function ownSubmission(userId, submissionId, extra = {}) {
  const submission = await prisma.submission.findUnique({ where: { id: submissionId }, ...extra });
  if (!submission || submission.userId !== userId) return null;
  return submission;
}

const FORM_TYPES = ['FMCS', 'ISI'];

// GET /api/submissions — list my forms, optionally filtered to one form type
router.get('/', async (req, res) => {
  try {
    const where = { userId: req.user.id };
    if (FORM_TYPES.includes(req.query.formType)) where.formType = req.query.formType;
    const submissions = await prisma.submission.findMany({
      where,
      select: { id: true, label: true, formType: true, status: true, updatedAt: true, createdAt: true },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/submissions — create a new form, optionally cloning formData from an existing one of the same type
router.post('/', async (req, res) => {
  try {
    const { label, cloneFromId } = req.body;
    if (!label || !label.trim()) return res.status(400).json({ error: 'Label is required' });
    const formType = FORM_TYPES.includes(req.body.formType) ? req.body.formType : 'FMCS';

    let formData = {};
    if (cloneFromId) {
      const source = await ownSubmission(req.user.id, cloneFromId);
      if (!source) return res.status(404).json({ error: 'Form to clone from was not found' });
      if (source.formType !== formType) return res.status(400).json({ error: 'Cannot clone from a form of a different type' });
      formData = source.formData;
    }

    const submission = await prisma.submission.create({
      data: { userId: req.user.id, label: label.trim(), formType, formData }
    });
    res.status(201).json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/submissions/:id — get one of my forms + its documents
router.get('/:id', async (req, res) => {
  try {
    const submission = await ownSubmission(req.user.id, req.params.id, {
      include: { documents: { orderBy: { uploadedAt: 'desc' } } }
    });
    if (!submission) return res.status(404).json({ error: 'Form not found' });
    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/submissions/:id — auto-save form data
router.put('/:id', async (req, res) => {
  try {
    const submission = await ownSubmission(req.user.id, req.params.id);
    if (!submission) return res.status(404).json({ error: 'Form not found' });
    if (submission.status === 'SUBMITTED') return res.status(403).json({ error: 'Form already submitted. Contact admin to unlock.' });

    const updated = await prisma.submission.update({
      where: { id: submission.id },
      data: { formData: req.body.formData, status: 'IN_PROGRESS' }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Save failed' });
  }
});

// POST /api/submissions/:id/submit — final submit
router.post('/:id/submit', async (req, res) => {
  try {
    const submission = await ownSubmission(req.user.id, req.params.id);
    if (!submission) return res.status(404).json({ error: 'Form not found' });
    if (submission.status === 'SUBMITTED') return res.status(400).json({ error: 'Already submitted' });

    const updated = await prisma.submission.update({
      where: { id: submission.id },
      data: { formData: req.body.formData || submission.formData, status: 'SUBMITTED' },
      include: { user: true }
    });

    sendAdminAlert({ clientUsername: updated.user.username, submittedAt: updated.updatedAt }); // fire-and-forget, don't make the client wait on Brevo

    res.json({ message: 'Form submitted successfully', submission: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Submit failed' });
  }
});

// POST /api/submissions/:id/documents — upload a document to a specific form
router.post('/:id/documents', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const { fieldKey, fieldLabel } = req.body;
    if (!fieldKey) return res.status(400).json({ error: 'fieldKey is required' });

    const submission = await ownSubmission(req.user.id, req.params.id);
    if (!submission) return res.status(404).json({ error: 'Form not found' });
    if (submission.status === 'SUBMITTED') return res.status(403).json({ error: 'Form already submitted. Contact admin to unlock.' });

    // Remove old doc for same fieldKey if exists
    const existing = await prisma.document.findFirst({ where: { submissionId: submission.id, fieldKey } });
    if (existing) {
      await deleteObject(existing.filePath);
      await prisma.document.delete({ where: { id: existing.id } });
    }

    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const objectKey = `${req.user.id}/${unique}-${req.file.originalname.replace(/\s+/g, '_')}`;
    await uploadObject(objectKey, req.file.buffer, req.file.mimetype);

    const doc = await prisma.document.create({
      data: {
        submissionId: submission.id,
        fieldKey,
        fieldLabel: fieldLabel || fieldKey,
        fileName: req.file.originalname,
        filePath: objectKey,
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

// DELETE /api/submissions/:id/documents/:docId
router.delete('/:id/documents/:docId', async (req, res) => {
  try {
    const submission = await ownSubmission(req.user.id, req.params.id);
    if (!submission) return res.status(404).json({ error: 'Form not found' });
    const doc = await prisma.document.findUnique({ where: { id: req.params.docId } });
    if (!doc || doc.submissionId !== submission.id) return res.status(404).json({ error: 'Not found' });
    await deleteObject(doc.filePath);
    await prisma.document.delete({ where: { id: doc.id } });
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
