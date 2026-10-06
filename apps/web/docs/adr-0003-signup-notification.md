# ADR-0003: Signup Notification to the Site Owner

**Date:** 2026-10-06  
**Status:** Accepted  
**Decision Maker:** Product Owner

## Context

When someone creates an account, nothing tells the site owner. Supabase Auth sends the confirmation and password-reset emails itself; the app has no mail code, no mail dependency and no SMTP configuration. The owner wants an email each time a new user confirms their account.

A notification email carries the new user's account email address to a mail provider, so it is a new processing activity and needs its own decision record.

## Decision

1. **Trigger on confirmation, not on form submit.** The notification fires in `app/auth/confirm/route.ts`, after `exchangeCodeForSession` (Google) or `verifyOtp` (email link) succeeds. Both signup paths pass through it. Unconfirmed attempts and bot submissions send nothing.
2. **"New" means confirmed in the last two minutes.** `isNewlyConfirmed` compares `email_confirmed_at` with the current time. Later Google sign-ins, password resets and a second click on a used link fall outside the window. There is no dedupe table; an occasional duplicate mail to the owner is harmless.
3. **Send after the response.** The mail is sent inside `after()` from `next/server`, so a slow or failing mail server never delays or breaks a sign-in.
4. **Zoho SMTP via nodemailer.** The owner already has a Zoho account. Settings come from six runtime-only environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SIGNUP_NOTIFY_TO`).
5. **Optional, like all persistence.** If any variable is missing, `getMailEnv()` returns `null` and the notification is skipped without error.
6. **Minimal content.** The mail is plain text with a fixed subject. The body holds the account email, the sign-in provider (`google` or `email`) and a timestamp. It never contains CV data, scores or profile data, and the user's address is not placed in any header.
7. **Server-only.** `lib/notify/` starts every file with `import "server-only"`. It imports nothing from `lib/scoring/`.

## Privacy Impact

### What changes

- **New processor:** Zoho Corporation receives the account email address in transit and stores the sent message in the owner's mailbox.
- **Privacy notice section 3 (Processing Purposes):** new item for notifying the site owner of a new account (Art. 6(1)(f) GDPR, legitimate interest in knowing about registrations).
- **Privacy notice section 4 (Data Recipients):** Zoho Corporation added.
- **KVKK notice sections 3 and 5:** same purpose and recipient in the KVKK wording. Translations in `en`, `tr` and `de`.
- **`LEGAL_VERSION` is not bumped.** A bump invalidates every CV-submission consent and forces re-consent on the next upload (see ADR-0002). The notification touches no CV data and no consented processing, so the notices are updated in place.

### What does not change

- The CV is still read and scored in the browser.
- No CV data, extraction, score or profile data reaches Zoho.
- Scoring stays pure and independent of this module.
- Retention of CVs (12 months) and profiles (until account deletion) is unchanged.

## Consequences

### Positive

- The owner learns about every confirmed signup without checking the Supabase dashboard.
- No schema change and no migration.
- A mail outage cannot affect sign-in.

### Negative

- A mail copy of each new user's address sits in the owner's mailbox and is outside the app's 12-month purge and account-deletion paths. Deleting the account does not delete that mail.
- A slow SMTP server is only bounded by the 10 second socket timeouts; there is no retry. A failed send is logged and lost.
- One more secret (`SMTP_PASS`) to rotate.

## Risks and Mitigations

1. **Zoho may not allow SMTP on the owner's plan, or may reject a `From` address that is not the authenticated account.**
   - **Mitigation:** Documented in `.env.example`. If SMTP is unavailable, the sender can be swapped behind `sendMail` (the `notifySignup` port) without touching the route.
2. **Zoho data-centre region is not stated in the notices.**
   - **Mitigation:** Confirm the account's region (`.com`, `.eu`, `.in`) and add it to the recipient line if the legal text should name it.
3. **Mail copies outlive account deletion.**
   - **Mitigation:** Handle deletion requests received through the Data Request form by also removing the notification mail from the owner's mailbox.
4. **Header injection through a crafted address.**
   - **Mitigation:** The subject is a constant, the address appears only in the body, and nodemailer sanitises header fields. A test covers an address containing CRLF.

## References

- [ADR-0001: CV Storage Decision](./adr-0001-cv-storage.md)
- [ADR-0002: User Profile Storage](./adr-0002-user-profile.md)
- [GDPR Art. 6 (Lawfulness of processing)](https://gdpr-info.eu/art-6-gdpr/)
