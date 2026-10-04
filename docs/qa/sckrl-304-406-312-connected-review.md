# SCKRL-304/406/312 connected validation

Date: 2026-10-04. Decision: **Support bounded real Auth/PostgREST/shared-client L2 evidence**.
SCKRL-304/406/312 remain Review; native and final acceptance gates are not waived. This is not
a Council final Done decision or a Stage 1 exit claim.

## Execution and independent review

The Chair executed the independently reviewed temporary harness against development project
`raqqhpeailkxqvubgzir`, using HTTPS Auth and PostgREST. The successful run is
`/tmp/sckrl-connected-qa.hQUcwx/runs/sckrl-qa-20261004081439810-1f570395`.
The Chair reported an immediate pre-execution hash check and actual process exit 0: eight Vitest
tests passed, three mode-specific tests skipped. The connected test contains **22 live assertion
stages**; these are not 22 separate Vitest tests.

Independent QA reviewed the harness and its execution/cleanup plan before each deliberate fresh
run, then inspected the successful `manifest.json` and `result.json`, all three retained failed
results, and all ten artifact/source hashes. QA performed no database or network calls and did
not independently rerun hosted assertions. Process exit evidence is Chair-reported; the saved
result/manifest and reviewed assertions were independently inspected.

The command was explicitly enabled; default preparation mode does not run connected checks:

```sh
SCKRL_CONNECTED_QA_MODE=execute SCKRL_CONNECTED_QA_APPROVE=dev-isolated-304-406-312 pnpm exec vitest run --config /tmp/sckrl-connected-qa.hQUcwx/vitest.config.ts
```

Real shared Auth, Profile, Receipts and Items clients use ordinary owner/member/outsider sessions
for application assertions. Admin access is limited to the read-only prerequisite probe,
synthetic account/membership provisioning and guarded cleanup. Three new directly confirmed
`@example.invalid` accounts carry a unique run marker; owner and outsider have separate synthetic
households. No email/invite, media upload, OCR, job, notification, fixture SQL or migration is called.
Secrets remain in ignored configuration or private memory and are not command arguments or report
content. Each Auth client uses explicit private memory storage and stopped automatic refresh;
the shared factory's persistence/refresh defaults are not mistaken for disabled options.

## Reviewed hashes

All entries below matched the final `review-hashes.json` on independent inspection. Temporary
files are under `/tmp/sckrl-connected-qa.hQUcwx`; source files are under `packages/api-client/src`.
Only the temporary harness/plan changed during these connected runs; product dependencies did not.

| Artifact             | SHA-256                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `harness.test.ts`    | `c9b38ec1aacc98e36bd96ea4cbec0ebeb35e5b33609e325b2a2ee94a33106524` |
| `plan.md`            | `fc964ea4872a85b0db7d42e33430cd1f46be4748e8678d4b87f0abf3c953ff20` |
| `vitest.config.ts`   | `b83cb2579abad3d411050c806b4a108d0ff592dc6c6427c318104a9f194809c7` |
| `tsconfig.json`      | `7fc2daf5925e3700188f5173215bda1601a41a4b2586e5631a16422a33384de4` |
| `auth.ts`            | `acf3541482788483b0ff921481d3a7abc6c3b0967fb91d9c26cffd4a6d5f6627` |
| `profile.ts`         | `9556e25ddaa3e011e24d4bba6c239e546f9214194f7bd00db79d43971a3aa1a3` |
| `items.ts`           | `4127100e7deeffae965e5c25846ac14f972e296ca0f4a21829d839772bd31a6a` |
| `receipts.ts`        | `cd9f08c0f77a20bbb2916369302a313ba74df480380ba36e185bddc74c490cab` |
| `receipt-parsing.ts` | `bdbb55deb240b929c71fb34233887101cd2c46bed0abb652fe4ea0f56fe91d44` |
| `index.ts`           | `ff1531c76b0c49dc0f22029f4ddd148db6194aa616792bbc27ff60125b581b40` |

## Accepted results

The successful saved result has `connectedPassed: true`, `failedAt: null`, and all 22 assertion
labels. Its manifest has `complete: true`; assertion and cleanup lists agree exactly between
the two files.

