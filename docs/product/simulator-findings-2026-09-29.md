# Owner simulator findings — 2026-09-29

State: observations recorded; new defects await bounded triage and independent validation.
This supplements [the original phone feedback](phone-feedback-triage-2026-09-13.md) and preserves
the raw [feedback.md](../../feedback.md). It does not replace prior findings or authorize new scope.

The owner supplied four simulator screenshots after Codex launched Expo Go on iPhone 17 Pro.
Screenshots show Scan, the no-generation review fallback, household calendar Settings and Home.
This is limited user-supplied rendering evidence, not independent end-to-end QA or a Done decision.

| Finding                                                                                  | Evidence and limits                                                                                                                                                                                                                          | Existing workstream / next validation                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Password reset email did not arrive                                                      | Owner reported non-delivery. A dashboard recovery attempt returned 429 with 11 seconds remaining. Separate supplied entries show a 400 password sign-in and a successful dashboard user-count query; neither explains original non-delivery. | SCKRL-008 recovery scope / SCKRL-020 follow-up triage. Inspect the original recovery Auth event and delivery configuration; do not infer an SMTP cause or change hosted settings without authorization.                |
| Password recovery is incomplete in the app                                               | Source sends a Supabase recovery request and displays “Password reset email sent.” There is no recovery callback/new-password screen. The later signed-in screenshot does not prove password recovery worked.                                | Scope a bounded SCKRL-008 repair with Auth/Backend review and independent QA. Request success must not claim verified email delivery.                                                                                  |
| Scan opens “Review not ready”                                                            | Screens show “Receipt saved. Opening review…” followed by the no-parsed-lines fallback. Source creates a simulated receipt record and opens review; it does not initiate parsing. Refresh only reads the snapshot.                           | Expected SCKRL-304 fallback, with SCKRL-307/308/309 still needed for real acquisition/processing. This is not evidence for editing or saving parsed review lines.                                                      |
| The new review editor is not practically testable through the normal simulated Scan path | No parsed generation is produced by Scan, so the owner cannot reach its edit controls through that path.                                                                                                                                     | SCKRL-304/908 QA setup gap. Chair suggested an explicit development-only sample preview; this is a proposal, not approved or implemented scope. Alternatively use an isolated existing parsed fixture when authorized. |
| Household calendar Settings renders                                                      | Screenshot shows Europe/Vienna and Save calendar.                                                                                                                                                                                            | SCKRL-406 partial rendering evidence only. Save persistence, owner/member rules and recipe calendar behavior remain to be validated.                                                                                   |
| Home header overlaps the status/Dynamic Island area                                      | Visible in the owner screenshot. Scroll position and exact reproduction are not established; source already applies a top inset, so do not assume the cause.                                                                                 | SCKRL-203/908 and SCKRL-020 follow-up triage. Reproduce at initial load and after returning from another screen before fixing layout.                                                                                  |
| Home says “0 dinners” and still recommends skipping shopping                             | Screenshot and source show the shopping recommendation alongside a zero dinner count.                                                                                                                                                        | SCKRL-203 product-truth defect for triage. Define and test truthful copy for zero/unknown eligible meals; no shopping forecast is established by this count.                                                           |

## Earlier notification and product requests remain recorded

- Yellow estimated-date warning and red overdue indicator with accessible text/double exclamation:
  SCKRL-407, Todo, after the SCKRL-406 data foundation (Review).
- Overdue push prompts, preference controls, household-local timing, duplicate suppression and
  inbox: SCKRL-411/412/421, specified in `features.md`, not implemented. A notification must link
  to an explicit item action and must never silently discard stock.
- Snoozing must preserve the expiry fact: SCKRL-408, Todo, before reminder delivery.
- Overdue/unknown stock excluded from recipe eligibility: SCKRL-506, Done locally; this does not
  certify food safety or complete notification behavior.
- Optional package photo/barcode: SCKRL-409; personal recipe book: SCKRL-507; collection sharing:
  SCKRL-508; bounded iPhone-style gestures: SCKRL-902; optional nutrition/calories: SCKRL-930.
  These remain separately staged backlog/discovery work. AI remains later program work.

## Program visibility

The [readable roadmap](notion-program-roadmap.md) summarizes the [full program](../../PROGRAM.md).
The Notion roadmap has not been published: the last creation attempt on 2026-09-27 was rejected
by Notion's workspace block limit. Capacity has not been rechecked on this date.
SCKRL-304 and SCKRL-406 remain Review; no migrations, notification implementation, deployments,
commits or merges are authorized by this findings note.
