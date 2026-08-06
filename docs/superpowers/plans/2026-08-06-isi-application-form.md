# ISI Application Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ISI (BIS Standard Mark) as a second, independent application-form type in the BIS Client Portal, alongside the existing FMCS flow, without breaking FMCS for live clients.

**Architecture:** Add a `FormType` enum to `Submission`. Generalize the existing FMCS-only wizard shell (`PortalLayout.jsx`) and form picker (`MyForms.jsx`) into type-agnostic components driven by props (`TABS`, `tabComponents`, `basePath`, `formType`). Build 10 new ISI tab components following the codebase's established `formData[section]` / `updateSection` pattern, plus one new shared `RepeatingTable` primitive for ISI's array-of-rows sections (which FMCS has none of). Wire both form types into routing via a new `/portal` chooser screen.

**Tech Stack:** React 19 + Vite, React Router v7, Tailwind v4, Express, Prisma/PostgreSQL (Supabase), no test framework (this repo has none — see `CLAUDE.md`; verification is manual, via curl for backend and the running dev server for frontend).

**Spec:** `docs/superpowers/specs/2026-08-06-isi-application-form-design.md`

---

## Before you start

1. **Branch:** all work happens on a feature branch, not `main`:
   ```bash
   cd c:/Projects/bis-portal
   git checkout -b feature/isi-application-form
   ```
2. **Database:** local dev (`server/.env` `DATABASE_URL`) points at the **same Supabase project used in production** — there is no separate dev database. This means:
   - The Task 1 schema push is safe to run now — it's purely additive (`FormType` enum + a `formType` column with a default), matching every existing row to `'FMCS'` with no data loss.
   - Manual QA (creating ISI test submissions, uploading test documents) must use a clearly-named throwaway client account (e.g. username `isi_qa_test`), and that account plus its submissions/documents must be deleted before merging to `main`. Do **not** use or modify any real client's account.
3. **Getting a bearer token for curl verification steps below:** log in as any client account and capture the token:
   ```bash
   # 1. get a captcha token + answer (the math is in the JSON response)
   curl -s http://localhost:5000/api/auth/captcha
   # → {"question":"3 + 4","token":"eyJ..."}
   # 2. log in (replace captchaToken/captchaAnswer with the values from step 1, and use a real test account's credentials)
   curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
     -d '{"username":"<test-username>","password":"<test-password>","captchaToken":"<token-from-step-1>","captchaAnswer":<sum>}'
   # → {"token":"eyJ...","user":{...}}
   ```
   Export the returned token as `$TOKEN` in your shell for the curl commands used throughout this plan.
4. **Dev servers:** `cd server && npm run dev` (port 5000) and `cd client && npm run dev` (port 5173), per `CLAUDE.md`.

---

### Task 1: Schema — add `FormType`

**Files:**
- Modify: `server/prisma/schema.prisma`

- [ ] **Step 1: Add the enum and field**

Add a new `FormType` enum and a `formType` field to `Submission`, right after the `id`/`userId` fields:

```prisma
enum FormType {
  FMCS
  ISI
}

model Submission {
  id        String     @id @default(cuid())
  userId    String
  label     String     @default("Form 1")
  formType  FormType   @default(FMCS)
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  status    Status     @default(NOT_STARTED)
  formData  Json       @default("{}")
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  documents Document[]
}
```

- [ ] **Step 2: Regenerate the Prisma client**

Run (from `server/`): `npx prisma generate`
Expected: `Generated Prisma Client ... in server/node_modules/@prisma/client`, no errors.

- [ ] **Step 3: Push the schema**

Run (from `server/`): `npx prisma db push`
Expected: output ends with `Your database is now in sync with your Prisma schema.` — no destructive-change warning (this is an additive change with a default, so none should appear).

- [ ] **Step 4: Verify existing rows defaulted correctly**

Run (from `server/`):
```bash
node -e "const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); p.submission.findMany({take:3,select:{id:true,formType:true}}).then(r=>{console.log(r); p.$disconnect();});"
```
Expected: every row shows `formType: 'FMCS'`.

- [ ] **Step 5: Commit**

```bash
git add server/prisma/schema.prisma
git commit -m "Add FormType enum to Submission for ISI form support"
```

---

### Task 2: Backend — `submissions.js` formType support

**Files:**
- Modify: `server/src/routes/submissions.js:1-65`

- [ ] **Step 1: Add a `FORM_TYPES` constant and update `POST /`**

Replace the existing `POST /` handler (currently lines ~44-65) with:

```javascript
const FORM_TYPES = ['FMCS', 'ISI'];

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
```

Place the `const FORM_TYPES = [...]` line right after the existing `const upload = multer({...})` block, before this route.

- [ ] **Step 2: Update `GET /` to filter and return `formType`**

Replace the existing `GET /` handler with:

```javascript
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
```

(No change needed to `GET /:id` — it uses `ownSubmission()` with no `select` restriction, so `formType` is already included on the returned object automatically.)

- [ ] **Step 3: Verify with curl** (using `$TOKEN` from the setup section)

```bash
# Create an ISI submission
curl -s -X POST http://localhost:5000/api/submissions -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"label":"ISI QA Test","formType":"ISI"}'
```
Expected: JSON response with `"formType":"ISI"`.

```bash
# List only ISI forms
curl -s "http://localhost:5000/api/submissions?formType=ISI" -H "Authorization: Bearer $TOKEN"
```
Expected: array containing only the submission just created (not any FMCS forms on the same account).

```bash
# List with no filter — should return all types
curl -s http://localhost:5000/api/submissions -H "Authorization: Bearer $TOKEN"
```
Expected: array including both FMCS and ISI forms if the test account has both, each showing its own `formType`.

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/submissions.js
git commit -m "Support formType on submission create/list, with clone-type guard"
```

---

### Task 3: Backend — `admin.js` formType passthrough + Excel stopgap

**Files:**
- Modify: `server/src/routes/admin.js:17-32` (GET /users)
- Modify: `server/src/routes/admin.js:146-162` (GET /submissions/:id/excel)

- [ ] **Step 1: Include `formType` in the `GET /users` submissions select**

Change:
```javascript
submissions: { select: { id: true, label: true, status: true, updatedAt: true }, orderBy: { updatedAt: 'desc' } }
```
to:
```javascript
submissions: { select: { id: true, label: true, formType: true, status: true, updatedAt: true }, orderBy: { updatedAt: 'desc' } }
```

(`GET /submissions` and `GET /submissions/:id` already return `formType` automatically — they use `include`, not `select`, on the top-level `Submission`.)

- [ ] **Step 2: Add the ISI stopgap to the Excel export route**

Replace the `GET /submissions/:id/excel` handler with:

```javascript
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
```

(This is the only change here — `generateExcelISI` is explicitly out of scope for this plan per the spec, pending the reference workbook.)

- [ ] **Step 3: Verify with curl**

```bash
# List users — confirm formType shows on each submission
curl -s http://localhost:5000/api/admin/users -H "Authorization: Bearer $ADMIN_TOKEN" | head -c 500
```
Expected: each entry under `submissions` includes `"formType":"FMCS"` or `"formType":"ISI"`.

```bash
# Excel export for the ISI test submission created in Task 2 (use its id)
curl -s -i http://localhost:5000/api/admin/submissions/<isi-submission-id>/excel -H "Authorization: Bearer $ADMIN_TOKEN"
```
Expected: `HTTP/1.1 501` status line, JSON body `{"error":"Excel export for ISI forms is not yet available. Contact the developer to enable it."}`.

```bash
# Excel export for an existing FMCS submission — must still work exactly as before
curl -s -o /tmp/test.xlsx -w "%{http_code}\n" http://localhost:5000/api/admin/submissions/<fmcs-submission-id>/excel -H "Authorization: Bearer $ADMIN_TOKEN"
```
Expected: `200`, and `/tmp/test.xlsx` is a valid non-empty `.xlsx` file.

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/admin.js
git commit -m "Return formType in admin user list; stopgap ISI Excel export until workbook is provided"
```

---

### Task 4: Frontend — `RepeatingTable` primitive

