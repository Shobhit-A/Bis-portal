# ISI Application Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ISI (BIS Standard Mark) as a second, independent application-form type in the BIS Client Portal, alongside the existing FMCS flow, without breaking FMCS for live clients.

**Spec:** `docs/superpowers/specs/2026-08-06-isi-application-form-design.md`

**Status as of this revision: implementation complete, pending QA and merge.** All code tasks
below are done. This document was originally written with 10 separate new ISI tabs (based on
a build-prompt written before anyone had opened the real reference workbook). Screenshots of
the actual `ISI_Application_form-Duly_Filled` workbook showed the real "Application form" sheet
combines Firm/Office, Registration, and Factory details into one page — not three — and
included `User ID`/`Application ID` fields the original spec was missing. Per explicit
direction, every ISI tab **after** Application Form (Document Checklist, Management,
Manufacturing, Packaging & Brand, Testing, Test Report, Declaration) was also simplified to
reuse the existing FMCS tab components verbatim rather than being rebuilt — so ISI ended up
with **8 client-facing tabs**, only one of which (`ApplicationForm.jsx`) is ISI-specific code.

## What's built

- [x] **Schema:** `FormType` enum (`FMCS`/`ISI`) on `Submission`, defaulting existing rows to `FMCS`.
- [x] **Backend:** `formType` on submission create/list (with clone-type guard), admin user
      list, and the Excel export route (`501` stopgap for ISI until the reference workbook is
      shared for building `generateExcelISI` — still out of scope, unchanged from the spec).
- [x] **`RepeatingTable`** shared primitive (`client/src/components/RepeatingTable.jsx`) —
      used once, by ISI's Product Variety table.
- [x] **`COUNTRIES`** exported from `tabs/OrganizationProfile.jsx` for reuse.
- [x] **`isi/ApplicationForm.jsx`** — the one new ISI tab, combining `firmOffice`/`factory`/
      `standard` sections + Product Variety table on a single page, matching the real workbook.
- [x] **`isiTabs.js`** — 8-tab config: `checklist`, `applicationForm`, `management`,
      `manufacturing`, `packaging`, `testing`, `testReport`, `declaration`. Seven of these
      import FMCS's tab components directly from `pages/portal/tabs/`; only `applicationForm`
      points at the new ISI-specific file.
- [x] **`PortalLayout.jsx`** generalized to a prop-driven wizard shell (`basePath`, `TABS`, `tabComponents`).
- [x] **`MyForms.jsx`** generalized to a prop-driven form-type picker (`formType`, `basePath`, `title`).
- [x] **`FormTypeSelect.jsx`** — new `/portal` chooser screen (FMCS / ISI cards).
- [x] **`App.jsx`** rewired: `/portal` → chooser, `/portal/fmcs/*` and `/portal/isi/*` as separate scoped flows.
- [x] **Admin `Dashboard.jsx`**: form-type badge per row; Excel-download error handling fixed
      to correctly surface the 501 stopgap message (axios `responseType: 'blob'` delivers JSON
      error bodies as a `Blob`, so the handler reads `.text()` + `JSON.parse` rather than
      `err.response.data.error` directly).
- [x] **Admin `SubmissionView.jsx`**: `SECTIONS` conditional on `submission.formType` — ISI's
      list uses the real `formData` namespace keys (`checklist, firmOffice, factory, standard,
      management, manufacturing, packaging, testing, testReport, declaration` — 10 admin review
      sections even though the client only sees 8 tabs, since `firmOffice`/`factory`/`standard`
      share one client page but stay separate for admin review). Same blob-error fix as Dashboard.
- [x] Verified all reused FMCS components' internal section keys (`checklist`, `management`,
      `manufacturing`, `packaging`, `testing`, `testReport`, `declaration`) match exactly what
      `isiTabs.js` and `SubmissionView.jsx` expect (checked via grep, not assumed).
- [x] `npm run build` (client) succeeds with no errors.

All work is on branch `feature/isi-application-form`, not yet merged to `main`.

## Remaining: manual QA and merge

(No automated test suite exists in this repo — verification is manual, per `CLAUDE.md`.)
Local dev points at the same Supabase project as production — use a clearly-named throwaway
test account (e.g. `isi_qa_test`) for everything below, and delete it before merging.

- [ ] **FMCS regression pass.** Log in as an existing FMCS test client. Confirm `/portal` shows
      the two-card chooser, `/portal/fmcs` shows the same forms list as before this branch
      existed, and all 9 original tabs on an existing form still load and autosave correctly
      (edit a field, confirm "Saving..." → "Saved HH:MM", refresh, confirm it persisted).
- [ ] **ISI smoke test.** Using the throwaway test account: `/portal` → "ISI — BIS Standard
      Mark" → `/portal/isi` → "Start New Form" → step through all 8 tabs via Next, confirm no
      console errors and the step indicator shows the right 8 labels including "Application
      Form" as tab 2.
- [ ] **Application Form field check.** On the Application Form tab, fill Firm/Office,
      Registration (including the new User ID / Application ID fields), and Factory sections.
      Toggle "Is Factory Address same as Office Address?" to Yes and click "Copy from Office" —
      confirm the factory address fields populate from the office ones. Add 2 rows to Product
      Variety, upload a distinct file to each, refresh, confirm both rows and both files persisted.
- [ ] **Repeating-row data-integrity check (top risk).** With 3 rows in Product Variety, each
      with a distinct uploaded file, delete row 2. Refresh. Confirm exactly 2 rows remain and
      each remaining row's file is still the one that was originally in it (no silent
      reassignment to the wrong row).
- [ ] **Admin review.** Log in as admin. Confirm the client table shows `ISI`/`FMCS` badges.
      Open the ISI test submission's admin view — confirm 10 sections render (including
      `firmOffice`, `factory`, `standard` as three separate sections even though the client saw
      them on one page), the Product Variety table renders via the generic array-of-objects
      renderer, and uploaded documents appear under the correct section. Click Excel download
      on the ISI submission — confirm the clear "not yet available" toast (not a crash, not a
      silent failure). Confirm Excel download on an FMCS submission still works exactly as before.
- [ ] **Docs ZIP.** Download the documents ZIP for the ISI test submission — confirm it
      includes every uploaded document (checklist misc doc, office/factory address proofs, GST
      cert, establishment proof, and the Product Variety row files).
- [ ] **Clean up test data.** Delete the `isi_qa_test` account (and any other throwaway
      accounts) via the admin dashboard — cascades to delete its submissions/documents too.
- [ ] **Merge.**
  ```bash
  git checkout main
  git pull
  git merge feature/isi-application-form
  git push
  ```
  Push triggers Render's backend redeploy and Vercel's frontend redeploy automatically —
  confirm both come up green.
