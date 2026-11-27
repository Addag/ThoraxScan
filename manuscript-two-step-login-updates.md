# Manuscript updates: optional two-step login

Proposed changes to `(LATEST)RadTech-ThoraxScan-Pre-Oral.docx`, as of November 15, 2026.
**Not applied.** This list was written from the app and from `manuscript-evaluation.md`; the manuscript
itself was not opened, so figure numbers and paragraph positions below need to be confirmed against it.

## What was added to the app

Any Student, Professor or Administrator can turn on "Two-step login" in User Profile → Security. After
that, logging in asks for the password and then a 6-digit code from an authenticator app (for example
Google Authenticator or Microsoft Authenticator). It is optional; accounts that do not turn it on log in
as before. An Administrator can reset it for a user who lost their phone. The code is generated on the
user's phone; ThoraxScan does not email or text it.

## Proposed changes

### 1. Chapters 1 to 3: leave as is

The feature was added after pre-oral. Nothing in the defended chapters needs to change.

### 2. Chapter 4.1, Data Flow Diagrams (Figures 2.0 and 3.0)

This sits on top of items 1 to 3 in `manuscript-evaluation.md` (email links instead of codes, the
Administrator entity, and Turnstile).

- **Authentication process:** add one optional flow from the user: "Authenticator code (optional two-step
  login)", after "Email, password".
- **Administrator entity:** add "Reset two-step login" to what the Administrator sends to account
  management.
- **Wording to keep straight:** item 1 of `manuscript-evaluation.md` removes "OTP" and "verification code"
  for registration and password reset, because those are email links. That stays true. The only code in
  the system is the authenticator code at login, so label it "authenticator code", not "OTP sent to
  email".
- **DFD paragraph, add:**

> Users may turn on an optional two-step login. When it is on, the system asks for a six-digit code from
> the user's authenticator app after the password, and it does not open the account until the code is
> correct.

### 3. Chapter 4.2, Entity-Relationship Diagram (Figure 5.0)

No new table in the application's own schema. The authenticator link is kept by Supabase Auth, the same
place the account's email and password are kept.

- If the redrawn ERD shows Supabase Auth as one box (item 8 of `manuscript-evaluation.md`), add
  "authenticator factor (optional)" to that box's attributes.
- If it shows only the application tables, no change.

### 4. Chapter 4.3, System Architecture (Figure 4.0)

- **Figure:** no new box. Two-step login is part of the existing Supabase Auth box. Optionally add the
  label "optional two-step login" beside Turnstile on the authentication arrow.
- **Paragraph beginning "Supabase. Supabase provides authentication":** add one sentence at its end:

> Supabase Auth also provides the optional two-step login: a user who turns it on must enter a code from an
> authenticator app after the password, and the database refuses requests from that account until the code
> has been entered.

### 5. Chapter 4.4, Screen Layout

Three screenshots, each with a caption and a one- or two-sentence description. Use the demo accounts and
blur or crop the QR code and the typed key so they cannot be scanned from the paper.

| New or retake | Screen | What it should show |
|---|---|---|
| New | Two-Step Login page (`/login/verify`) | The 6-digit code field after the password step |
| Retake | User Profile: Security | The new "Two-step login" panel under "Change password", in its off state |
| New (optional) | User Profile: Security, setup | The QR code, the typed key, and the code field, with the QR and key blurred |
| Retake | Administrator: Accounts, Manage account | The new "Reset two-step login" button beside "Sign out everywhere" |

- **List of Figures:** add the new entries and renumber after them. This is the same pass as item 13 of
  `manuscript-evaluation.md`, so do both together.
- **Suggested descriptions:**

> Two-Step Login. Shown only to users who turned on two-step login. After the password is accepted, the
> user enters the six-digit code from their authenticator app to finish logging in.

> User Profile: Security. The user can change their email and password and turn the optional two-step login
> on or off. Turning it off requires the current password.

> Administrator: Accounts. The administrator can rename an account, set a temporary password, sign the user
> out, reset two-step login for a user who lost their phone, disable sign-in, or delete the account.

### 6. Chapter 5.0, Conclusion and Recommendation

Optional, one sentence each. Skip if the chapter is already at length.

- **Findings paragraph (how professors and students use the system):**

> Accounts are protected by email confirmation, a CAPTCHA check, and an optional two-step login that the
> school's current learning management system does not offer.

  [Confirm the comparison with lms.lpubatangas.edu.ph before using it; it comes from the developer's own
  observation, not from a document.]

- **Recommendation:**

> Future work may add recovery codes for users who lose their authenticator device, and may require
> two-step login for professor and administrator accounts.

### 7. Appendix F, Hardware and Software Specifications

No change. No new library or service was added; two-step login uses Supabase Auth, which is already listed.

## Not part of the manuscript

- The app's Privacy Policy does not yet mention that an authenticator link is stored for accounts that turn
  two-step login on. Decide separately whether to add a line there.
