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

## 8. ISI tab-by-tab field spec — REVISED against the real reference workbook

**This section was rewritten after the user shared screenshots of the actual
`ISI_Application_form-Duly_Filled` workbook.** The original version of this spec (based on a
build-prompt written before anyone had opened the real file) assumed a 3-way split
(Firm/Office, Factory, Standard/Variety as three separate wizard tabs) that does not match
reality — the real workbook has these three as ONE combined "Application form" sheet. It was
also missing two real fields (`User ID`, `Application ID`) and had address fields split into
Line 1/Line 2 that don't exist in the source (`Office Address` and `Factory Address` are each
a single field). This revision corrects both, and — per the user's explicit direction — folds
in a second simplification: everything **after** the Application Form sheet (Document
Checklist, Management, Manufacturing, Packaging & Brand, Testing, Test Report, Declaration)
is **not** rebuilt for ISI at all; the ISI wizard reuses the existing FMCS tab components for
those sections verbatim, unmodified. Net effect: ISI now has **8 client-facing wizard tabs**
instead of 10, and only **one new tab component** needs to be written.

| # | Tab key (routing) | Label | Component |
|---|---|---|---|
| 1 | `checklist` | Document Checklist | **Reused** — `tabs/DocumentChecklist.jsx` (FMCS's, unmodified) |
| 2 | `applicationForm` | Application Form | **New** — `isi/ApplicationForm.jsx` |
| 3 | `management` | Management Details | **Reused** — `tabs/ManagementDetails.jsx` |
| 4 | `manufacturing` | Manufacturing Process | **Reused** — `tabs/ManufacturingProcess.jsx` |
| 5 | `packaging` | Packaging & Brand Details | **Reused** — `tabs/PackagingBrandDetails.jsx` |
| 6 | `testing` | Testing & Inspection | **Reused** — `tabs/TestingInspection.jsx` |
| 7 | `testReport` | Test Report Details | **Reused** — `tabs/TestReportDetails.jsx` |
| 8 | `declaration` | Declaration & Undertaking | **Reused** — `tabs/DeclarationUndertaking.jsx` |

Reused components are imported directly into `isiTabs.js` from the existing `pages/portal/tabs/`
folder — no new files, no content changes. Their internal `formData` section keys
(`checklist`, `management`, `manufacturing`, `packaging`, `testing`, `testReport`,
`declaration`) are whatever they already are in the FMCS code; the ISI tab-routing `key` for
each must match so `TABS`/`tabComponents` stay aligned (see §6/§8 wiring below).

### `applicationForm` — the one new tab (path `application-form`)

Combines three underlying `formData` namespaces — `firmOffice`, `factory`, `standard` — onto
a single scrolling page, matching the real workbook's single "Application form" sheet. Each
namespace keeps its own `set(key, val)` helper internally (three independent
`updateSection('firmOffice'|'factory'|'standard', ...)` calls), so the admin viewer can still
review them as three separate sections (see §9) even though the client sees one page.

**Section: Firm / Office Details** (→ `formData.firmOffice`)
- Firm Name*, Office Address* (single field, not split into lines)
- Country* (reuse `COUNTRIES` from `OrganizationProfile.jsx`), State*, District*, City*, PIN Code
- CEO Name*, Registered Email*, Office Email*, Registered Mobile No.* (max 10), Alternate Mobile No., Landline No.
- Address Proof Document Type* — `Select`: `['GST Registration Certificate', 'Business Licence', 'Any Other']`
  + `FileUpload fieldKey="firmOffice_office_addr_proof"`

**Section: Registration Details** (→ same `formData.firmOffice` namespace)
- User ID (hint: "BIS portal user ID, if already known"), Application ID (same hint pattern) — both optional text
- Nature of Firm* — `Select`: `['Proprietorship', 'Partnership', 'Pvt Ltd', 'Public Ltd', 'LLP', 'Others']`
- Scale* — `Select`: `['Micro', 'Small', 'Medium', 'Large']`
- Sector* — `Select`: `['Private', 'Public']`
- Women Entrepreneur* — `Select`: `['Yes', 'No']`
- Startup* — `Select`: `['Yes', 'No']`
- Date of Registration (date), Registration Number
- GST Number* + `FileUpload fieldKey="firmOffice_gst_cert"` (label "GST Certificate")
- PAN Number
- Proof of Establishment Type* — `Select`: `['Certificate of Incorporation', 'Business Licence', 'Partnership Deed', 'Proprietorship Declaration', 'GST Registration Certificate', 'Udyam Registration Certificate', 'Trade Licence', 'Others']`
  + `FileUpload fieldKey="firmOffice_estab_proof"`
- Business Licence Number (plain text, no upload — matches the real sheet, which has no "ALSO UPLOAD DOCS" note next to this field)

**Section: Factory Details** (→ `formData.factory`)
- "Is Factory Address same as Office Address?"* — `Select`: `['Yes', 'No']`. If Yes, a
  "Copy from Office" button one-time copies `officeAddress`/`officeCountry`/`officeState`/
  `officeDistrict`/`officeCity`/`officePIN`/`officeEmail`/`officeMobile` from `formData.firmOffice`
  into the equivalent factory fields (one-time copy, not two-way bound — editable after).
- Factory Address* (single field), Country*, State*, District*, City*, PIN Code
- Factory Email*, Registered Email (factory has its own, distinct from Firm/Office's — matches
  the real sheet, which lists both "Factory email" and "Registered email" as separate rows)
- Registered Mobile No., Alternate Mobile No., Landline Number
- Latitude (hint: "Check your address proof documents for exact coordinates"), Longitude
- SEZ (Special Economic Zone)?* — `Select`: `['Yes', 'No']`
- Address Proof Document Type* — `Select`: `['GST Registration Certificate', 'Business Licence', 'Any Other']`
  + `FileUpload fieldKey="factory_addr_proof"`

**Section: Indian Standard Details** (→ `formData.standard`)
- "Do you know the Indian Standard applicable to your product?"* — `Select`: `['Yes', 'No']`.
  If Yes: Indian Standard (text, e.g. `IS 10617:2018`). If No: hint text, "Absolute Veritas
  will help identify the applicable standard."

**Section: Scheme of Inspection and Testing** (→ same `formData.standard` namespace)
- "Do you accept the Scheme of Inspection & Testing (SIT) specified by BIS w.r.t. frequency
  of testing and inspection?"* — `Select`: `['Yes', 'No']`.

**Section: Product Variety** (→ same `formData.standard` namespace, `rows` array)
- `RepeatingTable` (`sectionKey="standard"`, rows at `formData.standard.rows`): columns
  "Variety Applied For" (text), "Upload Supporting Documents" (file, `fieldKeySuffix="variety"`)
  — matches the real sheet's 3-column table (S.No. is the row's position, not stored data).

