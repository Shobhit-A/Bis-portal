# Multi-Form Submissions — Design

## Problem

Today, one client login (`User`) maps to exactly one BIS form (`Submission`) — enforced by `Submission.userId @unique`. A client who needs to submit multiple product registrations (e.g. different products under the same firm) has no way to do that from one account; each additional form currently requires a brand-new login created by the admin.

## Goal

Let one client login own multiple independent forms. Starting a new form can pre-fill the client's typed answers (not documents) from an existing form of their choice, so they only edit what's different instead of re-typing everything.

## Data model

`Submission` moves from "exactly one per user" to "many per user." `Document` is unchanged — it already belongs to a `submissionId`, so more submissions per user just means more rows, each with its own document set.

```prisma
model Submission {
  id        String     @id @default(cuid())
  userId    String                              // no longer @unique
  label     String                              // client-provided name, e.g. "Product A"
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  status    Status     @default(NOT_STARTED)
  formData  Json
  documents Document[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}
```

**Migration note**: every existing user already has exactly one submission row, so relaxing `@unique` is non-destructive. Existing rows are backfilled with `label = "Form 1"`.

## Backend API

Replaces the old singular `/api/submission` routes (breaking change to the API — acceptable since it's fully internal to this app):

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/submissions` | List the logged-in client's forms: `id`, `label`, `status`, `updatedAt` |
| POST | `/api/submissions` | Create a form: `{ label, cloneFromId? }`. If `cloneFromId` given, deep-copies that form's `formData` (not documents) into the new row |
| GET | `/api/submissions/:id` | Fetch one form + its documents (must belong to the logged-in user) |
| PUT | `/api/submissions/:id` | Autosave `formData` (same debounce behavior as today) |
| POST | `/api/submissions/:id/submit` | Mark that form SUBMITTED |
| POST | `/api/submissions/:id/documents` | Upload a document scoped to that form |
| DELETE | `/api/submissions/:id/documents/:docId` | Delete a document from that form |

All routes verify the submission's `userId` matches `req.user.id` (mirrors the existing document-ownership check pattern already used in the codebase).

**Admin API**: `GET /api/admin/users` changes `submission: {...}` (singular object) to `submissions: [{id, label, status, updatedAt}]` (array). The existing per-submission admin routes (`/excel`, `/docs`, `/documents/:docId`, `/unlock`, single-submission `GET`) are unchanged — they already operate on a submission ID, not a user ID.

**Admin account creation**: `POST /api/admin/users` no longer auto-creates an empty `Submission` for the new client — forms are now created client-side via "Start New Form," not implicitly at account-creation time. A brand-new client sees an empty "My Forms" page with just the "+ Start New Form" button.

## Frontend flow

**"My Forms" landing page** (new): after login, a client lands here instead of jumping straight into the tab editor.
- Lists their forms: label, status badge, last updated
- Clicking a form opens the existing 9-tab editor for that submission
- **"+ Start New Form"** button opens a modal: label text input + a "Clone from" dropdown (`None (start blank)` plus each existing form by label). Client explicitly picks the source — there is no automatic "always clone the most recent" behavior.

**Routing**: `/portal` becomes the "My Forms" list. The existing 9-tab editor moves from an implicit "the" submission to `/portal/:submissionId/*`. `PortalLayout.jsx` reads `submissionId` from `useParams()` and threads it through every API call (`updateSection`, document upload/remove, submit, unlock).

**Tab editor internals are unchanged** — same 9 tab components, same auto-save behavior, same document upload widgets, same Declaration/submit flow. They now operate on one specific submission's data instead of the user's only submission.

## Admin dashboard

Flat list, one row per form (not grouped/expandable per client):

| Client | Form Label | Status | Last Updated | Created | Actions |
|---|---|---|---|---|---|
| dhruv_2026 | Product A | SUBMITTED | ... | ... | View / Excel / ZIP |
| dhruv_2026 | Product B | IN PROGRESS | ... | ... | View / Excel / ZIP |

Built from `users[].submissions[]` flattened into rows, sorted by last-updated. Per-row actions (View form / Excel / Docs ZIP) work exactly as they do today since they're already keyed by submission ID.

## Out of scope (not requested, not building)

- No limit on number of forms per client
- No renaming/deleting forms after creation (not asked for; can be a follow-up)
- No cloning of uploaded documents between forms (explicitly decided against — most BIS documents are product/batch-specific, so blind copying is often wrong; client re-uploads)
- No "clone" of documents' metadata rows either — a fresh form's `documents` array starts empty
