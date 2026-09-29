# Next session handover — GPT / Codex

Updated: 2026-09-29. State: ready for a future Codex session; no active implementation writer.

The owner requests continuation in GPT/Codex, not Claude. This supersedes the outgoing
`claude-next-work-package.md` and the mandatory alternating-assistant instructions from September 28.
There is no Claude implementation to collect or validate. Keep future checkpoints for Codex unless
the owner explicitly requests another provider. This update is documentation only; it does not start
a feature or waive a QA gate. The later sample addition below supersedes that earlier scope note.

**Latest increment — development sample (2026-09-29):** Council
[COUNCIL-20260929-01](council-decisions/COUNCIL-20260929-01.md) accepted a development-only
**Scan → Load sample receipt** path after the owner had no parsed fixture to open.
`apps/mobile/lib/sample-receipt.ts`, Scan and its tests are local uncommitted changes on top of
published commit `5f3c395` / [draft PR #4](https://github.com/redonhalimaj/sackerl/pull/4).
Milk, Bananas and Bread are clearly synthetic unresolved parser rows saved via existing authenticated
commands; no stock write. Same-session retry recovers uncertain creation by URI and reuses a known
receipt/generation, preserving edits. Recovery state is in memory and is lost on restart/unmount.
Independent [source QA](../qa/sckrl-304-sample-review.md) supports Review; connected creation/read/save
and native visual/accessibility validation remain open. Root implemented; Deputy and QA explicitly
used configured `gpt-6-sol` / `high` fallbacks (preferred routes unavailable). No migration/deployment
or additional publication occurred. Continue with owner QA before choosing the next implementation.

**Later owner authorization, 2026-09-29:** commit the accumulated branch work and open a PR into
`dev`. Staging, commit and branch push are authorized for that publication; merge, deployment and
migration/provider changes remain prohibited. The PR is a draft while 304/406 runtime gates remain.
Inspect the current Git/GitHub state for its final commit/URL; do not follow the earlier no-commit
instructions as a bar to the explicitly requested publication.

## Start here

1. Read the Current work checkpoint in [status.md](../../status.md), `AGENTS.md`, `CLAUDE.md`
   (repository guidance still applies regardless of its filename), `TEAM.md`, the
   [Council workflow](council-workflow.md) and [session handoff rules](codex-claude-handoff.md).
2. Read [the latest simulator findings](../product/simulator-findings-2026-09-29.md), the original
   [phone-feedback triage](../product/phone-feedback-triage-2026-09-13.md), and `feedback.md`.
   The [readable roadmap](../product/notion-program-roadmap.md) maps those requests to tickets;
   `PROGRAM.md` defines stages and gates, while `features.md` defines accepted ticket scope.
3. Inspect branch/HEAD, `git status --short`, staged and unstaged diffs, and relevant untracked files.
   The pre-publication checkout was `feature/SCKRL-ASTRA` at `fbd18c5`; verify the current HEAD.
   Previously staged/untracked source is included in the requested publication. Preserve any later
   local changes and the owner's Obsidian layout. Inspect both commits and the actual working tree.
4. On a development resume, use the Council to triage the latest owner findings before selecting
   one bounded task. SCKRL-308 remains the previously accepted next foundation candidate; its
   implementation contract has not been ratified. Do not automatically start every finding or treat
   further receipt acquisition or OCR work as approved by the bounded sample addition above.
5. Name the ticket, scope, actual available models and file owners in status before implementation.
   Use TEAM.md's Codex routing. If an exact model is unavailable, record the limitation and resolve
   routing explicitly; never claim an unavailable model ran. Retain separate independent QA.

## Implemented and validated locally

- **SCKRL-304 — Review:** Scan opens `/receipt-review/[id]` after receipt persistence. The route
  reads an active generation; edits effective values; supports explicit review/exclusion and manual
  additions; and saves every existing line with generation/revision guards. Persisted manual lines
  use database IDs; only new manual lines use stable client IDs. Failed saves and conflicts retain
  drafts; reload requires a discard choice. Session/navigation guards prevent stale responses and
  delayed writes after context changes. Placement remains visibly disabled and does not write stock.
- Source: `apps/mobile/app/receipt-review/[id].tsx`, `apps/mobile/lib/receipt-review.ts`, its fixture
  and tests, `apps/mobile/lib/scan-review-entry.test.tsx`, Scan and root layout integration.
- Council [COUNCIL-20260928-02](council-decisions/COUNCIL-20260928-02.md) records unanimous source
  acceptance to Review. Initial Frontend saved partial code then stopped at a limit; root completed
  it. Independent QA did not implement the accepted code. See [QA report](../qa/sckrl-304-review.md).
- Evidence from September 28: 44 mobile tests/7 files; independent QA reran 24 focused tests/3 files
  and typecheck. Mobile lint/typecheck, source formatting and iOS export passed (1,286 modules).
  Generated code map: 645 callables, 1,164 relationships, 81 modules, zero stale files.
- **SCKRL-406 — Review:** expiry provenance, Add/Edit handling, household calendar, member reads
  and recipe calendar consumers are implemented and source reviewed. See its
  [contract](../features/sckrl-406-expiry-provenance.md), [QA report](../qa/sckrl-406-review.md)
  and historical [implementation ledger](claude-work-package.md). That filename is historical,
  not a current Claude assignment.
- **SCKRL-506 — Done locally:** overdue/unknown-date stock is excluded from recipe eligibility.
  This does not complete warning/notification behavior or certify that food is safe.

Pre-publication checks on September 29: full format check, all five lint/typecheck tasks and
218 workspace tests pass (207 executed, 11 token/UI tests from Turbo cache); code map has zero stale
files. `.prettierignore` excludes local tool/editor state and Expo-generated declarations, preserving
Obsidian preferences rather than reformatting them. No database/runtime acceptance is implied.

## What the owner can actually see, and what remains open

- Scan is simulated. It creates a receipt record, uploads no photo and starts no parsing job.
  The owner reached “Review not ready”; Refresh only reads the same receipt. This is limited
  native rendering evidence, not validation of parsed-line editing, saves or placement.
- The owner needs a practical route into review-editor QA. An explicit development-only sample
  preview was suggested but is neither ratified nor implemented. An isolated parsed fixture is an
  alternative when the required environment and operations are authorized.
- Password reset mail did not arrive. A later `/recover` attempt returned 429 with 11 seconds
  remaining. The original delivery failure is undiagnosed. The app also lacks recovery-link/new-
  password handling and its “email sent” message overstates delivery. Later signed-in screenshots
  do not prove recovery worked. Track through SCKRL-008 / bounded SCKRL-020 follow-up triage.
- Home overlaps the status/Dynamic Island region in the screenshot; exact scroll/reproduction
  conditions remain unknown. It also says “0 dinners” while recommending skipping shopping.
  Route these through the dashboard/SCKRL-203 and simulator QA work before making corrections.
- Calendar Settings renders Europe/Vienna; saving/reloading and owner/member behavior have not
  been established by the owner's screenshot.
- SCKRL-304 and SCKRL-406 still need their connected runtime and native/accessibility checks.
  Do not mark either Done or recast passing mocked tests as those checks.

## Notification and broader feedback must carry forward

Yellow estimate warnings, red overdue warnings/double-exclamation and explicit discard are
SCKRL-407 (Todo). Separate snooze state is SCKRL-408 (Todo). Push registration, controllable overdue
reminders, household-local scheduling, duplicate suppression and inbox are SCKRL-411/412/421,
specified but not implemented. A reminder must never automatically discard stock.

Optional package photo/barcode is SCKRL-409; personal recipes SCKRL-507; collection sharing
SCKRL-508; bounded swipe navigation SCKRL-902; optional nutrition/calories SCKRL-930. These remain
staged backlog/discovery work; AI comes later under the program gates. None is silently dropped.

## Previously selected candidate: SCKRL-308 local private media foundation

If selected after reviewing the new findings, convene Infrastructure as primary owner, Backend
support and independent QA. Ratify the contract before implementation. The accepted handover scope:

1. Publish `docs/features/sckrl-308-private-receipt-media.md` with upload/finalize/read/deletion,
   authorization, retry and failure contracts. Follow ADR-0001; document refinements first.
2. Implement local private Supabase `receipt-media` policy definitions, household/receipt-scoped
   references, server-authorized access, finalization verification and durable media metadata.
   New forward migration source is permitted; applying/replaying it is not.
3. Validate supported image/PDF content and size from server-observed evidence, not client MIME
   alone. Store bucket/path rather than expiring signed URLs. Keep privileged keys server-side.
4. Provide idempotent deletion/cleanup. ADR defaults are 30 days after placement, or capture for
   abandoned/failed receipts, with earlier requested deletion. Do not invent placement timestamps.
5. Test authorization, malformed/oversized files, expiry, retries, duplicate finalization, missing
   objects and repeat cleanup. Publish contracts for SCKRL-307/309 without implementing those tickets.

Missing provider, RLS and database execution evidence keeps this in Review/QA rather than Done.

## Environment and restrictions

- No migration application or replay anywhere, hosted bucket/configuration writes, deployment,
  merge, resetting or unrelated feature implementation. Staging/commit/branch push are permitted
  only for the explicit publication request recorded above; future publication requires its own authorization. Do not start SCKRL-407/408
  or notifications under this handover; they remain recorded requests awaiting authorized scope.
- Codex applied neither pending SCKRL-310 nor SCKRL-406 migration. The owner's hosted migration
  state remains unverified. Do not insert synthetic SQL-suite fixtures into hosted household data.
- The simulator was launched September 29 with `pnpm --filter @sackerl/mobile ios:simulator`;
  iPhone 17 Pro / Expo Go bundled 1,452 modules, Metro at `127.0.0.1:8081`. Inspect current processes
  before starting another Metro. Keep credentials in existing ignored environment files.
- The Notion roadmap is local only. Last publication attempt September 27 failed with HTTP 403
  due to the workspace block limit. Do not claim it was published; capacity has not been rechecked.

## Finish the next session

Update status, findings, ticket/contract and affected code-map notes with actual behavior and
evidence. Regenerate/check maps after source changes. Obtain independent QA for implementation,
keep unresolved gates explicit, stop delegated writers and release named file ownership.
Update **this Codex handover** with the next concrete action and resume prompt. Do not create a
Claude package or require alternating providers unless the owner explicitly changes the preference.

## Future Codex resume prompt

> Continue Sackerl from status.md and docs/agents/codex-next-work-package.md. The previous writer
> has stopped. Read the repository instructions, inspect the actual staged/unstaged/untracked tree,
> and use the Council with explicitly recorded available Codex models. First review the September 29
> simulator findings and original notification/product feedback, then select one bounded next task.
> Preserve SCKRL-304/406 Review gates and all migration/hosted-write/commit/merge restrictions.
> Keep status and the Obsidian map current, obtain independent QA, and checkpoint for another
> GPT/Codex session when finished. Claude is not part of this handover.
