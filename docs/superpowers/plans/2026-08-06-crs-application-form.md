# CRS Application Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CRS (Compulsory Registration Scheme) as a third, independent application-form type alongside FMCS and ISI, sourced from real BIS/CRS government portal screenshots.

**Architecture:** Built on `feature/crs-application-form`, branched from `feature/isi-application-form` — inherits the generalized wizard shell (`PortalLayout`/`MyForms` taking `formType`/`basePath`/`TABS`/`tabComponents` props) and the shared `RepeatingTable` primitive. 11 tabs: 9 new CRS-specific components, 1 reused verbatim from FMCS (Declaration), 2 shared "Coming soon" stubs (Tabs 4/5, pending missing source material per the spec).

**Tech Stack:** Same as ISI — React + Vite, Express, Prisma/PostgreSQL, ExcelJS. No test framework — verification is manual (`CLAUDE.md`).

**Spec:** `docs/superpowers/specs/2026-08-06-crs-application-form-design.md`

---

## Before you start

Confirm you're on the right branch — this plan assumes `feature/crs-application-form`
(branched from `feature/isi-application-form`) is already checked out:
```bash
cd c:/Projects/bis-portal
git branch --show-current   # should print feature/crs-application-form
```

Local dev's `DATABASE_URL` points at the same Supabase project as production — use a
throwaway test account for QA (Task 21), delete it before merging.

---

### Task 1: Schema — add `CRS` to `FormType`

**Files:**
- Modify: `server/prisma/schema.prisma`

- [ ] **Step 1: Add the enum value**

Change:
```prisma
enum FormType {
  FMCS
  ISI
}
```
to:
```prisma
enum FormType {
  FMCS
  ISI
  CRS
}
```

- [ ] **Step 2: Push the schema**

Run (from `server/`): `npx prisma generate && npx prisma db push`
Expected: `Your database is now in sync with your Prisma schema.` — additive, no data-loss warning.

- [ ] **Step 3: Commit**

```bash
git add server/prisma/schema.prisma
git commit -m "Add CRS to FormType enum"
```

---

### Task 2: Backend — `generateExcelCRS`

**Files:**
- Modify: `server/src/services/excelExport.js`

- [ ] **Step 1: Add the function**

Add this right after the existing `generateExcel` function (after its closing `}` at the
end of the file, before `module.exports`):

