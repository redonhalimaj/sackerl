# Council review: SCKRL-311 implementation continuation

Opened: 2026-10-19. Continued: 2026-11-01. Lane: Complex.
State: Source-v4 unanimously ratified for bounded local acceptance; full ticket remains Review.

This continues the [ratified placement v1 design](COUNCIL-20261015-02-placement.md); its immutable
proposal and historical votes are unchanged. The owner directs the Chair to analyze, orchestrate
and directly instruct the Lunas, with Astra used only for brief routing and work reviews. The
owner subsequently requests a Claude implementation handoff after this work, with Codex doing
independent QA. Neither instruction starts a next feature or grants hosted migration authority.

## Predeclared participants and ownership

| Participant                     | Actual route / effort                                 | Responsibility                                                                        |
| ------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Chair `/root`                   | GPT-6-based runtime; exact variant/effort not exposed | Analysis, orchestration, instructions, policy/status, runner, integration and handoff |
| Astra `/root/astra_review`      | `gpt-6-astra` / `high`                                | Brief routing only; task completed before implementation wave                         |
| Astra `/root/astra_work_review` | `gpt-6-astra` / `xhigh`                               | Actual work review and acceptance vote; the same Astra seat, not an additional voter  |
| Luna A `/root/luna_a`           | `gpt-6-luna` / `xhigh`                                | Primary Backend/Infrastructure owner: migration, fixtures, contract and ADR addendum  |
| Luna B `/root/luna_b`           | `gpt-6-luna` / `high`                                 | Typed client, HTTP boundary and tests                                                 |
| Luna C `/root/luna_c`           | `gpt-6-luna` / `xhigh`                                | Independent QA; report only, no implementation edits                                  |

Final voters are Chair, Astra work reviewer, A, B and C. The Chair declared these seats before
findings. Implementation ran as root plus three Lunas after routing completed. Astra review runs
only after a worker completes, within four active runtime slots. There are at most two source
owners, one independent QA seat and one writer per file boundary.

## Review findings and corrections

- Independent QA identified zone existence validation before the zone lock. A moved the
  authoritative validation after sorted zone locks, preserving stable missing-zone errors.
- Client review identified unexpected successful non-200 replies escaping as successful HTTP
  status. B maps these to 502 with `outcomeUnknown`, and tests malformed, duplicate and unsorted
  canonical responses. Exact command/key recovery is preserved.
- Source integration passes all 18 Turbo lint/typecheck/test tasks, nine cached, with 370 recorded
  tests. Formatting and diff checks pass. Independent QA reproduced the focused client/web tests.
- C found the disposable runner's isolation appropriate in static review. Astra initially
  **Objected** to its execution packet because the concurrent fixture had stale two-item
  expectations, sleep-based scheduling without observed blocking and missing child cleanup.
  A revised helper removed artificial receipt prelocks, observed actual `PgSleep` and blocking PIDs,
  derived included-line counts and bounded/cleaned child processes. Astra explicitly supported that
  exact revised packet, then separately reviewed the later four-gap test extension. No approval was
  inferred from silence or from isolation alone.

## Evidence boundaries

The new runner prints a plan by default and accepts no existing application/hosted connection.
Its execution path creates a fresh PostgreSQL 14 cluster under `/private/tmp`, with TCP disabled,
private Unix socket, explicit coordinates, a sanitized environment, isolated clean/populated and
310/406/312 regression databases, bounded subprocesses, input hashes and retained logs. It attempts
to stop only its owned cluster and records cleanup failure. Separate sandbox execution permission
was obtained for the reviewed disposable runs. The final replacement run passed all 95 steps,
all 95 logs exist, all 32 input hashes match and the owned cluster stopped. Independent QA inspected
the actual evidence without claiming a second execution. See [database QA](../../qa/sckrl-311-database-review.md)
and [independent source QA](../../qa/sckrl-311-source-review.md).

The final local run exercises eight observed-blocking cases, forced household/UTC day separation,
exact two-zone assignment, normalized replay and post-placement pagination. Actual concurrent
multi-zone placement/deletion remains unexecuted; its single-zone deletion case and inspected
lock-order source must not be called exhaustive proof. Hosted installation, real Auth/PostgREST
acceptance and mobile placement are separate. SCKRL-311 remains **Review**, not full-ticket Done.
SCKRL-304/406/312 remain Review, SCKRL-908 In Progress and Stage 1 incomplete. No simulator rerun,
provider call, hosted migration, deployment, publication or next feature is included.

## Final revision and votes

