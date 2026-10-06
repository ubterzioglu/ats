# ADR-0002: User Profile Storage

**Date:** 2026-10-06  
**Status:** Accepted  
**Decision Maker:** Product Owner

## Context

The `/account` page currently holds only a "delete account" button. Users want a profile page where information extracted from CV analyses can be saved and reused:

1. **Reuse across CVs:** When a user analyzes a CV, the extracted data (name, contact, experience, education, skills, languages) could populate a profile, so the next CV starts from a known base rather than blank.
2. **CV builder integration:** The builder (`/builder`) reads drafts from IndexedDB. A server-side profile would let the builder inject known data into an empty draft, or merge with an existing one.
3. **Extensibility:** Future features (certifications, projects, preferences) need a place to live. A profile row with a `resume` core and an `extras` extension point avoids new tables per feature.

The product's privacy contract is strict: the CV never leaves the browser by default, and when it is uploaded, the user consents explicitly. A profile is a new kind of data, and its storage needs its own decision record.

## Decision

We will store a user profile on the server, bound to the user's account, with the following constraints:

1. **Explicit consent only.** Profile data is never written automatically. After a CV analysis, the user sees what was extracted and chooses which fields to save. No silent writes.
2. **Account-bound.** The profile is a single row per user in a `profiles` table, keyed by `user_id`. It lives as long as the account; it is deleted when the account is deleted.
3. **Separate from CV storage.** CV submissions are retained for 12 months (ADR-0001). The profile is retained until the user deletes their account. The two lifecycles are independent.
4. **Shape mirrors the CV model.** The profile's core is a `Resume` object (JSON Resume schema), the same shape the builder uses. An `extras` JSONB column holds future extensions without schema changes.
5. **No influence on scoring.** Profile data never feeds into `lib/scoring/`. The deterministic engine remains pure and profile-independent.
6. **Opt-in, not opt-out.** The profile feature is available only to logged-in users. Guest users have no profile and no server-side data beyond the 12-month CV submission.

## Data Model

```sql
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  resume jsonb not null default '{}',
  extras jsonb not null default '{}',
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
```

No RLS policies: service-role only, matching the `ats_reports` pattern (ADR-0001).

## Privacy Impact

### What changes

- **Privacy notice section 2 (Data We Process):** add a new item for profile data (name, contact, experience, education, skills, languages).
- **Privacy notice section 3 (Processing Purposes):** add a new item for profile management.
- **Privacy notice section 6 (Retention Period):** clarify that profile data is retained until account deletion, separate from the 12-month CV retention.
- **KVKK notice:** same updates in Turkish.
- **LEGAL_VERSION bump:** from `2026-10-06-v2` to `2026-10-06-v3`. This invalidates existing CV submission consents; users must re-consent on their next upload.

### What does not change

- The CV is still read and scored in the browser.
- The profile is populated only from user-confirmed extractions, not from the raw CV text.
- The scoring engine remains pure and profile-independent.
- Share links continue to strip evidence.

## Consequences

### Positive

- Users can build a persistent profile from CV analyses.
- The CV builder can inject known data, reducing repetitive entry.
- Future features (certifications, projects, preferences) have a home.
- The profile shape mirrors the builder, so mapping is nearly 1:1.

### Negative

- LEGAL_VERSION bump forces re-consent on next CV upload. Users must be notified.
- New attack surface: profile data is server-side and must be protected.
- Migration must be applied manually to the live database.

### Neutral

- The profile is a single row per user; storage cost is negligible.
- The builder's IndexedDB draft remains the primary workspace; the profile is an injection source, not a replacement.

## Risks and Mitigations

1. **LEGAL_VERSION bump breaks existing consents.** Users who uploaded a CV before the bump must re-consent on their next upload.
   - **Mitigation:** The consent checkbox is already required; the re-consent is a one-time friction. Notify users in the next release notes.

2. **Profile data may contain special category data** (health, religion, trade union) if the user confirms such fields from a CV.
   - **Mitigation:** The import panel warns users to review fields before confirming. The privacy notice already warns against uploading special category data.

3. **Profile deletion must be cascade-safe.** When a user deletes their account, the profile must go with it.
   - **Mitigation:** The `deleteAccount` server action explicitly deletes the profile row before deleting the auth user. The `profiles` table has `on delete cascade` as a backup.

4. **Profile data must not leak into scoring.** If the profile influences the score, the deterministic engine is compromised.
   - **Mitigation:** `lib/profile/` imports nothing from `lib/scoring/`, and `lib/scoring/` imports nothing from `lib/profile/`. A test enforces this boundary.

## Open Questions

- Should the profile be exportable as JSON Resume? (Deferred; the builder already exports JSON Resume.)
- Should the profile support multiple CVs (e.g., a "master" profile plus per-job variants)? (Deferred; the current model is one profile per user.)
- Should the profile be editable directly, or only via CV import? (Deferred; the profile page will allow direct editing in a future iteration.)

## References

- [ADR-0001: CV Storage Decision](./adr-0001-cv-storage.md)
- [JSON Resume Schema](https://jsonresume.org/schema/)
- [GDPR Art. 6 (Lawfulness of processing)](https://gdpr-info.eu/art-6-gdpr/)
- [KVKK (Turkish Data Protection Law)](https://www.kvkk.gov.tr/)