```javascript
async function generateExcelCRS(submission) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Absolute Veritas Portal';
  wb.created = new Date();

  const fd = submission.formData || {};
  const docs = submission.documents || [];
  const checklist = fd.checklist || {};
  const account = fd.account || {};
  const address = fd.address || {};
  const brand = fd.brand || {};
  const mgmt = fd.management || {};
  const contact = fd.contact || {};
  const air = fd.air || {};
  const uploads = fd.uploads || {};
  const decl = fd.declaration || {};

  const clientInfo = `Client: ${submission.user?.username || '—'}   |   Status: ${submission.status}   |   Last Updated: ${new Date(submission.updatedAt).toLocaleDateString('en-IN')}`;

  const CHECKLIST_DOCS = [
    { no: 1, doc: 'Brand Registration Certificate(s)' },
    { no: 2, doc: 'Brand Authorization Letter' },
    { no: 3, doc: 'Authorization from Factory CEO/MD/Head for Filling and Signing Form-1' },
    { no: 4, doc: 'Authorization Letter from CEO/Top Management of AIR Firm' },
    { no: 5, doc: 'ID Card of Authorized Signatory of AIR' },
    { no: 6, doc: 'Raw Materials/Components' },
  ];

  // ============================================================
  // SHEET 1 — REGISTRATION & ADDRESS
  // ============================================================
  {
    const ws = wb.addWorksheet('Registration & Address');
    ws.columns = [{ width: 28 }, { width: 42 }, { width: 28 }, { width: 42 }];
    let r = 1;
    spacer(ws, r++, 4, 8);
    titleRow(ws, r++, 4, 'CRS APPLICATION — REGISTRATION & ADDRESS');
    noteRow(ws, r++, 4, '* Mandatory Fields');
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'Document Checklist');
    spacer(ws, r++, 4, 4);
    CHECKLIST_DOCS.forEach(d => {
      const status = checklist[String(d.no)] || '';
      lv2(ws, r++, `${d.no}. ${d.doc}`, status, '', '');
    });
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'Basic Details');
    spacer(ws, r++, 4, 4);
    lv1(ws, r++, 'User Name *', account.userName);
    lv2(ws, r++, 'Company URL', account.companyUrl || '', 'Email *', account.email || '');
    lv2(ws, r++, 'Name *', account.name || '', 'Designation', account.designation || '');
    lv1(ws, r++, 'Mobile No. *', account.mobile);
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'Manufacturer Unit Details');
    spacer(ws, r++, 4, 4);
    lv1(ws, r++, 'Manufacturing Unit Name *', account.unitName);
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'Address of the Manufacturing Unit');
    spacer(ws, r++, 4, 4);
    lv1(ws, r++, 'Email *', address.mfgEmail);
    lv1(ws, r++, 'Address *', address.mfgAddress);
    lv2(ws, r++, 'Country *', address.mfgCountry || '', 'State/Province *', address.mfgState || '');
    lv2(ws, r++, 'Zip Code *', address.mfgZip || '', 'Fax No.', address.mfgFax || '');
    lv1(ws, r++, 'Contact No. *', address.mfgContact);
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'Address for Correspondence');
    spacer(ws, r++, 4, 4);
    lv1(ws, r++, 'Email *', address.corrEmail);
    lv1(ws, r++, 'Address *', address.corrAddress);
    lv2(ws, r++, 'Country *', address.corrCountry || '', 'State/Province *', address.corrState || '');
    lv2(ws, r++, 'Zip Code *', address.corrZip || '', 'Fax No.', address.corrFax || '');
    lv1(ws, r++, 'Contact No. *', address.corrContact);
    lv1(ws, r++, 'Correspondence Address Selection *', address.correspondenceSelection);
    lv1(ws, r++, 'Address Authentication Document', getDoc(docs, 'address_auth_doc'));

    spacer(ws, r++, 4, 5);
    mergeSet(ws, r, 1, r, 4, clientInfo, { fg: 'FF555555', bg: 'FFEEF2F7', size: 8, align: 'center' });
  }

  // ============================================================
  // SHEET 2 — BRAND & MANAGEMENT
  // ============================================================
  {
    const ws = wb.addWorksheet('Brand & Management');
    ws.columns = [{ width: 6 }, { width: 30 }, { width: 30 }, { width: 20 }, { width: 20 }, { width: 18 }];
    let r = 1;
    spacer(ws, r++, 6, 8);
    titleRow(ws, r++, 6, 'CRS APPLICATION — BRAND & MANAGEMENT DETAILS');
    spacer(ws, r++, 6, 6);

    secHeader(ws, r++, 6, 'Brand Details');
    spacer(ws, r++, 6, 4);
    const brandRows = (brand.rows || []).map((row, i) => ({
      sno: i + 1, brandName: row.brandName || '', cert: getDoc(docs, `brand_cert_${row.id}`),
      ownedBy: row.ownedBy || '', registered: row.registered || '', registrationDate: row.registrationDate || '',
    }));
    r = drawTable(ws, r, [
      { col: 1, label: 'S.No.', key: 'sno' },
      { col: 2, label: 'Brand Name', key: 'brandName' },
      { col: 3, label: 'Registration Certificate', key: 'cert' },
      { col: 4, label: 'Owned By', key: 'ownedBy' },
      { col: 5, label: 'Registered?', key: 'registered' },
      { col: 6, label: 'Registration Date', key: 'registrationDate' },
    ], brandRows, 6);
    spacer(ws, r++, 6, 6);

    secHeader(ws, r++, 6, 'Top Management Details');
    spacer(ws, r++, 6, 4);
    const topRows = (mgmt.topRows || []).map((row, i) => ({ sno: i + 1, name: row.name || '', designation: row.designation || '' }));
    r = drawTable(ws, r, [
      { col: 1, label: 'S.No.', key: 'sno' },
      { col: 2, label: 'Name', key: 'name', merge: 2 },
      { col: 4, label: 'Designation', key: 'designation', merge: 3 },
    ], topRows, 6);
    spacer(ws, r++, 6, 6);

    secHeader(ws, r++, 6, 'Technical Management Details');
    spacer(ws, r++, 6, 4);
    const techRows = (mgmt.techRows || []).map((row, i) => ({ sno: i + 1, name: row.name || '', designation: row.designation || '' }));
    r = drawTable(ws, r, [
      { col: 1, label: 'S.No.', key: 'sno' },
      { col: 2, label: 'Name', key: 'name', merge: 2 },
      { col: 4, label: 'Designation', key: 'designation', merge: 3 },
    ], techRows, 6);

    spacer(ws, r++, 6, 5);
    mergeSet(ws, r, 1, r, 6, clientInfo, { fg: 'FF555555', bg: 'FFEEF2F7', size: 8, align: 'center' });
  }

  // ============================================================
  // SHEET 3 — CONTACT & AIR
  // ============================================================
  {
    const ws = wb.addWorksheet('Contact & AIR');
    ws.columns = [{ width: 28 }, { width: 42 }, { width: 28 }, { width: 42 }];
    let r = 1;
    spacer(ws, r++, 4, 8);
    titleRow(ws, r++, 4, 'CRS APPLICATION — CONTACT PERSON & AIR');
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'Contact Person');
    spacer(ws, r++, 4, 4);
    lv2(ws, r++, 'Name *', contact.name || '', 'Designation *', contact.designation || '');
    lv2(ws, r++, 'Mobile Number *', contact.mobile || '', 'Email *', contact.email || '');
    lv1(ws, r++, 'Fax', contact.fax);
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'Manufacturer Details');
    spacer(ws, r++, 4, 4);
    lv1(ws, r++, 'Firm Name', account.unitName);
    lv1(ws, r++, 'Firm Address', address.mfgAddress);
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'AIR / Authorized Signatory');
    spacer(ws, r++, 4, 4);
    lv1(ws, r++, 'Representative Scenario *', air.scenario);
    lv2(ws, r++, 'Firm Name *', air.repFirmName || '', 'Firm Address *', air.repFirmAddress || '');
    lv2(ws, r++, 'Aadhar Number', air.aadharNumber || '', 'Govt. Issued Document', air.govtDocType || '');
    lv1(ws, r++, 'Document Number', air.govtDocNumber);
    lv2(ws, r++, 'Person Name', air.personName || '', 'Designation', air.personDesignation || '');
    lv2(ws, r++, 'Mobile Number', air.personMobile || '', 'Email', air.personEmail || '');
    lv2(ws, r++, 'State', air.state || '', 'Zip Code/Pin', air.zipCode || '');

    spacer(ws, r++, 4, 5);
    mergeSet(ws, r, 1, r, 4, clientInfo, { fg: 'FF555555', bg: 'FFEEF2F7', size: 8, align: 'center' });
  }

  // ============================================================
  // SHEET 4 — UPLOADS & DECLARATION
  // ============================================================
  {
    const ws = wb.addWorksheet('Uploads & Declaration');
    ws.columns = [{ width: 40 }, { width: 40 }, { width: 28 }, { width: 42 }];
    let r = 1;
    spacer(ws, r++, 4, 8);
    titleRow(ws, r++, 4, 'CRS APPLICATION — UPLOAD DOCUMENTS & DECLARATION');
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'Upload Documents');
    spacer(ws, r++, 4, 4);
    lv1(ws, r++, 'Authorization from Factory CEO/MD/Head', getDoc(docs, 'uploads_ceo_auth'));
    lv1(ws, r++, 'Raw Materials/Components', getDoc(docs, 'uploads_raw_materials'));
    lv1(ws, r++, 'Authorization Letter from AIR Firm CEO/Top Mgmt', getDoc(docs, 'uploads_air_ceo_auth'));
    lv1(ws, r++, 'In-house Testing Facility?', uploads.inHouseTesting);
    lv1(ws, r++, 'Complete Manufacturing Facility?', uploads.completeManufacturing);
    lv1(ws, r++, 'ID Card of Authorized Signatory of AIR', getDoc(docs, 'uploads_air_id_card'));
    lv1(ws, r++, 'Other Document', getDoc(docs, 'uploads_other'));
    lv1(ws, r++, 'Factory Address Proof / Business License', getDoc(docs, 'uploads_factory_proof'));
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'Declaration & Undertaking');
    spacer(ws, r++, 4, 4);
    lv1(ws, r++, 'Statutory Permissions Required?', decl.statutoryPermissions);
    lv1(ws, r++, 'Other Information?', decl.otherInfo);
    lv1(ws, r++, 'Other Request?', decl.otherRequest);
    lv2(ws, r++, 'Submitter Name *', decl.submitterName || '', 'Submitter Designation *', decl.submitterDesignation || '');
    lv1(ws, r++, 'Weekly Off?', decl.weeklyOff);
    lv1(ws, r++, 'Weekly Off Days', decl.weeklyOffDays);
    lv2(ws, r++, 'Signatory Name *', decl.signatoryName || '', 'Date *', decl.signDate || '');

    spacer(ws, r++, 4, 5);
    mergeSet(ws, r, 1, r, 4, clientInfo, { fg: 'FF555555', bg: 'FFEEF2F7', size: 8, align: 'center' });
  }

  return wb;
}
```