<!-- acceptance:v1:start -->

### SCKRL-311-source-v1 — bounded local acceptance

Accept the exact 64-entry [source manifest](../../qa/sckrl-311-source-manifest.json), including
one generated-file deletion, SHA-256
`79e67d9c7d933b664f0f745cecab07cc39959c5990a3ddf1498cc82c8c478e4b`.
Its files cover the local backend, tests/fixtures/runner, contract and QA records, code maps,
the owner's Council responsibility update and the gated Claude implementation/Codex QA handoff.
`status.md`, this vote ledger and the manifest itself are excluded bookkeeping; no source entry
may change under this acceptance. The manifest and every entry must match before each vote.

Evidence: 18 successful Turbo tasks (nine cached), 370 recorded tests, production web build,
format/diff checks and current generated-map verification. Final disposable SQL results at
`/private/tmp/sckrl311-validation.6yvy7l5d/results.json` have SHA-256
`0988aaf97ebadd2810da85e396adf51cf74cf4deba8b0b1504ebf3648964ee08`:
95 zero-exit steps, 95 logs, 32 unchanged input hashes, eight observed-blocking cases and confirmed
owned-cluster shutdown. Independent QA inspected the actual final artifacts without rerunning SQL.

Outcome: accept the bounded local implementation and executed disposable evidence. SCKRL-311 stays
**Review** for hosted/connected and remaining acceptance; do not mark the entire ticket Done or
enable placement UI. Concurrent multi-zone placement/deletion remains unexecuted; the existing
single-zone deletion race plus two-zone assignment/source inspection is not exhaustive lock-order
evidence. Hosted target/schema execution, real Auth/PostgREST, applicable prerequisite acceptance,
mobile recovery/UI and Stage 1 exit gates remain separate. No provider, hosted write, deployment,
commit, push, merge or next implementation is authorized by these votes.

The Chair leads analysis, orchestration, evidence synthesis and direct Luna instruction; Astra is
used for brief routing and actual work reviews only. The Claude package is prepared for subsequent
implementation after its gates, with Codex independently reviewing it. It does not launch Claude,
transfer an unfinished SCKRL-311 implementation or start SCKRL-305 while blocked.

Alternative: withhold all local source acceptance until hosted and exhaustive activation checks.
Strongest counterargument to accepting now: a passing local backend is not the finished receipt-to-
stock feature. Response: the ratified design explicitly permits a bounded source increment; the
manifest and Review state preserve every remaining activation/product gate. Accepting tested source
does not waive them or fabricate complete feature acceptance. All five final voters must explicitly
Support this exact revision; silence, proxies, historical votes and author self-review do not count.

<!-- acceptance:v1:end -->

### Preliminary votes — SCKRL-311-source-v1

Chair recommendation: **Support** this bounded revision, subject to the actual independent votes;
this does not accept hosted activation or full-ticket completion.

| Participant | Vote | Evidence/rationale |
| --- | --- | --- |
| Astra work reviewer | Object | Verified exact manifest and evidence; malformed/mismatched 200 SDK replies become HTTP 200 error bodies. Requires 502 and a real SDK-to-route regression. |
| Luna A | Support | Authentic preliminary Support on v1/hash after verifying all 64 entries, SQL artifacts and bounded backend scope. |
| Luna B | Support | Authentic preliminary Support on v1/hash and verified evidence, before Astra identified the composition defect. |
| Luna C | Needs evidence | Verified all entries and final SQL; the proposal omits the separate unexecuted placement-wins/delete-later ordering already recorded in database QA. |

### Reciprocal Chair review

The Chair accepts both findings. Source v1 is **not ratified**: A/B Support cannot override
Astra Object or independent QA Needs evidence. B is assigned the narrow malformed-200 error-status
fix and real SDK/route composition regression; C reviews it independently. The next proposal will
explicitly preserve both concurrent multi-zone and placement-wins/delete-later evidence gaps.
SQL source is unchanged and its accepted execution evidence is reusable; affected TypeScript
checks and source hashes must be refreshed. Publish v2 and obtain all fresh votes after those
changes; do not reinterpret these v1 votes as approval of the revision.

### Final votes — SCKRL-311-source-v1

No final votes were requested: preliminary unanimity was absent. The immutable v1 manifest and
proposal remain historical review evidence and are not an accepted baseline. Fresh v2 follows
after the concrete fix, independent QA and updated source/evidence manifest.

## Continuation — 2026-10-22