**Files:**
- Create: `client/src/components/RepeatingTable.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { X, Plus } from 'lucide-react';
import { FileUpload } from './FormField';

// Renders an add/remove-able table of rows for ISI's array sections (product variety,
// raw materials, packaging rows, etc — FMCS has none of these).
//
// Each row MUST carry a stable `id` (crypto.randomUUID()), assigned once at creation.
// A file column's upload fieldKey is `${sectionKey}_${column.fieldKeySuffix}_${row.id}` —
// never derive it from the row's array index, or removing/reordering rows will silently
// reassign an uploaded document to the wrong row.
export function RepeatingTable({ sectionKey, columns, rows, onChange, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const list = rows || [];

  const addRow = () => onChange([...list, { id: crypto.randomUUID() }]);
  const removeRow = (id) => onChange(list.filter(r => r.id !== id));
  const setCell = (id, key, value) => onChange(list.map(r => r.id === id ? { ...r, [key]: value } : r));

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-border rounded">
          <thead>
            <tr className="bg-gray-50">
              {columns.map(c => (
                <th key={c.key} className="text-left px-2 py-1.5 font-medium text-gray-500 border-b border-border whitespace-nowrap">{c.label}</th>
              ))}
              {!isSubmitted && <th className="px-2 py-1.5 border-b border-border w-8" />}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="text-center py-4 text-gray-400">No rows added yet</td></tr>
            ) : list.map(row => (
              <tr key={row.id} className="border-b border-border last:border-0">
                {columns.map(c => (
                  <td key={c.key} className="px-2 py-1.5 align-top">
                    {c.type === 'file' ? (
                      <FileUpload
                        fieldKey={`${sectionKey}_${c.fieldKeySuffix}_${row.id}`}
                        fieldLabel={c.label}
                        existingDoc={getDocForField(`${sectionKey}_${c.fieldKeySuffix}_${row.id}`)}
                        onUploaded={onDocUploaded}
                        onRemoved={onDocRemoved}
                      />
                    ) : c.type === 'select' ? (
                      <select className="text-xs border border-border rounded px-1 py-0.5 bg-white w-full" value={row[c.key] || ''}
                        onChange={e => setCell(row.id, c.key, e.target.value)} disabled={isSubmitted}>
                        <option value="">Select</option>
                        {c.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input className="text-xs border border-border rounded px-1.5 py-1 w-full"
                        type={c.type === 'date' ? 'date' : c.type === 'number' ? 'number' : 'text'}
                        value={row[c.key] || ''} onChange={e => setCell(row.id, c.key, e.target.value)} disabled={isSubmitted} />
                    )}
                  </td>
                ))}
                {!isSubmitted && (
                  <td className="px-2 py-1.5 align-top">
                    <button type="button" onClick={() => removeRow(row.id)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isSubmitted && (
        <button type="button" onClick={addRow} className="text-xs text-primary hover:underline flex items-center gap-1">
          <Plus size={13} /> Add Row
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it renders with no console errors**

This component has no consumers yet, so verification happens once the first ISI tab using it (Task 9) is built. No standalone check needed here beyond confirming the dev server still compiles cleanly:

Run: `cd client && npm run build`
Expected: build succeeds with no errors (unused-export warnings, if any, are fine).

- [ ] **Step 3: Commit**

```bash
git add client/src/components/RepeatingTable.jsx
git commit -m "Add RepeatingTable primitive for ISI's array-of-rows sections"
```

---

### Task 5: Frontend — export `COUNTRIES` from `OrganizationProfile.jsx`

Several ISI tabs need the same country list FMCS's Organization Profile tab already has. Export it instead of duplicating a 40-entry array.

**Files:**
- Modify: `client/src/pages/portal/tabs/OrganizationProfile.jsx:4`

- [ ] **Step 1: Add `export` to the existing constant**

Change:
```javascript
const COUNTRIES = ['India','Afghanistan','Australia','Bahrain','Bangladesh','Brazil','Canada','China','Egypt','France','Germany','Indonesia','Iran','Iraq','Italy','Japan','Kenya','Kuwait','Malaysia','Mexico','Myanmar','Nepal','Netherlands','New Zealand','Nigeria','Oman','Pakistan','Philippines','Qatar','Russia','Saudi Arabia','Singapore','South Africa','South Korea','Sri Lanka','Thailand','UAE','United Kingdom','USA','Vietnam'];
```
to:
```javascript
export const COUNTRIES = ['India','Afghanistan','Australia','Bahrain','Bangladesh','Brazil','Canada','China','Egypt','France','Germany','Indonesia','Iran','Iraq','Italy','Japan','Kenya','Kuwait','Malaysia','Mexico','Myanmar','Nepal','Netherlands','New Zealand','Nigeria','Oman','Pakistan','Philippines','Qatar','Russia','Saudi Arabia','Singapore','South Africa','South Korea','Sri Lanka','Thailand','UAE','United Kingdom','USA','Vietnam'];
```

- [ ] **Step 2: Verify FMCS Organization Profile tab still works**

Run `cd client && npm run build` — expected: succeeds (adding `export` to an existing const is non-breaking; nothing else changed in this file).

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/tabs/OrganizationProfile.jsx
git commit -m "Export COUNTRIES from OrganizationProfile so ISI tabs can reuse it"
```

---

### Task 6: ISI tab — Document Checklist

**Files:**
- Create: `client/src/pages/portal/isi/DocumentChecklist.jsx`

- [ ] **Step 1: Write the component**

Same pattern as `client/src/pages/portal/tabs/DocumentChecklist.jsx` (status dropdown per document row, plus one misc upload), with ISI's 30-item list:

```jsx
import React from 'react';
import { Field, FileUpload } from '../../../components/FormField';

const DOCUMENTS = [
  { no: 1, doc: 'Address Proof (Registered Office)', requirement: 'Mandatory' },
  { no: 2, doc: 'GST Certificate', requirement: 'Mandatory' },
  { no: 3, doc: 'Proof of Establishment of Firm (Business Licence)', requirement: 'Mandatory' },
  { no: 4, doc: 'Business Licence (Company Incorporation Certificate)', requirement: 'Mandatory' },
  { no: 5, doc: 'Address Proof (Factory / Manufacturing Unit)', requirement: 'Mandatory' },
  { no: 6, doc: 'Supporting Docs of Product Variety', requirement: 'Optional' },
  { no: 7, doc: 'Qualification Document & Photograph of Technical Manager', requirement: 'Mandatory' },
  { no: 8, doc: 'Process Flowchart covering all Manufacturing Processes', requirement: 'Mandatory' },
  { no: 9, doc: 'Layout Plan of Factory', requirement: 'Mandatory' },
  { no: 10, doc: 'Manufacturing Machinery List', requirement: 'Mandatory' },
  { no: 11, doc: 'Trademark Registration Details (Certification & Declaration)', requirement: 'Mandatory' },
  { no: 12, doc: 'List of Testing Equipment', requirement: 'Mandatory' },
  { no: 13, doc: 'In-House Test Report for the Product', requirement: 'Mandatory' },
  { no: 14, doc: 'Agreement with Manufacturing Unit for Outsourcing', requirement: 'Mandatory' },
  { no: 15, doc: 'Controls Exercised on Outsourced Process & Product on Receipt (IQC docs)', requirement: 'Mandatory' },
  { no: 16, doc: 'Test Report / Test Certificate', requirement: 'Mandatory' },
  { no: 17, doc: 'Statutory Permissions required for the Product Category', requirement: 'Optional' },
  { no: 18, doc: 'Authorization Letter of Person Submitting the Application', requirement: 'Mandatory' },
  { no: 19, doc: 'Form of Label(s) (Nature of Packaging)', requirement: 'Mandatory' },
  { no: 20, doc: 'Payment Receipt', requirement: 'Mandatory' },
  { no: 21, doc: 'Scope of Licence', requirement: 'Mandatory' },
  { no: 22, doc: 'List of Models to be covered in BIS Certification', requirement: 'Mandatory' },
  { no: 23, doc: 'Quality Assurance System (Quality Manual)', requirement: 'Mandatory' },
  { no: 24, doc: 'Drawing of Product', requirement: 'Mandatory' },
  { no: 25, doc: 'Calibration Certificates (for testing equipment)', requirement: 'Mandatory' },
  { no: 26, doc: 'Location Plan of Factory (Google Coordinates)', requirement: 'Mandatory' },
  { no: 27, doc: 'Undertaking (Acceptance of Marking Fee & STI)', requirement: 'Mandatory' },
  { no: 28, doc: 'Declaration', requirement: 'Mandatory' },
  { no: 29, doc: 'Undertaking for Arrangement of Water / Electricity', requirement: 'Mandatory' },
  { no: 30, doc: 'Weekly Off Declaration (Working Days)', requirement: 'Mandatory' },
];

export default function DocumentChecklist({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const statuses = formData.checklist || {};
  const setStatus = (docNo, status) => updateSection('checklist', { ...statuses, [String(docNo)]: status });
  const providedCount = DOCUMENTS.filter(d => statuses[String(d.no)] === 'Provided').length;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Document Checklist</div>
        <div className="p-6">
          <div className="text-sm font-medium text-gray-700 mb-4">
            {providedCount} of {DOCUMENTS.length} documents marked as Provided
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-border rounded">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="px-2 py-1.5 text-left">S.No.</th>
                  <th className="px-2 py-1.5 text-left">Document</th>
                  <th className="px-2 py-1.5 text-left">Requirement</th>
                  <th className="px-2 py-1.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {DOCUMENTS.map((d, idx) => {
                  const status = statuses[String(d.no)];
                  let rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                  if (status === 'Provided') rowBg = 'bg-green-50';
                  else if (status === 'Pending') rowBg = 'bg-yellow-50';
                  return (
                    <tr key={d.no} className={`${rowBg} border-t border-border`}>
                      <td className="px-2 py-1.5">{d.no}</td>
                      <td className="px-2 py-1.5">{d.doc}</td>
                      <td className={`px-2 py-1.5 ${d.requirement === 'Mandatory' ? 'text-red-600' : 'text-gray-500'}`}>{d.requirement}</td>
                      <td className="px-2 py-1.5">
                        <select className="text-xs border border-border rounded px-1 py-0.5 bg-white" value={status || ''}
                          onChange={e => setStatus(d.no, e.target.value)} disabled={isSubmitted}>
                          <option value="">Select</option>
                          <option value="Provided">Provided</option>
                          <option value="Pending">Pending</option>
                          <option value="Not Applicable">Not Applicable</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-6">
            <Field label="Miscellaneous Document" hint="Any other supporting document not covered above — included with the rest when documents are downloaded.">
              <FileUpload fieldKey="checklist_misc" fieldLabel="Miscellaneous Document"
                existingDoc={getDocForField('checklist_misc')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd client && npm run build` — expected: succeeds (this component isn't wired into any route yet, so it isn't reachable in the browser until Task 17; a clean build is the only check available at this point).

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/isi/DocumentChecklist.jsx
git commit -m "Add ISI Document Checklist tab"
```

---

### Task 7: ISI tab — Firm, Office & Registration Details

**Files:**
- Create: `client/src/pages/portal/isi/FirmOfficeDetails.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';
import { COUNTRIES } from '../tabs/OrganizationProfile';

