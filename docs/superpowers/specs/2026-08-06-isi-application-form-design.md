# Design: Add ISI (BIS Standard Mark) Application Form

Date: 2026-08-06
Status: Approved — ready for implementation plan

## 1. Problem / Goal

The portal currently supports exactly one application type (FMCS), hardcoded end to end:
one `formData` shape, one 9-tab wizard (`PortalLayout.jsx` + `client/src/pages/portal/tabs/*.jsx`),
one Excel export function. Absolute Veritas also needs to collect **ISI (BIS Standard Mark)**
applications through the same portal, with the same UX (multi-tab wizard, autosave, document
upload, admin review/export) but a different, larger field set (10 tabs, including several
repeating-row sections that FMCS doesn't have at all).

Goal: add ISI as a second, fully independent form type without breaking or duplicating the
existing FMCS flow, which real clients use today.

## 2. Scope of this implementation pass

**In scope:**
- Schema: `FormType` enum (`FMCS` | `ISI`) on `Submission`, defaulting existing/new FMCS rows correctly.
- Backend: `formType` on create/list/read, clone-type guard, no other route changes needed
  (document routes are already generic).
- Frontend routing: `/portal` becomes a form-type chooser; `/portal/fmcs/*` and `/portal/isi/*`
  are separate scoped flows.
- Generalizing `MyForms.jsx` and `PortalLayout.jsx` to be form-type-agnostic (props-driven)
  rather than duplicating them for ISI.
- New shared `RepeatingTable` primitive for ISI's array-of-rows sections.
- All 10 ISI tab components, per the field-by-field spec in §7 below.
- Admin dashboard (form-type badge) and `SubmissionView.jsx` (conditional `SECTIONS`) updates.
- Manual QA per the rollout checklist (§10), run on a feature branch before merge.

**Explicitly out of scope for this pass:**
- `generateExcelISI` (the Excel export function for ISI submissions). The existing FMCS export
  was built to match an exact cell-by-cell layout from a reference workbook provided directly
  in an earlier session. The equivalent ISI reference workbook
  (`ISI_Application_form-Duly_Filled-Jaspreet-13032026.xlsx`) is not present anywhere in this
  environment (repo or user's Desktop files folder) — it needs to be shared before that function
  can be written to the same fidelity. Until then, `GET /api/admin/submissions/:id/excel` returns
  a clear "Excel export not yet available for ISI" response (not a crash, not a silently-wrong
  file) when `submission.formType === 'ISI'`. The documents ZIP export and the admin on-screen
  viewer are already generic and need no stopgap — they work for ISI as soon as §8 lands.

## 3. Rollout strategy

Built on a feature branch (`feature/isi-application-form`), not directly on `main`. Full manual
QA (§10) — including an explicit FMCS-regression pass and the repeating-row
delete-doesn't-corrupt-neighbor test — runs before merge and deploy. This is a schema change
plus a refactor of the shared wizard shell that live FMCS clients use today, so nothing lands on
`main`/production until it's verified end to end on a dev database.

## 4. Data model changes

`server/prisma/schema.prisma`:

```prisma
enum FormType {
  FMCS
  ISI
}

model Submission {
  id        String     @id @default(cuid())
  userId    String
  label     String     @default("Form 1")
  formType  FormType   @default(FMCS)   // NEW — existing rows default to FMCS, backward-compatible
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  status    Status     @default(NOT_STARTED)
  formData  Json       @default("{}")
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  documents Document[]
}
```

Applied via `npx prisma db push` (this repo has no migration files — `db push` only, per
`CLAUDE.md`).

## 5. Backend changes

`server/src/routes/submissions.js`:
- `POST /` accepts `formType` in the body, validated against the enum, defaults to `'FMCS'`
  when omitted (keeps any existing client unaffected).
- Clone guard: when `cloneFromId` is provided, after loading the source via `ownSubmission`,
  reject with 400 if `source.formType !== formType` — cross-type cloning would copy an
  incompatible `formData` shape.
- `GET /` includes `formType` in its `select`.

`server/src/routes/admin.js`:
- `GET /submissions` and `GET /submissions/:id` include `formType`.
- `GET /submissions/:id/excel` branches on `formType`; for `'ISI'` it returns the stopgap
  response described in §2 until `generateExcelISI` exists.

No changes needed to document upload/delete routes — already generic, keyed by `fieldKey` only.

## 6. Frontend routing

Replace the single `/portal` flow in `client/src/App.jsx`:

```
/portal                          → FormTypeSelect.jsx (new) — two cards: FMCS / ISI
/portal/fmcs                     → MyForms (formType=FMCS) — existing FMCS tabs, unchanged
/portal/fmcs/:submissionId/*     → PortalLayout (generalized) + existing FMCS tab set
/portal/isi                      → MyForms (formType=ISI)
/portal/isi/:submissionId/*      → PortalLayout (generalized) + new ISI tab set
```

`MyForms.jsx` takes `formType`, `basePath`, `title` props instead of being FMCS-only; filtering
by type happens server-side (`GET /api/submissions?formType=ISI`) to keep payload size bounded
as forms grow, rather than filtering client-side.

`PortalLayout.jsx` becomes a reusable wizard shell taking a `TABS` config array, a
`tabComponents` map (`{ [tab.key]: Component }`), and a `basePath` prop, instead of importing
the 9 FMCS tab components directly. All existing autosave/submit/navbar logic is already
form-agnostic (reads/writes `formData`, calls `updateSection`) and needs no change beyond
receiving these as props.

`FormTypeSelect.jsx` (new): two cards styled consistently with the rest of the portal
(`bg-primary` navbar, `.card`, `btn-primary`), each with icon/title/one-line description,
navigating to `/portal/fmcs` or `/portal/isi`. No API calls on this screen.

`FormField.jsx` (`Field`, `Select`, `FileUpload`, `SubmissionIdContext`) is reused as-is for
ISI — no changes except the new `RepeatingTable` primitive below.

## 7. Shared primitive: `RepeatingTable`

FMCS has zero array/table sections; ISI has several (product varieties, raw materials,
packaging rows, brand/trademark rows, subcontracted tests, per-variety test reports, raw
material conformity). New component in `components/FormField.jsx` (or a new
`components/RepeatingTable.jsx` importing from it):

```jsx
// Each row MUST carry a stable `id` (crypto.randomUUID()) assigned once, at creation —
// never derive a row's file fieldKey from its array index, or removing/reordering rows
// will silently reassign an uploaded document to the wrong row.
export function RepeatingTable({ sectionKey, columns, rows, onChange, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  // columns: [{ key, label, type: 'text' | 'select' | 'date' | 'number' | 'file', options?, fieldKeySuffix? }]
  // rows: array of { id, [columns[i].key]: value }
  // for type:'file' columns, the FileUpload fieldKey is `${sectionKey}_${col.fieldKeySuffix}_${row.id}`
  // renders an add-row button (pushes { id: crypto.randomUUID() }) and a per-row remove button
  // supports more than one file column per row (e.g. Technical Management needs qualification-doc + photo)
}
```

Each dynamic section stores its rows at `formData.<sectionKey>.rows` (or a more specific key
where a tab has multiple row-groups, e.g. `formData.management.topRows` and
`formData.management.techRows` — see §8).

**`fieldKey` convention — load-bearing, do not deviate:** every `FileUpload`'s `fieldKey` must
start with its tab's `sectionKey` (e.g. `factory_addr_proof`, not `isi_factory_addr_proof`).
`SubmissionView.jsx` buckets a submission's documents per tab using
`doc.fieldKey.startsWith(activeTab)` — breaking this prefix hides uploaded documents from the
admin view for that tab.

## 8. ISI tab-by-tab field spec

All 10 tabs follow the same coding pattern as the existing FMCS tabs: `const data =
formData.<section> || {}`, `set(key, val) => updateSection('<section>', { ...data, [key]: val })`,
built from `Field`/`Select`/`FileUpload`/`RepeatingTable`, `disabled={isSubmitted}` on every
input. Route paths are kebab-case.

### Tab 1 — `checklist` (path `''`, index route)
Same pattern as `DocumentChecklist.jsx` (status dropdown per row: Provided / Pending / Not
Applicable, plus one misc upload `fieldKey="checklist_misc"`). 30-item list:
1. Address Proof (Registered Office) — Mandatory
2. GST Certificate — Mandatory
3. Proof of Establishment of Firm (Business Licence) — Mandatory
4. Business Licence (Company Incorporation Certificate) — Mandatory
5. Address Proof (Factory / Manufacturing Unit) — Mandatory
6. Supporting Docs of Product Variety — Optional
7. Qualification Document & Photograph of Technical Manager — Mandatory
8. Process Flowchart covering all Manufacturing Processes — Mandatory
9. Layout Plan of Factory — Mandatory
10. Manufacturing Machinery List — Mandatory
11. Trademark Registration Details (Certification & Declaration) — Mandatory
12. List of Testing Equipment — Mandatory
13. In-House Test Report for the Product — Mandatory
14. Agreement with Manufacturing Unit for Outsourcing — Mandatory
15. Controls Exercised on Outsourced Process & Product on Receipt (IQC docs) — Mandatory
16. Test Report / Test Certificate — Mandatory
17. Statutory Permissions required for the Product Category — Optional
18. Authorization Letter of Person Submitting the Application — Mandatory
19. Form of Label(s) (Nature of Packaging) — Mandatory
20. Payment Receipt — Mandatory
21. Scope of Licence — Mandatory
22. List of Models to be covered in BIS Certification — Mandatory
23. Quality Assurance System (Quality Manual) — Mandatory
24. Drawing of Product — Mandatory
25. Calibration Certificates (for testing equipment) — Mandatory
26. Location Plan of Factory (Google Coordinates) — Mandatory
27. Undertaking (Acceptance of Marking Fee & STI) — Mandatory
28. Declaration — Mandatory
29. Undertaking for Arrangement of Water / Electricity — Mandatory
30. Weekly Off Declaration (Working Days) — Mandatory

### Tab 2 — `firmOffice` ("Firm, Office & Registration Details", path `firm-office`)
- User/Contact: Registered Email*, Registered Mobile No.*
- Firm/Office Details: Firm Name*, CEO/MD Name*, Office Address Line 1*, Line 2, Country*
  (reuse `COUNTRIES` from `OrganizationProfile.jsx`), State*, District*, City*, PIN Code,
  Office Email*, Office Mobile, Landline STD Code, Landline Number, Alternate Mobile.
  - Address Proof Document Type* — `Select`: `['GST Registration Certificate', 'Business Licence', 'Any Other']`
  - Address Proof Document — `FileUpload fieldKey="firmOffice_office_addr_proof"`
- Registration Details: Nature of Firm* — `Select`: `['Proprietorship', 'Partnership', 'Pvt Ltd', 'Public Ltd', 'LLP', 'Others']`;
  Scale* — `Select`: `['Micro', 'Small', 'Medium', 'Large']`; Sector* — `Select`: `['Private', 'Public']`;
  Women Entrepreneur* — `Select`: `['Yes', 'No']`; Startup* — `Select`: `['Yes', 'No']`;
  Registration Number, PAN Number, Date of Registration (date).
  - GST Number* + `FileUpload fieldKey="firmOffice_gst_cert"` (label "GST Certificate")
  - Proof of Establishment Type* — `Select`: `['Certificate of Incorporation', 'Business Licence', 'Partnership Deed', 'Proprietorship Declaration', 'GST Registration Certificate', 'Udyam Registration Certificate', 'Trade Licence', 'Others']`
    + `FileUpload fieldKey="firmOffice_estab_proof"`
  - Business Licence Number

### Tab 3 — `factory` ("Factory Details", path `factory`)
- "Is Factory Address same as Office Address?" — `Select`: `['Yes', 'No']`. If Yes, a
  "Copy from Office" button one-time copies address fields from `formData.firmOffice` into
  `formData.factory` (one-time copy, not two-way bound — editable after copying).
- Factory Address Line 1*, Line 2, Country*, State*, District*, City*, PIN Code, Factory
  Email*, Factory Mobile, Landline STD Code, Landline Number, Alternate Mobile, Latitude,
  Longitude, SEZ — `Select`: `['Yes', 'No']`.
  - Factory Address Proof Type* — `Select`: `['GST Registration Certificate', 'Business Licence', 'Any Other']`
    + `FileUpload fieldKey="factory_addr_proof"`

### Tab 4 — `standard` ("Indian Standard & Product Variety", path `standard-variety`)
- "Do you know the Indian Standard applicable to your product?" — `Select`: `['Yes', 'No']`.
  If Yes: Indian Standard (text, e.g. `IS 10617:2018`). If No: hint text, "Absolute Veritas
  will help identify the applicable standard."
- "Do you accept the Scheme of Inspection & Testing (SIT) specified by BIS w.r.t. frequency
  of testing and inspection?" — `Select`: `['Yes', 'No']`.
- Product Variety — `RepeatingTable` (`sectionKey="standard"`, rows at `formData.standard.rows`):
  columns Variety Applied For (text), Supporting Document (file, `fieldKeySuffix="variety"`).

### Tab 5 — `management` ("Management Details", path `management`)
- Top Management — `RepeatingTable` (rows at `formData.management.topRows`): Name,
  Designation, Contact No., Email, DIN (optional) — all text, no upload.
- Correspondence Details (flat fields): Name of Contact Person, Designation of Contact
  Person, Contact No., Email.
- Technical Management — `RepeatingTable` (rows at `formData.management.techRows`): Name,
  Designation, Qualification (text), Qualification Document (file,
  `fieldKeySuffix="tech_qual"`), Experience in Years (number), Photo (file,
  `fieldKeySuffix="tech_photo"`) — two file columns per row.

### Tab 6 — `manufacturing` ("Manufacturing Process", path `manufacturing`)
- Raw Material Details — `RepeatingTable` (rows at `formData.manufacturing.rawRows`): Raw
  Material (with grade, text), Name of Supplier (text), Conformity of Material — `select`:
  `['BIS Certified', 'Test Certificate', 'Any Other']`, How Received (text), Records
  Maintained — `select`: `['Yes', 'No']`. No upload column.
- "Do you outsource any part of the manufacturing process?" — `Select`: `['Yes', 'No']`. If
  Yes: Agreement with Manufacturing Unit for Outsourcing
  (`fieldKey="manufacturing_outsource_agreement"`), Controls Exercised on Outsourced Process
  & Product on Receipt / IQC docs (`fieldKey="manufacturing_outsource_iqc"`).
- "Maintenance of Hygienic Conditions?" — `Select`: `['Yes', 'No']`. If Yes: upload
  (`fieldKey="manufacturing_hygiene_docs"`).
- Process Flow-Chart — `FileUpload fieldKey="manufacturing_process_flowchart"`.
- Layout Plan of Factory — `FileUpload fieldKey="manufacturing_factory_layout"`.
- Manufacturing Machinery List — `FileUpload fieldKey="manufacturing_machinery_list"`.
- Production Details: Unit of Production (text), Production Value — Actual Approx. Value
  per Annum in ₹ (number), Present Installed Capacity (text).

### Tab 7 — `packagingBrand` ("Packaging & Brand Details", path `packaging-brand`)
- Packaging & Marking Details — `RepeatingTable` (rows at
  `formData.packagingBrand.packagingRows`): Nature of Packaging (text), Marking on Article
  (text), Method of Marking (text), Quantity per Package (number), Form of Label(s) (file,
  `fieldKeySuffix="label"`), Batch/Code/Serial Numbering (text).
- Brand Details — `RepeatingTable` (rows at `formData.packagingBrand.brandRows`): Brand
  Name/Trademark (text), Owned By — `select`: `['Self', 'Others']`, Registered/Unregistered
  — `select`: `['Registered', 'Unregistered']`, Date of Registration/Introduction (date),
  Trademark Certificate (file, `fieldKeySuffix="brand"`).

### Tab 8 — `testing` ("Testing & Inspection", path `testing`)
- "Do you have in-house facility for complete testing of the product as per the Indian
  Standard?" — `Select`: `['Yes', 'No']`.
- If No: Subcontracted Testing — `RepeatingTable` (rows at
  `formData.testing.subcontractRows`): Clause No. of IS (text), Test to be Sub-Contracted
  (text), Consent Letter (file, `fieldKeySuffix="subcontract"`), Name of Lab — must be a BIS
  Recognised or Empanelled Lab (text).
- List of Testing Equipment — `FileUpload fieldKey="testing_equipment_list"`.

### Tab 9 — `testReport` ("Test Report Details", path `test-report`)
- Product Test Reports — `RepeatingTable` (rows at `formData.testReport.varietyRows`):
  Product Variety Description (text), IS No. (text), Sample Code (text), Test Report Issue
  Date (date), Reason for Delay if older than 90/180 days (text), Test Report (file,
  `fieldKeySuffix="variety"`), Test Report Complete? — `select`: `['Yes', 'No']`, Conformity
  of Sample as per IS? — `select`: `['Yes', 'No']`.
- Long Duration Tests: "Is a long duration test applicable for the product?" — `Select`:
  `['Yes', 'No']`. If Yes:
  - "Has the firm NOT uploaded the Long Duration Test Report and is opting for relaxation
    per the Guidelines for Grant of Licence?" — `Select`: `['Yes', 'No']`. If Yes, Undertaking
    upload (`fieldKey="testReport_ldt_undertaking"`).
  - Clause No. of IS (text), Long Duration Test Specified (text), Name of Lab where Test is
    in Progress (text), Date Test Report Likely to be Available (date), In-House Test Report
    (file, `fieldKey="testReport_ldt_inhouse"`), Test Report on Receipt from Lab (file,
    `fieldKey="testReport_ldt_lab_report"`).
- Raw Material Conformity: "Does the applicable Indian Standard require raw material
  conformity?" — `Select`: `['Yes', 'No']`. If Yes: `RepeatingTable` (rows at
  `formData.testReport.rawMatRows`): Raw Material Description (text), Test
  Report/Certificate (file, `fieldKeySuffix="rawmat"`), Complete? — `select`: `['Yes', 'No']`,
  Conformity of Sample as per Indian Standard? — `select`: `['Yes', 'No']`.

### Tab 10 — `declaration` ("Declaration & Undertaking", path `declaration`)
Functionally identical to FMCS's `DeclarationUndertaking.jsx` — same structure, same field
names (`statutoryPermissions`, `otherInfo`, `otherRequest`, `submitterName`,
`submitterDesignation`, `weeklyOff`, `weeklyOffDays`, `signatoryName`, `signDate`,
`confirmed`), same `onSubmit`/`submitting` wiring and final "Submit Form to Absolute
Veritas" button. No field differences from the FMCS version.

## 9. Admin-side changes

`client/src/pages/admin/Dashboard.jsx`: small badge next to each row's label showing form
type (`FMCS`/`ISI`), since `label` alone won't disambiguate anymore.

`client/src/pages/admin/SubmissionView.jsx`: `SECTIONS` becomes conditional on
`submission.formType` — existing array stays for `FMCS`; new array for `ISI` uses the 10
section keys from §8 (`checklist, firmOffice, factory, standard, management, manufacturing,
packagingBrand, testing, testReport, declaration`). No other change needed — the generic
renderer already handles both flat key/value sections and arrays-of-objects (the new `rows`
arrays) via its existing `isObjectArray` branch, and the document list already buckets
correctly given the `fieldKey` prefix convention in §7.

## 10. Rollout / manual QA checklist

(No automated test suite exists in this repo — verification is manual, per existing project
convention documented in `CLAUDE.md`.)

1. Schema push — verify existing FMCS submissions still load with `formType` defaulting to
   `'FMCS'`.
2. Backend: `formType` accepted on create, returned on read, clone-type guard in place.
3. Frontend routing: `/portal` → chooser → `/portal/fmcs/*` (regression-test the untouched
   FMCS flow end-to-end) and `/portal/isi/*` (new flow).
4. All 10 ISI tab components built and wired into the generalized wizard shell.
5. `RepeatingTable`: verify add/remove row, and that removing row 2 of 3 doesn't corrupt row
   3's uploaded file — this is the top risk, test it explicitly.
6. Admin dashboard shows form type; `SubmissionView.jsx` renders both types correctly,
   including the new `rows` tables.
7. Docs-ZIP download works for an ISI submission with uploaded documents in at least one
   repeating-row field. Excel export for ISI returns the "not yet available" stopgap
   response cleanly (not a 500) until `generateExcelISI` exists.
8. Manually fill one full ISI submission end-to-end (using real-ish data), submit it, and
   confirm the admin view renders everything correctly.