The owner requests completion of the local review and preparation of the Claude handover.
The fixed source-v2 voters were declared in status before new findings: Chair, Astra, A, B and C.
New sessions replace the corresponding historical seats, without substituting or reusing votes:

| Seat | Actual session/model/effort | Current file boundary |
| --- | --- | --- |
| Chair | `/root`; GPT-6-based, precise variant/effort not exposed | Status, Council records, manifest, handover, maps and integration |
| A | `/root/luna_a_311`; `gpt-6-luna` / `xhigh` | Disposable concurrency helper and necessary synthetic fixtures only |
| B | `/root/luna_b_311`; `gpt-6-luna` / `high` | Verify client/web correction; development/connected execution planning |
| C | `/root/luna_c_311`; `gpt-6-luna` / `xhigh` | Independent source/database QA; no implementation changes |
| Astra | Work-review session to be recorded; `gpt-6-astra` / `xhigh` | Bounded execution-packet and final source/evidence reviews |

The Chair preserves the historical v1 proposal, votes and manifest unchanged. Source-v2 will use
`docs/qa/sckrl-311-source-v2-manifest.json`, not overwrite the v1 manifest. No v2 votes are
inferred from the earlier review. The ratified placement transaction/API design remains unchanged.

The inherited malformed HTTP-200 fix and real SDK-to-route regression are present. B freshly ran
58 receipt-client and 12 route tests; root integration passes 18/18 Turbo tasks, all from matching
cache, with 372 recorded tests. The production web build was freshly executed successfully.
A is adding actual opposing-input multi-zone contention and placement-before-zone-delete
evidence, independently reviewed by C before execution review. Disposable SQL execution, local
source acceptance, hosted installation and full ticket activation remain separate gates.

The development/connected packet is planning only. Chair review corrected alternate-key canonical
response semantics and separated receipt-deletion preservation from household cleanup; independent
QA additionally challenged session lifetime during cleanup, member provisioning and event
preservation assertions. No hosted write or new feature is authorized by preparing those artifacts.

### Restart recovery and execution review — 2026-10-23

The server restart ended the 2026-10-22 sessions. Root verified the actual checkout, saved helper
and retained run directories before resuming; no new local SQL run or completed hosted probe had
occurred. Replacement sessions retain the same predeclared seats and routes:
`/root/luna_a_311_resume`, `/root/luna_c_311_resume`, `/root/astra_review_311_resume`;
B returns in the next wave. No prior source vote transfers to these sessions.

The exact disposable execution packet binds helper SHA-256
`d94fa3a7094767c48be47e4631ad479f35cb80e37267d0a3fb2d094edfbbc7ee`
and unchanged runner SHA-256
`b2c1ee9aa3fe8ceeb9f3445521fee9ce44dc1cf33121eb848aebeb3a3b577b96`.
Command: `python3 supabase/tests/run_sckrl_311.py --pg-bin /opt/homebrew/opt/postgresql@14/bin --execute`.
Plan-only inspection confirms 13 migrations, 32 hashed inputs and five isolated databases.
Chair reviewed the actual saved source and supports this bounded execution. A independently
verified syntax and source, recommending Support subject to the other reviews/permission;
C and Astra each explicitly **Support** this exact local execution packet after independent
source/hash inspection. These execution reviews do not accept unseen results or source-v2.

Review corrections are present in this hash: fresh synthetic zones avoid the existing basement
fixture; actual stock/event IDs and zones must match canonical results; unexpected successful
deletion raises inside a subtransaction and rolls back immediately. The new combined scenario
adds three observed-blocker phases to the eight existing concurrency scenarios. It must not be
counted as two separately executed tests or exhaustive proof of every interleaving.

A separately reviewed metadata-only development probe now succeeds over client TLSv1.3 for
the historical expected development project. Placement tables/lineage are absent; receipt expiry
and expiry facts are present. This is read-only catalog evidence, not the full installation
baseline or connected acceptance. No hosted write occurred. Applicable sandbox permission is
obtained separately for the disposable PostgreSQL execution.

### Failed observation and corrected packet — 2026-10-23

The first new run is retained at `/private/tmp/sckrl311-validation.8b941dfv/results.json`, SHA-256
`cdf40cd4ee35d89ae55999cf88e9499b10794649ae3c2d756a1b35f91ba7c438`.
It has 95 steps/logs and 32 unchanged inputs; only step 94 concurrency failed, while step 95 stopped
the cluster and the PID file is absent. Both placers were observed blocked by the higher-zone gate,
but the observer did not see both lower-zone delete blockers simultaneously. No successful
concurrency outcome is inferred from this run. C and Astra independently inspected these artifacts.

