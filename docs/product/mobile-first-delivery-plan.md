# Mobile-First Delivery Review

Date: 2026-09-09

Execution update (2026-09-11): SCKRL-906 is Done locally with independent QA acceptance. Use the
[accepted test harness](../qa/application-test-harness.md) for subsequent tickets; references below
to starting the harness describe the original sequence. `status.md` remains the live handoff.

Scope: the user's requested review of the existing requirements and delivery plan. This is a
planning revision, not implementation acceptance or a change to historical ticket states.

## Decision

Keep the existing Expo, Next.js, and Supabase foundation and the narrow product promise in
`PROGRAM.md`: know what food is at home, where it is, and what to use next. Complete that loop on
mobile before expanding recipes, buying intelligence, premium, or the desktop experience.

The existing program is directionally sound. Its strongest decisions are explicit user correction,
expiry provenance, transactional receipt placement, private media, and deferring AI until there is
reliable data. Its weakness is execution scope: Stage 1 combines a large ingestion project,
multiple screens, notifications, and release validation without a smaller usable release boundary.
Later-stage records are a direction, not a schema checklist for the first release.

Use three delivery milestones: an internal mobile alpha, a small mobile beta, then a web companion.
The alpha is an intermediate Stage 1 checkpoint; it does not waive the remaining Stage 1 exit
criteria or open the learning stages. Deploying the Next.js API is an early mobile dependency;
building the desktop product is a later workstream.

## Current Product Truth

| Area                  | Assessment                                                                                                                                          | Implication                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Mobile foundation     | Auth, storage setup, manual stock, expiry views, recipe discovery, and shopping-list code exist; prior runtime evidence is recorded in `status.md`. | Extend the current app; do not restart it.                                           |
| Receipt entry         | Scan creates synthetic references; provider-backed ingestion and review/placement are incomplete.                                                   | A polished scan screen is not a functioning receipt product.                         |
| Inventory correctness | Snooze rewrites expiry; recipe completion removes all matched stock rows through separate requests.                                                 | Correct or restrict these actions before inviting external testers.                  |
| Backend               | CRUD and deterministic parsing exist; atomic promotion, durable jobs, private media, and finalization remain follow-ups.                            | Establish those contracts before dependent receipt UI.                               |
| Web                   | API and design/demo foundation, without an authenticated end-user companion.                                                                        | Treat web product delivery as new scoped work.                                       |
| Validation            | Shared-package tests and historical manual checks exist; app journey evidence is incomplete.                                                        | Build success and green empty test suites cannot establish mobile release readiness. |

Code anchors: `apps/mobile/app/(tabs)/scan.tsx`,
`apps/web/lib/receipt-parsing.ts`, `packages/api-client/src/receipts.ts`,
`apps/mobile/app/(tabs)/expiring.tsx` (`snoozeItem`), and
`apps/mobile/app/recipe/[id].tsx` (`handleCookedIt`).

## Milestone A: Internal Mobile Alpha

Outcome: the owner can take a real supported receipt through review and storage, find the resulting
stock after restarting the app, and maintain it without unexplained changes or duplicate entries.

1. Start SCKRL-906 and its bounded SCKRL-907/908 coverage. In parallel, finish SCKRL-020 from actual
   owner observations. Do not repeat the accepted SCKRL-021 through SCKRL-024 document audits.
   Independent foundation work can proceed while owner feedback is pending; SCKRL-304/307 retain
   their existing SCKRL-020 prerequisite.
2. Refine immediate correctness fixes into explicit tickets: snooze must preserve expiry;
   recipe completion must not silently remove whole matched lots; failed edits/retries must not
   report a successful stock change. Keep advanced recipe consumption out of this milestone by
   restricting the unsafe action until its contract is ready.
3. Deliver SCKRL-310 review data and SCKRL-406 expiry provenance, followed by SCKRL-311 atomic
   placement. Keep the existing stock projection and minimal acquisition events. Serialize edits
   to overlapping migrations; publish contracts and failure fixtures before frontend integration.
4. Deliver SCKRL-308 private media and SCKRL-307 real acquisition. Establish an installable mobile
   development build and reachable staging API through a bounded part of SCKRL-920 early enough
   to exercise permissions, uploads, authentication callbacks, and process interruption on devices.
