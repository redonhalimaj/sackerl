# Independent Codex QA — Stage 1 receipt loop

Executed 2026-11-04 UTC / 2026-11-05 Europe/Vienna. Request and boundaries:
[Claude handover](../agents/codex-qa-handover-2026-11-04.md), Q1–Q4. Codex did not change product
code, apply migrations, deploy, or merge. Claude retains implementation ownership.

**Source vote: OBJECT — do not merge the inspected Stage 1 revision into `dev` yet.** The passing
suites do not cover the reproduced durable-attempt failure and misleading placement-status copy.
SCKRL-924 is separate from Stage 1; its isolated native rerun could not reach the app entry screen. Owner device
checks remain unverified. This does not rewrite the historical owner decision A or reopen SCKRL-305.

## Frozen source and execution

| Ref                                                                   | Exact commit                               |
| --------------------------------------------------------------------- | ------------------------------------------ |
| Reviewed base `origin/dev`                                            | `6c07803c8a248c1b09d98508e0cef922a6a38333` |
| Stage 1 `origin/feature/stage1-receipt-loop`                          | `5501d17155642b492dff6293203f0428e7e66320` |
| Separate SCKRL-924 candidate `origin/fix/SCKRL-924-household-on-scan` | `6c0a1a4bf3389cae8bf573dc5a24d45dffb6ceca` |

Remote refs were refreshed before testing. Stage 1 has the same product source as handover commit
`3884563`; subsequent changes through `5501d17` are handover documentation. Candidate 924 was
inspected separately, never merged into the tested Stage 1 checkout. Documentation branch:
`qa/codex-stage1`. A concurrent Claude documentation-only commit, `48aa235f25a6453ffcfaabfc7f0891a1958c698f`, is preserved as an ancestor; it adds the SCKRL-921 resume note and one status pointer. It changes no tested product source. The QA commit itself contains only this report and the QA status update.

Host: Node 20.20.2, pnpm 9.15.4; booted iPhone 17 simulator, iOS 26.5, Expo Go. Existing guarded
fixtures targeted the approved development Supabase project. Credentials were read only from
ignored files and were not printed or published. Raw evidence and temporary probes are ignored
under `.env.qa-codex-stage1-20261104/`, `.env.e2e-mobile/` and
the archived `mobile-probe-snapshot/` inside the first directory. Temporary screen tests were removed from the app test tree after execution.

