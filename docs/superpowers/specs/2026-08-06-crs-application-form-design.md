# Design: Add CRS (Compulsory Registration Scheme) Application Form

Date: 2026-08-06
Status: Approved — ready for implementation plan

## 1. Goal

Add CRS as a third, independent application-form type in the BIS Client Portal, alongside
FMCS and ISI. Source material is real screenshots of the live BIS/CRS government portal
(`CRS_Registration_Form_Reference.xlsx`, 10 sheets) — far more reliable than the earlier,
sparse internal docx this replaces. The government portal actually runs two distinct
flows (account registration, then a separate 9-tab "New License / Form-1" application);
our portal flattens both into one continuous 11-tab wizard, matching how FMCS and ISI
each present as a single wizard rather than mimicking the source's own navigation.

## 2. Branch strategy

Built on `feature/crs-application-form`, branched from `feature/isi-application-form`
(not `main`) — the ISI branch already has the generalized wizard shell (`PortalLayout`/
`MyForms` taking `formType`/`basePath`/`TABS`/`tabComponents` props) and the shared
`RepeatingTable` primitive that CRS needs. Branching from ISI avoids re-implementing that
refactor a third time. This branch will carry a dependency on `feature/isi-application-form`
being merged first (or being merged together) — not mergeable to `main` independently.

## 3. Known gaps — resolved by holding two tabs back

The source screenshots don't fully capture two things:
- **Tab 4 (Product & Testing)**: what appears after choosing "Product Category Wise" or
  "Indian Standard Wise" — the deeper product/standard picker — was never captured.
- **Tab 5 (Model & Brand Mapping)**: this tab's real purpose is mapping uploaded test
  reports to Brand + Model combinations, fed by an entirely separate "Testing and Sample
  Submission" flow that has no screenshot at all. The captured screen only shows an empty
  state ("No Test Report Available").

**Decision (confirmed with user):** rather than build against a guess, Tabs 4 and 5 ship
as simple "Coming soon" stub placeholders (a single shared `ComingSoon` component, no
inputs, no data collected) until clearer source material arrives. All other 9 tabs are
fully specified from the screenshots and build normally.

Two smaller gaps remain inside otherwise-fully-specified tabs, built now with best-guess
placeholder values per the source document's own suggestion, to revisit once confirmed:
- Tab 6 (Brand Details) "Is Brand Name/Trade Mark Registered?" dropdown options —
  using `['Registered', 'Unregistered', 'Applied For']` (table was empty in the source).