5. Deliver SCKRL-309 durable OCR against the media and parse-generation contracts. Use polling for
   client completion, as already permitted by ADR-0001. Provider choice and worker deployment
   belong to that ticket; this review selects no new vendor.
6. Deliver SCKRL-304 review and SCKRL-305 placement, including both drag and tap paths. Integrate
   SCKRL-909 journey evidence incrementally and add receipt history/resume through SCKRL-306.

The data and media tracks may run in parallel with separate ownership. Review UI can proceed once
its contract and SCKRL-020 are accepted; it need not wait for production OCR. A deterministic fixture
is useful during development but cannot satisfy the alpha's real-receipt acceptance gate.

The first end-to-end increment can exercise one image format and a small declared receipt corpus.
The accepted SCKRL-307/308 ticket scope still includes the specified gallery/PDF formats; incomplete
format support must remain visibly incomplete or be split into explicit follow-up tickets before
an acceptance claim. Begin with receipts representative of the intended pilot, with Austrian/German
receipts as a planning default, not a claim of supported international OCR quality.

Alpha acceptance requires:

- A real image reaches durable reviewed stock; every included line is explicitly approved and
  links to its source. Parser confidence alone never approves it.
- Double submit, timeout followed by retry, and injected placement failure produce neither duplicate
  stock nor partial receipt placement. Failed reprocessing preserves the previous good generation.
- Permission denial, interrupted upload, OCR failure, manual fallback, and reopening an unfinished
  receipt have understandable recovery paths; reviewed edits survive app restart.
- Unknown, estimated, and user-confirmed expiry are distinguishable. Confirming an estimate does
  not turn it into a printed date. Snooze changes reminder state only.
- Manual add/edit/move/use/discard actions have clear outcomes and reload correctly. Any whole-lot
  consumption is explicit; quantity-aware recipe automation is deferred.
- Household authorization, private media access, and non-member rejection have integration evidence.
- The supported mobile platform/device and app version are recorded. Expo web export is not native
  device evidence; do not claim both iOS and Android are validated after testing only one.

Full offline synchronization is deferred. Preserve drafts and confirmed server state, show connection
failure, and make retries safe. Do not imply that an unacknowledged mutation has been saved.

## Milestone B: Small Mobile Beta

Outcome: a few households use the app across repeated shopping cycles without developer assistance.
Start with one account managing one household, consistent with the existing V1 exclusions. Invites
and multi-user household collaboration require a separate explicit scope decision.

Complete the remaining Stage 1 work: supported image/PDF acquisition, usable receipt history and
recovery, reminder registration/preferences and local-time delivery (SCKRL-411/412), notification
history (SCKRL-421), and real provider/device validation. Before shipping reminders, store snooze
separately, distinguish estimated dates in copy, and test opt-out, repeat suppression, and deep links.

Move minimum account recovery, account/media deletion, retention enforcement, release configuration,
safe error reporting, and backup/restore verification into the beta release gate. These cannot wait
for a later learning program simply because the larger privacy package is listed in Stage 2.
Create bounded tickets for missing coverage; documentation alone does not deliver these controls.
External processing follows ADR-0001's existing privacy and provider requirements.

Test iOS and Android independently before distributing the beta on both. Agree the first pilot
device with the owner when scheduling device QA; this review does not assume a platform preference.
Use a staging environment, installable builds, and a rollback/recovery runbook. Keep public app-store
submission and production promotion as separate release actions.

Use the existing measurement plan with a small initial subset: receipt completion, correction effort,
processing failures, time spent reviewing/placing, and repeat confirmed stock actions. A proposed
discovery cohort is 3–5 households over two shopping cycles. Observe whether they can complete the
loop unaided and whether stock stays credible; this is a qualitative learning checkpoint, not a
statistical retention claim. Establish usability and OCR thresholds from the initial corpus and
observations before making a wider-release decision. Integrity/security failures block release
regardless of average success rate. Broader analytics procurement need not block local QA evidence.

## Milestone C: Web Companion