- [ ] **Step 2: Export it**

Change:
```javascript
module.exports = { generateExcel };
```
to:
```javascript
module.exports = { generateExcel, generateExcelCRS };
```

- [ ] **Step 3: Commit**

```bash
git add server/src/services/excelExport.js
git commit -m "Add generateExcelCRS export function"
```

---

### Task 3: Backend — branch the Excel export route for CRS

**Files:**
- Modify: `server/src/routes/admin.js:7` (import)
- Modify: `server/src/routes/admin.js:145-164` (route handler, per the ISI branch's current line numbers)

- [ ] **Step 1: Import `generateExcelCRS`**

Change:
```javascript
const { generateExcel } = require('../services/excelExport');
```
to:
```javascript
const { generateExcel, generateExcelCRS } = require('../services/excelExport');
```

- [ ] **Step 2: Branch on `formType === 'CRS'`**

Change:
```javascript
    if (submission.formType === 'ISI') {
      return res.status(501).json({ error: 'Excel export for ISI forms is not yet available. Contact the developer to enable it.' });
    }
    const wb = await generateExcel(submission);
```
to:
```javascript
    if (submission.formType === 'ISI') {
      return res.status(501).json({ error: 'Excel export for ISI forms is not yet available. Contact the developer to enable it.' });
    }
    const wb = submission.formType === 'CRS' ? await generateExcelCRS(submission) : await generateExcel(submission);
```

- [ ] **Step 3: Verify with curl** (after Tasks 4-20 land and a CRS test submission exists)

```bash
curl -s -o /tmp/crs-test.xlsx -w "%{http_code}\n" http://localhost:5000/api/admin/submissions/<crs-submission-id>/excel -H "Authorization: Bearer $ADMIN_TOKEN"
```
Expected: `200`, and `/tmp/crs-test.xlsx` is a valid non-empty `.xlsx` file with 4 sheets
(Registration & Address, Brand & Management, Contact & AIR, Uploads & Declaration).

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/admin.js
git commit -m "Branch admin Excel export route to use generateExcelCRS for CRS submissions"
```

---

### Task 4: Frontend — `RepeatingTable`'s `protectFirstRow` prop

A real filled-in screenshot of CRS's Management Details tab confirms row 1 has no Delete
button (only rows 2+ do) — a behavior `RepeatingTable` doesn't have yet (built for ISI,
where every row was freely deletable).

**Files:**
- Modify: `client/src/components/RepeatingTable.jsx`

- [ ] **Step 1: Add the prop and use the row index**

Change:
```jsx
export function RepeatingTable({ sectionKey, columns, rows, onChange, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
```
to:
```jsx
export function RepeatingTable({ sectionKey, columns, rows, onChange, getDocForField, onDocUploaded, onDocRemoved, isSubmitted, protectFirstRow = false }) {
```

Change:
```jsx
            ) : list.map(row => (
              <tr key={row.id} className="border-b border-border last:border-0">
```
to:
```jsx
            ) : list.map((row, idx) => (
              <tr key={row.id} className="border-b border-border last:border-0">
```

Change:
```jsx
                {!isSubmitted && (
                  <td className="px-2 py-1.5 align-top">
                    <button type="button" onClick={() => removeRow(row.id)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                  </td>
                )}
```
to:
```jsx
                {!isSubmitted && (
                  <td className="px-2 py-1.5 align-top">
                    {!(protectFirstRow && idx === 0) && (
                      <button type="button" onClick={() => removeRow(row.id)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                    )}
                  </td>
                )}
```

The `<td>` still renders unconditionally when `!isSubmitted` (keeping every row's cell
count aligned) — only the button inside is conditionally hidden for the protected row.
`protectFirstRow` defaults to `false`, so every existing ISI usage of `RepeatingTable` is
unaffected.

- [ ] **Step 2: Verify build**

Run: `cd client && npm run build` — expected: succeeds (no consumer uses the new prop yet
until Task 12).

- [ ] **Step 3: Commit**

```bash
git add client/src/components/RepeatingTable.jsx
git commit -m "Add protectFirstRow prop to RepeatingTable for CRS Management Details"
```

---

### Task 5: Frontend — shared `ComingSoon` stub component

**Files:**
- Create: `client/src/components/ComingSoon.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { Clock } from 'lucide-react';

// Placeholder for CRS tabs whose source material is incomplete (see the CRS design spec
// §3) — no fields, nothing stored to formData, doesn't block navigation or submission.
export default function ComingSoon({ title, message }) {
  return (
    <div className="card">
      <div className="section-header">{title}</div>
      <div className="p-10 text-center">
        <Clock size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">{message}</p>
        <p className="text-xs text-gray-400 mt-1">Check back soon, or contact Absolute Veritas if you need to provide this information now.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ComingSoon.jsx
git commit -m "Add shared ComingSoon stub component"
```

---

### Task 6: CRS tab — Document Checklist

**Files:**
- Create: `client/src/pages/portal/crs/DocumentChecklist.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { Field, FileUpload } from '../../../components/FormField';

const DOCUMENTS = [
  { no: 1, doc: 'Brand Registration Certificate(s)', requirement: 'Mandatory' },
  { no: 2, doc: 'Brand Authorization Letter (only when the brand is declared as owned by Others)', requirement: 'Optional' },
  { no: 3, doc: 'Authorization from Factory CEO/MD/Head for Filling and Signing Form-1', requirement: 'Mandatory' },
  { no: 4, doc: 'Authorization Letter from CEO/Top Management of AIR Firm', requirement: 'Mandatory' },
  { no: 5, doc: 'ID Card of Authorized Signatory of AIR', requirement: 'Mandatory' },
  { no: 6, doc: 'Raw Materials/Components', requirement: 'Mandatory' },
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
          <p className="text-xs text-gray-400 mt-3">Other documents may be required.</p>
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

- [ ] **Step 2: Verify build** — `cd client && npm run build`, expect success.
- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/crs/DocumentChecklist.jsx
git commit -m "Add CRS Document Checklist tab"
```

---

### Task 7: CRS tab — Registration & Manufacturing Unit ("account")

**Files:**
- Create: `client/src/pages/portal/crs/AccountDetails.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { Field } from '../../../components/FormField';

export default function AccountDetails({ formData, updateSection, isSubmitted }) {
  const data = formData.account || {};
  const set = (key, val) => updateSection('account', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  const passwordMismatch = data.password && data.confirmPassword && data.password !== data.confirmPassword;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Basic Details</div>
        <div className="p-6 space-y-4">
          <Field label="User Name" required hint="Proposed BIS portal login username"><input {...d('userName')} /></Field>
          <div className="form-row">
            <Field label="Password" required><input type="password" {...d('password')} /></Field>
            <Field label="Confirm Password" required error={passwordMismatch ? 'Passwords do not match' : undefined}>
              <input type="password" {...d('confirmPassword')} />
            </Field>
          </div>
          <Field label="Company URL"><input {...d('companyUrl')} /></Field>
          <Field label="Email" required hint="Email will be sent to this Email Id"><input type="email" {...d('email')} /></Field>
          <div className="form-row">
            <Field label="Name" required><input {...d('name')} /></Field>
            <Field label="Designation"><input {...d('designation')} /></Field>
          </div>
          <Field label="Mobile No." required hint="SMS will be sent to this No."><input {...d('mobile')} /></Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Manufacturer Unit Details</div>
        <div className="p-6">
          <Field label="Manufacturing Unit Name" required><input {...d('unitName')} /></Field>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build** — `cd client && npm run build`, expect success.
- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/crs/AccountDetails.jsx
git commit -m "Add CRS Registration & Manufacturing Unit tab"
```

---

### Task 8: CRS tab — Manufacturing Unit & Correspondence Address

**Files:**
- Create: `client/src/pages/portal/crs/AddressDetails.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';
import { COUNTRIES } from '../tabs/OrganizationProfile';

const ADDR_PROOF_HINT = 'For proof of name and address of manufacturing unit, kindly upload a valid government issued document in which name and address of the manufacturing unit is clearly reflected along with reflection of manufacturing activity for products related to Registration Scheme. Documents like ISO certificates may be submitted in addition, if scope of manufacturing is not clear from the above document. However, an ISO document alone will not be accepted for address proof.';

export default function AddressDetails({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.address || {};
  const set = (key, val) => updateSection('address', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  const copyFromManufacturing = () => {
    updateSection('address', {
      ...data,
      corrEmail: data.mfgEmail || '',
      corrAddress: data.mfgAddress || '',
      corrCountry: data.mfgCountry || '',
      corrState: data.mfgState || '',
      corrZip: data.mfgZip || '',
      corrFax: data.mfgFax || '',
      corrContact: data.mfgContact || '',
      sameAsManufacturing: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Address of the Manufacturing Unit</div>
        <div className="p-6 space-y-4">
          <Field label="Email" required><input type="email" {...d('mfgEmail')} /></Field>
          <Field label="Address" required>
            <textarea className="input" value={data.mfgAddress || ''} onChange={e => set('mfgAddress', e.target.value)} disabled={isSubmitted} rows={3} />
          </Field>
          <div className="form-row">
            <Field label="Country" required>
              <Select value={data.mfgCountry || 'India'} onChange={v => set('mfgCountry', v)} options={COUNTRIES} />
            </Field>
            <Field label="State/Province" required><input {...d('mfgState')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Zip Code" required hint="Zip Code is Mandatory"><input {...d('mfgZip')} /></Field>
            <Field label="Fax No."><input {...d('mfgFax')} /></Field>
          </div>
          <Field label="Contact No." required hint="STD code(s) to be given with contact numbers"><input {...d('mfgContact')} /></Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Address for Correspondence</div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="sameAsMfg" checked={data.sameAsManufacturing || false}
              onChange={e => { set('sameAsManufacturing', e.target.checked); if (e.target.checked) copyFromManufacturing(); }}
              disabled={isSubmitted} />
            <label htmlFor="sameAsMfg" className="text-sm text-gray-700 cursor-pointer">Same as Manufacturing Unit Address</label>
          </div>
          <Field label="Email" required><input type="email" {...d('corrEmail')} /></Field>
          <Field label="Address" required>
            <textarea className="input" value={data.corrAddress || ''} onChange={e => set('corrAddress', e.target.value)} disabled={isSubmitted} rows={3} />
          </Field>
          <div className="form-row">
            <Field label="Country" required>
              <Select value={data.corrCountry} onChange={v => set('corrCountry', v)} options={COUNTRIES} />
            </Field>
            <Field label="State/Province" required><input {...d('corrState')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Zip Code" required><input {...d('corrZip')} /></Field>
            <Field label="Fax No."><input {...d('corrFax')} /></Field>
          </div>
          <Field label="Contact No." required><input {...d('corrContact')} /></Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Correspondence Address Selection</div>
        <div className="p-6">
          <Field label="Correspondence Address" required>
            <Select value={data.correspondenceSelection || 'Office'} onChange={v => set('correspondenceSelection', v)} options={['Office', 'Manufacturing Unit']} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Document Upload</div>
        <div className="p-6">
          <Field label="Address Authentication of Manufacturing Unit" required hint={ADDR_PROOF_HINT}>
            <FileUpload fieldKey="address_auth_doc" fieldLabel="Address Authentication"
              existingDoc={getDocForField('address_auth_doc')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
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
git add client/src/pages/portal/crs/AddressDetails.jsx
git commit -m "Add CRS Manufacturing Unit & Correspondence Address tab"
```

---

### Task 9: CRS tab — Product & Testing stub

**Files:**
- Create: `client/src/pages/portal/crs/ProductTesting.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import ComingSoon from '../../../components/ComingSoon';

export default function ProductTesting() {
  return <ComingSoon title="Product & Testing" message="This section is being finalized based on additional BIS portal reference material." />;
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/portal/crs/ProductTesting.jsx
git commit -m "Add CRS Product & Testing stub tab"
```

---

### Task 10: CRS tab — Model & Brand Mapping stub

**Files:**
- Create: `client/src/pages/portal/crs/ModelBrandMapping.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import ComingSoon from '../../../components/ComingSoon';

export default function ModelBrandMapping() {
  return <ComingSoon title="Model & Brand Mapping" message="This section is being finalized based on additional BIS portal reference material." />;
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/portal/crs/ModelBrandMapping.jsx
git commit -m "Add CRS Model & Brand Mapping stub tab"
```

---

### Task 11: CRS tab — Brand Details

**Files:**
- Create: `client/src/pages/portal/crs/BrandDetails.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { RepeatingTable } from '../../../components/RepeatingTable';

const BRAND_COLUMNS = [
  { key: 'brandName', label: 'Brand Name', type: 'text' },
  { key: 'cert', label: 'Brand Registration Certificate', type: 'file', fieldKeySuffix: 'cert' },
  { key: 'ownedBy', label: 'Owned By', type: 'select', options: ['Self', 'Others'] },
  { key: 'registered', label: 'Is Brand Name/Trade Mark Registered?', type: 'select', options: ['Registered', 'Unregistered', 'Applied For'] },
  { key: 'registrationDate', label: 'Registration Date', type: 'date' },
];

export default function BrandDetails({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.brand || {};
  const set = (key, val) => updateSection('brand', { ...data, [key]: val });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Brand Details</div>
        <div className="p-6">
          <RepeatingTable sectionKey="brand" columns={BRAND_COLUMNS} rows={data.rows}
            onChange={rows => set('rows', rows)} getDocForField={getDocForField}
            onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build** — `cd client && npm run build`, expect success. This is the
      first consumer of `RepeatingTable` on this branch since Task 4's change — a build
      failure here likely means Task 4's edit has a syntax error.
- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/crs/BrandDetails.jsx
git commit -m "Add CRS Brand Details tab"
```

---

### Task 12: CRS tab — Management Details

**Files:**
- Create: `client/src/pages/portal/crs/ManagementDetails.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { RepeatingTable } from '../../../components/RepeatingTable';

const MGMT_COLUMNS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'designation', label: 'Designation', type: 'text' },
];

// Default rows use fixed literal ids ('top-1'/'tech-1'), not crypto.randomUUID() —
// this fallback runs on every render when the section has no saved rows yet, and a
// fresh randomUUID() each render would change the row's React key every render,
// breaking focus/input stability. Once the user edits a cell, onChange persists the
// row into formData with this same fixed id, so it only "generates" once in practice.
export default function ManagementDetails({ formData, updateSection, isSubmitted }) {
  const data = formData.management || {};
  const set = (key, val) => updateSection('management', { ...data, [key]: val });
  const topRows = data.topRows && data.topRows.length > 0 ? data.topRows : [{ id: 'top-1' }];
  const techRows = data.techRows && data.techRows.length > 0 ? data.techRows : [{ id: 'tech-1' }];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Top Management Details</div>
        <div className="p-6">
          <RepeatingTable sectionKey="management" columns={MGMT_COLUMNS} rows={topRows}
            onChange={rows => set('topRows', rows)} protectFirstRow isSubmitted={isSubmitted} />
        </div>
      </div>

      <div className="card">
        <div className="section-header">Technical Management Details</div>
        <div className="p-6">
          <RepeatingTable sectionKey="management" columns={MGMT_COLUMNS} rows={techRows}
            onChange={rows => set('techRows', rows)} protectFirstRow isSubmitted={isSubmitted} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build** — `cd client && npm run build`, expect success.
- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/crs/ManagementDetails.jsx
git commit -m "Add CRS Management Details tab with protected first row"
```

---

### Task 13: CRS tab — Contact Person

**Files:**
- Create: `client/src/pages/portal/crs/ContactPerson.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { Field } from '../../../components/FormField';

export default function ContactPerson({ formData, updateSection, isSubmitted }) {
  const data = formData.contact || {};
  const set = (key, val) => updateSection('contact', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Contact Person</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Name" required><input {...d('name')} /></Field>
            <Field label="Designation" required><input {...d('designation')} /></Field>
          </div>
          <Field label="Mobile Number" required hint="OTP for submission of the application will be sent to this number"><input {...d('mobile')} /></Field>
          <Field label="Email" required hint="OTP for submission of the application will be sent to this E-mail Id"><input type="email" {...d('email')} /></Field>
          <Field label="Fax"><input {...d('fax')} /></Field>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build** — `cd client && npm run build`, expect success.
- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/crs/ContactPerson.jsx
git commit -m "Add CRS Contact Person tab"
```

---

### Task 14: CRS tab — AIR / Authorized Signatory

**Files:**
- Create: `client/src/pages/portal/crs/AirSignatory.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { Field, Select } from '../../../components/FormField';

const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'];

const GOVT_DOCUMENTS = ['PAN Card', 'Aadhaar Card', 'Passport', 'Voter ID', 'Driving License'];

const SCENARIOS = [
  'We have a liaison/branch office in India',
  'We do not have a liaison/branch office in India, but the Proprietor/Registered User of the Brand/Trademark is located in India',
  'We have neither, so we nominate our Authorized Indian Representative',
];

export default function AirSignatory({ formData, updateSection, isSubmitted }) {
  const data = formData.air || {};
  const set = (key, val) => updateSection('air', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  const account = formData.account || {};
  const address = formData.address || {};

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Manufacturer Details</div>
        <div className="p-6 space-y-2 text-sm">
          <div><span className="text-gray-500">Firm Name:</span> <span className="font-medium">{account.unitName || '—'}</span></div>
          <div><span className="text-gray-500">Firm Address:</span> <span className="font-medium">{address.mfgAddress || '—'}</span></div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Representative Scenario</div>
        <div className="p-6">
          <Field label="Representative Scenario" required>
            <Select value={data.scenario} onChange={v => set('scenario', v)} options={SCENARIOS} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Indian Representative Details</div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-400">Enter "NA" if not applicable to your selected scenario.</p>
          <div className="form-row">
            <Field label="Firm Name" required><input {...d('repFirmName')} /></Field>
            <Field label="Firm Address" required><input {...d('repFirmAddress')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Aadhar Number" hint="Format: xxxx xxxx xxxx"><input {...d('aadharNumber')} /></Field>
            <Field label="Govt. Issued Documents">
              <Select value={data.govtDocType} onChange={v => set('govtDocType', v)} options={GOVT_DOCUMENTS} />
            </Field>
          </div>
          <Field label="Enter Number" hint="The ID number for whichever document type was selected above"><input {...d('govtDocNumber')} /></Field>
          <div className="form-row">
            <Field label="Person Name"><input {...d('personName')} /></Field>
            <Field label="Designation"><input {...d('personDesignation')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Mobile Number"><input {...d('personMobile')} /></Field>
            <Field label="Email"><input type="email" {...d('personEmail')} /></Field>
          </div>
          <div className="form-row">
            <Field label="State">
              <Select value={data.state} onChange={v => set('state', v)} options={INDIAN_STATES} />
            </Field>
            <Field label="Zip Code/Pin"><input {...d('zipCode')} /></Field>
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
git add client/src/pages/portal/crs/AirSignatory.jsx
git commit -m "Add CRS AIR / Authorized Signatory tab"
```

---

### Task 15: CRS tab — Upload Documents

**Files:**
- Create: `client/src/pages/portal/crs/UploadDocuments.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';

export default function UploadDocuments({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.uploads || {};
  const set = (key, val) => updateSection('uploads', { ...data, [key]: val });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Upload Documents</div>
        <div className="p-6 space-y-4">
          <Field label="Authorization from factory CEO/MD/Head for filling and signing Form-1" required>
            <FileUpload fieldKey="uploads_ceo_auth" fieldLabel="CEO/MD/Head Authorization"
              existingDoc={getDocForField('uploads_ceo_auth')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
          <Field label="Raw Materials/Components" required>
            <FileUpload fieldKey="uploads_raw_materials" fieldLabel="Raw Materials/Components"
              existingDoc={getDocForField('uploads_raw_materials')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
          <Field label="Authorization letter from CEO/top management of AIR firm towards the authorized signatory" required>
            <FileUpload fieldKey="uploads_air_ceo_auth" fieldLabel="AIR CEO Authorization"
              existingDoc={getDocForField('uploads_air_ceo_auth')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
          <Field label="Does the manufacturing unit have complete testing facility installed in-house for ascertaining conformity as per Indian Standard?" required>
            <Select value={data.inHouseTesting} onChange={v => set('inHouseTesting', v)} options={['Yes', 'No']} />
          </Field>
          <Field label="Does the manufacturing unit have complete manufacturing facility for the product and its models/series/type/grade/class/size/rating for which registration is applied?" required>
            <Select value={data.completeManufacturing} onChange={v => set('completeManufacturing', v)} options={['Yes', 'No']} />
          </Field>
          <Field label="ID card of authorized signatory of AIR" required>
            <FileUpload fieldKey="uploads_air_id_card" fieldLabel="AIR Signatory ID Card"
              existingDoc={getDocForField('uploads_air_id_card')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
          <Field label="Other document, if required">
            <FileUpload fieldKey="uploads_other" fieldLabel="Other Document"
              existingDoc={getDocForField('uploads_other')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
          <Field label="Factory Address Proof / Business license" required>
            <FileUpload fieldKey="uploads_factory_proof" fieldLabel="Factory Address Proof / Business License"
              existingDoc={getDocForField('uploads_factory_proof')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
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
git add client/src/pages/portal/crs/UploadDocuments.jsx
git commit -m "Add CRS Upload Documents tab"
```

---

### Task 16: Frontend — `crsTabs.js` config

**Files:**
- Create: `client/src/pages/portal/crsTabs.js`

- [ ] **Step 1: Write the config**

```javascript
import DocumentChecklist from './crs/DocumentChecklist';
import AccountDetails from './crs/AccountDetails';
import AddressDetails from './crs/AddressDetails';
import ProductTesting from './crs/ProductTesting';
import ModelBrandMapping from './crs/ModelBrandMapping';
import BrandDetails from './crs/BrandDetails';
import ManagementDetails from './crs/ManagementDetails';
import ContactPerson from './crs/ContactPerson';
import AirSignatory from './crs/AirSignatory';
import UploadDocuments from './crs/UploadDocuments';
import DeclarationUndertaking from './tabs/DeclarationUndertaking';

export const CRS_TABS = [
  { key: 'checklist', label: 'Document Checklist', path: '' },
  { key: 'account', label: 'Registration & Manufacturing Unit', path: 'account' },
  { key: 'address', label: 'Manufacturing Unit & Correspondence Address', path: 'address' },
  { key: 'product', label: 'Product & Testing', path: 'product-testing' },
  { key: 'modelBrand', label: 'Model & Brand Mapping', path: 'model-brands' },
  { key: 'brand', label: 'Brand Details', path: 'brand-details' },
  { key: 'management', label: 'Management Details', path: 'management' },
  { key: 'contact', label: 'Contact Person', path: 'contact-person' },
  { key: 'air', label: 'AIR / Authorized Signatory', path: 'air-signatory' },
  { key: 'uploads', label: 'Upload Documents', path: 'upload-documents' },
  { key: 'declaration', label: 'Declaration & Undertaking', path: 'declaration' },
];

export const CRS_TAB_COMPONENTS = {
  checklist: DocumentChecklist,
  account: AccountDetails,
  address: AddressDetails,
  product: ProductTesting,
  modelBrand: ModelBrandMapping,
  brand: BrandDetails,
  management: ManagementDetails,
  contact: ContactPerson,
  air: AirSignatory,
  uploads: UploadDocuments,
  declaration: DeclarationUndertaking,
};
```

- [ ] **Step 2: Verify build**

Run: `cd client && npm run build`
Expected: succeeds. This is the first point all 9 new CRS tab files plus the 2 stubs and
the reused Declaration tab get imported together — a build failure here means one of
Tasks 6-15 has a bad import path or syntax error; fix it before continuing.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/portal/crsTabs.js
git commit -m "Add CRS tab config wiring together all 11 CRS tabs"
```

---

### Task 17: Frontend — `FormTypeSelect.jsx` third card

**Files:**
- Modify: `client/src/pages/portal/FormTypeSelect.jsx`

- [ ] **Step 1: Add the `ClipboardCheck` icon import**

Change:
```jsx
import { LogOut, FileCheck2, ShieldCheck } from 'lucide-react';
```
to:
```jsx
import { LogOut, FileCheck2, ShieldCheck, ClipboardCheck } from 'lucide-react';
```

- [ ] **Step 2: Widen the grid to 3 columns and add the CRS card**

Change:
```jsx
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
```
to:
```jsx
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
          <button onClick={() => navigate('/portal/crs')} className="card p-8 text-left hover:border-primary/50 hover:shadow-md transition-all">
            <ClipboardCheck size={28} className="text-primary mb-4" />
            <div className="text-base font-semibold text-gray-900 mb-1">CRS</div>
            <p className="text-xs text-gray-500">Compulsory Registration Scheme application.</p>
          </button>
        </div>
```

- [ ] **Step 3: Also widen the page's max width** so 3 cards have room:

Change:
```jsx
      <div className="max-w-3xl mx-auto px-6 py-16">
```
to:
```jsx
      <div className="max-w-4xl mx-auto px-6 py-16">
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/portal/FormTypeSelect.jsx
git commit -m "Add CRS card to the form-type chooser"
```

---

### Task 18: Frontend — wire `/portal/crs` routes into `App.jsx`

**Files:**
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Import the CRS tab config**

Change:
```jsx
import { ISI_TABS, ISI_TAB_COMPONENTS } from './pages/portal/isiTabs';
```
to:
```jsx
import { ISI_TABS, ISI_TAB_COMPONENTS } from './pages/portal/isiTabs';
import { CRS_TABS, CRS_TAB_COMPONENTS } from './pages/portal/crsTabs';
```

- [ ] **Step 2: Add the two routes**

Change:
```jsx
      <Route path="/portal/isi" element={<ProtectedRoute role="CLIENT"><MyForms formType="ISI" basePath="/portal/isi" title="ISI (BIS Standard Mark) Forms" /></ProtectedRoute>} />
      <Route path="/portal/isi/:submissionId/*" element={<ProtectedRoute role="CLIENT"><PortalLayout basePath="/portal/isi" TABS={ISI_TABS} tabComponents={ISI_TAB_COMPONENTS} /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/login" />} />
```
to:
```jsx
      <Route path="/portal/isi" element={<ProtectedRoute role="CLIENT"><MyForms formType="ISI" basePath="/portal/isi" title="ISI (BIS Standard Mark) Forms" /></ProtectedRoute>} />
      <Route path="/portal/isi/:submissionId/*" element={<ProtectedRoute role="CLIENT"><PortalLayout basePath="/portal/isi" TABS={ISI_TABS} tabComponents={ISI_TAB_COMPONENTS} /></ProtectedRoute>} />
      <Route path="/portal/crs" element={<ProtectedRoute role="CLIENT"><MyForms formType="CRS" basePath="/portal/crs" title="CRS Forms" /></ProtectedRoute>} />
      <Route path="/portal/crs/:submissionId/*" element={<ProtectedRoute role="CLIENT"><PortalLayout basePath="/portal/crs" TABS={CRS_TABS} tabComponents={CRS_TAB_COMPONENTS} /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/login" />} />
```

- [ ] **Step 3: Verify build**

Run: `cd client && npm run build` — expected: succeeds.

- [ ] **Step 4: FMCS/ISI regression + CRS smoke check in the browser**

With both dev servers running, log in as an existing test client:
1. `/portal` now shows **three** cards (FMCS/ISI/CRS) — confirm the existing FMCS and ISI
   flows still work exactly as before (open an existing form of each type, confirm all
   tabs load and autosave).
2. Click "CRS" → `/portal/crs` → "Start New Form" → lands on `/portal/crs/<id>/` (Document
   Checklist tab). Step through all 11 tabs via "Next →" — confirm each renders without a
   console error, the step indicator shows 11 tabs with the right labels, and Tabs 4/5
   show the "Coming soon" message.
3. On Management Details, confirm row 1 has no Delete button on both Top and Technical
   Management tables, and clicking "Add Row" adds a row with a working Delete button.
4. On Address Details, fill the Manufacturing Unit address, check "Same as Manufacturing
   Unit Address," confirm the Correspondence fields populate immediately.

- [ ] **Step 5: Commit**

```bash
git add client/src/App.jsx
git commit -m "Wire /portal/crs routes into App"
```

---

### Task 19: Admin — `SubmissionView.jsx` CRS sections

**Files:**
- Modify: `client/src/pages/admin/SubmissionView.jsx`

- [ ] **Step 1: Add the `CRS` entry to `SECTIONS_BY_TYPE`**

Change:
```javascript
  ISI: [
    { key: 'checklist', label: 'Document Checklist' },
    { key: 'firmOffice', label: 'Firm, Office & Registration' },
    { key: 'factory', label: 'Factory Details' },
    { key: 'standard', label: 'Indian Standard & Product Variety' },
    { key: 'management', label: 'Management Details' },
    { key: 'manufacturing', label: 'Manufacturing Process' },
    { key: 'packaging', label: 'Packaging & Brand Details' },
    { key: 'testing', label: 'Testing & Inspection' },
    { key: 'testReport', label: 'Test Report Details' },
    { key: 'declaration', label: 'Declaration & Undertaking' },
  ],
};
```
to:
```javascript
  ISI: [
    { key: 'checklist', label: 'Document Checklist' },
    { key: 'firmOffice', label: 'Firm, Office & Registration' },
    { key: 'factory', label: 'Factory Details' },
    { key: 'standard', label: 'Indian Standard & Product Variety' },
    { key: 'management', label: 'Management Details' },
    { key: 'manufacturing', label: 'Manufacturing Process' },
    { key: 'packaging', label: 'Packaging & Brand Details' },
    { key: 'testing', label: 'Testing & Inspection' },
    { key: 'testReport', label: 'Test Report Details' },
    { key: 'declaration', label: 'Declaration & Undertaking' },
  ],
  CRS: [
    { key: 'checklist', label: 'Document Checklist' },
    { key: 'account', label: 'Registration & Manufacturing Unit' },
    { key: 'address', label: 'Manufacturing Unit & Correspondence Address' },
    { key: 'product', label: 'Product & Testing' },
    { key: 'modelBrand', label: 'Model & Brand Mapping' },
    { key: 'brand', label: 'Brand Details' },
    { key: 'management', label: 'Management Details' },
    { key: 'contact', label: 'Contact Person' },
    { key: 'air', label: 'AIR / Authorized Signatory' },
    { key: 'uploads', label: 'Upload Documents' },
    { key: 'declaration', label: 'Declaration & Undertaking' },
  ],
};
```

- [ ] **Step 2: Verify in the browser**

Log in as admin, open the CRS test submission from Task 18 — confirm 11 sections show
(including "Product & Testing" and "Model & Brand Mapping" correctly showing "No data
filled for this section" since those are stub tabs), the Brand Details `rows` array
renders as a table via the existing generic `isObjectArray` renderer, and uploaded
documents (e.g. from the Upload Documents tab) appear under the correct section.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/admin/SubmissionView.jsx
git commit -m "Render CRS submissions with their own section list in the admin viewer"
```

---

### Task 20: Admin — `Dashboard.jsx` third badge color

**Files:**
- Modify: `client/src/pages/admin/Dashboard.jsx`

- [ ] **Step 1: Add a CRS color branch to the badge**

Change:
```jsx
                    {row.formType && (
                      <span className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded ${row.formType === 'ISI' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {row.formType}
                      </span>
                    )}
```
to:
```jsx
                    {row.formType && (
                      <span className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        row.formType === 'ISI' ? 'bg-purple-100 text-purple-700' :
                        row.formType === 'CRS' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {row.formType}
                      </span>
                    )}
```

- [ ] **Step 2: Verify in the browser**

Confirm the CRS test submission's row shows an amber "CRS" badge, distinct from FMCS
(blue) and ISI (purple).

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/admin/Dashboard.jsx
git commit -m "Add third badge color for CRS on the admin dashboard"
```

---

### Task 21: Final QA and merge readiness

**Files:** none (verification only)

- [ ] **Step 1: FMCS/ISI regression pass.** Confirm both existing form types still work
      end-to-end exactly as before this branch existed (open a form, edit a field on
      every tab, confirm autosave, submit, confirm admin view and Excel/ZIP downloads).
- [ ] **Step 2: Repeating-row data-integrity check (top risk, same as ISI).** On Brand
      Details, add 3 rows, upload a distinct file to each row's certificate column, note
      which file is in which row. Delete row 2. Refresh. Confirm exactly 2 rows remain
      and no file got silently reassigned to the wrong row.
- [ ] **Step 3: `protectFirstRow` check.** On Management Details (both tables), confirm
      row 1's Delete button is absent no matter how many rows exist, and every other row
      can be freely added/deleted.
- [ ] **Step 4: Full CRS end-to-end submission.** Fill every field across all 11 tabs on
      a throwaway test account (skipping Tabs 4/5's stub content, which collects
      nothing), submit, and confirm:
  - Admin dashboard shows the submission `SUBMITTED` with the amber `CRS` badge.
  - Admin submission view renders all 11 sections correctly.
  - Docs-ZIP download includes every uploaded document (checklist misc, address proof,
    brand certificates, all 6 Upload Documents tab files).
  - Excel download produces a 4-sheet `.xlsx` matching the submitted data.
- [ ] **Step 5: Clean up test data.** Delete any throwaway test accounts via the admin
      dashboard.
- [ ] **Step 6: Merge order.** This branch depends on `feature/isi-application-form`.
      Merge ISI to `main` first (per its own plan's Task 24), then rebase or merge this
      branch onto the updated `main`:
  ```bash
  git checkout feature/crs-application-form
  git merge main
  # resolve any conflicts, re-run npm run build to confirm
  git checkout main
  git merge feature/crs-application-form
  git push
  ```
  Push triggers Render's backend redeploy and Vercel's frontend redeploy automatically —
  confirm both come up green.
