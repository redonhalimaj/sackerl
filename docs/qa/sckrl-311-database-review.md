# SCKRL-311 disposable database verification

Historical baseline: 2026-10-19. Follow-ups: 2026-10-24 and 2026-11-01. Scope: local PostgreSQL
evidence for the backend increment, not hosted activation or full-ticket acceptance. The
[ratified design](../agents/council-decisions/COUNCIL-20261015-02-placement.md) and
[source review](../agents/council-decisions/COUNCIL-20261019-01-placement-source.md) retain separate
source, execution and activation gates.

## Current replay — 2026-11-01 (passed)

The Chair ran the reviewed, unchanged PostgreSQL 14 runner and concurrency helper after
permissioned local execution. Luna C independently inspected the archived and original run
artifacts; C did not execute SQL. The original temporary run directory was
`/private/tmp/sckrl311-validation.hk0iekfc`; the retained evidence is in the ignored workspace
archive. Its [results.json](../../.env.qa-sckrl311-evidence-20261101/run-zu04vnsp/results.json) SHA-256
is `efa909150f3d978780f1c7d2f6b7592b9e0670096cf46094bfc617b0f0ba4a8f`. The
[archive registry](../../.env.qa-sckrl311-evidence-20261101/run-zu04vnsp/archive.json) SHA-256 is
`8a0b142dc49881794823bbf848a9a1822e4517663a5cca57c700bfa4c7b9e48c`.

The reviewed capture wrapper was `capture.py` SHA-256
`ca93893bf80a129eb8f5e9793ba784780fbd99ca70e5487d27f2d72f68eaf361`; its plan mode remained
non-executing. It invoked the unchanged runner with the reviewed PostgreSQL 14 binary directory,
then archived the synthetic logs/results and their hashes. No application env file was read.

The registry records a successful wrapper exit, `archiveComplete: true`, `captureState: archived`,
no capture/archive errors and 98 file hashes. I independently matched all registry hashes, then
compared the 97 files copied from the raw run with the still-available original directory; every
hash matched. (The remaining `runner-output.log` belongs to the workspace capture wrapper.) The
results contain 95 subprocess steps and 95 listed logs; every step exited zero. All 32 current
workspace input hashes match. `checksPassed` and `clusterStopped` are true, and both the registry and
filesystem report that `data/postmaster.pid` was absent. The archived [stop log](../../.env.qa-sckrl311-evidence-20261101/run-zu04vnsp/095-stop.log)
confirms shutdown. No PostgreSQL data directory was archived. PostgreSQL was 14.20 (Homebrew).
These 95 setup, migration, assertion and shutdown subprocess steps are not 95 independent tests.

The reviewed inputs were unchanged: migration
`b130383684fc85549c8d33542108dd5992e3e23c7ed4aea565f73dabfb858459`, runner
`b2c1ee9aa3fe8ceeb9f3445521fee9ce44dc1cf33121eb848aebeb3a3b577b96`, and concurrency helper
`d8a138c27c8fd98b8667650256d97019dae1ce0e9e6c0af269928ace38767ad1`. The runner used a fresh
socket-only cluster, disabled TCP, and used its sanitized child environment. It did not load
application env files or connect to a hosted database. Synthetic auth fixtures emulate local
database roles; they do not exercise real Supabase Auth or PostgREST.

Five isolated databases were exercised: clean 311, populated 311, and 310, 406 and 312 regression
cases. The populated database ran legacy preservation, placement commands, adversarial assertions
and the concurrency helper.

The helper runs the previous eight observed-blocking cases plus one combined opposing-order
multi-zone/delete case: same-key replay, an alternate key for one placed receipt, a household-key
conflict across receipts with loser rollback, review-save/parse-promotion/parse-failure rejection,
membership revocation ordering, zone deletion winning before placement, and the combined two-zone
case. The last case has four blocker observations in the archived
[concurrency log](../../.env.qa-sckrl311-evidence-20261101/run-zu04vnsp/094-sckrl311-concurrency.log):

| Waiting session | PID | Observed blocker | PID | Evidence |
| --- | ---: | --- | ---: | --- |
| High-zone-first placement A | 10534 | High-zone gate | 10530 | A waits at the gate while its request lists high zone before low. |
| Low-zone delete probe | 10541 | Placement A | 10534 | The lower-zone delete probe sees A holding that zone before B starts. |
| Low-zone-first placement B | 10558 | High-zone gate | 10530 | B waits at the same gate with the reverse submitted zone order. |
| Final low-zone delete | 10564 | Placement A | 10534 | The final delete reports A only, a nonempty subset of the recorded A/B blockers. |

The successful concurrency-helper exit requires the probe to time out with `55P03` and roll back,
both placements to return `placed`, and the later delete to fail with `23503`. Its post-race
assertions require each canonical result/status, the exact receipt-line-to-zone mapping, matching
stock and acquisition-event lineage/zones, one placement row per receipt, and both synthetic zones
to remain. Thus the observed execution covers the placement-wins/delete-later ordering and bounded
opposing submitted zone orders. It did not observe both placements simultaneously blocking the final
delete, and it is not exhaustive evidence for every schedule.