The corrected helper is SHA-256
`d8a138c27c8fd98b8667650256d97019dae1ce0e9e6c0af269928ace38767ad1`;
the runner/command are unchanged. First, with only high-first placer A running, a lower-zone
delete probe must be observed blocked exactly by A, time out with `55P03`, and fully roll back
before B starts. This proves lower-before-higher locking despite the submitted higher-first order.
B then contends on the higher-zone gate. The final delete must have a nonempty blocker subset of
the actual observed A/B application-and-PID pairs; it need not report all shared-lock holders at
once. Both placements, the final `23503`, exact mappings and cleanup remain required.

Astra identified that the proposed 20-second gate exceeds the inherited 15-second lock timeout;
the new-case placements/final delete now use bounded 30-second local timeouts, while the probe
retains two seconds. Observers retain actual PostgreSQL diagnostics on failure. Root inspected the
actual corrected source; C and Astra each explicitly **Support** this exact corrected execution
packet after independent source/hash inspection. No runtime migration or transaction contract
changed. A fresh isolated replay is justified by this failed observation and corrected proof;
historical results are not reused as a pass for changed test inputs.

## Source-v2 evidence freeze — 2026-10-24

The corrected replay at `/private/tmp/sckrl311-validation.a3vvont4` passes all 95 subprocess steps.
All 95 logs exist, all 32 inputs match, `checksPassed` and `clusterStopped` are true and the PID
file is absent. C independently inspected the actual source/artifacts and authored the two QA
reports; C did not rerun SQL. There are nine concurrency scenarios: the previous eight and one
combined zone scenario with four observed-blocker phases. Failed `8b941dfv` remains historical.

The Chair's final format/diff checks, generated-map check (715 callables, 1,316 relationships,
88 modules, zero stale files), 458 local Markdown targets and all 66 manifest entries pass.
The historical v1 manifest remains byte-for-byte unchanged and is itself included in v2.
The Oct 22 web build and unchanged TypeScript checks are reused with explicit cache attribution.
All implementation and QA-report writers have released their files before this freeze.

<!-- acceptance:v2:start -->

### SCKRL-311-source-v2 — bounded local source and disposable evidence

Accept the exact 66-entry [source-v2 manifest](../../qa/sckrl-311-source-v2-manifest.json), including
one generated-file deletion, SHA-256
`d9b1414da2536ba83cc889ad46099a81bac79dd83e73110d8279fb6da4d881b5`.
It binds the local placement backend, SDK/HTTP boundary, fixtures/runner, contract and QA evidence,
code maps, owner-directed Council responsibilities, development planning and gated Claude
implementation/Codex QA handover. `status.md`, this ledger and the manifest itself are excluded
bookkeeping. The manifest and every entry must match before each vote; no accepted source file
may change under this revision. Historical source-v1 remains unratified and unchanged.

Evidence: 18 successful Turbo tasks with all 18 served from matching cache and 372 recorded tests;
fresh 58 receipt-client and 12 placement-route tests; fresh successful web production build on
Oct 22; current format/diff, generated-map and link checks. Disposable PostgreSQL 14.20 results at
`/private/tmp/sckrl311-validation.a3vvont4/results.json` have SHA-256
`5c79d11c6b2e58e462a5136dc24487723656707f1566bddb42580871e0f2967a`:
95 zero-exit steps/logs, 32 unchanged inputs, nine concurrency scenarios and owned-cluster shutdown.
C independently inspected retained source/artifacts, without claiming a second execution.

The HTTP-200 malformed/mismatched response defect now returns SDK/HTTP 502 with `outcomeUnknown`
through a real SDK-to-route regression. The combined multi-zone case proves A holds the lower zone
while blocked at the higher gate despite high-first input, rolls back its bounded probe before B,
then observes opposing placements and a later delete. Both placements, the final stock-FK rejection
and exact result/stock/event mappings pass. The final delete reports an actual known blocker
subset; neither all simultaneous blockers nor exhaustive interleavings are claimed. The failed
observer attempt remains visible. The limited hosted probe is read-only catalog evidence only.

Outcome: accept the bounded local source/evidence increment, retaining SCKRL-311 **Review**.
Full development baseline comparison, concrete migration executor/connected harness, separately
authorized hosted installation, real Auth/PostgREST/schema-cache/recovery, applicable 304/312
prerequisite acceptance, SCKRL-305/native/accessibility and Stage 1 exit gates remain open.
No placement UI is enabled. The prepared Claude package transfers no hosted/provider/deployment,
commit/push/merge or new-feature authority; ownership release and first action are recorded in status.

