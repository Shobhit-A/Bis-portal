# Multiple Forms Per Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let one client login own multiple independent BIS forms, each separately labeled, editable, submittable, and downloadable — with an optional "clone typed answers from an existing form" shortcut when starting a new one.

**Architecture:** `Submission.userId` loses its `@unique` constraint (one user → many submissions). All submission-scoped API routes move from `/api/submission` (implicit "the one") to `/api/submissions/:id` (explicit, ownership-checked). A new `MyForms` client page lists/creates forms; the existing 9-tab editor (`PortalLayout`) is unchanged internally except it now reads `submissionId` from the URL instead of assuming one exists. A React Context carries `submissionId` down to the shared `FileUpload` component so none of the 9 tab files need to change.

**Tech Stack:** Express + Prisma (Postgres via Supabase) on the backend, React + react-router-dom v7 + Vite on the frontend. No test framework exists in this repo — verification throughout uses curl against the running dev server, direct Prisma queries, and a Playwright browser check for the full flow (matching how every prior feature in this codebase was verified).

**Reference spec:** `docs/superpowers/specs/2026-08-04-multi-form-submissions-design.md`

---

## Task 1: Prisma schema — allow multiple submissions per user

**Files:**
- Modify: `server/prisma/schema.prisma`

- [ ] **Step 1: Confirm current constraint**

Run: `grep -n "userId" server/prisma/schema.prisma`
Expected output includes: `userId    String     @unique` (on the `Submission` model) — this is the constraint we're removing.

- [ ] **Step 2: Edit the schema**

Change `server/prisma/schema.prisma` from:

```prisma
model User {
  id           String      @id @default(cuid())
  username     String      @unique
  email        String?     @unique
  passwordHash String
  role         Role        @default(CLIENT)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  submission   Submission?
}
```

to:

```prisma
model User {
  id           String       @id @default(cuid())
  username     String       @unique
  email        String?      @unique
  passwordHash String
  role         Role         @default(CLIENT)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  submissions  Submission[]
}
```

and change:

```prisma
model Submission {
  id        String     @id @default(cuid())
  userId    String     @unique
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  status    Status     @default(NOT_STARTED)
  formData  Json       @default("{}")
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  documents Document[]
}
```

to:

```prisma
model Submission {
  id        String     @id @default(cuid())
  userId    String
  label     String     @default("Form 1")
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  status    Status     @default(NOT_STARTED)
  formData  Json       @default("{}")
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  documents Document[]
}
```

