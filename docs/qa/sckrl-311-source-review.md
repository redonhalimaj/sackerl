# SCKRL-311 independent source review

Original review date: 2026-10-19. Current follow-up: 2026-11-01. Reviewer: Luna C, independent QA
(`gpt-6-luna`, `xhigh`).

## Current QA checkpoint — 2026-11-01

SCKRL-311-source-v1 and source-v2 remain unratified. The current local implementation and evidence
are eligible for a fresh source-v3 review after the Chair publishes an immutable manifest and
revision, followed by fresh preliminary and final unanimous Council votes. At this report freeze on
2026-11-01, no source-v3 preliminary or final vote has been requested or cast; later outcomes belong
in the Council ledger. The full SCKRL-311 ticket remains **Review**; hosted activation and Stage 1
exit are not accepted.

The Chair executed the reviewed disposable PostgreSQL 14 runner after permissioned local execution.
I independently inspected its archive and source; I did not execute SQL or repeat application
checks. The retained workspace [results.json](../../.env.qa-sckrl311-evidence-20261101/run-zu04vnsp/results.json)
has SHA-256 `efa909150f3d978780f1c7d2f6b7592b9e0670096cf46094bfc617b0f0ba4a8f`; its [archive
registry](../../.env.qa-sckrl311-evidence-20261101/run-zu04vnsp/archive.json) has SHA-256
`8a0b142dc49881794823bbf848a9a1822e4517663a5cca57c700bfa4c7b9e48c`. PostgreSQL was 14.20
(Homebrew). All 95 subprocess steps exited zero, all 95 expected step logs are present, and all 32
recorded input hashes match the workspace. `checksPassed` and `clusterStopped` are true; the stop
log confirms shutdown and the PID file was absent at archive time. The archive registry has 98
verified file hashes: 95 step logs, `server.log`, `runner-output.log`, and `results.json`. No
PostgreSQL data directory is archived. I also compared the 97 archived run files with the raw
temporary run while it remained available; all hashes matched. The original execution coordinate
was `/private/tmp/sckrl311-validation.hk0iekfc`; use the workspace archive for retained evidence.

The run used the unchanged helper `d8a138c27c8fd98b8667650256d97019dae1ce0e9e6c0af269928ace38767ad1`,
runner `b2c1ee9aa3fe8ceeb9f3445521fee9ce44dc1cf33121eb848aebeb3a3b577b96`, and placement migration
`b130383684fc85549c8d33542108dd5992e3e23c7ed4aea565f73dabfb858459`. Five isolated databases cover
clean and populated 311 plus 310, 406 and 312 regression cases.

The replay includes eight prior observed-blocking cases and one combined opposing-order multi-zone
placement/deletion case. The archived
[concurrency log](../../.env.qa-sckrl311-evidence-20261101/run-zu04vnsp/094-sckrl311-concurrency.log)
records four blocker observations: high-zone-first placement A (PID 10534) was blocked by the
high-zone gate (PID 10530); the lower-zone delete probe (PID 10541) was blocked by A; low-zone-first
placement B (PID 10558) was blocked by the same gate; and the final delete (PID 10564) was blocked
by A. The final delete observed A only, not both placement sessions simultaneously. The successful
helper exit also requires the probe's bounded `55P03` and rollback, both placements to succeed, and
the final delete to return `23503`. The inspected helper assertions verify canonical status/results,
exact line-to-zone mapping, stock and acquisition-event lineage and zones for both placements. This
is bounded evidence for the observed schedules, not proof of every possible interleaving.

An earlier 2026-11-01 sandbox attempt is separately preserved at its
[archive registry](../../.env.qa-sckrl311-evidence-20261101/run-4v3a77e6/archive.json) and
[initdb log](../../.env.qa-sckrl311-evidence-20261101/run-4v3a77e6/001-initdb.log). It failed before
SQL execution because `initdb` could not create a shared-memory segment (`shmget: Operation not
permitted`). Its runner exit was 1, `checksPassed` was absent, and the runner found no live cluster
PID to clean up.
This is sandbox-restriction evidence, not a SQL or product failure and not a passing replay.

The previously reported 2026-10-24 pass has result hash
`5c79d11c6b2e58e462a5136dc24487723656707f1566bddb42580871e0f2967a` and remains historical QA
evidence. Its original `/private/tmp/sckrl311-validation.a3vvont4` artifacts were cleared before
2026-11-01; the archived run above supplies current inspectable evidence. The 2026-10-23 failed
observer attempt (result hash
`cdf40cd4ee35d89ae55999cf88e9499b10794649ae3c2d756a1b35f91ba7c438`) also remains reported
history, with its raw temporary logs unavailable. See the [database review](sckrl-311-database-review.md)
for both attempts and their limits.

The 2026-10-23 limited read-only development probe was previously reported with results hash
`c16da7494c87b468a4dd54a592b69e46781aae78d6e9b517aa36266875a8a773`. Its raw
`/private/tmp/sckrl311-dev-inspection-20261022.json` file is no longer available. The prior report
recorded only connection identity and catalog presence, with no placement table, acquisition-event
table or lineage column. Treat that as historical probe evidence, not a statement of current hosted
state; it does not establish a full preflight, target readiness, hosted write or connected
acceptance.