| Coverage                       | Live assertions established                                                                                                                                                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Auth and household calendar    | Password sign-in/server identity, explicit session refresh, owner calendar write, member fallback/read and actual denied calendar write, invalid IANA rejection and outsider separation                                                                                                                                              |
| Receipt review                 | Honest no-generation response, synthetic parse promotion, persisted manual identity, member name/quantity/unit/category correction and reload, immutable parser evidence, stale revision/generation conflicts, actual reparse replacement and last-good-lines preservation after parse failure                                       |
| Receipt expiry                 | Dated leap day, no-date/excluded and unknown/manual defaults, old-client omission, actual-change versus unchanged attribution, distinct reviewer and expiry editor, explicit reset, strict invalid date/state/actor rejection, later-FK rollback of rows/revision/attribution                                                        |
| Receipt access and resume data | Direct line/header writes denied, outsider/wrong-household/invalid-token rejection, saved reviews paginated 3+1, same receipt reloaded by a fresh client/refreshed session, all-excluded completed review, zero stock and stock expiry facts from review                                                                             |
| Stock expiry provenance        | Undeclared inferred evidence, inferred confirmation becoming a user assertion, declared-estimate precision/idempotency and confirmation without date movement, member printed fact/confirmation, stale/null expected-fact rollback, ordered single-active history, untouched metadata preservation and atomic clear with idempotency |
| Stock isolation and integrity  | Invalid/model/actor-spoofed declarations and direct history writes rejected, forged projections replaced by honest provenance, foreign-household expected fact rejected with HTTP 403, outsider item/history isolation, foreign zone rejected with HTTP 409/23503 without an extra item                                              |

The all-excluded assertion requires zero included rows, reviewed status and `canComplete: true`.
This follows accepted review-completion semantics; it does not establish placement eligibility
or implement SCKRL-311. The foreign-fact rejection is the explicit PT403 boundary, distinct from
a stale same-household fact's PT409 conflict.

## Cleanup and retained failures

The successful run records exactly three synthetic users and two households. All account-create
and household intents are settled. Cleanup entries match the two recorded household IDs and all
three user roles, with no missing or extra entry. Under the reviewed harness, these entries are
recorded only after household absence and Auth-user absence checks pass.

Household intent is persisted before the multi-request helper. Recovery queries only its
run-created owner, requires the exact synthetic name/owner/recorded ID and blocks owner deletion
if uncertain or mismatched. Account deletion requires exact ID/email/run marker. This prevents
cleanup from silently bypassing an uncertain household guard through Auth cascades. Synthetic
sessions are signed out, refresh is stopped and memory storage cleared. The run directory has
mode `0700`; manifest/result files have mode `0600`.

The three earlier run directories remain under the same `runs` directory, with
`connectedPassed: false`, settled intents and recorded cleanup of both households/all three users:

| Run                                   | Completed stages | Harness-only correction before the next new run                                                                                          |
| ------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `sckrl-qa-20261003230322921-408a463c` | 2                | Replace JSON string equality, which depends on object key order, with structural equality and actual-mapper positive/negative regression |
| `sckrl-qa-20261003231101282-cab3b2ae` | 12               | Correct the all-excluded assertion to accepted review-completion semantics                                                               |
| `sckrl-qa-20261004081120827-0b4c4415` | 21               | Expect the accepted foreign-household fact rejection HTTP 403 instead of stale-fact HTTP 409                                             |

These failed runs remain failures. Their partial coverage is not substituted for the successful
complete run, and their corrections changed no product source or migration. Each new run was
independently reviewed and deliberately executed with new isolated fixtures, rather than
automatically replaying uncertain mutations.

## Remaining gates

This establishes the exercised shared-client Auth/PostgREST L2 behavior. It does not run Next.js
route middleware, the mobile route or Home state machine, actual sample-button navigation,
native layout/date modal/keyboard/screen-reader/back-swipe behavior, account-switch UI or an
app termination/relaunch. Fresh-client/session readback is not native durable-resume evidence.
Injected invalid writes and stale tokens are not lost-response/offline UI acceptance.

Native Add/Edit/Settings, receipt editing/exit/restart and bounded SCKRL-908 smoke evidence remain
open, as does final integration acceptance. This synthetic receipt test does not validate real
acquisition, private upload, OCR or future SCKRL-311 placement/retry/immutability. No deployment,
publication, merge or Stage 1 exit is established.

Historical source reports remain separate: [304](sckrl-304-review.md),
[406](sckrl-406-review.md) and [312](sckrl-312-review.md). Previously accepted
[406 local replay/concurrency](sckrl-406-database-review.md) and
[312 development installation](sckrl-312-development-migration-plan.md) are prerequisites,
not substitutes for these connected assertions or the remaining native gates.