| Check                                    | Independent result / evidence                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CI=1 pnpm install --frozen-lockfile`    | Pass. Sandbox DNS failed first; permissioned retry installed the unchanged lockfile.                                                                                                                                                                                                                                          |
| `pnpm format:check`                      | Pass.                                                                                                                                                                                                                                                                                                                         |
| `TURBO_FORCE=true pnpm lint`             | Pass, 5/5 tasks, no cache.                                                                                                                                                                                                                                                                                                    |
| `TURBO_FORCE=true pnpm typecheck`        | Pass, 5/5 tasks, no cache.                                                                                                                                                                                                                                                                                                    |
| `TURBO_FORCE=true pnpm test`             | Pass, 8/8 tasks, no cache: **471 tests passed, 1 skipped**. Mobile 155; web 105; api-client 200 + 1 skipped; UI 8; tokens 3. The skipped api-client test is not a pass.                                                                                                                                                       |
| Guarded dev Playwright `e2e:api`, serial | **82/82 passed**, run `rmw2q9yeq`, 4.3 min; teardown confirms 87 synthetic users absent, 0 failed. `E2E_BACKEND=1` was explicitly set, so backend tests did not silently skip.                                                                                                                                                |
| Default Maestro suite                    | **10/10 passed**, run `20261104230533-xl7n`, 10 min 4 sec; fixture cleanup confirmed. Includes 51 same-receipt resume after restart, 55 tap placement/toast, and 90 signed-out landing.                                                                                                                                       |
| Handover placement fault suite           | **3/3 passed**, run `20261104234029-osgz`, 4 min 47 sec; fixture cleanup confirmed.                                                                                                                                                                                                                                           |
| Supplemental forced live replay          | **3/3 passed**, run `20261104234629-03k7`, 4 min 59 sec; fixture cleanup confirmed. Ignored flow variant taps Try again directly; command record proves 1 retry tap and 0 status taps, followed by Home/toast and exactly three stock rows.                                                                                   |
| Focused negative-path screen probes      | **2/2 reproduced** the defects below using the actual Stage 1 route and an ignored copy of its existing renderer harness. Fourteen unrelated copied tests were filtered out. These assertions prove the failures, not acceptance.                                                                                             |
| Candidate 924 real-dev concurrency probe | Run `codex-924-1793835047862`: zero households initially; observed losing insert 409; one membership POST deliberately delayed locally; losing call returned while `is_household_member=false`. After release: both calls return the same household, exactly one household, membership true. Exact fixture cleanup confirmed. |

Candidate-focused tests also passed in an isolated exact-source snapshot: **21 profile tests and 17 Scan-entry tests**. All 12 files in the candidate diff matched Git source bytes. The extra native attempt `20261104235204-zg2o` reported **0/1**: Expo Go showed “Could not connect to the server” before flow 10 reached any app screen. Cleanup succeeded; no native Scan outcome or pre/post household count is claimed. Its port was 8082. Resume this bounded check on the known-working 8081 setup; this startup failure is an environment result, not a demonstrated product defect.

Initial plain Turbo invocations were cache hits; the reported lint/typecheck/unit results are the
subsequent forced executions. Next build and typecheck were not run together. The initial sandbox
Playwright attempt could not bind port 3100; its permissioned dev rerun is the passing run above.
The handover's historical 89-test total is not the size of the current API-only project: this
checkout's API project discovers 82 tests. No browser smoke or standalone SQL replay is claimed.

The 924 probe transpiles the exact candidate `profile.ts`, substitutes only auth-config validation,
and uses real authenticated HTTP requests for the profile/household/membership operations. It
delays requests on its own transport and does not alter the database schema or any other user.
It proves the concurrency window; it is not a native Scan-flow pass.

## Findings and required disposition

### F1 — High: placement starts without a durable retry record

`apps/mobile/app/receipt-placement/[id].tsx:231–240` catches and ignores
`AsyncStorage.setItem` rejection before calling `finalizeWithFaultInjection`.

Reproduce with storage unavailable/full: assign every item, make pending-attempt persistence reject,
then submit. The focused route probe observes one finalize call, an unknown-outcome screen, and
zero stored attempts. Kill the app during an unresolved outcome; restart cannot recover the
original frozen key/body. If canonical status is still unplaced/in flight, a new attempt can use
different assignments. Backend receipt uniqueness still protects against duplicate stock; this
finding does **not** demonstrate duplicate writes or actual receipt loss.

Expected: satisfy the accepted SCKRL-305 restart contract before issuing placement. Suggested Claude
fix: fail closed with the draft retained when saving the pending attempt fails, and add a negative
storage-path regression plus restart/retry evidence. Recovery reads also convert `getItem` failure
to no attempt at `:167–170` (source inspection only); handle reads conservatively too. Owner:
Frontend, SCKRL-305/312 recovery.

### F2 — Medium: failed placement recheck retains affirmative stale status

`apps/mobile/lib/receipt-placement.ts:389–406` retains `checkedUnplaced` when starting/failing a
subsequent status check; `apps/mobile/app/receipt-placement/[id].tsx:596–598` consequently displays
“These items are not in your stock yet. Try again to add them.”

Reproduce: uncertain submit → status returns unplaced → another status check fails. The route
probe confirms the affirmative copy remains after the failed request. The original command can
have committed since the earlier read, so the latest outcome is unknown. Expected: neutral copy
and the same frozen attempt. Suggested Claude fix: invalidate the stale flag on checking/failure
and test this sequence; describe an unplaced read without implying the original request cannot
still commit. Owner: Frontend, SCKRL-305.

### F3 — High residual risk, already known: household may lack usable membership

Candidate `packages/api-client/src/profile.ts:368–374` returns the winning household after a 409;
the owner lookup at `:300–311` does not require membership, while the winning call inserts membership
later at `:383–398`. The independent real-dev race probe reproduced early return with membership
false. Receipt/list operations gated by `is_household_member` can therefore fail immediately after
`ensureHousehold` appears successful. If membership insertion permanently fails, subsequent owner
lookups alone do not repair it.

This extends the explicitly documented pre-existing non-atomic creation edge; it is not presented
as a newly introduced SCKRL-924 regression or as newly discovered cross-household exposure. The
candidate does create exactly one household in the reproduced race. Record this as a follow-up
and correct the candidate board's “user is not stuck” implication. An atomic creation/repair
contract needs the responsible Backend/Infrastructure council review; **do not implement SQL in
this QA handover**. This known risk alone does not override the owner's bounded 924 scope.

### F4 — Low: candidate 924 flow has no explicit fresh-household assertion

Candidate `apps/mobile/e2e/maestro/15-fresh-user-scan.yaml:3–4` assumes flow 10 leaves no household.
`apps/mobile/e2e/maestro/10-auth-onboarding.yaml:65–74` can complete storage-zone setup when shown,
and `apps/mobile/app/storage-zones.tsx:276–277` calls `ensureHousehold` on that conditional path.

The Chair challenged an initial reviewer claim that this necessarily invalidates flow 15. Both
independent Stage 1 runs' flow-10 command records show the post-auth zone branch **skipped**;
the earlier signed-out zone tap returns before household creation. Thus 10 → 15 can exercise the
intended fresh-user path. No false-green candidate native run was demonstrated. The remaining
limitation is that the flow does not assert its database precondition across routing variations.
The new source calls to `ensureHousehold` in both Scan paths and shopping list are present, and
the guarded single-screen double-tap test is useful. Suggested QA improvement: assert zero
households before Scan, then review opens and exactly one household/membership exists. Owner:
QA/Frontend, SCKRL-924. Candidate native flow 10 was attempted in an isolated snapshot but failed before app entry; flow 15 and its database precondition checks were not reached.

### F5 — Low: pending-review count is a bounded test oracle

`apps/mobile/e2e/maestro/lib/count-pending.yaml:17–51` counts visible rows, while
`apps/mobile/app/(tabs)/index.tsx:392` requests page size 3. At three pending reviews, an erroneous
extra pending receipt can leave the visible count at three and satisfy
`apps/mobile/e2e/maestro/55-receipt-placement-tap.yaml:71–76`.

The current default fixture starts below that limit and the independent run passed. This is a
future false-green risk, not evidence that current Home includes placed receipts. Assert a unique
receipt identity is absent, or enforce the bounded fixture precondition. Owner: QA, SCKRL-908.

### F6 — Low: manual checklist count disagrees with its contents

`docs/qa/stage1-manual-checklist.md:48` says 11 checks; the file contains **10** checkboxes.
Clarify whether one check is missing or the total should be ten. No missing check was invented.

## Q1/Q4 contract observations

- The frozen attempt supplies identical command/key on an uncertain retry; definite rollback
  errors release the attempt. API tests exercise server idempotency/isolation.
- Home uses `listUnplacedReceiptReviews` at `apps/mobile/app/(tabs)/index.tsx:392` and `:629`.
- Review placement CTA requires a clean, saved, complete review with included items.
- The placement fault hook requires all three gates: `__DEV__ === true`,
  `EXPO_PUBLIC_APP_ENV === 'dev'`, and the explicit response-drop flag. The ordinary run exercised
  normal placement; the fault run is separate.
- Placement performs no client receipt-row write after success (L3). The success render disarms
  the leave guard before navigation; the default run reached Home/toast without “Still confirming.”
- Flow 90's optional confirmation tap retains mandatory signed-out landing assertions and passed
  independently; no sign-out defect was reproduced.
- Flow 56 checks status before its optional retry branch. A successful committed status normally
  bypasses Try again. Its existing pass must not be cited as proof of live POST replay.
  The independent ignored variant closes this session's gap by tapping retry first and verifying
  Home/toast plus no duplicate stock. The checked-in flow still covers status recovery.

## Owner/manual checklist result

No owner device results were supplied during this run. Automated and mocked checks are not ticks
for this one-time checklist. The file was left unticked.

| Existing checkbox                            | Literal manual/device result | Related evidence, not substitution                                         |
| -------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| Two-session save conflict retains draft      | Pending                      | Unit review/conflict and connected revision guards passed.                 |
| Offline review save retains draft            | Pending                      | Unit failure/uncertain-save coverage passed.                               |
| Back with unsaved edits                      | Pending                      | Unit navigation/draft coverage passed.                                     |
| VoiceOver review rows                        | Pending owner iPhone check   | Static labels inspected; no speech verification.                           |
| VoiceOver placement without drag             | Pending owner iPhone check   | Tap-only Maestro passed; VoiceOver actions not exercised.                  |
| Spoken placement result/toast                | Pending owner iPhone check   | Toast visible in Maestro; announcement not verified.                       |
| Unknown / dated / no-date save and reopen    | Pending                      | Unit/connected expiry choice coverage passed.                              |
| Offline Home pending-review error/retry      | Pending                      | Unit error-state coverage only.                                            |
| Offline placement then exactly-once recovery | Pending                      | Dev injected-response fault is distinct from real offline/device behavior. |
| A → sign out → B pending-review isolation    | Pending                      | Connected outsider isolation and unit auth-scope coverage passed.          |

Result: **0/10 literal manual checks verified in this session**; the handover's stated 11th check
is unspecified. The owner was asked for the three VoiceOver results while automated work continued.

## Council review

Predeclared complex-lane voters: Chair (GPT-6-based Codex; exact variant/effort unexposed), Astra Deputy (`gpt-6-astra`,
`xhigh`), Worker A Backend/Infrastructure domain reviewer (`gpt-6-luna`, `xhigh`), and Worker B
independent mobile QA (`gpt-6-luna`, `high`). All are independent of Claude's implementation.
Chair owns this report/status; workers and Deputy own read-only review. No reviewer implemented
the product changes being accepted. Council support of an accurate **OBJECT** report is distinct
from product acceptance.

Preliminary revision `STAGE1-QA-20261105-v1` binds the report bytes before this Council section:
SHA-256 `509ff284ed269fa826d62814bb3ae68d311814784e3dbfc70e75ba84e52c5316`.
Chair, Astra, Worker A and Worker B each explicitly **Support** report/status publication and
**Object** to Stage 1 source merge readiness. Both workers and Astra independently checked the
hash/source; A and Astra also verified all 14 raw evidence hashes. These are preliminary votes only.

Reciprocal Chair review preserved the known-membership scope, corrected the overstrong fresh-user
test claim using actual skipped-branch records, and confirmed direct replay from the actual command
log. Astra corrected the manual-count citation to line 48 and requested the Decision Log row.
The Chair also identified the concurrent documentation-only ancestor above and preserved it.
These editorial/provenance refinements receive revision v2 and fresh votes; v1 votes are not carried forward.

Final revision: **`STAGE1-QA-20261105-v2`**. Immutable findings body (UTF-8 bytes before
`## Council review`) SHA-256:
`b24e46dc4aaf0263c10426f6e22bb39195abe3be5919e5f922a0882303ab808c`.
Final status SHA-256: `0f3c3fd707cae23c60c0ce87796996a88bf1ac7cfe45fef270b34cc73a96d205`.
Raw v1 report and v1/v2 manifests remain in the ignored evidence directory.