After the mobile loop passes its beta gate, deliver shared-account sign-in, stock by location,
expiring items, and a shopping list with printing. Reuse contracts and server commands. Share domain
behavior and tokens; keep navigation and desktop layouts appropriate to the platform.

Use SCKRL-701 and SCKRL-715, with separately scoped stock/expiry screens. Defer the full SCKRL-705
dashboard until its statistics and suggestion modules are trustworthy. Do not claim stock/expiry
screens are already covered by a ticket that only defines a shell or dashboard.

Add SCKRL-711 receipt upload after web review/placement surfaces are explicitly scoped and the mobile
pipeline is proven. It must use the same private media, asynchronous processing, review, provenance,
and finalization contracts; depending on old SCKRL-303 alone is insufficient. Multi-file upload is
later than a working single-receipt web flow. Reconcile that increment with the existing ticket's
batch-upload criteria before marking the ticket Done.

## Required Ticket Refinements

These are planning changes to apply before the affected ticket starts; existing criteria and states
are not silently replaced by this document.

| Ticket/area                        | Required refinement                                                                                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SCKRL-304                          | Require explicit resolution of every included line, separate from confidence; specify persisted drafts and stale-generation conflicts.                                                                 |
| SCKRL-305                          | Use an honest save label until reminders are available; keep UI ownership here and the transaction in SCKRL-311.                                                                                       |
| SCKRL-306                          | Define post-placement edits: correct receipt history without silently changing stock; stock adjustments need a separate explicit action. Preserve a useful history view after media retention expires. |
| SCKRL-309                          | Reconcile its webhook/push requirement with ADR-0001's polling decision; depend on SCKRL-310 for atomic parse promotion. Split job machinery and provider integration if necessary.                    |
| SCKRL-406 / new correctness ticket | Separate reminder snooze from expiry, including existing manual Add/Edit paths.                                                                                                                        |
| SCKRL-505 follow-up                | Restrict destructive whole-lot recipe completion pending an explicit, recoverable consumption contract.                                                                                                |
| SCKRL-411/412                      | Add expiry provenance, snooze, timezone, preferences, duplicate delivery, and device-lifecycle contracts.                                                                                              |
| SCKRL-711                          | Replace the obsolete SCKRL-303-only dependency and scope web review/placement explicitly.                                                                                                              |
| SCKRL-910                          | Align the legacy event list with the accepted measurement vocabulary and consent/provider gates.                                                                                                       |
| SCKRL-920 / new release tickets    | Separate installable staging builds needed early from production release; ticket account recovery/deletion and operational readiness.                                                                  |

Keep recipe personalization, canonical product catalogs, prices/budgets, learned storage, broad
language expansion, premium, health features, and non-food inventory off the immediate queue.
After beta observations, choose the next capability by demonstrated user friction. The long-term
stages do not mandate building every proposed table or feature.

## Delivery Discipline And Cost

Keep one primary owner per ticket and independent QA. Delegate only bounded work with explicit file
ownership and stable contracts; do not launch every role for every change. Use expensive integration
review for contract decisions, conflicting evidence, and milestone acceptance. The GPT-5.5 xhigh
reviewer routing for this assessment is the user's explicit override for this review; this does not
change the standing roster in `TEAM.md`.

Re-estimate the next milestone after the first working receipt and device build. The program's sprint
ranges are hypotheses, not delivery commitments. Prefer a demonstrated end-to-end outcome over
counts of tickets marked Done.

## Review Evidence And Limits

Three GPT-5.5 xhigh reviewers returned product, implementation, and QA assessments. The integration
retains the existing architecture and prioritizes the concrete correctness gaps above. Current code
inspection agrees with the earlier Stage 0 finding that receipt handling is still a foundation.

On 2026-09-09, `pnpm test` and `pnpm typecheck` returned success using Turbo cache hits. The test
output reports 58 API-client, 8 UI, and 3 token tests; mobile and web both report no test files and
exit successfully through `--passWithNoTests`. These cached results do not constitute fresh runtime
validation. No physical-device journey, real OCR, live database authorization, production build,
provider assessment, or release certification was performed for this planning review.

Only planning documents are delivered. Ticket criteria refinements remain listed above, and no
application implementation ticket changes state because of this review.