## Failed sandbox attempt — 2026-11-01 (before SQL)

The first local attempt is preserved separately in its
[archive registry](../../.env.qa-sckrl311-evidence-20261101/run-4v3a77e6/archive.json) and
[initdb log](../../.env.qa-sckrl311-evidence-20261101/run-4v3a77e6/001-initdb.log). It exited 1 at
the first `initdb` step because PostgreSQL could not create a shared-memory segment (`shmget:
Operation not permitted`). `checksPassed` is absent, and the runner found no live cluster PID to
clean up. The archive preserved all files from this single step and contains no
database data. This is sandbox-restriction evidence; no SQL assertion ran and no passing result is
claimed from it. The subsequent permissioned run above supplies the current SQL evidence.

## Historical successful replay — 2026-10-24 (raw artifacts unavailable)

The Chair's prior successful result was reported at `/private/tmp/sckrl311-validation.a3vvont4/results.json`,
SHA-256 `5c79d11c6b2e58e462a5136dc24487723656707f1566bddb42580871e0f2967a`. At that time, 95 steps
and logs, 32 input hashes, `checksPassed`, `clusterStopped` and PID absence were independently
reported and verified by C. Those raw temporary files were cleared before 2026-11-01; the hash and
pass remain historical facts, not the current retained evidence. The new 2026-11-01 archived run
above re-establishes inspectable evidence with the same reviewed helper and runner.

## Historical failed observer replay — 2026-10-23 (raw artifacts unavailable)

The previously reviewed runner recorded results hash
`cdf40cd4ee35d89ae55999cf88e9499b10794649ae3c2d756a1b35f91ba7c438` at the then-temporary path
`/private/tmp/sckrl311-validation.8b941dfv`. The raw result and logs are no longer present. At the
time, the 95-step run recorded steps 1–93 and 95 as successful, with step 94's concurrency assertion
failing because it did not observe both placements as the exact blocker set for the low-zone delete.
The two fresh-zone placements were observed behind the high-zone gate, but the logs did not
establish their later commits, the delete's `23503`, or post-race mapping assertions. Preserve this
as a failed helper assertion, not as product failure or success. It was superseded by the reported
2026-10-24 pass; the 2026-11-01 run now supplies current archived evidence.

## Revised execution-packet review — 2026-10-23

Luna C independently reviewed helper SHA-256
`d8a138c27c8fd98b8667650256d97019dae1ce0e9e6c0af269928ace38767ad1` against runner SHA-256
`b2c1ee9aa3fe8ceeb9f3445521fee9ce44dc1cf33121eb848aebeb3a3b577b96` and supported that exact local
execution packet. The helper observes high-first placement A as the blocker for a low-zone delete
probe, requires the bounded 2-second `55P03` path and rollback before B starts, then observes B
blocked on the gate. The final delete accepts a nonempty subset restricted to the exact A/B PIDs,
then requires both placements to commit and the delete to return `23503`. This was static packet
review and a vote on that execution packet, not SQL execution or source acceptance.

## Older reported execution — 2026-10-19 (historical)

The prior report recorded two local PostgreSQL 14.20 runs. The later reported result hash was
`0988aaf97ebadd2810da85e396adf51cf74cf4deba8b0b1504ebf3648964ee08`; it covered 95 successful
steps, five databases and eight observed-blocking scenarios. It was inspected as reported at the
time, but its `/private/tmp` raw artifacts are not the current retained evidence. The earlier run
and its narrower snapshot do not bind the current helper or substitute for the archived 2026-11-01
run.

## Limits and next gate

This local replay is independent of hosted schemas and mobile use. It does not prove real bearer
authentication, PostgREST error/schema behavior, development installation, connected
uncertain-outcome recovery, placement UI, native/device accessibility or Stage 1 exit. The bounded
zone-delete observations do not prove every possible concurrent schedule.

SCKRL-311-source-v1 and source-v2 remain unratified. The new replay and independent artifact review
make the unchanged local source/evidence candidate eligible for a fresh source-v3 manifest and
Council cycle. At this report freeze on 2026-11-01, no source-v3 preliminary or final vote has been
requested or cast; subsequent outcomes belong in the Council ledger. The previous 2026-10-24 C
Support applied only to its execution packet and is not a source-v3 vote. The full SCKRL-311 ticket
remains **Review**. Full development baseline and migration-executor readiness, separately
authorized hosted installation, real Auth/PostgREST and schema-cache acceptance, connected
recovery, prerequisite 304/312 acceptance, SCKRL-305 placement UI and native/device accessibility
remain open. Stage 1 remains incomplete; this disposable replay alone does not mark SCKRL-311 Done.