The `@default("Form 1")` on `label` means `db push` can add the column to the database without needing a manual backfill step — every currently-existing submission (each user's original, only form) becomes correctly labeled "Form 1".

- [ ] **Step 3: Push the schema and regenerate the client**

Run: `cd server && npx prisma db push`
Expected output ends with: `Your database is now in sync with your Prisma schema.` followed by Prisma Client regeneration.

- [ ] **Step 4: Verify existing data survived**

Run:
```bash
cd server && node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const subs = await prisma.submission.findMany({ select: { id: true, userId: true, label: true, status: true } });
  console.log(subs);
  await prisma.\$disconnect();
})();
"
```
Expected: every existing submission row printed with `label: 'Form 1'` and its original `id`/`userId`/`status` unchanged.

- [ ] **Step 5: Commit**

```bash
git add server/prisma/schema.prisma
git commit -m "Allow multiple submissions per user in schema"
```

---

## Task 2: Rewrite submission routes as submissions.js (plural, ID-scoped)

**Files:**
- Create: `server/src/routes/submissions.js`
- Delete: `server/src/routes/submission.js`
- Modify: `server/src/index.js`

- [ ] **Step 1: Write the new route file**

Create `server/src/routes/submissions.js`:

```javascript
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

// GET /api/submissions — list my forms
router.get('/', async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { userId: req.user.id },
      select: { id: true, label: true, status: true, updatedAt: true, createdAt: true },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/submissions — create a new form, optionally cloning formData from an existing one
router.post('/', async (req, res) => {
  try {
    const { label, cloneFromId } = req.body;
    if (!label || !label.trim()) return res.status(400).json({ error: 'Label is required' });

    let formData = {};
    if (cloneFromId) {
      const source = await ownSubmission(req.user.id, cloneFromId);
      if (!source) return res.status(404).json({ error: 'Form to clone from was not found' });
      formData = source.formData;
    }

    const submission = await prisma.submission.create({
      data: { userId: req.user.id, label: label.trim(), formData }
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

    await sendAdminAlert({ clientUsername: updated.user.username, submittedAt: updated.updatedAt });

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
```

- [ ] **Step 2: Delete the old file**

Run: `rm server/src/routes/submission.js`

- [ ] **Step 3: Update the mount point in index.js**

In `server/src/index.js`, change:

```javascript
const submissionRoutes = require('./routes/submission');
```

to:

```javascript
const submissionsRoutes = require('./routes/submissions');
```

and change:

```javascript
app.use('/api/submission', authMiddleware, submissionRoutes);
```

to:

```javascript
app.use('/api/submissions', authMiddleware, submissionsRoutes);
```

- [ ] **Step 4: Syntax-check both files**

Run: `cd server && node -c src/routes/submissions.js && node -c src/index.js && echo OK`
Expected output: `OK`

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/submissions.js server/src/index.js
git rm server/src/routes/submission.js
git commit -m "Replace singular /api/submission with ID-scoped /api/submissions routes"
```

---

## Task 3: Update admin routes for multi-submission support

**Files:**
- Modify: `server/src/routes/admin.js:17-56`

- [ ] **Step 1: Change GET /users to return an array of submissions**

In `server/src/routes/admin.js`, change:

```javascript
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: {
        id: true, username: true, createdAt: true,
        submission: { select: { id: true, status: true, updatedAt: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
```

to:

```javascript
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: {
        id: true, username: true, createdAt: true,
        submissions: { select: { id: true, label: true, status: true, updatedAt: true }, orderBy: { updatedAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
```

- [ ] **Step 2: Stop auto-creating an empty submission on account creation**

In `server/src/routes/admin.js`, change:

```javascript
    const user = await prisma.user.create({
      data: { username, passwordHash, role: 'CLIENT' },
      select: { id: true, username: true, role: true, createdAt: true }
    });
    // Auto-create empty submission
    await prisma.submission.create({ data: { userId: user.id, formData: {} } });
    res.status(201).json(user);
```

to:

```javascript
    const user = await prisma.user.create({
      data: { username, passwordHash, role: 'CLIENT' },
      select: { id: true, username: true, role: true, createdAt: true }
    });
    res.status(201).json(user);
```

(Forms are now created by the client via "Start New Form," not implicitly at account-creation time — matches the design spec.)

- [ ] **Step 3: Syntax-check**

Run: `cd server && node -c src/routes/admin.js && echo OK`
Expected output: `OK`

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/admin.js
git commit -m "Admin: list submissions as array per client, stop auto-creating empty forms"
```

---

## Task 4: Backend integration verification

**Files:** none (verification only)

- [ ] **Step 1: Start the backend**

Run: `cd server && npm run dev` (background)
Expected: `BIS Portal server running on port 5000` in the output, no crash.

- [ ] **Step 2: Create a temp QA client**

```bash
cd server && node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
(async () => {
  const hash = await bcrypt.hash('TestClient@123', 12);
  await prisma.user.upsert({ where: { username: 'qa_multiform' }, update: { passwordHash: hash }, create: { username: 'qa_multiform', passwordHash: hash, role: 'CLIENT' } });
  console.log('ready');
  await prisma.\$disconnect();
})();
"
```
Expected output: `ready`

- [ ] **Step 3: Log in and confirm zero forms initially**

```bash
CAPTCHA=$(curl -s http://localhost:5000/api/auth/captcha)
TOKEN=$(node -e "console.log(JSON.parse(process.argv[1]).token)" "$CAPTCHA")
QUESTION=$(node -e "console.log(JSON.parse(process.argv[1]).question)" "$CAPTCHA")
ANSWER=$(node -e "const [a,,b]=process.argv[1].split(' '); console.log(Number(a)+Number(b))" "$QUESTION")
LOGIN=$(curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d "{\"username\":\"qa_multiform\",\"password\":\"TestClient@123\",\"captchaToken\":\"$TOKEN\",\"captchaAnswer\":\"$ANSWER\"}")
CLIENT_TOKEN=$(node -e "console.log(JSON.parse(process.argv[1]).token)" "$LOGIN")
curl -s http://localhost:5000/api/submissions -H "Authorization: Bearer $CLIENT_TOKEN"
```
Expected output: `[]` (new account has no auto-created submission, per Task 3 Step 2).

- [ ] **Step 4: Create "Form 1" (blank)**

```bash
FORM1=$(curl -s -X POST http://localhost:5000/api/submissions -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" -d '{"label":"Product A"}')
echo "$FORM1"
FORM1_ID=$(node -e "console.log(JSON.parse(process.argv[1]).id)" "$FORM1")
```
Expected: JSON with `"label":"Product A"`, `"status":"NOT_STARTED"`, `"formData":{}`.

- [ ] **Step 5: Save data into Form 1**

```bash
curl -s -X PUT "http://localhost:5000/api/submissions/$FORM1_ID" -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" -d '{"formData":{"registration":{"firstName":"Test","lastName":"User"}}}'
```
Expected: JSON with `"status":"IN_PROGRESS"` and the `formData` echoed back.

- [ ] **Step 6: Create "Form 2" cloned from Form 1**

```bash
FORM2=$(curl -s -X POST http://localhost:5000/api/submissions -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" -d "{\"label\":\"Product B\",\"cloneFromId\":\"$FORM1_ID\"}")
echo "$FORM2"
```
Expected: JSON with `"label":"Product B"` and `formData` containing the same `registration.firstName`/`lastName` saved in Step 5 — confirms cloning copies typed answers.

- [ ] **Step 7: List forms — confirm both appear independently**

```bash
curl -s http://localhost:5000/api/submissions -H "Authorization: Bearer $CLIENT_TOKEN"
```
Expected: array of 2 objects, `Product A` (`IN_PROGRESS`) and `Product B` (`NOT_STARTED` — cloning copies data but not status).

- [ ] **Step 8: Confirm cross-user ownership check — try fetching another user's submission**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5000/api/submissions/nonexistent-id-12345" -H "Authorization: Bearer $CLIENT_TOKEN"
```
Expected output: `404`

- [ ] **Step 9: Clean up**

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.delete({ where: { username: 'qa_multiform' } }).then(() => console.log('removed')).finally(() => prisma.\$disconnect());
"
```
Expected output: `removed` (cascades to delete both submissions via `onDelete: Cascade`).

- [ ] **Step 10: Commit**

No code changes in this task — nothing to commit. Proceed to Task 5.

---

## Task 5: Thread submissionId to FileUpload via Context (no tab-file changes needed)

**Files:**
- Modify: `client/src/components/FormField.jsx`

- [ ] **Step 1: Add the context and consume it in FileUpload**

In `client/src/components/FormField.jsx`, change the top imports from:

```javascript
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, CheckCircle } from 'lucide-react';
import api from '../lib/axios';
import toast from 'react-hot-toast';
```

to:

```javascript
import React, { useCallback, useState, createContext, useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, CheckCircle } from 'lucide-react';
import api from '../lib/axios';
import toast from 'react-hot-toast';

// Provided by PortalLayout, consumed here so none of the 9 tab components
// need to thread submissionId through as a prop.
export const SubmissionIdContext = createContext(null);
```

Then change the `FileUpload` function signature and its two API calls. From:

```javascript
export function FileUpload({ fieldKey, fieldLabel, existingDoc, onUploaded, onRemoved }) {
  const [uploading, setUploading] = useState(false);
  const [doc, setDoc] = useState(existingDoc || null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fieldKey', fieldKey);
    formData.append('fieldLabel', fieldLabel);
    try {
      const res = await api.post('/submission/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDoc(res.data);
      onUploaded?.(res.data);
      toast.success(`${file.name} uploaded`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [fieldKey, fieldLabel]);

  const handleRemove = async () => {
    if (!doc) return;
    try {
      await api.delete(`/submission/documents/${doc.id}`);
      setDoc(null);
      onRemoved?.(doc.id);
      toast.success('Document removed');
    } catch {
      toast.error('Remove failed');
    }
  };
```

to:

```javascript
export function FileUpload({ fieldKey, fieldLabel, existingDoc, onUploaded, onRemoved }) {
  const submissionId = useContext(SubmissionIdContext);
  const [uploading, setUploading] = useState(false);
  const [doc, setDoc] = useState(existingDoc || null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fieldKey', fieldKey);
    formData.append('fieldLabel', fieldLabel);
    try {
      const res = await api.post(`/submissions/${submissionId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDoc(res.data);
      onUploaded?.(res.data);
      toast.success(`${file.name} uploaded`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [fieldKey, fieldLabel, submissionId]);

  const handleRemove = async () => {
    if (!doc) return;
    try {
      await api.delete(`/submissions/${submissionId}/documents/${doc.id}`);
      setDoc(null);
      onRemoved?.(doc.id);
      toast.success('Document removed');
    } catch {
      toast.error('Remove failed');
    }
  };
```

(The rest of the file — `Field`, `Select`, the dropzone JSX at the bottom of `FileUpload` — is unchanged.)

- [ ] **Step 2: Syntax/compile check**

Run: `cd client && npx vite build 2>&1 | tail -20`
Expected: build succeeds (`✓ built in ...`), no error referencing `FormField.jsx`. (A stale `submissionId` of `undefined` at this point is fine — nothing calls `FileUpload` outside a provider yet until Task 8.)

- [ ] **Step 3: Commit**

```bash
git add client/src/components/FormField.jsx
git commit -m "FileUpload: read submissionId from context, call ID-scoped document endpoints"
```

---

## Task 6: Create the "My Forms" landing page

**Files:**
- Create: `client/src/pages/portal/MyForms.jsx`

- [ ] **Step 1: Write the page**

Create `client/src/pages/portal/MyForms.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { LogOut, Plus, X } from 'lucide-react';

function StatusBadge({ status }) {
  if (status === 'SUBMITTED') return <span className="badge-submitted">Submitted</span>;
  if (status === 'IN_PROGRESS') return <span className="badge-progress">In Progress</span>;
  return <span className="badge-notstarted">Not Started</span>;
}

function NewFormModal({ forms, onClose, onCreated }) {
  const [label, setLabel] = useState('');
  const [cloneFromId, setCloneFromId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/submissions', { label, cloneFromId: cloneFromId || undefined });
      toast.success(`"${res.data.label}" created`);
      onCreated(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-gray-900">Start New Form</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Form Name <span className="required">*</span></label>
            <input className="input" placeholder="e.g. Product A" value={label}
              onChange={e => setLabel(e.target.value)} required minLength={1} autoFocus />
          </div>
          {forms.length > 0 && (
            <div>
              <label className="label">Clone answers from</label>
              <select className="input" value={cloneFromId} onChange={e => setCloneFromId(e.target.value)}>
                <option value="">None (start blank)</option>
                {forms.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1">Copies typed answers only — you'll need to re-upload documents.</p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Creating...' : 'Create Form'}
            </button>
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MyForms() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    api.get('/submissions')
      .then(res => setForms(res.data))
      .catch(() => toast.error('Failed to load forms'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <nav className="bg-primary px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-white/20 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">AV</span>
          </div>
          <span className="text-white font-semibold text-sm">BIS Application Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-xs">{user?.username}</span>
          <button onClick={() => { logout(); navigate('/login'); }} className="text-white/70 hover:text-white text-xs flex items-center gap-1.5">
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900">My Forms</h1>
          <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Start New Form
          </button>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
          ) : forms.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No forms yet. Start one to get going.</div>
          ) : (
            <div className="divide-y divide-border">
              {forms.map(f => (
                <button key={f.id} onClick={() => navigate(`/portal/${f.id}`)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{f.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Last updated {new Date(f.updatedAt).toLocaleDateString('en-IN')}</div>
                  </div>
                  <StatusBadge status={f.status} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNew && <NewFormModal forms={forms} onClose={() => setShowNew(false)} onCreated={f => { setForms(prev => [f, ...prev]); setShowNew(false); navigate(`/portal/${f.id}`); }} />}
    </div>
  );
}
```

- [ ] **Step 2: Syntax/compile check**

Run: `cd client && npx vite build 2>&1 | tail -20`
Expected: build succeeds. (Nothing routes to this page yet — that's Task 7.)

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/MyForms.jsx
git commit -m "Add My Forms landing page (list + start-new-form modal)"
```

---

## Task 7: Update routing in App.jsx

**Files:**
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Add the MyForms import and split the /portal route**

In `client/src/App.jsx`, change:

```javascript
import PortalLayout from './pages/portal/PortalLayout';
```

to:

```javascript
import PortalLayout from './pages/portal/PortalLayout';
import MyForms from './pages/portal/MyForms';
```

Then change:

```javascript
      <Route path="/portal/*" element={<ProtectedRoute role="CLIENT"><PortalLayout /></ProtectedRoute>} />
```

to:

```javascript
      <Route path="/portal" element={<ProtectedRoute role="CLIENT"><MyForms /></ProtectedRoute>} />
      <Route path="/portal/:submissionId/*" element={<ProtectedRoute role="CLIENT"><PortalLayout /></ProtectedRoute>} />
```

- [ ] **Step 2: Syntax/compile check**

Run: `cd client && npx vite build 2>&1 | tail -20`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add client/src/App.jsx
git commit -m "Route /portal to My Forms list, /portal/:submissionId/* to the tab editor"
```

---

## Task 8: Update PortalLayout.jsx for submissionId-scoped routes

**Files:**
- Modify: `client/src/pages/portal/PortalLayout.jsx` (full-file replacement — nearly every function touches submissionId)

- [ ] **Step 1: Replace the file contents**

Replace the entire contents of `client/src/pages/portal/PortalLayout.jsx` with:

```jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { LogOut, CheckCircle, Clock, Save, ArrowLeft } from 'lucide-react';
import { SubmissionIdContext } from '../../components/FormField';

// Tab components
import RegistrationForm from './tabs/RegistrationForm';
import OrganizationProfile from './tabs/OrganizationProfile';
import ManagementDetails from './tabs/ManagementDetails';
import ManufacturingProcess from './tabs/ManufacturingProcess';
import PackagingBrandDetails from './tabs/PackagingBrandDetails';
import TestingInspection from './tabs/TestingInspection';
import TestReportDetails from './tabs/TestReportDetails';
import DeclarationUndertaking from './tabs/DeclarationUndertaking';
import DocumentChecklist from './tabs/DocumentChecklist';

const TABS = [
  { key: 'checklist', label: 'Document Checklist', path: '' },
  { key: 'registration', label: 'Registration Form', path: 'registration' },
  { key: 'organization', label: 'Organization Profile', path: 'organization' },
  { key: 'management', label: 'Management Details', path: 'management' },
  { key: 'manufacturing', label: 'Manufacturing Process', path: 'manufacturing' },
  { key: 'packaging', label: 'Packaging & Brand Details', path: 'packaging' },
  { key: 'testing', label: 'Testing & Inspection', path: 'testing' },
  { key: 'testReport', label: 'Test Report Details', path: 'test-report' },
  { key: 'declaration', label: 'Declaration & Undertaking', path: 'declaration' },
];

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [submission, setSubmission] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const saveTimer = useRef(null);

  // Load submission on mount
  useEffect(() => {
    api.get(`/submissions/${submissionId}`)
      .then(res => {
        setSubmission(res.data);
        setFormData(res.data.formData || {});
      })
      .catch(() => toast.error('Failed to load form data'));
  }, [submissionId]);

  // Auto-save with debounce
  const saveData = useCallback(async (data) => {
    if (submission?.status === 'SUBMITTED') return;
    setSaving(true);
    try {
      await api.put(`/submissions/${submissionId}`, { formData: data });
      setLastSaved(new Date());
    } catch {
      // Silent fail for auto-save
    } finally {
      setSaving(false);
    }
  }, [submission?.status, submissionId]);

  const updateSection = useCallback((sectionKey, sectionData) => {
    setFormData(prev => {
      const updated = { ...prev, [sectionKey]: sectionData };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveData(updated), 2000);
      return updated;
    });
  }, [saveData]);

  const handleManualSave = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await saveData(formData);
    toast.success('Progress saved');
  };

  const handleSubmit = async () => {
    if (!window.confirm('Submit the form? You will not be able to edit after submission unless admin unlocks it.')) return;
    setSubmitting(true);
    try {
      await api.post(`/submissions/${submissionId}/submit`, { formData });
      setSubmission(prev => ({ ...prev, status: 'SUBMITTED' }));
      toast.success('Form submitted successfully!');
      navigate(`/portal/${submissionId}/submitted`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitted = submission?.status === 'SUBMITTED';
  const docs = submission?.documents || [];

  const getDocForField = (fieldKey) => docs.find(d => d.fieldKey === fieldKey);
  const onDocUploaded = (doc) => setSubmission(prev => ({ ...prev, documents: [...(prev?.documents || []).filter(d => d.fieldKey !== doc.fieldKey), doc] }));
  const onDocRemoved = (docId) => setSubmission(prev => ({ ...prev, documents: (prev?.documents || []).filter(d => d.id !== docId) }));

  const basePath = `/portal/${submissionId}`;
  const activeTab = TABS.findIndex(t => {
    const path = location.pathname.replace(basePath, '').replace(/^\//, '');
    return t.path === path || (t.path === '' && path === '');
  });

  const currentIndex = Math.max(0, activeTab);

  const sharedProps = { formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted };

  return (
    <SubmissionIdContext.Provider value={submissionId}>
      <div className="min-h-screen bg-surface flex flex-col">
        {/* Header (navbar + step indicator) — stays fixed while form content scrolls */}
        <div className="sticky top-0 z-20 shrink-0">
          {/* Navbar */}
          <nav className="bg-primary px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/portal')} className="text-white/70 hover:text-white" title="Back to My Forms">
                <ArrowLeft size={16} />
              </button>
              <div className="w-7 h-7 bg-white/20 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">AV</span>
              </div>
              <div>
                <span className="text-white font-semibold text-sm">{submission?.label || 'BIS Application Portal'}</span>
                {isSubmitted && <span className="ml-3 text-xs bg-green-400/20 text-green-200 px-2 py-0.5 rounded">Submitted</span>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Save status */}
              {!isSubmitted && (
                <div className="flex items-center gap-2">
                  {saving ? (
                    <span className="text-white/50 text-xs flex items-center gap-1"><Clock size={11} /> Saving...</span>
                  ) : lastSaved ? (
                    <span className="text-white/50 text-xs flex items-center gap-1"><CheckCircle size={11} /> Saved {lastSaved.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  ) : null}
                  <button onClick={handleManualSave} className="text-white/70 hover:text-white text-xs flex items-center gap-1 px-2 py-1 rounded border border-white/20 hover:border-white/50">
                    <Save size={12} /> Save
                  </button>
                </div>
              )}
              <span className="text-white/60 text-xs">{user?.username}</span>
              <button onClick={() => { logout(); navigate('/login'); }} className="text-white/70 hover:text-white text-xs flex items-center gap-1.5">
                <LogOut size={13} /> Sign out
              </button>
            </div>
          </nav>

          {/* Step indicator */}
          <div className="bg-white border-b border-border px-6 py-3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 min-w-max">
              {TABS.map((tab, idx) => (
                <button key={tab.key}
                  onClick={() => navigate(`${basePath}/${tab.path}`)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${idx === currentIndex ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}>
                  <span className="mr-1.5 opacity-60">{idx + 1}.</span>{tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {isSubmitted && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded flex items-center gap-3">
                <CheckCircle size={18} className="text-green-500 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-green-800">Form Submitted</div>
                  <div className="text-xs text-green-600 mt-0.5">Your form has been submitted. You can view your data below. Contact us to make changes.</div>
                </div>
              </div>
            )}

            <Routes>
              <Route index element={<DocumentChecklist {...sharedProps} />} />
              <Route path="registration" element={<RegistrationForm {...sharedProps} />} />
              <Route path="organization" element={<OrganizationProfile {...sharedProps} />} />
              <Route path="management" element={<ManagementDetails {...sharedProps} />} />
              <Route path="manufacturing" element={<ManufacturingProcess {...sharedProps} />} />
              <Route path="packaging" element={<PackagingBrandDetails {...sharedProps} />} />
              <Route path="testing" element={<TestingInspection {...sharedProps} />} />
              <Route path="test-report" element={<TestReportDetails {...sharedProps} />} />
              <Route path="declaration" element={<DeclarationUndertaking {...sharedProps} onSubmit={handleSubmit} submitting={submitting} />} />
              <Route path="submitted" element={
                <div className="text-center py-16">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Form Submitted Successfully!</h2>
                  <p className="text-gray-500 text-sm mb-6">Our team at Absolute Veritas will review your information and get back to you shortly.</p>
                  <a href="mailto:cs@absoluteveritas.com" className="btn-primary inline-block">Contact Us</a>
                </div>
              } />
            </Routes>

            {/* Navigation buttons */}
            {!location.pathname.includes('submitted') && (
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <button onClick={() => { const prev = TABS[currentIndex - 1]; if (prev) navigate(`${basePath}/${prev.path}`); }}
                  disabled={currentIndex === 0} className="btn-secondary disabled:opacity-30">← Previous</button>
                {currentIndex < TABS.length - 1 ? (
                  <button onClick={() => { const next = TABS[currentIndex + 1]; navigate(`${basePath}/${next.path}`); }} className="btn-primary">
                    Next →
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </SubmissionIdContext.Provider>
  );
}
```

- [ ] **Step 2: Syntax/compile check**

Run: `cd client && npx vite build 2>&1 | tail -20`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/PortalLayout.jsx
git commit -m "PortalLayout: read submissionId from URL, scope all API calls and nav to it"
```

---

## Task 9: Update admin Dashboard.jsx to show one row per form

**Files:**
- Modify: `client/src/pages/admin/Dashboard.jsx:171-286`

- [ ] **Step 1: Replace the stats calculation**

In `client/src/pages/admin/Dashboard.jsx`, change:

```javascript
  const stats = {
    total: users.length,
    submitted: users.filter(u => u.submission?.status === 'SUBMITTED').length,
    inProgress: users.filter(u => u.submission?.status === 'IN_PROGRESS').length,
    notStarted: users.filter(u => !u.submission || u.submission?.status === 'NOT_STARTED').length,
  };
```

to:

```javascript
  const allSubmissions = users.flatMap(u => u.submissions || []);
  const stats = {
    total: users.length,
    submitted: allSubmissions.filter(s => s.status === 'SUBMITTED').length,
    inProgress: allSubmissions.filter(s => s.status === 'IN_PROGRESS').length,
    notStarted: allSubmissions.filter(s => s.status === 'NOT_STARTED').length,
  };

  // One row per form; clients with zero forms still get one row so their
  // account remains visible/manageable (reset password, delete).
  const rows = users.flatMap(u =>
    u.submissions && u.submissions.length > 0
      ? u.submissions.map(s => ({ ...s, userId: u.id, username: u.username, accountCreatedAt: u.createdAt }))
      : [{ id: null, label: null, status: null, updatedAt: null, userId: u.id, username: u.username, accountCreatedAt: u.createdAt }]
  );
```

("Total Clients" stays an account count; the other three become form-level counts, since one client can now have forms in different statuses at once.)

- [ ] **Step 2: Replace the table body to iterate over `rows`**

In `client/src/pages/admin/Dashboard.jsx`, change:

```javascript
              ) : users.map((u, i) => (
                <tr key={u.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{u.username}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.submission?.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {u.submission?.updatedAt ? new Date(u.submission.updatedAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {u.submission && (
                        <>
                          <button onClick={() => navigate(`/admin/submissions/${u.submission.id}`)}
                            className="p-1.5 text-gray-400 hover:text-primary rounded hover:bg-blue-50" title="View form">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => handleDownloadExcel(u.submission.id, u.username)}
                            disabled={downloadingId === u.submission.id}
                            className="p-1.5 text-gray-400 hover:text-green-600 rounded hover:bg-green-50 disabled:opacity-60" title="Download Excel">
                            {downloadingId === u.submission.id
                              ? <Loader2 size={15} className="animate-spin" />
                              : <FileText size={15} />}
                          </button>
                          <button onClick={() => handleDownloadDocs(u.submission.id, u.username)}
                            disabled={downloadingDocsId === u.submission.id}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 disabled:opacity-60" title="Download Documents ZIP">
                            {downloadingDocsId === u.submission.id
                              ? <Loader2 size={15} className="animate-spin" />
                              : <Download size={15} />}
                          </button>
                        </>
                      )}
                      <button onClick={() => setResetUser(u)}
                        className="p-1.5 text-gray-400 hover:text-yellow-600 rounded hover:bg-yellow-50" title="Reset password">
                        <Key size={15} />
                      </button>
                      <button onClick={() => handleDelete(u.id, u.username)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50" title="Delete account">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
```

to:

```javascript
              ) : rows.map((row, i) => (
                <tr key={row.id || `${row.userId}-empty`} className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {row.username}
                    {row.label && <span className="text-gray-400 font-normal"> — {row.label}</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(row.accountCreatedAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {row.id && (
                        <>
                          <button onClick={() => navigate(`/admin/submissions/${row.id}`)}
                            className="p-1.5 text-gray-400 hover:text-primary rounded hover:bg-blue-50" title="View form">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => handleDownloadExcel(row.id, `${row.username}_${row.label}`)}
                            disabled={downloadingId === row.id}
                            className="p-1.5 text-gray-400 hover:text-green-600 rounded hover:bg-green-50 disabled:opacity-60" title="Download Excel">
                            {downloadingId === row.id
                              ? <Loader2 size={15} className="animate-spin" />
                              : <FileText size={15} />}
                          </button>
                          <button onClick={() => handleDownloadDocs(row.id, `${row.username}_${row.label}`)}
                            disabled={downloadingDocsId === row.id}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 disabled:opacity-60" title="Download Documents ZIP">
                            {downloadingDocsId === row.id
                              ? <Loader2 size={15} className="animate-spin" />
                              : <Download size={15} />}
                          </button>
                        </>
                      )}
                      <button onClick={() => setResetUser({ id: row.userId, username: row.username })}
                        className="p-1.5 text-gray-400 hover:text-yellow-600 rounded hover:bg-yellow-50" title="Reset password">
                        <Key size={15} />
                      </button>
                      <button onClick={() => handleDelete(row.userId, row.username)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50" title="Delete account">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
```

- [ ] **Step 3: Fix the `onCreated` callback shape for the create-account modal**

In `client/src/pages/admin/Dashboard.jsx`, change:

```javascript
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={u => setUsers(prev => [{ ...u, submission: null }, ...prev])} />}
```

to:

```javascript
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={u => setUsers(prev => [{ ...u, submissions: [] }, ...prev])} />}
```

- [ ] **Step 4: Syntax/compile check**

Run: `cd client && npx vite build 2>&1 | tail -20`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/admin/Dashboard.jsx
git commit -m "Admin dashboard: one row per form (not per client), delete-account still works with zero forms"
```

---

## Task 10: End-to-end verification, then push

**Files:** none (verification only)

- [ ] **Step 1: Start both dev servers**

Run: `cd server && npm run dev` (background)
Run: `cd client && npx vite` (background)
Expected: backend logs `BIS Portal server running on port 5000`; frontend logs a `Local: http://localhost:5173/` URL.

- [ ] **Step 2: Confirm both respond**

Run: `curl -s -o /dev/null -w "backend: %{http_code}\n" http://localhost:5000/api/health`
Run: `curl -s -o /dev/null -w "frontend: %{http_code}\n" http://localhost:5173/`
Expected: both print `200`.

- [ ] **Step 3: Create a temp QA client for the browser check**

```bash
cd server && node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
(async () => {
  const hash = await bcrypt.hash('TestClient@123', 12);
  await prisma.user.upsert({ where: { username: 'qa_e2e_multiform' }, update: { passwordHash: hash }, create: { username: 'qa_e2e_multiform', passwordHash: hash, role: 'CLIENT' } });
  console.log('ready');
  await prisma.\$disconnect();
})();
"
```
Expected output: `ready`

- [ ] **Step 4: Write and run a Playwright check of the full flow**

Create a temporary script (not committed — delete after use) at `client/e2e_multiform_check.js`:

```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  const inputs = await page.locator('input').all();
  await inputs[0].fill('qa_e2e_multiform');
  await inputs[1].fill('TestClient@123');
  const question = await page.locator('.font-mono').innerText();
  const [a, , b] = question.replace(' = ?', '').split(' ');
  await page.fill('input[placeholder="Enter the answer"]', String(Number(a) + Number(b)));
  await page.click('button[type="submit"]');
  await page.waitForURL('**/portal', { timeout: 8000 });
  console.log('Landed on My Forms:', page.url());

  // Empty state
  const emptyText = await page.locator('text=No forms yet').count();
  console.log('Empty state shown:', emptyText > 0);

  // Create Form 1
  await page.click('text=Start New Form');
  await page.fill('input[placeholder="e.g. Product A"]', 'Product A');
  await page.click('button:has-text("Create Form")');
  await page.waitForURL(/\/portal\/[a-z0-9]+$/, { timeout: 8000 });
  const form1Url = page.url();
  console.log('Form 1 created, URL:', form1Url);

  // Fill something in Registration tab
  await page.click('text=Registration Form');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.waitForTimeout(2500); // debounced autosave

  // Back to My Forms, create Form 2 cloned from Form 1
  await page.click('[title="Back to My Forms"]');
  await page.waitForURL('**/portal', { timeout: 8000 });
  await page.click('text=Start New Form');
  await page.fill('input[placeholder="e.g. Product A"]', 'Product B');
  await page.selectOption('select', { label: 'Product A' });
  await page.click('button:has-text("Create Form")');
  await page.waitForURL(/\/portal\/[a-z0-9]+$/, { timeout: 8000 });
  const form2Url = page.url();
  console.log('Form 2 created (cloned), URL:', form2Url, 'different from Form 1:', form2Url !== form1Url);

  // Confirm cloned data appears
  await page.click('text=Registration Form');
  const emailValue = await page.locator('input[type="email"]').inputValue();
  console.log('Cloned email value in Form 2:', emailValue, 'matches:', emailValue === 'test@example.com');

  // Back to My Forms — both forms listed
  await page.click('[title="Back to My Forms"]');
  await page.waitForURL('**/portal', { timeout: 8000 });
  const formCount = await page.locator('text=Product A').count() + await page.locator('text=Product B').count();
  console.log('Both forms listed:', formCount === 2);

  console.log('ERRORS:', JSON.stringify(errors));
  await browser.close();
})();
```

Run: `node client/e2e_multiform_check.js`

Expected output includes all of:
```
Landed on My Forms: http://localhost:5173/portal
Empty state shown: true
Form 1 created, URL: http://localhost:5173/portal/<id1>
Form 2 created (cloned), URL: http://localhost:5173/portal/<id2> different from Form 1: true
Cloned email value in Form 2: test@example.com matches: true
Both forms listed: true
ERRORS: []
```

- [ ] **Step 5: Check the admin dashboard shows both forms as separate rows**

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const prisma = new PrismaClient();
(async () => {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const token = jwt.sign({ userId: admin.id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '10m' });
  console.log(token);
  await prisma.\$disconnect();
})();
" > /tmp_admin_tok.txt
ADMIN_TOKEN=$(cat /tmp_admin_tok.txt | tr -d '\r\n')
curl -s http://localhost:5000/api/admin/users -H "Authorization: Bearer $ADMIN_TOKEN" | node -e "
let d=''; process.stdin.on('data', c => d+=c); process.stdin.on('end', () => {
  const u = JSON.parse(d).find(x => x.username === 'qa_e2e_multiform');
  console.log(JSON.stringify(u, null, 2));
});
"
rm -f /tmp_admin_tok.txt
```
Expected: `u.submissions` is an array of length 2, containing `Product A` and `Product B` with the correct statuses.

- [ ] **Step 6: Clean up test artifacts**

```bash
rm -f client/e2e_multiform_check.js
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.delete({ where: { username: 'qa_e2e_multiform' } }).then(() => console.log('removed')).finally(() => prisma.\$disconnect());
"
```
Expected output: `removed`

- [ ] **Step 7: Push everything**

```bash
git push
```
Expected: all commits from Tasks 1–9 land on `origin/main`.

- [ ] **Step 8: Note the production deployment step (manual, not run here)**

After pushing, Render and Vercel auto-deploy from `main`. Render's deploy runs `npm install` → `postinstall` → `prisma generate` (already configured), but **does not** run `prisma db push` automatically — the schema change from Task 1 must be applied to the production database once, the same way it was applied locally:

Run once, after confirming `DATABASE_URL`/`DIRECT_URL` in your shell match production (they do, by default, since this project shares one Supabase instance between dev and prod — see the "Database" conversation from earlier in this project's history):

```bash
cd server && npx prisma db push
```

This is safe to run against the shared production database — it's the same non-destructive schema change verified in Task 1 (relaxes a unique constraint, adds one column with a default).