All four participants gave fresh preliminary Support on v2. After reciprocal Chair review, every
participant independently gave the following fresh final votes on the same v2 findings and final
status. The Chair rechecked both hashes and the evidence boundaries before its final vote.

| Participant                     | Final QA report/status vote | Separate Stage 1 source vote | Rationale                                                                                      |
| ------------------------------- | --------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------- |
| Chair                           | **Support**                 | **Object**                   | Reproduced F1/F2; exact evidence, limitations and handback are accurate.                       |
| Astra Deputy                    | **Support**                 | **Object**                   | Verified hashes/evidence and reciprocal corrections; no product acceptance inferred.           |
| Luna A — Backend/Infrastructure | **Support**                 | **Object**                   | F1/F2 block source readiness; known membership risk remains separately scoped.                 |
| Luna B — independent mobile QA  | **Support**                 | **Object**                   | Verified actual final diff and hashes; manual/native limits and historical Done are preserved. |

**Ratified outcome: publish this QA report/status; Stage 1 source remains OBJECT.** This is not
unanimous product acceptance or permission to merge. No implementation was changed by the reviewers.

Claude continuation: address F1/F2 with independent QA on the revised source, retain F3 as the known
household-membership follow-up, and rerun the bounded candidate 924 native check on port 8081 with
explicit before/after household assertions. Complete the owner/manual checks separately. Use new
source/evidence revisions and fresh votes for any fixes; do not reuse this report's votes as their acceptance.