Alternative: withhold all local source acceptance until hosted/product acceptance. Strongest
counterargument: disposable auth stubs and a local backend cannot establish the finished receipt-to-
stock journey. Response: this accepts a reproducible bounded source increment while preserving
every activation and product gate. It does not rename local checks as connected/native evidence,
mark the full ticket Done, or start blocked work. All five fixed voters must explicitly Support
this exact revision; conditional support, historical votes, proxies and silence are not assent.

<!-- acceptance:v2:end -->

### Preliminary votes — SCKRL-311-source-v2

Chair: **Support** the exact source-v2 manifest/proposal above within its bounded local scope.
Fresh Astra/A/B/C votes are requested after this publication; none is inferred from packet review.

Proposal SHA-256: `7227a876d9eec3d1a944a8d897b03667635f943f7bc28438b917972ad2b2951f`
over the exact 3,208 UTF-8 bytes between the `acceptance:v2` markers, including their surrounding
newlines. Manifest SHA-256: `d9b1414da2536ba83cc889ad46099a81bac79dd83e73110d8279fb6da4d881b5`.

## Session reset and durable evidence — 2026-11-01

The intervening reset left all 66 v2 entries unchanged but removed the temporary raw SQL/probe
artifacts. No worker preliminary votes or final v2 acceptance were received or recorded. V1/v2
remain unratified immutable history. Before new findings, status retains the fixed Chair/Astra/A/B/C
source-v3 voter seats and existing model/effort routes; no interrupted task is a vote.

The reviewed runner/helper remain unchanged at `b2c1ee9a…b577b96` / `d8a138c2…8767ad1`.
Root added a plan-by-default ignored capture wrapper, SHA-256
`ca93893bf80a129eb8f5e9793ba784780fbd99ca70e5487d27f2d72f68eaf361`.
C (`/root/luna_c_nov1`, `gpt-6-luna`/`xhigh`) requested failure-safe registry handling before
execution. Root corrected it; C explicitly Supported this exact bounded execution/archive packet.
An initial durable incomplete record precedes the child process; errors/unknown cleanup remain
explicit, and only top-level synthetic results/logs are archived, without database data or env files.

Normal sandbox execution failed at initdb shared-memory creation. The resulting failed archive
`run-4v3a77e6` is retained and independently inspected as a restriction, not SQL evidence.
Separate escalation then allowed the unchanged reviewed replay and capture. Selected workspace
archive is `.env.qa-sckrl311-evidence-20261101/run-zu04vnsp`, raw results SHA-256
`efa909150f3d978780f1c7d2f6b7592b9e0670096cf46094bfc617b0f0ba4a8f`, registry SHA-256
`8a0b142dc49881794823bbf848a9a1822e4517663a5cca57c700bfa4c7b9e48c`.
All 95 steps/logs pass, all 32 input hashes and 98 archive file hashes match. Shutdown/PID absence
are confirmed and no database data was archived. C independently compared all 97 copied raw files
with the still-present originals, as well as inspecting the archive and four blocker observations;
C did not rerun SQL. This repairs the evidence gap without changing implementation or contracts.

Source-v3 will preserve both old manifests and bind the replacement archive plus updated QA and
handover guidance. The old hosted probe is historical reported evidence only, not current target
state. Full baseline/executor/harness, authorized hosted installation, real Auth/PostgREST,
prerequisite/native/UI and Stage 1 gates remain separate. No hosted write occurred.

## Source-v3 freeze and proposal — 2026-11-01

Before freeze, A found ambiguous handover wording that could imply acceptance/ownership release
already existed. Root clarified that the checkpoint is authoritative and neither is implied by
the package. No code or contract changed. C released the two QA reports after archive inspection.
All 67 entries match; format/diff, map (715/1,316/88, zero stale) and 468 local-link targets pass.
Voter seats remain Chair, Astra, A, B and C, with fresh votes only. A is
`/root/luna_a_311_resume`, C `/root/luna_c_nov1`; B and Astra use their resumed seats/routes.

<!-- acceptance:v3:start -->

### SCKRL-311-source-v3 — local source and durable evidence

