# ADR-0001: CV Storage Decision

**Date:** 2026-10-05  
**Status:** Accepted  
**Decision Maker:** Product Owner

## Context

The original privacy contract stated "the CV never leaves the browser." This was a core design principle from the project's inception. However, several factors necessitated a change:

1. **User demand:** Users requested the ability to access their CV analyses across devices and share them with others.
2. **Backup and recovery:** Browser-only storage meant data loss if the user cleared their browser or switched devices.
3. **Analytics and improvement:** Storing analyses (with consent) allows us to improve the scoring algorithm and understand real-world usage patterns.
4. **Compliance requirements:** Certain jurisdictions require data controllers to maintain records of processing activities, which is easier with server-side storage.

## Decision

We will store CV submissions on the server with the following constraints:

1. **Mandatory consent:** Users must explicitly consent before their CV is uploaded. The consent checkbox is required to enable the "Analyze" button.
2. **12-month retention:** All CV data (file, extracted text, analysis result) is automatically deleted after 12 months via a cron job.
3. **Three storage locations:**
   - Supabase database (PostgreSQL) for metadata and analysis results
   - Supabase Storage (private bucket) for the original file
   - Google Drive (backup folder) for disaster recovery
4. **Fail-open:** If storage fails, the analysis still completes in the browser, but the data is not persisted.
5. **Admin access:** Only designated administrators can access stored CVs, with all access logged in an audit table.
   Administrators can also list registered accounts at `/admin/users` (email, sign-in method, registration date, last sign-in, email confirmed; no CV content, tokens or other metadata). The list is read-only and every view is logged as `user_list` in the same audit table (added 2026-10-07, O5).
6. **Data subject rights:** Users can request access, correction, or deletion of their data via a public form.

## Consequences

### Positive
- Users can access their analyses across devices
- Data survives browser cache clears
- Enables future features like analysis history and comparison
- Provides disaster recovery via Google Drive backup
- Meets compliance requirements for data processing records

### Negative
- Increased infrastructure complexity (Supabase, Google Drive, cron jobs)
- Legal liability as data controller (KVKK, GDPR)
- Requires ongoing maintenance (retention jobs, backup monitoring)
- Users must trust us with their CV data
- Cross-border data transfers (USA for Google Drive) require legal safeguards

### Neutral
- The browser still performs the initial parsing and scoring; server storage is a secondary step
- Share links continue to strip evidence (lines from the CV) for privacy
- The scoring algorithm remains deterministic and unchanged

## Risks and Mitigations

1. **Legal review pending:** The KVKK and GDPR texts are drafts and require lawyer review before deployment.
   - **Mitigation:** Do not deploy until legal review is complete.

2. **Cross-border transfers:** Google Drive is in the USA, requiring Standard Contractual Clauses under GDPR and notification under KVKK Article 9.
   - **Mitigation:** Include SCC references in privacy notices; monitor regulatory updates.

3. **Special category data:** CVs may contain health, religion, or trade union information.
   - **Mitigation:** Warn users to remove such data before upload; do not process it specially.

4. **VERBIS registration:** Turkish Data Protection Authority may require registration.
   - **Mitigation:** Consult lawyer on VERBIS applicability.

5. **DPIA requirement:** GDPR may require a Data Protection Impact Assessment.
   - **Mitigation:** Conduct DPIA before deployment if required.

6. **Processor agreements:** Supabase and Google are data processors.
   - **Mitigation:** Sign DPAs with both providers.

7. **Refresh token lifecycle:** Google OAuth refresh tokens expire if not used.
   - **Mitigation:** Monitor Drive upload failures; alert on repeated failures.

## Open Questions

- Should we offer an opt-out for users who want browser-only analysis?
- Should we encrypt CVs at rest in Supabase?
- Should we provide a data export feature (beyond the admin panel)?

## References

- [KVKK (Turkish Data Protection Law)](https://www.kvkk.gov.tr/)
- [GDPR (EU General Data Protection Regulation)](https://gdpr-info.eu/)
- [Supabase Security](https://supabase.com/docs/guides/security)
- [Google Drive API](https://developers.google.com/drive/api/guides/about-sdk)