The frozen source-v2 manifest was verified before this report update: all 66 entries matched its
SHA-256 `d9b1414da2536ba83cc889ad46099a81bac79dd83e73110d8279fb6da4d881b5`. This QA report and the
database report are being revised for source-v3 evidence, so source-v2 remains immutable historical
evidence and is no longer the exact current report snapshot. The Chair must publish a new manifest
before source-v3 voting. Interrupted tasks, old execution-packet votes, silence and source-v1/v2
votes are not source-v3 votes.

Historical Council status: source-v1's 2026-10-19 preliminary round had Astra Object, Luna A/B
Support and independent QA Needs evidence; no final round was requested, so v1 stayed unratified.
Source-v2 was frozen on 2026-10-24, but no fresh worker preliminary votes or final source votes
were recorded before the session reset. The Council ledger remains authoritative for those records.

## Source findings

- The typed client and web boundary were reviewed for strict command/result shapes, membership
  resolution before protected calls, foreign-receipt 404 behavior, `no-store` responses,
  unknown-outcome handling and absence of a legacy fallback. The placement result parser requires
  canonical sorted, unique line IDs; unexpected successful HTTP statuses map to 502 with
  `outcomeUnknown`. The v1 review found that malformed or mismatched RPC HTTP-200 responses could
  retain status 200 through the SDK and route. B's source-v2 fix maps this case to SDK 502 with
  `outcomeUnknown`. The prior route-composition test used the real SDK with mocked `fetch` and
  auth/household dependencies; malformed and wrong-household HTTP-200 replies returned 502 with
  `no-store` and `outcomeUnknown`, made one RPC request, and retained the original receipt and key.
  I did not rerun that test. Sources: [`receipt-placement.ts`](../../packages/api-client/src/receipt-placement.ts),
  [`receipts.ts`](../../packages/api-client/src/receipts.ts), [placement route](../../apps/web/app/receipts/%5Bid%5D/placement/route.ts),
  and [shared route boundary](../../apps/web/lib/receipt-placement.ts).
- The migration source was reviewed for transaction scope, authorization ordering, idempotent
  replay, exact included-line matching, protected receipt lineage, expiry conversion, receipt
  mutation freeze, deletion behavior and grants. It locks existing candidate zones in stable UUID
  order before the authoritative missing/household check ([migration](../../supabase/migrations/20261015100000_sckrl_311_atomic_receipt_placement.sql#L507)).
- Fixture coverage includes the household-calendar `added_on` differing from UTC, three included
  lines across two zones with reverse requested UUID order and exact result/stock mappings, placed
  receipts disappearing from pending results and totals with deterministic pagination, and
  observed-blocking save-review and parse-promotion races that assert `PT409` and unchanged source.
  Sources: [placement commands](../../supabase/tests/sckrl_311_placement_commands.sql#L215),
  [concurrency helper](../../supabase/tests/sckrl_311_concurrency.py#L248), and
  [legacy seed](../../supabase/tests/sckrl_311_legacy_seed.sql#L90). The replay's 32 input hashes
  independently bind these sources to this archived execution.
- **Historical v1 finding:** the 2026-10-19 helper did not exercise placement winning a zone lock
  before a later delete or concurrent opposing-order multi-zone placement/deletion. The 2026-11-01
  bounded run now covers both orderings with synthetic zones and observed blockers. This does not
  establish every possible schedule.
- Current policy previously inspected in TEAM.md, AGENTS.md, CLAUDE.md, PROGRAM.md and `docs/agents/`
  follows the 2026-10-19 direction: the root Chair analyzes, coordinates and instructs the Lunas;
  Astra provides brief model routing and work reviews. Independent QA, explicit unanimity,
  reciprocal review where required and the four-slot concurrency limit remain. Frozen Council
  decision records were not edited.

## Verification and remaining gates

The Chair's 2026-10-22 integration record reports 18/18 Turbo tasks successful (all served from
matching cache), 372 recorded tests (API client 169, web 76, mobile 116, UI 8, tokens 3), a fresh web
production build, passing format/diff checks and a generated-map check with 715 callables, 1,316
relationships, 88 modules and zero stale files. Luna B's prior focused runs covered 58 receipt-client
and 12 placement-route tests. I did not rerun these unchanged application checks on 2026-11-01.
They are historical checks; today's new execution is the disposable SQL replay above.

Full development baseline and migration-executor readiness, separately authorized hosted schema
installation, real Auth/PostgREST and schema-cache behavior, connected uncertain-outcome recovery,
applicable SCKRL-304/312 prerequisite acceptance, SCKRL-305 placement UI and native/device
accessibility remain separate gates. The old limited development probe is not current environment
evidence. SCKRL-311 remains **Review**, Stage 1 remains incomplete, and this report accepts neither
hosted activation nor full-ticket completion. Source-v3 remains pending its immutable manifest and
fresh preliminary and final unanimous Council votes after reciprocal Chair review. This QA evidence
was independently inspected; it was not independently executed by C.