Accept the exact 67-entry [source-v3 manifest](../../qa/sckrl-311-source-v3-manifest.json), including
one deletion, SHA-256 `1456dcec1a3546186ad76373ae65bad6fce0f8b6a992cd7e6be4b6df4c978e3c`.
It binds the local backend/SDK/HTTP source, fixtures, contracts, QA, code maps, Council guidance,
development plan and gated Claude implementation/Codex QA handover. Historical v1/v2 manifests
remain unchanged and unratified. Status, this ledger and the v3 manifest are excluded bookkeeping.
Verify the manifest and every entry before each vote; no source changes under this revision.

The unchanged reviewed runner/helper passed a fresh PostgreSQL 14.20 replay. Retained workspace
archive: `.env.qa-sckrl311-evidence-20261101/run-zu04vnsp`; raw result SHA-256
`efa909150f3d978780f1c7d2f6b7592b9e0670096cf46094bfc617b0f0ba4a8f`, registry SHA-256
`8a0b142dc49881794823bbf848a9a1822e4517663a5cca57c700bfa4c7b9e48c`.
All 95 steps/logs, 32 input hashes and 98 archive hashes pass; owned shutdown and PID absence
are confirmed. C independently inspected the archive and compared all 97 copied raw files with
the originals; C did not execute SQL. Nine concurrency scenarios include the bounded four-phase
opposing-order/placement-before-delete proof. Exact mappings and malformed-200-to-502 recovery
are covered; neither exhaustive schedules nor real hosted authentication are inferred.

App checks are unchanged recorded Oct 22 evidence: 18 matching cached Turbo tasks, 372 tests,
fresh 58 client/12 route tests and web build. Current format/diff/map/link checks pass. Expired
October raw artifacts remain reported history; the current archive repairs that evidence gap.

Accept this bounded local increment and prepared handover while retaining SCKRL-311 **Review**.
Full hosted baseline, executor/harness, separately authorized installation, real Auth/PostgREST,
schema-cache/recovery, 304/312 prerequisites, placement UI/native/accessibility and Stage 1 gates
remain open. The old hosted probe is historical only. No UI activation, hosted/provider write,
deployment, publication, new feature or full-ticket Done is authorized. Ownership release and
the first manual takeover action are recorded separately in status after acceptance.

Alternative: defer all local acceptance until hosted/product completion. Strongest counterargument:
local auth stubs and retained logs cannot prove the end-user journey. Response: exact source and
inspectable evidence can be accepted as a bounded increment while every product/activation gate
remains explicit. All five fixed voters must Support this exact proposal and manifest; conditional
approval, old votes, silence, proxies and Chair override do not count.

<!-- acceptance:v3:end -->

### Preliminary votes — SCKRL-311-source-v3

Chair: **Support** the exact bounded revision above. Fresh A/B/C/Astra votes are requested now;
packet reviews and interrupted v2 requests do not count as source-v3 votes.

### Source-v3 preliminary result and revision

| Seat | Authentic preliminary vote | Evidence/rationale |
| --- | --- | --- |
| Chair | Support | Exact local manifest/proposal; full-ticket gates preserved. |
| A | Support | Verified all 67 entries, proposal, archive and raw copies; scoped backend evidence coherent. |
| B | Object | Claude handover states the old probe binds/shows state in present tense; requires historical date and fresh verification. |
| C | Support | Exact entries/proposal and independent QA agree; notes pending status bookkeeping. |
| Astra | Object | Independently identifies the same temporal inconsistency in both Claude and Codex handovers; all archive/source checks otherwise pass. |

Source-v3 is **not ratified**. Chair accepts B/Astra's findings; A/C Support cannot override them.
Root dated both sentences October 23, explicitly marked raw evidence expired/not current and
required fresh target/schema verification. Only the two handover documents change from v3;
implementation, contracts, QA reports and the November archive are unchanged. V4 preserves the
immutable v3 manifest/proposal and requires all fresh votes; no final v3 votes are requested.

<!-- acceptance:v4:start -->

### SCKRL-311-source-v4 — local acceptance with dated handover evidence

Accept the exact 68-entry [source-v4 manifest](../../qa/sckrl-311-source-v4-manifest.json), including
one deletion, SHA-256 `2bfc5a157fd747cb90f0f4f3d6127f742ede89dd1a16882e8fa004294152a3c9`.
It binds the complete local backend/SDK/HTTP source, fixtures, contracts, QA, code maps, Council
guidance, development planning and manual Claude implementation/Codex QA handover. Status, this
ledger and the v4 manifest are excluded bookkeeping. Verify every entry and proposal before each
vote. Historical v1/v2/v3 remain unchanged and unratified; their votes do not accept v4.