export default function FirmOfficeDetails({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.firmOffice || {};
  const set = (key, val) => updateSection('firmOffice', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">1. User / Contact Details</div>
        <div className="p-6">
          <div className="form-row">
            <Field label="Registered Email" required><input type="email" {...d('registeredEmail')} /></Field>
            <Field label="Registered Mobile Number" required><input {...d('registeredMobile')} maxLength={10} /></Field>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">2. Firm / Office Details</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Firm Name" required><input {...d('firmName')} /></Field>
            <Field label="CEO / MD Name" required><input {...d('ceoName')} /></Field>
          </div>
          <Field label="Office Address Line 1" required><input {...d('officeAddr1')} /></Field>
          <Field label="Office Address Line 2"><input {...d('officeAddr2')} /></Field>
          <div className="form-row">
            <Field label="Country" required>
              <Select value={data.officeCountry} onChange={v => set('officeCountry', v)} options={COUNTRIES} />
            </Field>
            <Field label="State" required><input {...d('officeState')} /></Field>
          </div>
          <div className="form-row">
            <Field label="District" required><input {...d('officeDistrict')} /></Field>
            <Field label="City" required><input {...d('officeCity')} /></Field>
          </div>
          <div className="form-row">
            <Field label="PIN Code"><input {...d('officePIN')} maxLength={6} /></Field>
            <Field label="Office Email" required><input type="email" {...d('officeEmail')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Office Mobile"><input {...d('officeMobile')} /></Field>
            <Field label="Alternate Mobile"><input {...d('altMobile')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Landline STD Code"><input {...d('landlineSTD')} /></Field>
            <Field label="Landline Number"><input {...d('landlineNumber')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Address Proof Document Type" required>
              <Select value={data.officeAddrProofType} onChange={v => set('officeAddrProofType', v)}
                options={['GST Registration Certificate', 'Business Licence', 'Any Other']} />
            </Field>
            <Field label="Address Proof Document" required>
              <FileUpload fieldKey="firmOffice_office_addr_proof" fieldLabel="Office Address Proof"
                existingDoc={getDocForField('firmOffice_office_addr_proof')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">3. Registration Details</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Nature of Firm" required>
              <Select value={data.natureOfFirm} onChange={v => set('natureOfFirm', v)}
                options={['Proprietorship', 'Partnership', 'Pvt Ltd', 'Public Ltd', 'LLP', 'Others']} />
            </Field>
            <Field label="Scale" required>
              <Select value={data.scale} onChange={v => set('scale', v)} options={['Micro', 'Small', 'Medium', 'Large']} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Sector" required>
              <Select value={data.sector} onChange={v => set('sector', v)} options={['Private', 'Public']} />
            </Field>
            <Field label="Women Entrepreneur" required>
              <Select value={data.womenEntrepreneur} onChange={v => set('womenEntrepreneur', v)} options={['Yes', 'No']} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Startup" required>
              <Select value={data.startup} onChange={v => set('startup', v)} options={['Yes', 'No']} />
            </Field>
            <Field label="Date of Registration"><input type="date" {...d('regDate')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Registration Number"><input {...d('registrationNumber')} /></Field>
            <Field label="PAN Number"><input {...d('panNumber')} /></Field>
          </div>
          <div className="form-row">
            <Field label="GST Number" required><input {...d('gstNumber')} /></Field>
            <Field label="GST Certificate" required>
              <FileUpload fieldKey="firmOffice_gst_cert" fieldLabel="GST Certificate"
                existingDoc={getDocForField('firmOffice_gst_cert')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Proof of Establishment Type" required>
              <Select value={data.estabProofType} onChange={v => set('estabProofType', v)}
                options={['Certificate of Incorporation', 'Business Licence', 'Partnership Deed', 'Proprietorship Declaration', 'GST Registration Certificate', 'Udyam Registration Certificate', 'Trade Licence', 'Others']} />
            </Field>
            <Field label="Proof of Establishment Document" required>
              <FileUpload fieldKey="firmOffice_estab_proof" fieldLabel="Proof of Establishment"
                existingDoc={getDocForField('firmOffice_estab_proof')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
          <Field label="Business Licence Number"><input {...d('businessLicenceNumber')} /></Field>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build** — `cd client && npm run build`, expect success.
- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/isi/FirmOfficeDetails.jsx
git commit -m "Add ISI Firm, Office & Registration Details tab"
```

---

### Task 8: ISI tab — Factory Details

**Files:**
- Create: `client/src/pages/portal/isi/FactoryDetails.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';
import { COUNTRIES } from '../tabs/OrganizationProfile';

export default function FactoryDetails({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.factory || {};
  const office = formData.firmOffice || {};
  const set = (key, val) => updateSection('factory', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  const copyFromOffice = () => {
    updateSection('factory', {
      ...data,
      addr1: office.officeAddr1 || '',
      addr2: office.officeAddr2 || '',
      country: office.officeCountry || '',
      state: office.officeState || '',
      district: office.officeDistrict || '',
      city: office.officeCity || '',
      pin: office.officePIN || '',
      email: office.officeEmail || '',
      mobile: office.officeMobile || '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Factory Details</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Is Factory Address same as Office Address?" required>
              <Select value={data.sameAsOffice} onChange={v => set('sameAsOffice', v)} options={['Yes', 'No']} />
            </Field>
            {data.sameAsOffice === 'Yes' && !isSubmitted && (
              <div className="flex items-end">
                <button type="button" onClick={copyFromOffice} className="btn-secondary text-xs">Copy from Office</button>
              </div>
            )}
          </div>
          <Field label="Factory Address Line 1" required><input {...d('addr1')} /></Field>
          <Field label="Factory Address Line 2"><input {...d('addr2')} /></Field>
          <div className="form-row">
            <Field label="Country" required>
              <Select value={data.country} onChange={v => set('country', v)} options={COUNTRIES} />
            </Field>
            <Field label="State" required><input {...d('state')} /></Field>
          </div>
          <div className="form-row">
            <Field label="District" required><input {...d('district')} /></Field>
            <Field label="City" required><input {...d('city')} /></Field>
          </div>
          <div className="form-row">
            <Field label="PIN Code"><input {...d('pin')} maxLength={6} /></Field>
            <Field label="Factory Email" required><input type="email" {...d('email')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Factory Mobile"><input {...d('mobile')} /></Field>
            <Field label="Alternate Mobile"><input {...d('altMobile')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Landline STD Code"><input {...d('landlineSTD')} /></Field>
            <Field label="Landline Number"><input {...d('landlineNumber')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Latitude"><input {...d('latitude')} /></Field>
            <Field label="Longitude"><input {...d('longitude')} /></Field>
          </div>
          <Field label="SEZ (Special Economic Zone)?" required>
            <Select value={data.sez} onChange={v => set('sez', v)} options={['Yes', 'No']} />
          </Field>
          <div className="form-row">
            <Field label="Factory Address Proof Type" required>
              <Select value={data.addrProofType} onChange={v => set('addrProofType', v)}
                options={['GST Registration Certificate', 'Business Licence', 'Any Other']} />
            </Field>
            <Field label="Factory Address Proof" required>
              <FileUpload fieldKey="factory_addr_proof" fieldLabel="Factory Address Proof"
                existingDoc={getDocForField('factory_addr_proof')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build** — `cd client && npm run build`, expect success.
- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/isi/FactoryDetails.jsx
git commit -m "Add ISI Factory Details tab"
```

---

### Task 9: ISI tab — Indian Standard & Product Variety

**Files:**
- Create: `client/src/pages/portal/isi/StandardVariety.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { Field, Select } from '../../../components/FormField';
import { RepeatingTable } from '../../../components/RepeatingTable';

const VARIETY_COLUMNS = [
  { key: 'variety', label: 'Variety Applied For', type: 'text' },
  { key: 'doc', label: 'Supporting Document', type: 'file', fieldKeySuffix: 'variety' },
];

export default function StandardVariety({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.standard || {};
  const set = (key, val) => updateSection('standard', { ...data, [key]: val });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">1. Indian Standard</div>
        <div className="p-6 space-y-4">
          <Field label="Do you know the Indian Standard applicable to your product?" required>
            <Select value={data.knowsStandard} onChange={v => set('knowsStandard', v)} options={['Yes', 'No']} />
          </Field>
          {data.knowsStandard === 'Yes' && (
            <Field label="Indian Standard" required hint="e.g. IS 10617:2018">
              <input className="input" value={data.indianStandard || ''} onChange={e => set('indianStandard', e.target.value)} disabled={isSubmitted} />
            </Field>
          )}
          {data.knowsStandard === 'No' && (
            <p className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-3">
              Absolute Veritas will help identify the applicable standard.
            </p>
          )}
          <Field label="Do you accept the Scheme of Inspection & Testing (SIT) specified by BIS w.r.t. frequency of testing and inspection?" required>
            <Select value={data.acceptsSIT} onChange={v => set('acceptsSIT', v)} options={['Yes', 'No']} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">2. Product Variety</div>
        <div className="p-6">
          <RepeatingTable sectionKey="standard" columns={VARIETY_COLUMNS} rows={data.rows}
            onChange={rows => set('rows', rows)} getDocForField={getDocForField}
            onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build** — `cd client && npm run build`, expect success.
- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/isi/StandardVariety.jsx
git commit -m "Add ISI Indian Standard & Product Variety tab"
```

---

### Task 10: ISI tab — Management Details

**Files:**
- Create: `client/src/pages/portal/isi/ManagementDetails.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { Field } from '../../../components/FormField';
import { RepeatingTable } from '../../../components/RepeatingTable';

const TOP_COLUMNS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'designation', label: 'Designation', type: 'text' },
  { key: 'contact', label: 'Contact No.', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'din', label: 'DIN', type: 'text' },
];

const TECH_COLUMNS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'designation', label: 'Designation', type: 'text' },
  { key: 'qualification', label: 'Qualification', type: 'text' },
  { key: 'qualDoc', label: 'Qualification Document', type: 'file', fieldKeySuffix: 'tech_qual' },
  { key: 'experience', label: 'Experience (Years)', type: 'number' },
  { key: 'photo', label: 'Photo', type: 'file', fieldKeySuffix: 'tech_photo' },
];

export default function ManagementDetails({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.management || {};
  const set = (key, val) => updateSection('management', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">1. Top Management</div>
        <div className="p-6">
          <RepeatingTable sectionKey="management" columns={TOP_COLUMNS} rows={data.topRows}
            onChange={rows => set('topRows', rows)} getDocForField={getDocForField}
            onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
        </div>
      </div>

      <div className="card">
        <div className="section-header">2. Correspondence Details</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Name of Contact Person" required><input {...d('contactName')} /></Field>
            <Field label="Designation of Contact Person" required><input {...d('contactDesignation')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Contact No." required><input {...d('contactNumber')} /></Field>
            <Field label="Email" required><input type="email" {...d('contactEmail')} /></Field>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">3. Technical Management</div>
        <div className="p-6">
          <RepeatingTable sectionKey="management" columns={TECH_COLUMNS} rows={data.techRows}
            onChange={rows => set('techRows', rows)} getDocForField={getDocForField}
            onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build** — `cd client && npm run build`, expect success.
- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/isi/ManagementDetails.jsx
git commit -m "Add ISI Management Details tab"
```

---

### Task 11: ISI tab — Manufacturing Process

**Files:**
- Create: `client/src/pages/portal/isi/ManufacturingProcess.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';
import { RepeatingTable } from '../../../components/RepeatingTable';

const RAW_COLUMNS = [
  { key: 'material', label: 'Raw Material (with grade)', type: 'text' },
  { key: 'supplier', label: 'Name of Supplier', type: 'text' },
  { key: 'conformity', label: 'Conformity of Material', type: 'select', options: ['BIS Certified', 'Test Certificate', 'Any Other'] },
  { key: 'howReceived', label: 'How Received', type: 'text' },
  { key: 'recordsMaintained', label: 'Records Maintained', type: 'select', options: ['Yes', 'No'] },
];

export default function ManufacturingProcess({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.manufacturing || {};
  const set = (key, val) => updateSection('manufacturing', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">1. Raw Material Details</div>
        <div className="p-6">
          <RepeatingTable sectionKey="manufacturing" columns={RAW_COLUMNS} rows={data.rawRows}
            onChange={rows => set('rawRows', rows)} getDocForField={getDocForField}
            onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
        </div>
      </div>

      <div className="card">
        <div className="section-header">2. Outsourcing & Hygiene</div>
        <div className="p-6 space-y-4">
          <Field label="Do you outsource any part of the manufacturing process?" required>
            <Select value={data.outsources} onChange={v => set('outsources', v)} options={['Yes', 'No']} />
          </Field>
          {data.outsources === 'Yes' && (
            <div className="form-row">
              <Field label="Agreement with Manufacturing Unit for Outsourcing" required>
                <FileUpload fieldKey="manufacturing_outsource_agreement" fieldLabel="Outsourcing Agreement"
                  existingDoc={getDocForField('manufacturing_outsource_agreement')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
              </Field>
              <Field label="Controls Exercised on Outsourced Process / Product (IQC docs)" required>
                <FileUpload fieldKey="manufacturing_outsource_iqc" fieldLabel="Outsourcing IQC Docs"
                  existingDoc={getDocForField('manufacturing_outsource_iqc')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
              </Field>
            </div>
          )}
          <Field label="Maintenance of Hygienic Conditions?" required>
            <Select value={data.hygiene} onChange={v => set('hygiene', v)} options={['Yes', 'No']} />
          </Field>
          {data.hygiene === 'Yes' && (
            <Field label="Hygiene Supporting Documents">
              <FileUpload fieldKey="manufacturing_hygiene_docs" fieldLabel="Hygiene Documents"
                existingDoc={getDocForField('manufacturing_hygiene_docs')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          )}
        </div>
      </div>

      <div className="card">
        <div className="section-header">3. Process Documentation</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Process Flow-Chart" required>
              <FileUpload fieldKey="manufacturing_process_flowchart" fieldLabel="Process Flow-Chart"
                existingDoc={getDocForField('manufacturing_process_flowchart')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
            <Field label="Layout Plan of Factory" required>
              <FileUpload fieldKey="manufacturing_factory_layout" fieldLabel="Factory Layout Plan"
                existingDoc={getDocForField('manufacturing_factory_layout')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
          <Field label="Manufacturing Machinery List" required>
            <FileUpload fieldKey="manufacturing_machinery_list" fieldLabel="Machinery List"
              existingDoc={getDocForField('manufacturing_machinery_list')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">4. Production Details</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Unit of Production" required hint="e.g. 1 Piece"><input {...d('unitOfProduction')} /></Field>
            <Field label="Production Value — Approx. Value per Annum (₹)"><input type="number" {...d('productionValue')} /></Field>
          </div>
          <Field label="Present Installed Capacity" required><input {...d('installedCapacity')} /></Field>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build** — `cd client && npm run build`, expect success.
- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/isi/ManufacturingProcess.jsx
git commit -m "Add ISI Manufacturing Process tab"
```

---

### Task 12: ISI tab — Packaging & Brand Details

**Files:**
- Create: `client/src/pages/portal/isi/PackagingBrandDetails.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { RepeatingTable } from '../../../components/RepeatingTable';

const PACKAGING_COLUMNS = [
  { key: 'nature', label: 'Nature of Packaging', type: 'text' },
  { key: 'marking', label: 'Marking on Article', type: 'text' },
  { key: 'method', label: 'Method of Marking', type: 'text' },
  { key: 'qtyPerPackage', label: 'Quantity per Package', type: 'number' },
  { key: 'label', label: 'Form of Label(s)', type: 'file', fieldKeySuffix: 'label' },
  { key: 'batchNumbering', label: 'Batch/Code/Serial Numbering', type: 'text' },
];

const BRAND_COLUMNS = [
  { key: 'brandName', label: 'Brand Name / Trademark', type: 'text' },
  { key: 'ownedBy', label: 'Owned By', type: 'select', options: ['Self', 'Others'] },
  { key: 'regStatus', label: 'Registered/Unregistered', type: 'select', options: ['Registered', 'Unregistered'] },
  { key: 'regDate', label: 'Date of Registration/Introduction', type: 'date' },
  { key: 'cert', label: 'Trademark Certificate', type: 'file', fieldKeySuffix: 'brand' },
];

export default function PackagingBrandDetails({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.packagingBrand || {};
  const set = (key, val) => updateSection('packagingBrand', { ...data, [key]: val });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">1. Packaging & Marking Details</div>
        <div className="p-6">
          <RepeatingTable sectionKey="packagingBrand" columns={PACKAGING_COLUMNS} rows={data.packagingRows}
            onChange={rows => set('packagingRows', rows)} getDocForField={getDocForField}
            onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
        </div>
      </div>

      <div className="card">
        <div className="section-header">2. Brand Details</div>
        <div className="p-6">
          <RepeatingTable sectionKey="packagingBrand" columns={BRAND_COLUMNS} rows={data.brandRows}
            onChange={rows => set('brandRows', rows)} getDocForField={getDocForField}
            onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build** — `cd client && npm run build`, expect success.
- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/isi/PackagingBrandDetails.jsx
git commit -m "Add ISI Packaging & Brand Details tab"
```

---

### Task 13: ISI tab — Testing & Inspection

**Files:**
- Create: `client/src/pages/portal/isi/TestingInspection.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';
import { RepeatingTable } from '../../../components/RepeatingTable';

const SUBCONTRACT_COLUMNS = [
  { key: 'clauseNo', label: 'Clause No. of IS', type: 'text' },
  { key: 'test', label: 'Test to be Sub-Contracted', type: 'text' },
  { key: 'consent', label: 'Consent Letter', type: 'file', fieldKeySuffix: 'subcontract' },
  { key: 'labName', label: 'Name of Lab (BIS Recognised/Empanelled)', type: 'text' },
];

export default function TestingInspection({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.testing || {};
  const set = (key, val) => updateSection('testing', { ...data, [key]: val });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">1. In-House Testing</div>
        <div className="p-6 space-y-4">
          <Field label="Do you have in-house facility for complete testing of the product as per the Indian Standard?" required>
            <Select value={data.hasInHouse} onChange={v => set('hasInHouse', v)} options={['Yes', 'No']} />
          </Field>
        </div>
      </div>

      {data.hasInHouse === 'No' && (
        <div className="card">
          <div className="section-header">2. Subcontracted Testing</div>
          <div className="p-6">
            <RepeatingTable sectionKey="testing" columns={SUBCONTRACT_COLUMNS} rows={data.subcontractRows}
              onChange={rows => set('subcontractRows', rows)} getDocForField={getDocForField}
              onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
          </div>
        </div>
      )}

      <div className="card">
        <div className="section-header">3. Testing Equipment</div>
        <div className="p-6">
          <Field label="List of Testing Equipment" required hint="Measuring instruments, chemicals, glassware, etc.">
            <FileUpload fieldKey="testing_equipment_list" fieldLabel="Testing Equipment List"
              existingDoc={getDocForField('testing_equipment_list')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build** — `cd client && npm run build`, expect success.
- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/isi/TestingInspection.jsx
git commit -m "Add ISI Testing & Inspection tab"
```

---

### Task 14: ISI tab — Test Report Details

**Files:**
- Create: `client/src/pages/portal/isi/TestReportDetails.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';
import { RepeatingTable } from '../../../components/RepeatingTable';

const VARIETY_COLUMNS = [
  { key: 'description', label: 'Product Variety Description', type: 'text' },
  { key: 'isNo', label: 'IS No.', type: 'text' },
  { key: 'sampleCode', label: 'Sample Code', type: 'text' },
  { key: 'issueDate', label: 'Test Report Issue Date', type: 'date' },
  { key: 'delayReason', label: 'Reason for Delay (if older than 90/180 days)', type: 'text' },
  { key: 'report', label: 'Test Report', type: 'file', fieldKeySuffix: 'variety' },
  { key: 'complete', label: 'Test Report Complete?', type: 'select', options: ['Yes', 'No'] },
  { key: 'conformity', label: 'Conformity of Sample as per IS?', type: 'select', options: ['Yes', 'No'] },
];

const RAWMAT_COLUMNS = [
  { key: 'description', label: 'Raw Material Description', type: 'text' },
  { key: 'report', label: 'Test Report/Certificate', type: 'file', fieldKeySuffix: 'rawmat' },
  { key: 'complete', label: 'Complete?', type: 'select', options: ['Yes', 'No'] },
  { key: 'conformity', label: 'Conformity of Sample as per IS?', type: 'select', options: ['Yes', 'No'] },
];

export default function TestReportDetails({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.testReport || {};
  const set = (key, val) => updateSection('testReport', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">A. Product Test Reports</div>
        <div className="p-6">
          <RepeatingTable sectionKey="testReport" columns={VARIETY_COLUMNS} rows={data.varietyRows}
            onChange={rows => set('varietyRows', rows)} getDocForField={getDocForField}
            onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
        </div>
      </div>

      <div className="card">
        <div className="section-header">A1. Long Duration Tests</div>
        <div className="p-6 space-y-4">
          <Field label="Is a long duration test applicable for the product?" required>
            <Select value={data.ldtApplicable} onChange={v => set('ldtApplicable', v)} options={['Yes', 'No']} />
          </Field>
          {data.ldtApplicable === 'Yes' && (
            <>
              <Field label="Has the firm NOT uploaded the Long Duration Test Report and is opting for relaxation per the Guidelines for Grant of Licence?" required>
                <Select value={data.ldtRelaxation} onChange={v => set('ldtRelaxation', v)} options={['Yes', 'No']} />
              </Field>
              {data.ldtRelaxation === 'Yes' && (
                <Field label="Undertaking (per Guidelines Annex III)" required>
                  <FileUpload fieldKey="testReport_ldt_undertaking" fieldLabel="LDT Relaxation Undertaking"
                    existingDoc={getDocForField('testReport_ldt_undertaking')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
                </Field>
              )}
              <div className="form-row">
                <Field label="Clause No. of IS"><input {...d('ldtClauseNo')} /></Field>
                <Field label="Long Duration Test Specified"><input {...d('ldtSpecified')} /></Field>
              </div>
              <div className="form-row">
                <Field label="Name of Lab where Test is in Progress"><input {...d('ldtLabName')} /></Field>
                <Field label="Date Test Report Likely to be Available"><input type="date" {...d('ldtExpectedDate')} /></Field>
              </div>
              <div className="form-row">
                <Field label="In-House Test Report">
                  <FileUpload fieldKey="testReport_ldt_inhouse" fieldLabel="LDT In-House Test Report"
                    existingDoc={getDocForField('testReport_ldt_inhouse')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
                </Field>
                <Field label="Test Report on Receipt from Lab">
                  <FileUpload fieldKey="testReport_ldt_lab_report" fieldLabel="LDT Lab Test Report"
                    existingDoc={getDocForField('testReport_ldt_lab_report')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
                </Field>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="section-header">B. Raw Material Conformity</div>
        <div className="p-6 space-y-4">
          <Field label="Does the applicable Indian Standard require raw material conformity?" required>
            <Select value={data.rawMatRequired} onChange={v => set('rawMatRequired', v)} options={['Yes', 'No']} />
          </Field>
          {data.rawMatRequired === 'Yes' && (
            <RepeatingTable sectionKey="testReport" columns={RAWMAT_COLUMNS} rows={data.rawMatRows}
              onChange={rows => set('rawMatRows', rows)} getDocForField={getDocForField}
              onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build** — `cd client && npm run build`, expect success.
- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/isi/TestReportDetails.jsx
git commit -m "Add ISI Test Report Details tab"
```

---

### Task 15: ISI tab — Declaration & Undertaking

Per the spec, this is functionally identical to FMCS's declaration tab — same fields, same submit wiring. Copy it verbatim into the ISI folder.

**Files:**
- Create: `client/src/pages/portal/isi/DeclarationUndertaking.jsx`

- [ ] **Step 1: Copy the FMCS declaration tab unchanged**

```jsx
import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';

export default function DeclarationUndertaking({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted, onSubmit, submitting }) {
  const data = formData.declaration || {};
  const set = (key, val) => updateSection('declaration', { ...data, [key]: val });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">1. Miscellaneous Declaration</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Any Statutory Permissions required for the product category?" required>
              <Select value={data.statutoryPermissions} onChange={v => set('statutoryPermissions', v)} options={['Yes', 'No', 'NA']} />
            </Field>
            {data.statutoryPermissions === 'Yes' && (
              <Field label="Upload Statutory Permission Documents" hint="PDF copy required">
                <FileUpload fieldKey="declaration_statutory_docs" fieldLabel="Statutory Permission Documents"
                  existingDoc={getDocForField('declaration_statutory_docs')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
              </Field>
            )}
          </div>
          <div className="form-row">
            <Field label="Does the firm intend to provide any other information?" required>
              <Select value={data.otherInfo} onChange={v => set('otherInfo', v)} options={['Yes', 'No']} />
            </Field>
            {data.otherInfo === 'Yes' && (
              <Field label="Upload Supporting Documents">
                <FileUpload fieldKey="declaration_other_info" fieldLabel="Other Information Documents"
                  existingDoc={getDocForField('declaration_other_info')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
              </Field>
            )}
          </div>
          <div className="form-row">
            <Field label="Does the firm intend to submit any other request for consideration?" required>
              <Select value={data.otherRequest} onChange={v => set('otherRequest', v)} options={['Yes', 'No']} />
            </Field>
            {data.otherRequest === 'Yes' && (
              <Field label="Upload Supporting Documents">
                <FileUpload fieldKey="declaration_other_request" fieldLabel="Other Request Documents"
                  existingDoc={getDocForField('declaration_other_request')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
              </Field>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">2. Application Submission Details</div>
        <div className="p-6 space-y-4">
          <Field label="Name of the Person Submitting Application" required>
            <input className="input" value={data.submitterName || ''} onChange={e => set('submitterName', e.target.value)} disabled={isSubmitted} />
          </Field>
          <Field label="Designation of the Person Submitting Application" required>
            <input className="input" value={data.submitterDesignation || ''} onChange={e => set('submitterDesignation', e.target.value)} disabled={isSubmitted} />
          </Field>
          <Field label="Authorization Letter of Person Submitting Application" required hint="If applicable">
            <FileUpload fieldKey="declaration_auth_letter" fieldLabel="Authorization Letter"
              existingDoc={getDocForField('declaration_auth_letter')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">3. Working Days & Weekly Off</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Weekly Off?" required>
              <Select value={data.weeklyOff} onChange={v => set('weeklyOff', v)} options={['Yes', 'No']} />
            </Field>
            {data.weeklyOff === 'Yes' && (
              <Field label="Days (if Yes)" required>
                <input className="input" placeholder="e.g. Sunday, Saturday" value={data.weeklyOffDays || ''} onChange={e => set('weeklyOffDays', e.target.value)} disabled={isSubmitted} />
              </Field>
            )}
          </div>
        </div>
      </div>

      <div className="card border-primary/30">
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800 mb-6">
            I/We hereby declare that the information furnished above is true and correct to the best of my/our knowledge and belief.
          </div>
          <Field label="Authorised Signatory Name" required>
            <input className="input" value={data.signatoryName || ''} onChange={e => set('signatoryName', e.target.value)} disabled={isSubmitted} />
          </Field>
          <Field label="Date" required>
            <input className="input" type="date" value={data.signDate || ''} onChange={e => set('signDate', e.target.value)} disabled={isSubmitted} />
          </Field>

          {!isSubmitted && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-start gap-3 mb-4">
                <input type="checkbox" id="confirm" className="mt-0.5" checked={data.confirmed || false} onChange={e => set('confirmed', e.target.checked)} />
                <label htmlFor="confirm" className="text-sm text-gray-700 cursor-pointer">
                  I confirm that all information provided is accurate and all required documents have been uploaded.
                </label>
              </div>
              <button onClick={onSubmit} disabled={submitting || !data.confirmed} className="btn-primary bg-green-600 hover:bg-green-700 w-full py-3 text-base">
                {submitting ? 'Submitting...' : '✓ Submit Form to Absolute Veritas'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build** — `cd client && npm run build`, expect success.
- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/isi/DeclarationUndertaking.jsx
git commit -m "Add ISI Declaration & Undertaking tab"
```

---

### Task 16: Frontend — extract `fmcsTabs.js` config

Extracts the currently-hardcoded FMCS tab list and component imports out of `PortalLayout.jsx`, so the wizard shell can become type-agnostic in Task 18.

**Files:**
- Create: `client/src/pages/portal/fmcsTabs.js`

- [ ] **Step 1: Write the config**

```javascript
import DocumentChecklist from './tabs/DocumentChecklist';
import RegistrationForm from './tabs/RegistrationForm';
import OrganizationProfile from './tabs/OrganizationProfile';
import ManagementDetails from './tabs/ManagementDetails';
import ManufacturingProcess from './tabs/ManufacturingProcess';
import PackagingBrandDetails from './tabs/PackagingBrandDetails';
import TestingInspection from './tabs/TestingInspection';
import TestReportDetails from './tabs/TestReportDetails';
import DeclarationUndertaking from './tabs/DeclarationUndertaking';

export const FMCS_TABS = [
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

export const FMCS_TAB_COMPONENTS = {
  checklist: DocumentChecklist,
  registration: RegistrationForm,
  organization: OrganizationProfile,
  management: ManagementDetails,
  manufacturing: ManufacturingProcess,
  packaging: PackagingBrandDetails,
  testing: TestingInspection,
  testReport: TestReportDetails,
  declaration: DeclarationUndertaking,
};
```

This must exactly match the `TABS` array currently hardcoded at the top of `client/src/pages/portal/PortalLayout.jsx` — do not change any `key`/`label`/`path` values, only relocate them.

- [ ] **Step 2: Verify build** — `cd client && npm run build`, expect success (unused until Task 20 rewires `App.jsx`, but this file is self-contained and importable now).
- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/fmcsTabs.js
git commit -m "Extract FMCS tab config into its own module"
```

---

### Task 17: Frontend — `isiTabs.js` config

**Files:**
- Create: `client/src/pages/portal/isiTabs.js`

- [ ] **Step 1: Write the config**

```javascript
import DocumentChecklist from './isi/DocumentChecklist';
import FirmOfficeDetails from './isi/FirmOfficeDetails';
import FactoryDetails from './isi/FactoryDetails';
import StandardVariety from './isi/StandardVariety';
import ManagementDetails from './isi/ManagementDetails';
import ManufacturingProcess from './isi/ManufacturingProcess';
import PackagingBrandDetails from './isi/PackagingBrandDetails';
import TestingInspection from './isi/TestingInspection';
import TestReportDetails from './isi/TestReportDetails';
import DeclarationUndertaking from './isi/DeclarationUndertaking';

export const ISI_TABS = [
  { key: 'checklist', label: 'Document Checklist', path: '' },
  { key: 'firmOffice', label: 'Firm, Office & Registration', path: 'firm-office' },
  { key: 'factory', label: 'Factory Details', path: 'factory' },
  { key: 'standard', label: 'Indian Standard & Product Variety', path: 'standard-variety' },
  { key: 'management', label: 'Management Details', path: 'management' },
  { key: 'manufacturing', label: 'Manufacturing Process', path: 'manufacturing' },
  { key: 'packagingBrand', label: 'Packaging & Brand Details', path: 'packaging-brand' },
  { key: 'testing', label: 'Testing & Inspection', path: 'testing' },
  { key: 'testReport', label: 'Test Report Details', path: 'test-report' },
  { key: 'declaration', label: 'Declaration & Undertaking', path: 'declaration' },
];

export const ISI_TAB_COMPONENTS = {
  checklist: DocumentChecklist,
  firmOffice: FirmOfficeDetails,
  factory: FactoryDetails,
  standard: StandardVariety,
  management: ManagementDetails,
  manufacturing: ManufacturingProcess,
  packagingBrand: PackagingBrandDetails,
  testing: TestingInspection,
  testReport: TestReportDetails,
  declaration: DeclarationUndertaking,
};
```

- [ ] **Step 2: Verify build**

Run: `cd client && npm run build`
Expected: succeeds. This is the first point where all 10 ISI tab files (Tasks 6-15) get imported together — a build failure here means one of them has a syntax error or a bad import path; fix it before continuing.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/isiTabs.js
git commit -m "Add ISI tab config, wiring together all 10 ISI tab components"
```

---

### Task 18: Frontend — generalize `PortalLayout.jsx`

Converts the wizard shell from FMCS-only to prop-driven (`basePath`, `TABS`, `tabComponents`), so both `/portal/fmcs/:submissionId/*` and `/portal/isi/:submissionId/*` can reuse it.

**Files:**
- Modify: `client/src/pages/portal/PortalLayout.jsx` (full rewrite)

- [ ] **Step 1: Replace the entire file**

```jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { LogOut, CheckCircle, Clock, Save, ArrowLeft } from 'lucide-react';
import { SubmissionIdContext } from '../../components/FormField';

export default function PortalLayout({ basePath, TABS, tabComponents }) {
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

  useEffect(() => {
    api.get(`/submissions/${submissionId}`)
      .then(res => {
        setSubmission(res.data);
        setFormData(res.data.formData || {});
      })
      .catch(() => toast.error('Failed to load form data'));
  }, [submissionId]);

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
      navigate(`${basePath}/${submissionId}/submitted`);
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

  const formBasePath = `${basePath}/${submissionId}`;
  const activeTab = TABS.findIndex(t => {
    const path = location.pathname.replace(formBasePath, '').replace(/^\//, '');
    return t.path === path || (t.path === '' && path === '');
  });

  const currentIndex = Math.max(0, activeTab);
  const sharedProps = { formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted };

  return (
    <SubmissionIdContext.Provider value={submissionId}>
      <div className="min-h-screen bg-surface flex flex-col">
        <div className="sticky top-0 z-20 shrink-0">
          <nav className="bg-primary px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(basePath)} className="text-white/70 hover:text-white" title="Back to My Forms">
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

          <div className="bg-white border-b border-border px-6 py-3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 min-w-max">
              {TABS.map((tab, idx) => (
                <button key={tab.key}
                  onClick={() => navigate(`${formBasePath}/${tab.path}`)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${idx === currentIndex ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}>
                  <span className="mr-1.5 opacity-60">{idx + 1}.</span>{tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

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
              {TABS.map((tab, idx) => {
                const Component = tabComponents[tab.key];
                const extraProps = idx === TABS.length - 1 ? { onSubmit: handleSubmit, submitting } : {};
                return tab.path === ''
                  ? <Route key={tab.key} index element={<Component {...sharedProps} {...extraProps} />} />
                  : <Route key={tab.key} path={tab.path} element={<Component {...sharedProps} {...extraProps} />} />;
              })}
              <Route path="submitted" element={
                <div className="text-center py-16">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Form Submitted Successfully!</h2>
                  <p className="text-gray-500 text-sm mb-6">Our team at Absolute Veritas will review your information and get back to you shortly.</p>
                  <a href="mailto:cs@absoluteveritas.com" className="btn-primary inline-block">Contact Us</a>
                </div>
              } />
            </Routes>

            {!location.pathname.includes('submitted') && (
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <button onClick={() => { const prev = TABS[currentIndex - 1]; if (prev) navigate(`${formBasePath}/${prev.path}`); }}
                  disabled={currentIndex === 0} className="btn-secondary disabled:opacity-30">← Previous</button>
                {currentIndex < TABS.length - 1 ? (
                  <button onClick={() => { const next = TABS[currentIndex + 1]; navigate(`${formBasePath}/${next.path}`); }} className="btn-primary">
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

**What changed vs. the original:** the hardcoded `TABS` array and 9 tab imports are gone — `TABS` and `tabComponents` now arrive as props. The local `basePath` variable (previously `` `/portal/${submissionId}` ``) is renamed `formBasePath` and now built from the `basePath` **prop** (e.g. `/portal/fmcs`) plus `submissionId`, so the "Back to My Forms" button and post-submit redirect go to the right type-scoped list. The `<Routes>` block now maps over the `TABS` prop instead of listing each FMCS route by hand, attaching `onSubmit`/`submitting` only to the last tab (same as the original did explicitly for `declaration`).

This component isn't reachable yet — `App.jsx` still imports the old signature until Task 20. Verification happens then.

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/portal/PortalLayout.jsx
git commit -m "Generalize PortalLayout into a prop-driven wizard shell for any form type"
```

---

### Task 19: Frontend — generalize `MyForms.jsx`

**Files:**
- Modify: `client/src/pages/portal/MyForms.jsx` (full rewrite)

- [ ] **Step 1: Replace the entire file**

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { LogOut, Plus, X, ArrowLeft } from 'lucide-react';

function StatusBadge({ status }) {
  if (status === 'SUBMITTED') return <span className="badge-submitted">Submitted</span>;
  if (status === 'IN_PROGRESS') return <span className="badge-progress">In Progress</span>;
  return <span className="badge-notstarted">Not Started</span>;
}

function NewFormModal({ forms, formType, onClose, onCreated }) {
  const [label, setLabel] = useState('');
  const [cloneFromId, setCloneFromId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/submissions', { label, formType, cloneFromId: cloneFromId || undefined });
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

export default function MyForms({ formType, basePath, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    api.get('/submissions', { params: { formType } })
      .then(res => setForms(res.data))
      .catch(() => toast.error('Failed to load forms'))
      .finally(() => setLoading(false));
  }, [formType]);

  return (
    <div className="min-h-screen bg-surface">
      <nav className="bg-primary px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/portal')} className="text-white/70 hover:text-white" title="Back to Application Types">
            <ArrowLeft size={16} />
          </button>
          <div className="w-7 h-7 bg-white/20 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">AV</span>
          </div>
          <span className="text-white font-semibold text-sm">{title}</span>
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
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
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
                <button key={f.id} onClick={() => navigate(`${basePath}/${f.id}`)}
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

      {showNew && <NewFormModal forms={forms} formType={formType} onClose={() => setShowNew(false)} onCreated={f => { setForms(prev => [f, ...prev]); setShowNew(false); navigate(`${basePath}/${f.id}`); }} />}
    </div>
  );
}
```

**What changed vs. the original:** `MyForms` now takes `formType`, `basePath`, `title` props. The forms list fetch passes `formType` as a query param (server-side filtering, per the approved spec — keeps payload bounded as forms grow). Navigation targets `` `${basePath}/${f.id}` `` instead of the old hardcoded `` `/portal/${f.id}` ``. A back arrow was added (there was no chooser screen to go back to before this feature). `NewFormModal` now sends `formType` when creating a form, and its clone dropdown is naturally already scoped to one type since `forms` itself is now server-filtered.

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/portal/MyForms.jsx
git commit -m "Generalize MyForms into a prop-driven form-type picker"
```

---

### Task 20: Frontend — `FormTypeSelect.jsx`

**Files:**
- Create: `client/src/pages/portal/FormTypeSelect.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { LogOut, FileCheck2, ShieldCheck } from 'lucide-react';

export default function FormTypeSelect() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-lg font-semibold text-gray-900 mb-1 text-center">Choose Application Type</h1>
        <p className="text-sm text-gray-500 mb-10 text-center">Select the certification scheme you'd like to apply for.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button onClick={() => navigate('/portal/fmcs')} className="card p-8 text-left hover:border-primary/50 hover:shadow-md transition-all">
            <FileCheck2 size={28} className="text-primary mb-4" />
            <div className="text-base font-semibold text-gray-900 mb-1">FMCS</div>
            <p className="text-xs text-gray-500">Foreign Manufacturers Certification Scheme application.</p>
          </button>
          <button onClick={() => navigate('/portal/isi')} className="card p-8 text-left hover:border-primary/50 hover:shadow-md transition-all">
            <ShieldCheck size={28} className="text-primary mb-4" />
            <div className="text-base font-semibold text-gray-900 mb-1">ISI — BIS Standard Mark</div>
            <p className="text-xs text-gray-500">Indian Standards Institute (ISI) certification mark application.</p>
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/portal/FormTypeSelect.jsx
git commit -m "Add form-type chooser screen"
```

---

### Task 21: Frontend — rewire `App.jsx` routing

This is the task that makes everything from Tasks 4-20 reachable in the browser.

**Files:**
- Modify: `client/src/App.jsx` (full rewrite)

- [ ] **Step 1: Replace the entire file**

```jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './lib/AuthContext';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import SubmissionView from './pages/admin/SubmissionView';
import PortalLayout from './pages/portal/PortalLayout';
import MyForms from './pages/portal/MyForms';
import FormTypeSelect from './pages/portal/FormTypeSelect';
import { FMCS_TABS, FMCS_TAB_COMPONENTS } from './pages/portal/fmcsTabs';
import { ISI_TABS, ISI_TAB_COMPONENTS } from './pages/portal/isiTabs';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-500 text-sm">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/portal'} replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/portal'} /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/portal'} /> : <RegisterPage />} />
      <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/submissions/:id" element={<ProtectedRoute role="ADMIN"><SubmissionView /></ProtectedRoute>} />
      <Route path="/portal" element={<ProtectedRoute role="CLIENT"><FormTypeSelect /></ProtectedRoute>} />
      <Route path="/portal/fmcs" element={<ProtectedRoute role="CLIENT"><MyForms formType="FMCS" basePath="/portal/fmcs" title="FMCS Forms" /></ProtectedRoute>} />
      <Route path="/portal/fmcs/:submissionId/*" element={<ProtectedRoute role="CLIENT"><PortalLayout basePath="/portal/fmcs" TABS={FMCS_TABS} tabComponents={FMCS_TAB_COMPONENTS} /></ProtectedRoute>} />
      <Route path="/portal/isi" element={<ProtectedRoute role="CLIENT"><MyForms formType="ISI" basePath="/portal/isi" title="ISI (BIS Standard Mark) Forms" /></ProtectedRoute>} />
      <Route path="/portal/isi/:submissionId/*" element={<ProtectedRoute role="CLIENT"><PortalLayout basePath="/portal/isi" TABS={ISI_TABS} tabComponents={ISI_TAB_COMPONENTS} /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontSize: '14px' } }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd client && npm run build`
Expected: succeeds with no errors.

- [ ] **Step 3: FMCS regression check in the browser**

With both dev servers running, log in as an **existing FMCS test client** (not a real client account) and confirm:
1. Landing on `/portal` shows the two-card chooser (FMCS / ISI).
2. Clicking "FMCS" navigates to `/portal/fmcs` and shows the same forms list as before (same forms, same statuses, same "Start New Form" flow).
3. Opening an existing FMCS form navigates to `/portal/fmcs/<id>` and shows all 9 original tabs working exactly as before — fill a field on any tab, confirm the "Saving..." → "Saved HH:MM" indicator still appears within ~2 seconds, refresh the page, confirm the value persisted.
4. The document checklist and any previously-uploaded file still shows as uploaded.

Any deviation from prior FMCS behavior here is a regression — stop and fix before proceeding to ISI verification.

- [ ] **Step 4: ISI smoke check in the browser**

Using the throwaway `isi_qa_test` account (create via admin dashboard or self-registration + approval if none exists yet):
1. `/portal` → click "ISI — BIS Standard Mark" → lands on `/portal/isi`, empty forms list.
2. "Start New Form" → creates a form → lands on `/portal/isi/<id>/` (Document Checklist tab).
3. Step through all 10 tabs via "Next →" — confirm each renders without a console error and the step indicator shows 10 tabs with the right labels.
4. On the Product Variety table (Indian Standard & Product Variety tab), click "Add Row" twice, fill different values in each row, confirm both persist after a refresh.

- [ ] **Step 5: Commit**

```bash
git add client/src/App.jsx
git commit -m "Wire /portal into a form-type chooser with separate FMCS and ISI routes"
```

---

### Task 22: Admin — `Dashboard.jsx` form-type badge + Excel error handling

**Files:**
- Modify: `client/src/pages/admin/Dashboard.jsx:305-308` (badge)
- Modify: `client/src/pages/admin/Dashboard.jsx:170-179` (`handleDownloadExcel`)

- [ ] **Step 1: Add the form-type badge**

Change:
```jsx
<td className="px-4 py-3 font-medium text-gray-900">
  {row.username}
  {row.label && <span className="text-gray-400 font-normal"> — {row.label}</span>}
</td>
```
to:
```jsx
<td className="px-4 py-3 font-medium text-gray-900">
  {row.username}
  {row.label && <span className="text-gray-400 font-normal"> — {row.label}</span>}
  {row.formType && (
    <span className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded ${row.formType === 'ISI' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
      {row.formType}
    </span>
  )}
</td>
```

(`row.formType` is already present — `admin.js`'s `GET /users` select was updated in Task 3 to include it, and `rows` in this file already spreads `...s` from each submission, so no other change is needed to get the data here.)

- [ ] **Step 2: Surface the real error message on a 501 Excel response**

`axios` with `responseType: 'blob'` still delivers an error body as a `Blob` even when the server sent JSON — so `err.response.data` must be read as text and parsed, it can't be accessed as `.error` directly. Change:

```javascript
const handleDownloadExcel = async (submissionId, username) => {
  setDownloadingId(submissionId);
  try {
    const res = await api.get(`/admin/submissions/${submissionId}/excel`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a'); a.href = url; a.download = `${username}_BIS_Form.xlsx`; a.click();
    URL.revokeObjectURL(url);
  } catch { toast.error('Download failed'); }
  finally { setDownloadingId(null); }
};
```
to:
```javascript
const handleDownloadExcel = async (submissionId, username) => {
  setDownloadingId(submissionId);
  try {
    const res = await api.get(`/admin/submissions/${submissionId}/excel`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a'); a.href = url; a.download = `${username}_BIS_Form.xlsx`; a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    if (err.response?.status === 501) {
      const text = await err.response.data.text();
      toast.error(JSON.parse(text).error);
    } else {
      toast.error('Download failed');
    }
  }
  finally { setDownloadingId(null); }
};
```

- [ ] **Step 3: Verify in the browser**

Log in as admin, confirm:
1. The client table now shows a small `FMCS` or `ISI` badge next to every form's label.
2. Clicking the Excel download icon on an ISI row shows a toast reading "Excel export for ISI forms is not yet available. Contact the developer to enable it." (not a generic "Download failed", not a silent failure, no browser download triggered).
3. Clicking the Excel download icon on an FMCS row still downloads a working `.xlsx` file exactly as before.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/admin/Dashboard.jsx
git commit -m "Show form-type badge on admin dashboard; surface real error on ISI Excel stopgap"
```

---

### Task 23: Admin — `SubmissionView.jsx` conditional sections

**Files:**
- Modify: `client/src/pages/admin/SubmissionView.jsx:7-24` (SECTIONS + initial state)
- Modify: `client/src/pages/admin/SubmissionView.jsx:99-101` (derive from formType)
- Modify: `client/src/pages/admin/SubmissionView.jsx:44-54` (`handleDownloadExcel` error handling)

- [ ] **Step 1: Replace the single `SECTIONS` constant with a per-type map**

Change:
```javascript
const SECTIONS = [
  { key: 'registration', label: 'Registration Form' },
  { key: 'organization', label: 'Organization Profile' },
  { key: 'management', label: 'Management Details' },
  { key: 'manufacturing', label: 'Manufacturing Process' },
  { key: 'packaging', label: 'Packaging & Brand Details' },
  { key: 'testing', label: 'Testing & Inspection' },
  { key: 'testReport', label: 'Test Report Details' },
  { key: 'declaration', label: 'Declaration & Undertaking' },
];
```
to:
```javascript
const SECTIONS_BY_TYPE = {
  FMCS: [
    { key: 'registration', label: 'Registration Form' },
    { key: 'organization', label: 'Organization Profile' },
    { key: 'management', label: 'Management Details' },
    { key: 'manufacturing', label: 'Manufacturing Process' },
    { key: 'packaging', label: 'Packaging & Brand Details' },
    { key: 'testing', label: 'Testing & Inspection' },
    { key: 'testReport', label: 'Test Report Details' },
    { key: 'declaration', label: 'Declaration & Undertaking' },
  ],
  ISI: [
    { key: 'checklist', label: 'Document Checklist' },
    { key: 'firmOffice', label: 'Firm, Office & Registration' },
    { key: 'factory', label: 'Factory Details' },
    { key: 'standard', label: 'Indian Standard & Product Variety' },
    { key: 'management', label: 'Management Details' },
    { key: 'manufacturing', label: 'Manufacturing Process' },
    { key: 'packagingBrand', label: 'Packaging & Brand Details' },
    { key: 'testing', label: 'Testing & Inspection' },
    { key: 'testReport', label: 'Test Report Details' },
    { key: 'declaration', label: 'Declaration & Undertaking' },
  ],
};
```

- [ ] **Step 2: Change the initial `activeTab` state and derive the effective tab from `submission.formType`**

Change:
```javascript
const [activeTab, setActiveTab] = useState('registration');
```
to:
```javascript
const [activeTab, setActiveTab] = useState(null);
```

Then, right after the existing `if (!submission) return (...)` guard block (so `submission` is guaranteed non-null below it), add:

```javascript
const SECTIONS = SECTIONS_BY_TYPE[submission.formType] || SECTIONS_BY_TYPE.FMCS;
const effectiveTab = activeTab && SECTIONS.some(s => s.key === activeTab) ? activeTab : SECTIONS[0].key;
```

Then replace every remaining use of the bare `activeTab` variable **below this point** (not the `setActiveTab` calls in the tab buttons, which stay as-is) with `effectiveTab`:
- `const formData = submission.formData || {};` stays unchanged
- `const activeData = formData[activeTab] || {};` → `const activeData = formData[effectiveTab] || {};`
- `const activeDocs = submission.documents?.filter(d => d.fieldKey.startsWith(activeTab)) || [];` → `const activeDocs = submission.documents?.filter(d => d.fieldKey.startsWith(effectiveTab)) || [];`
- In the tabs bar: `className={... ${activeTab === s.key ? ... : ...}}` → `className={... ${effectiveTab === s.key ? ... : ...}}`
- `<div className="section-header rounded-none">{SECTIONS.find(s => s.key === activeTab)?.label}</div>` → `{SECTIONS.find(s => s.key === effectiveTab)?.label}`

The tab buttons' `onClick={() => setActiveTab(s.key)}` stays exactly as-is — `setActiveTab` still just sets the raw clicked key; `effectiveTab` only supplies a same-type-safe default before the user clicks anything (or right after switching between an ISI and FMCS submission in the same browser session, since `activeTab` state would otherwise carry over an invalid key like `'registration'` onto an ISI view).

- [ ] **Step 3: Fix `handleDownloadExcel`'s error handling (same blob-error gotcha as Task 22)**

Change:
```javascript
const handleDownloadExcel = async () => {
  setDownloadingExcel(true);
  try {
    const res = await api.get(`/admin/submissions/${id}/excel`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a'); a.href = url;
    a.download = `${submission.user.username}_BIS_Form.xlsx`; a.click();
    URL.revokeObjectURL(url);
  } catch { toast.error('Failed to download Excel'); }
  finally { setDownloadingExcel(false); }
};
```
to:
```javascript
const handleDownloadExcel = async () => {
  setDownloadingExcel(true);
  try {
    const res = await api.get(`/admin/submissions/${id}/excel`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a'); a.href = url;
    a.download = `${submission.user.username}_BIS_Form.xlsx`; a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    if (err.response?.status === 501) {
      const text = await err.response.data.text();
      toast.error(JSON.parse(text).error);
    } else {
      toast.error('Failed to download Excel');
    }
  }
  finally { setDownloadingExcel(false); }
};
```

- [ ] **Step 4: Verify in the browser**

Log in as admin:
1. Open an existing FMCS submission's detail view — confirm all 8 original tabs still show, with the same data as before (unchanged behavior).
2. Open the ISI test submission created during Task 21's QA — confirm 10 tabs show (including "Document Checklist" as the first one), each with the data you entered, and that any repeating-row data (e.g. Product Variety rows) renders as a table (via the existing generic `isObjectArray` renderer — no new rendering code needed here).
3. Confirm uploaded documents show up under the correct tab (this validates the `fieldKey` prefix convention from Task 4-15 end to end).
4. Click Excel download on the ISI submission — confirm the same clear stopgap toast as Task 22, not a crash.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/admin/SubmissionView.jsx
git commit -m "Render ISI submissions with their own section list in the admin viewer"
```

---

### Task 24: Final QA pass and merge readiness

**Files:** none (verification only)

- [ ] **Step 1: Full FMCS regression pass**

Using a real (or realistic test) FMCS account: log in, open an in-progress form, edit a field on every one of the 9 tabs, confirm autosave fires each time, submit the form, confirm the admin dashboard and submission view show it correctly, confirm Excel and docs-ZIP downloads both still work exactly as before this branch existed.

- [ ] **Step 2: Repeating-row data-integrity check (the top risk called out in the spec)**

On the ISI test submission, go to a tab with a `RepeatingTable` that has a file column (e.g. Management Details → Technical Management). Add 3 rows, upload a distinct file to each row's file column, note which file is in which row. Delete row 2. Refresh the page. Confirm: only 2 rows remain, and the file that was in row 1 is still attached to row 1, and the file that was in row 3 is still attached to what is now row 2 (i.e. no file got silently reassigned to the wrong row). This is the scenario the `id`-based `fieldKey` design in Task 4 exists to prevent — confirm it actually holds.

- [ ] **Step 3: Full ISI end-to-end submission**

Fill every field across all 10 ISI tabs on the test account (including at least one row in every `RepeatingTable`), submit, and confirm:
- The admin dashboard shows the submission as `SUBMITTED` with the `ISI` badge.
- The admin submission view renders every section correctly.
- The docs-ZIP download includes every uploaded document.
- The Excel download shows the expected stopgap message (not a crash) — full Excel export remains explicitly out of scope until the reference workbook is provided.

- [ ] **Step 4: Clean up test data**

Delete the `isi_qa_test` (and any other throwaway test accounts created during this QA pass) via the admin dashboard's delete-account action, per the setup note — this cascades to delete their submissions and documents too (`onDelete: Cascade` in the schema).

- [ ] **Step 5: Merge**

```bash
git checkout main
git pull
git merge feature/isi-application-form
git push
```

Then follow the existing deployment process (per `CLAUDE.md`): push triggers Render's backend redeploy automatically; Vercel's frontend redeploy also triggers automatically on push to `main` — confirm both come up green before considering this done.