- Tab 9 (AIR) "Govt. Issued Documents" dropdown — using
  `['PAN Card', 'Aadhaar Card', 'Passport', 'Voter ID', 'Driving License']` (only "PAN
  Card" was visible as a selected example).

## 4. Data model change

```prisma
enum FormType {
  FMCS
  ISI
  CRS   // NEW
}
```

`npx prisma db push` — additive, backward-compatible, same as the ISI enum addition.

## 5. Backend & routing

`POST /api/submissions`'s `formType` validation, the clone-type guard, and list/detail
responses are already generic (built for "any enum value" during the ISI work) — no
backend code change needed beyond the schema addition.

`client/src/App.jsx`:
```
/portal/crs               → MyForms with formType="CRS" basePath="/portal/crs"
/portal/crs/:id/*         → wizard shell with CRS's TABS config + tab components
```

`FormTypeSelect.jsx` gains a third card: **CRS — Compulsory Registration Scheme**.

## 6. Design deviation: centralized "Upload Documents" tab

FMCS and ISI both put each `FileUpload` inline, next to the field it supports. CRS's real
government-portal source collects almost every document upload into one dedicated
"Upload Documents" tab (Tab 10) near the end, separate from where the related
information was entered — this is how the source actually works, not an accident. Tab 10
is therefore built as a **fixed list of named upload fields**, not a repeating table and
not inline uploads. Everything else (fieldKey prefix = sectionKey, `RepeatingTable` for
dynamic sections, wizard shell, autosave) stays consistent with FMCS/ISI.

## 7. CRS tab-by-tab spec

Same coding pattern as every other tab: `const data = formData.<section> || {}`,
`set(key, val) => updateSection('<section>', { ...data, [key]: val })`,
`disabled={isSubmitted}` on every input, `fieldKey`s start with their tab's `sectionKey`.

| # | Tab key | Label | Path | Component |
|---|---|---|---|---|
| 1 | `checklist` | Document Checklist | `''` (index) | New — `crs/DocumentChecklist.jsx` |
| 2 | `account` | Registration & Manufacturing Unit | `account` | New — `crs/AccountDetails.jsx` |
| 3 | `address` | Manufacturing Unit & Correspondence Address | `address` | New — `crs/AddressDetails.jsx` |
| 4 | `product` | Product & Testing | `product-testing` | New — shared `ComingSoon.jsx` stub |
| 5 | `modelBrand` | Model & Brand Mapping | `model-brands` | New — shared `ComingSoon.jsx` stub |
| 6 | `brand` | Brand Details | `brand-details` | New — `crs/BrandDetails.jsx` |
| 7 | `management` | Management Details | `management` | New — `crs/ManagementDetails.jsx` |
| 8 | `contact` | Contact Person | `contact-person` | New — `crs/ContactPerson.jsx` |
| 9 | `air` | AIR / Authorized Signatory | `air-signatory` | New — `crs/AirSignatory.jsx` |
| 10 | `uploads` | Upload Documents | `upload-documents` | New — `crs/UploadDocuments.jsx` |
| 11 | `declaration` | Declaration & Undertaking | `declaration` | **Reused** — `tabs/DeclarationUndertaking.jsx` (FMCS's, verbatim, same as ISI's approach) |

### Tab 1 — `checklist`
Same status-dropdown (Provided/Pending/Not Applicable) + misc-upload pattern as
FMCS's/ISI's checklist tabs (`fieldKey="checklist_misc"`), with CRS's own list from the
source "Required Documents" screen:
1. Brand Registration Certificate(s) — Mandatory
2. Brand Authorization Letter — Optional *(only when the brand is declared as owned by Others)*
3. Authorization from Factory CEO/MD/Head for Filling and Signing Form-1 — Mandatory
4. Authorization Letter from CEO/Top Management of AIR Firm — Mandatory
5. ID Card of Authorized Signatory of AIR — Mandatory
6. Raw Materials/Components — Mandatory

Plus a static note below the table: "Other documents may be required." This list is
intentionally shorter than Tab 10's authoritative 8-item upload list — that's in the
source itself (a lighter preview vs. the complete list), not a bug to reconcile.

### Tab 2 — `account`
**Basic Details:** User Name* (proposed BIS portal login), Password* (type="password"),
Confirm Password* (type="password", inline "Passwords do not match" hint if they differ
— non-blocking, this is form data collection not real auth), Company URL (optional),
Email* (hint: "Email will be sent to this Email Id"), Name*, Designation (optional),
Mobile No.* (hint: "SMS will be sent to this No.")

**Manufacturer Unit Details:** Manufacturing Unit Name*

No uploads on this tab.

### Tab 3 — `address`
**Address of the Manufacturing Unit:** Email*, Address* (`<textarea className="input">`
— full postal address, not the single-line `input` most fields use), Country* (`Select`,
default `"India"`, reuse `COUNTRIES`), State/Province* (text), Zip Code* (hint: "Zip Code
is Mandatory"), Fax No. (optional), Contact No.* (hint: "STD code(s) to be given with
contact numbers")

**Address for Correspondence:** "Same as Manufacturing Unit Address" checkbox — when
checked, one-time copies the block above into these fields (not two-way bound, editable
after copying, same `copyFromOffice`-style pattern already used in ISI's Factory Details
tab). Same field set: Email*, Address*, Country*, State/Province*, Zip Code*, Fax No.
(optional), Contact No.*

**Correspondence Address Selection:** Correspondence Address* — `Select`:
`['Office', 'Manufacturing Unit']`, default `Office`.

**Document Upload:** Address Authentication of Manufacturing Unit* —
`FileUpload fieldKey="address_auth_doc"`, with this exact helper hint text: *"For proof
of name and address of manufacturing unit, kindly upload a valid government issued
document in which name and address of the manufacturing unit is clearly reflected along
with reflection of manufacturing activity for products related to Registration Scheme.
Documents like ISO certificates may be submitted in addition, if scope of manufacturing
is not clear from the above document. However, an ISO document alone will not be
accepted for address proof."*

### Tab 4 — `product` — STUB (see §3)
Renders the shared `ComingSoon` component with title "Product & Testing" and a message
explaining this section is being finalized pending additional BIS portal reference
material. No fields, nothing stored to `formData.product`.

### Tab 5 — `modelBrand` — STUB (see §3)
Same `ComingSoon` component, title "Model & Brand Mapping". No fields, nothing stored.

### Tab 6 — `brand`
`RepeatingTable` (`sectionKey="brand"`, rows at `formData.brand.rows`), 6 columns
matching the real table:
- Brand Name* (text)
- Brand Registration Certificate (file, `fieldKeySuffix="cert"`)
- Owned By* (`select`: `['Self', 'Others']`)
- Is Brand Name/Trade Mark Registered?* (`select`: `['Registered', 'Unregistered', 'Applied For']` — placeholder per §3)
- Registration Date (date)

(S.No. is the row's position in the table, not a stored field — `RepeatingTable` doesn't
need a column for it.)

### Tab 7 — `management`
**Confirmed against a real filled-in screenshot** (7 Top Management rows, 4 Technical
Management rows) — both tables use only `Name`/`Designation` columns, an "Add More"
button, and a per-row "Delete" button on every row **except the first** — row 1 can
never be deleted, matching a minimum-of-1-row floor. This is a new behavior
`RepeatingTable` doesn't have yet (built for ISI, where every row was freely
deletable) — add an optional `protectFirstRow` boolean prop that skips rendering the
delete button for the row at index 0 when true; default `false` so ISI's existing usage
is unaffected.

**Top Management** — `RepeatingTable` (rows at `formData.management.topRows`,
`protectFirstRow`, defaults to exactly 1 empty row when the section is first opened):
Name* (text), Designation* (text). No upload, no qualification/photo/experience columns
(unlike ISI's equivalent table — this source is simpler, don't add fields that aren't in
it).

**Technical Management** — `RepeatingTable` (rows at `formData.management.techRows`,
`protectFirstRow`, defaults to exactly 1 empty row): same two columns.

### Tab 8 — `contact`
Flat fields: Name*, Designation*, Mobile Number* (hint: "OTP for submission of the
application will be sent to this number"), Email* (hint: "OTP for submission of the
application will be sent to this E-mail Id"), Fax (optional).

### Tab 9 — `air`
**Manufacturer Details** (read-only, derived from Tabs 2–3, not separately stored):
Firm Name (= `formData.account.unitName`), Firm Address (=
`formData.address.manufacturingAddress` or similar — display only).

**Representative Scenario*** — `Select`, one of:
- "We have a liaison/branch office in India"
- "We do not have a liaison/branch office in India, but the Proprietor/Registered User of the Brand/Trademark is located in India"
- "We have neither, so we nominate our Authorized Indian Representative"

**Indian Representative Details** — always visible regardless of scenario selected (per
the source example, which shows these fields filled with "NA" when not applicable — a
hint below the section header notes "Enter NA if not applicable to your selected
scenario" rather than conditionally hiding the fields): Firm Name*, Firm Address*, Aadhar
Number (hint: format `xxxx xxxx xxxx`), Govt. Issued Documents (`select`, placeholder
list per §3), Enter Number (the ID number for whichever doc type was selected), Person
Name, Designation, Mobile Number, Email, State (`select`, Indian states), Zip Code/Pin
(left blank by default — do not default to `"0"` like the source example did).

### Tab 10 — `uploads`
Fixed list of named fields — **not** a repeating table (see §6):
1. Authorization from factory CEO/MD/Head for filling and signing Form-1* — `FileUpload fieldKey="uploads_ceo_auth"`
2. Raw Materials/Components* — `FileUpload fieldKey="uploads_raw_materials"`
3. Authorization letter from CEO/top management of AIR firm towards the authorized signatory* — `FileUpload fieldKey="uploads_air_ceo_auth"`
4. "Does the manufacturing unit have complete testing facility installed in-house for ascertaining conformity as per Indian Standard?"* — `Select`: `['Yes', 'No']` → `formData.uploads.inHouseTesting`
5. "Does the manufacturing unit have complete manufacturing facility for the product and its models/series/type/grade/class/size/rating for which registration is applied?"* — `Select`: `['Yes', 'No']` → `formData.uploads.completeManufacturing`
6. ID card of authorized signatory of AIR* — `FileUpload fieldKey="uploads_air_id_card"`
7. Other document, if required (optional) — `FileUpload fieldKey="uploads_other"`
8. Factory Address Proof / Business license* — `FileUpload fieldKey="uploads_factory_proof"`

### Tab 11 — `declaration`
Reused verbatim from FMCS's `tabs/DeclarationUndertaking.jsx` — same as how ISI reused
it. Same field names (`statutoryPermissions`, `otherInfo`, `otherRequest`,
`submitterName`, `submitterDesignation`, `weeklyOff`, `weeklyOffDays`, `signatoryName`,
`signDate`, `confirmed`), same `onSubmit`/`submitting` wiring, same final submit button.
The source's own "Preview" screen was just validation banners, not a data-entry form —
nothing CRS-specific to build here.

## 8. Admin-side changes

`client/src/pages/admin/SubmissionView.jsx`: third `SECTIONS_BY_TYPE` entry for `CRS`:
`checklist, account, address, product, modelBrand, brand, management, contact, air,
uploads, declaration` (11 sections, matching the 11 client tabs 1:1 — unlike ISI, CRS
has no client-tab-to-admin-section fan-out). No renderer changes — flat fields and the
`brand.rows` array-of-objects both render automatically via the existing generic logic;
Tabs 4/5's stub sections will simply show "No data filled for this section" until they're
built out, which is correct and expected.

`client/src/pages/admin/Dashboard.jsx`: third badge color/variant for `CRS`, extending
the existing FMCS/ISI two-color badge to three.

## 9. Excel export

Add `generateExcelCRS(submission)` alongside `generateExcelFMCS`/the ISI stopgap in
`excelExport.js`, using the same shared layout helpers (`setCell`/`mergeSet`/`drawTable`/
`secHeader`/etc.), reading `submission.formData.<section>` per §7. Unlike ISI's Excel
export (deferred — no reference workbook was ever provided), CRS's source screenshots
give enough structure to build this now: branch on `submission.formType === 'CRS'` in
the `GET /api/admin/submissions/:id/excel` route the same way ISI's stopgap branch works,
but call the real `generateExcelCRS` instead of returning a 501.

## 10. Rollout / manual QA checklist

(No automated test suite in this repo — verification is manual, per `CLAUDE.md`.)

1. `FormType` enum includes `CRS`; `db push` run.
2. `/portal` chooser shows three cards; `/portal/crs` and `/portal/crs/:id/*` work
   end-to-end through all 11 tabs.
3. Tabs 4 and 5 show the "Coming soon" stub correctly and don't block navigation to
   adjacent tabs or final submission.
4. Tab 10's fixed-field upload list behaves correctly — verify each of the 8 rows
   independently (this is the one tab that isn't a flat-field or repeating-table
   pattern).
5. `RepeatingTable` reused correctly for Brand Details, Top Management, Technical
   Management — verify add/remove row, and (same top risk as ISI) that removing a row
   doesn't corrupt a sibling row's uploaded file. Specifically confirm the new
   `protectFirstRow` behavior: Top/Technical Management's row 1 has no Delete button and
   can't be removed, while Brand Details (no `protectFirstRow`) allows deleting any row
   including the first — and confirm ISI's existing tables (built before this prop
   existed) are visually and functionally unchanged now that the prop defaults to
   `false`.
6. Admin dashboard badge + `SubmissionView.jsx` SECTIONS render CRS correctly, including
   the two stub sections showing "No data filled."
7. Excel export and docs-ZIP work for a CRS submission.
8. Fill one full CRS submission end-to-end (skipping Tabs 4/5's stub content), submit,
   confirm the admin Excel export matches.
9. Once real source material for Tabs 4/5 arrives: revisit this spec's §3 before
   replacing the stubs with real fields — don't build ahead of confirmed source data.