The v3 findings are corrected in both handovers: the October 23 probe is dated, its expired raw
artifacts are explicit, and fresh target/schema verification is required. Only these two documents
change from v3. Implementation, contracts, QA reports and November evidence are unchanged; the QA
reports record their pre-v3 freeze, while subsequent reviews/decisions are recorded in this ledger.

Current evidence is the durable workspace archive
`.env.qa-sckrl311-evidence-20261101/run-zu04vnsp`: raw result SHA-256
`efa909150f3d978780f1c7d2f6b7592b9e0670096cf46094bfc617b0f0ba4a8f`, registry SHA-256
`8a0b142dc49881794823bbf848a9a1822e4517663a5cca57c700bfa4c7b9e48c`.
All 95 steps/logs, 32 inputs and 98 archive hashes pass; shutdown/PID absence are confirmed and
no database data is archived. C independently inspected the archive and all 97 raw copies without
running SQL. Nine concurrency scenarios include bounded opposing-order/placement-before-delete
evidence and exact mappings; the real SDK-to-route regression covers malformed-200-to-502 recovery.
No exhaustive schedules, real hosted auth or current hosted state are inferred.

Unchanged app validation is recorded Oct 22 evidence: 18 matching cached tasks, 372 tests, fresh
58 client/12 route tests and web build. Current format/diff/map/link checks pass. Expired October
raw artifacts are history; the November archive is the inspectable current SQL packet.

Outcome: accept the bounded local increment and prepared handover, retaining SCKRL-311 **Review**.
Full hosted baseline, executor/harness, authorized installation, real Auth/PostgREST/schema-cache
and recovery, 304/312 prerequisites, placement UI/native/accessibility and Stage 1 gates remain
open. No hosted/provider write, UI activation, deployment, publication, new feature or full-ticket
Done is authorized. Ownership release and first manual takeover action are recorded separately.

Alternative: withhold local acceptance until the hosted journey is complete. Strongest
counterargument: local fixtures cannot establish end-user acceptance. Response: this accepts a
reproducible source increment with exact evidence and explicit remaining gates. Require all five
fixed voters to explicitly Support this same revision, preliminary unanimity, reciprocal Chair
review and fresh final votes. Conditions, silence, proxies and historical votes are not assent.

<!-- acceptance:v4:end -->

### Preliminary votes — SCKRL-311-source-v4

Chair: **Support** this exact bounded v4 revision. All four peer votes are freshly requested;
no v3 vote transfers to this corrected source/proposal.

| Seat | Fresh preliminary vote | Evidence/rationale |
| --- | --- | --- |
| Chair | Support | Exact bounded proposal/source and remaining gates reviewed. |
| A | Support | All 68 entries/proposal/archive verify; both historical-probe sentences corrected. |
| B | Support | Independently confirms its v3 objection is resolved in both handovers; exact source and evidence match. |
| C | Support | Exact 68 entries and 3,029-byte proposal verify; unchanged QA and corrected temporal claims support local scope. |
| Astra | Support | Independently confirms its v3 objection resolved; all entries/archive/input/step checks match. |

Manifest SHA-256: `2bfc5a157fd747cb90f0f4f3d6127f742ede89dd1a16882e8fa004294152a3c9`.
Proposal SHA-256: `6f834d6b683eedf8d04184a0d4f50aee9d4bd3832fe3090e8228a2985d0791e3`,
over the exact 3,029 UTF-8 bytes between the v4 markers, including surrounding newlines.

### Reciprocal Chair review — source-v4

The Chair challenges whether accepting the archive might imply a passing test from
`archiveComplete` alone. It does not: the current packet also requires raw `checksPassed`, runner
exit zero, all 95 successful steps/logs, current 32 inputs and verified registry hashes; the failed
initdb archive remains separately identified as failed. Original temporary paths inside raw JSON
are execution coordinates, while the registry and matching archived basenames preserve inspection.

The Chair also challenges current hosted-state and ownership assumptions. Both handovers now date
the October observation and require fresh verification; full target/executor/connected gates remain
open. Acceptance does not install the schema, enable UI or satisfy native prerequisites. The
handover explicitly defers ownership release to the current status record and carries the ignored
archive alongside the dirty checkout. Source-v4 remains a bounded local increment, not full Done.

These checks require no proposal/source revision. All v4 hashes remain unchanged. Chair's fresh
final vote is **Support** this exact revision; fresh final responses from A/B/C/Astra are requested
to these challenges and the same immutable manifest/proposal. Preliminary votes are not final votes.

