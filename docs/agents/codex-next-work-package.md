# Next session handover — GPT / Codex

Updated: 2026-10-04. State: SCKRL-312 source accepted to Review; implementation writers stopped.

**Active scope:** owner froze `feature/SCKRL-ASTRA` on 2026-10-03 to implemented work plus
its pending validation. Finish SCKRL-304/406/312 and this branch's SCKRL-908 smoke coverage, retain SCKRL-506 recipe expiry eligibility and its regressions,
verify existing review-data prerequisites, then complete independent closeout and update the
already-open draft [PR #4](https://github.com/redonhalimaj/sackerl/pull/4) into `dev`.
The owner explicitly authorized publication on 2026-10-04. Source/QA increment `6a04f82` was
committed and pushed, followed by a documentation publication checkpoint. Use the current GitHub
head when checking CI; preserve draft status and open acceptance gates. Do not create a duplicate PR. SCKRL-311/305/308/307/309/history/notifications and other new product implementation
are deferred to later branches and are not branch-closeout prerequisites. Global Stage 1 remains
incomplete after this branch closes. See the active branch table in [status.md](../../status.md).

**Publication checkpoint — 2026-10-04:** independent QA supported the bounded draft update;
all 22 frozen source hashes remain unchanged. Formatting/code map pass; integration lint,
typecheck and tests reused all 18 matching Turbo tasks (314 recorded tests). Source and QA
records are published in `6a04f82`; current PR description documents later runtime evidence and
remaining native/middleware gates. Publication does not close tickets, waive QA, merge or deploy.
Check CI on the latest branch head, then continue the remaining validation below. Historical
local/uncommitted references below describe earlier checkpoints and are superseded here.

**Latest continuation:** [Council source acceptance v1](council-decisions/COUNCIL-20261001-01.md)
received unanimous fresh final votes after independent QA and reciprocal Chair review.
SCKRL-312 is **Review**, not Done. Receipt review supports persisted unknown/dated/no-date expiry,
explicit re-review after included expiry edits, preserved drafts through failed/conflicted/uncertain
saves and token refresh, supported native removal prevention and clean saved **Done for now**.
Home discovers persisted saved reviews, pages beyond three, revalidates household and the same
receipt ID, guards stale async work and retains entries with Retry. Placement remains unavailable.

Independent [source QA](../qa/sckrl-312-review.md) passed 49 focused and 85 mobile tests.
Root integration: 314 workspace tests, all five lint/typecheck gates, formatting/diff/map checks
pass; map 671 callables/1,231 relationships/83 modules with zero stale files. iOS export passed
(1,289 modules, `/tmp/sackerl-312-ios-verified`). Actual fallbacks and file ownership are recorded
in the Council decision; root runtime model/effort was not exposed. Source remains local and
uncommitted on `feature/SCKRL-ASTRA` at `d550bd1`; preserve all edits.

**Migration follow-up authorized:** the owner asks Codex to do point 1, applying the prepared
SCKRL-312 migration to development after disposable tests. This supersedes the earlier replay/dev
application restriction only for this bounded operation. Root has executed 49 successful SQL steps
in three disposable PostgreSQL 14.20 databases: populated 312 upgrade/legacy/commands, clean replay
and post-312 SCKRL-310 regressions. Independent QA2 accepted the runner/logs and SQL evidence in [database QA](../qa/sckrl-312-database-review.md); the temporary server is stopped.
The source acceptance snapshot remains unchanged; these are local auth-stub results.

**Development installation complete — 2026-10-04:** the owner supplied `DATABASE_URL` in
ignored root `.env`. Read-only preflight verified the development target, client TLSv1.3, accepted
SCKRL-310 schema/security and byte-exact receipt RPC bodies. An initial checksum mismatch was
newline trimming in the local comparison, not hosted drift. The operational
[Council v1](council-decisions/COUNCIL-20261003-01.md) was unanimously ratified with fresh final votes.
Root asserted all four reviewed hashes and applied only SCKRL-312 in the guarded transaction:
baseline/preservation checks passed, COMMIT and exit zero were explicit, and the fresh read-only
postcommit verifier passed. All 15 receipts and 3 lines are preserved; schema, constraints, exact
save function and RLS/grants verify. PostgREST reload was notified on commit. No hosted fixtures,
other migration or migration-history changes occurred. Independent QA accepted the inspected execution log and postcommit metadata.
See [execution evidence](../qa/sckrl-312-development-migration-plan.md).

**Latest QA continuation — 2026-10-04:** 406 corrected local suites before/after312 and both
concurrency races passed, with independent [database QA](../qa/sckrl-406-database-review.md).
The final connected run `sckrl-qa-20261004081439810-1f570395` passed all 22 real Auth/PostgREST/shared
client stages and exact cleanup (two synthetic households, three users); process exit zero.
Temporary reviewed harness and all four run manifests/results are under
`/tmp/sckrl-connected-qa.hQUcwx`. Its final SHA is
`c9b38ec1aacc98e36bd96ea4cbec0ebeb35e5b33609e325b2a2ee94a33106524`.
Earlier failures were harness assertions (JSON key order, all-excluded review completion,
403 foreign-fact vs409 stale-fact), preserved as failed runs with complete cleanup; no product
source fix was needed. Independent QA accepted the [connected evidence](../qa/sckrl-304-406-312-connected-review.md).

**Native setup checkpoint — 2026-10-04:** Deputy and independent QA supported the exact
prepared lifecycle. Root created a fresh QA simulator, installed only the existing Expo Go binary,
verified the actual compiled Auth configuration points to development, and reached the fresh
signed-out login screen. Fixture run `sckrl-native-20261004085221557-f9d77650` provisioned two
synthetic users, one household, one saved sample and one unconfirmed stock estimate. Specific
GUI transmission authorization was requested but not received; no credentials were entered.
Root then finished the held fixture (exit 0, exact household/both-user absence, private login file
removed) and removed only the new QA device (exit 0); original simulator/session still shows the
same Home stock/sample. No native acceptance follows from successful setup/cleanup.

Temporary fixture helper/plan: `/tmp/sckrl-native-fixture.LBV655`, reviewed registry SHA
`3e5e92b9f508a2c2a44b9ca69fea36334d4fa0c8ef496aefd04321679106ac75`.
Device/cleanup scripts and completed manifest:
`/var/folders/sz/htc75wrs1gqc7qxrylld40sc0000gn/T/sackerl-native-device.sy4mlpbz`.
Device script SHA `d4cee12707e9611d62cc02c7c4892cd373c2bd6d3d670f97033363aed39bdb6a`;
cleanup SHA `15bb20c4b236fa247f26080775f4bcdde96b655f95c22ebd54c516b89e5cb2a4`.
Do not rerun in its old directory with an existing device manifest; preserve this evidence and
use a new private directory for a deliberately authorized new run. Recheck hashes/source and
live Metro destination; require fresh fixture lease/liveness and exact finally cleanup.
Approval must explicitly permit generated QA email/passwords in Sackerl to development
`https://raqqhpeailkxqvubgzir.supabase.co`; no owner password or service key is entered in the UI.

**Latest authenticated native continuation — 2026-10-04:** the owner explicitly approved
using generated QA logins against development. Do not request that authorization again.
Independent [native QA](../qa/sckrl-304-406-312-native-review.md) supports bounded receipt
correction/save, expiry states/date validation, dirty Back/Keep editing, clean Done for now,
saved Home resume after cold Expo Go restart, metadata-only stock Edit, same-date confirmation,
member clear/history and estimated Add, and owner/member calendar Settings. The supplementary
ordinary-owner readback passed before its live lease ended. Both authenticated holding processes
and exact guarded device cleanup exited zero; synthetic households/users/private login files
are removed, and the original simulator remains booted. Preserve the earlier expired final
readback failure as historical evidence; the new run supports its own freshly exercised actions.
See the report for exact run IDs, helper hashes, artifacts and acceptance limits.

**Next concrete action:** prepare bounded remaining validation for native edge-swipe, dirty
account switching, in-flight/conflicted/uncertain saves and keyboard/VoiceOver/accessibility;
Next.js middleware is a separate gate. Computer Use coordinate interaction failed, so gesture
and full screen-reader acceptance require an operable validation path. Do not infer these passes
from AX labels or API assertions. Preserve the original iPhone17/iOS26.5
`534D9647-8E3B-4EFE-A3F6-CF45A0905324` session/data. Any new synthetic run must recheck the
reviewed helper/source hashes, target and lease, then complete exact cleanup before checkpointing.
No new migration, batch push/history repair or deferred feature is permitted. SCKRL304/406/312
stay Review pending actual acceptance; source is uncommitted and draft PR4 remains the target.
Owner requests for a profile page/account entry and `Hello, <account name>` are recorded in
[feedback.md](../../feedback.md) as later-branch ticket proposals; no implementation started.

For later branches, SCKRL-311 placement remains contract-only and precedes SCKRL-305; it must implement canonical
placed-state filtering along with locked conversion, lineage/events, idempotency/recovery and
placed-review immutability. SCKRL-308 remains Ready as a separate private-media lane;
SCKRL-304/406 remain Review and SCKRL-908 remains In Progress. Only the bounded development 312 upgrade has been performed. No deployment, merge or new publication occurred; production and unrelated hosted changes remain excluded.

The owner requests continuation in GPT/Codex, not Claude. This supersedes the outgoing
`claude-next-work-package.md` and the mandatory alternating-assistant instructions from September 28.
There is no Claude implementation to collect or validate. Keep future checkpoints for Codex unless
the owner explicitly requests another provider. This update is documentation only; it does not start
a feature or waive a QA gate. The later sample addition below supersedes that earlier scope note.

**Latest increment — development sample (2026-09-29):** Council
[COUNCIL-20260929-01](council-decisions/COUNCIL-20260929-01.md) accepted a development-only
**Scan → Load sample receipt** path after the owner had no parsed fixture to open.
`apps/mobile/lib/sample-receipt.ts`, Scan and its tests are in commit `d550bd1` on the feature
branch, after published commit `5f3c395` / [draft PR #4](https://github.com/redonhalimaj/sackerl/pull/4).
Milk, Bananas and Bread are clearly synthetic unresolved parser rows saved via existing authenticated
commands; no stock write. Same-session retry recovers uncertain creation by URI and reuses a known
receipt/generation, preserving edits. Recovery state is in memory and is lost on restart/unmount.
Independent [source QA](../qa/sckrl-304-sample-review.md) supports Review; owner screenshots now
show partial connected/native behavior, while reload persistence, correction, conflict and full
accessibility validation remain open. Root implemented; Deputy and QA explicitly
used configured `gpt-6-sol` / `high` fallbacks (preferred routes unavailable). No migration/deployment
or additional publication occurred. This historical sample checkpoint is superseded for next work by the SCKRL-312 checkpoint above.

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
- The development-only sample route now gives the owner a practical review-editor QA path. The
  owner reached the editor and saw a save-success message; persistence after reopening, field
  correction, conflict/failure behavior and native accessibility still need independent QA.
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

> Continue only the closeout of feature/SCKRL-ASTRA from status.md and this package, using the
> Council and separate independent QA. Preserve all current local edits. Validate the implemented
> 304/406/312 receipt and expiry work, existing 310/506/harness foundations and this branch's smoke
> coverage. Local 312 SQL/development installation, corrected406 SQL/concurrency and final
> connected L2 passed and independently accepted; native and Next-route gates remain open. Dev DATABASE_URL is supplied. Do not rerun
> the installed 312 upgrade or repair migration history. Do not start 311/305, media/OCR, history, notifications or other
> new features; those belong to later branches. Update existing draft PR #4 into dev rather than
> creating a duplicate; source acceptance does not mean Done or authorize merge/deployment.