## 9. Admin-side changes

`client/src/pages/admin/Dashboard.jsx`: small badge next to each row's label showing form
type (`FMCS`/`ISI`), since `label` alone won't disambiguate anymore.

`client/src/pages/admin/SubmissionView.jsx`: `SECTIONS` becomes conditional on
`submission.formType` — existing array stays for `FMCS`; new array for `ISI` lists the
**underlying `formData` namespaces**, independent of how many client-facing wizard tabs they're
grouped into: `checklist, firmOffice, factory, standard, management, manufacturing, packaging,
testing, testReport, declaration` (10 admin review sections from 8 client tabs — `firmOffice`/
`factory`/`standard` all live under the one `applicationForm` client tab but stay three separate
admin sections, since the admin viewer renders `formData[key]` directly and was never coupled to
the client's tab grouping). Note `packaging`, not `packagingBrand` — since Packaging & Brand
Details is now reused verbatim from FMCS, it uses FMCS's existing section key. No other change
needed — the generic renderer already handles both flat key/value sections and arrays-of-objects
(the `standard.rows` array) via its existing `isObjectArray` branch, and the document list
already buckets correctly given the `fieldKey` prefix convention in §7 (unaffected by this
revision — `firmOffice_*`/`factory_*`/`standard_*` prefixes are unchanged).

## 10. Rollout / manual QA checklist

(No automated test suite exists in this repo — verification is manual, per existing project
convention documented in `CLAUDE.md`.)

1. Schema push — verify existing FMCS submissions still load with `formType` defaulting to
   `'FMCS'`.
2. Backend: `formType` accepted on create, returned on read, clone-type guard in place.
3. Frontend routing: `/portal` → chooser → `/portal/fmcs/*` (regression-test the untouched
   FMCS flow end-to-end) and `/portal/isi/*` (new flow).
4. The one new `applicationForm` tab and the 7 reused-from-FMCS tabs are all wired into the
   generalized wizard shell and render correctly under `/portal/isi/*`.
5. `RepeatingTable`: verify add/remove row, and that removing row 2 of 3 doesn't corrupt row
   3's uploaded file — this is the top risk, test it explicitly.
6. Admin dashboard shows form type; `SubmissionView.jsx` renders both types correctly,
   including the new `rows` tables.
7. Docs-ZIP download works for an ISI submission with uploaded documents in at least one
   repeating-row field. Excel export for ISI returns the "not yet available" stopgap
   response cleanly (not a 500) until `generateExcelISI` exists.
8. Manually fill one full ISI submission end-to-end (using real-ish data), submit it, and
   confirm the admin view renders everything correctly.