### Final votes — SCKRL-311-source-v4

| Seat | Fresh final vote | Evidence/rationale |
| --- | --- | --- |
| Chair | Support | Exact source/proposal unchanged; reciprocal challenges resolved within bounded scope. |
| A | Support | Reverified all 68 entries/proposal and raw/archived pass evidence; no additional local evidence needed. |
| B | Support | Reverified entries/proposal/archive; historical-probe correction and failed-vs-passed archive distinction satisfy Chair challenge. |
| C | Support | Independently reverified entries/proposal; raw result, input/log/registry/cleanup evidence satisfy Chair review. |
| Astra | Support | Fresh verification of all entries, proposal, 95 steps/32 inputs/98 hashes/97 raw copies; remaining gates and historical-only probe explicit. |

**Ratified:** all five authentic final Support votes were received on the unchanged source-v4
manifest/proposal after preliminary unanimity and reciprocal Chair review. This accepts the
bounded local backend/evidence and prepared handover only. SCKRL-311 remains **Review**; no hosted
schema, connected, prerequisite/native/UI or Stage 1 gate is waived. V1/v2/v3 remain unratified.

## Owner-directed testing and publication follow-up — 2026-11-01

After final v4 votes, the owner instructs: “Ill do the testing using claude so add that to handover
and push the changes”. This explicitly assigns the remaining testing to the owner using Claude
and authorizes committing/pushing this branch. Codex prepares the testing handover and publication;
no further app/device/connected test execution is started here. Existing independent acceptance
and hosted-operation gates remain; a testing handover does not authorize a hosted migration.

The publication handover is a later user-directed documentation revision over accepted source-v4,
tracked separately; its updated documents must not be misrepresented as unchanged v4 entries.

### Testing handover publication v5 — owner-directed documentation

Verification participants are B (handover owner), C (independent documentation QA) and Chair
(lightweight integration). This executes the owner's explicit testing/publication decision;
it introduces no implementation, provider, routing-policy or contract decision. B and C must
each verify and Support the same publication snapshot before staging.

Revision: `SCKRL-311-testing-handover-publication-v5`, 69-entry
[publication manifest](../../qa/sckrl-311-handover-publication-manifest.json), SHA-256
`0914cf7c39a202eea3eacb19fedbbc4c04eb1c90919e9517e948ba8a121ac83f`.
Only the Claude package, Codex checkpoint and shared handoff workflow differ from accepted v4;
the v4 manifest is preserved in the inventory. Testing is assigned to the owner using Claude,
with a concrete checklist/resume prompt, honest remaining gates and independent review for fixes.
Raw synthetic evidence/credentials remain ignored and are not pushed. Current branch publication
is authorized; merge/deployment/hosted writes/new features remain outside this instruction.
No further app/device/connected tests are started by Codex. Documentary verification and Git
publication checks are required; accepted v4 implementation/evidence are unchanged.

B Supported initial publication-v5; C requested clearer pre-publication wording: the handover
must not imply publication/ownership release already occurred while status says it is pending.
Root changed the Claude package and shared workflow to require checking status for verified push
and explicit release, and to state the documents alone are not completion evidence. No other file,
scope, implementation or test evidence changed. The initial candidate remains unaccepted history
at SHA-256 `0914cf7c39a202eea3eacb19fedbbc4c04eb1c90919e9517e948ba8a121ac83f`.
The revised candidate is `SCKRL-311-testing-handover-publication-v5-r2`; both B/C must verify and
freshly Support its new manifest hash before publication. The initial vote does not transfer.

V5-r2 manifest SHA-256 is `859ae08530ee3603b77865431d818713f25780101b02618b1cb23e7e890fbd5e`.
B and C each freshly **Support** this exact 69-entry documentation/publication snapshot after
verifying all entries, corrected pending-state wording and unchanged accepted implementation.
Chair integration accepts the owner-directed documentation delta. No app/device/connected tests
were rerun. The current branch is authorized for commit/push; publication results and writer
release are recorded in status only after actual Git success.

Staging exposed one cosmetic default `git diff --cached --check` warning: the newly tracked,
already frozen placement migration has an extra blank line at EOF (line 698). Its exact reviewed
bytes/hash are retained to preserve the accepted SQL input/evidence binding; no SQL is rewritten
for this cosmetic warning. Staged whitespace checking with `blank-at-eol,space-before-tab` passes;
the default EOF warning is explicitly retained, not reported as a clean default staged check.
Manifest-to-index hashes, ignored-file exclusion and credential-pattern checks also pass.
