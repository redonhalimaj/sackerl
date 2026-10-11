# SCKRL-304/312 real Next HTTP validation

Date: 2026-10-04. Decision: **Support the exercised real Next bearer-route evidence**.
SCKRL-304/312 remain Review. This is bounded route acceptance, not full native, browser-session,
Done, merge-commit CI or program-stage acceptance.

## Execution and independent review

The owner requested actual remaining QA. Infrastructure prepared an isolated temporary packet;
Chair and independent QA reviewed its final v2 before the Chair executed it. The packet directory
is `/tmp/sckrl-next-http.JFywx2`; completed evidence was preserved under
`completed-http-run-20261004` before a subsequent native fixture could replace live attestations.

Fixture run `sckrl-native-20261004195414090-7c15a05a` is under
`/tmp/sckrl-native-fixture.LBV655/runs`. The unchanged accepted fixture helper created two
synthetic owner/member accounts, one household, one labelled three-line saved receipt and one
stock item. Admin access was confined to that reviewed helper's provisioning/cleanup. The actual
HTTP assertions used ordinary owner/member Auth sessions; Next received only the pinned
development public URL and anon key, with no service-role or database credential injected.

QA independently inspected all twenty packet/web-source hashes before execution, the complete
runner/launchers/plan, and afterward the archived HTTP result/stages, process attestations/results,
Next/hold logs and fixture manifest/summary/result. QA performed no HTTP, database, simulator or
GUI call and did not independently rerun hosted assertions. The Chair reported the HTTP process
exit 0 with eight Vitest tests passed: seven offline checks and one live test. The live test contains
**34 recorded assertion stages**, not 34 separate Vitest tests.

## Reviewed boundaries

Final packet registry SHA-256:
`f236355f7aa79f5f2fb14ed28646238b71d51a544379b337c1e3ae5fab5c8023`.
It binds nine packet artifacts and eleven real web auth/route/config source files. The preserved
fixture registry is
`3e5e92b9f508a2c2a44b9ca69fea36334d4fa0c8ef496aefd04321679106ac75`;
its fifteen entries are checked before setup and mutations.

| Artifact             | SHA-256                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `http-runner.ts`     | `89e89454b7191c88baba0160957e819dc9d803ddc0c59c6a26894bed43f74818` |
| `launch-next.cjs`    | `88a2c45984c399db775392fe1eeccf985127cb493c88320e14b33de16c7706be` |
| `hold-controller.py` | `e12ca4d9875d15c759232d5307df0bc7decb2997b520b8e4fcda1a717afc8800` |
| `guards.cjs`         | `6acab609ef0039fe286bd1fa4b11d2daa5387c76875057b7bb7259fbd0a18104` |

The Next child binds only `127.0.0.1:3117`; the runner allows GET on the selected local routes and
PUT only on receipt review. Requests have finite timeouts, refuse redirects and never retry writes.
Launcher/worker PID and start-time attestations, reviewed commands, fixture identity, phase and
lease with at least one minute remaining are checked before writes. The Chair verified readiness
and exclusive ownership of the port/cache before execution.

Existing owner dotenv files were preserved. Validation allowed only four public keys, requiring
development app environment, matching development Supabase URL/anon key and loopback API URL;
private/unknown/duplicate keys were rejected. The running attestation records only file/config
digests and target information, and these are checked again before PUT. No owner environment file
was rewritten. Auth SDK sessions used private Map storage and explicit refresh stops during
initialization/sign-in/server identity checks, then local-scoped logout and memory cleanup.

## Accepted results

Archived `http-result.json` has `passed: true`, `checksPassed: 34`, all stages passed and
`cleanupComplete: true`. Its stage array exactly matches `http-stages.json`.

| Exercised behavior     | Actual result                                                                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner/member reads     | `/household`, `/items?include_removed=true` and the exact owned `/receipts/<id>/items` return HTTP 200 with the same household/review/stock snapshot.                   |
| Bearer rejection       | Missing, malformed and fixed-invalid bearer GET and PUT each return 401.                                                                                                |
| Invalid input          | Malformed JSON, array payload and impossible Gregorian date `2040-02-30` each return 400; full review readback stays unchanged.                                         |
| Dated expiry           | Guarded owner PUT persists `2040-02-29`, correct owner expiry attribution and advanced revision, preserving parser evidence.                                            |
| Old-client omission    | Member PUT without expiry preserves the dated value, expiry actor and timestamp.                                                                                        |
| Explicit no-date/reset | Member `no_date`/null and owner `unknown`/null PUTs each roundtrip with the correct actor, timestamp and revision.                                                      |
| Stale save             | Original revision PUT returns 409; the full latest review remains unchanged.                                                                                            |
| Absent receipt         | Random nonexistent UUID GET and PUT return 404; the real synthetic receipt remains unchanged. This is absence/scoping evidence, not another household's isolation test. |
| Lineage and stock      | Same receipt/generation, three parser-line identities and parser evidence remain intact. Stock snapshot is unchanged at one seeded item; review creates no stock.       |

The Next log contains 27 HTTP 200, three 400, seven 401, two 404 and one 409 response entries.
Additional responses include baseline/reload/readiness reads; these counts are not the assertion
count. They agree with exercised runner paths and recorded statuses.

These are real HTTP route handlers, not mocks. There is no application `middleware.ts` in this
web app. `apps/web/lib/api-auth.ts` resolves the bearer header and verifies the token through
development Supabase `/auth/v1/user`; the receipt route then resolves the authenticated household,
parses the request and calls the guarded shared review client. This establishes the selected
handler/auth/validation/error-mapping path, without claiming nonexistent browser-cookie middleware.

## Cleanup and process outcomes

The reviewed runner sends the exact fixture finish signal in finally and waits for the helper.
Its archived controller result records `ready: true`, worker exit 0 and the correct manifest path.
The hold log reports eleven fixture/control tests passed and four modes skipped. Helper result
records `provisioningFailed: false` and `cleanupComplete: true`.

Manifest/summary agree on phase `cleaned`, `fixtureReady: false`, all settled account/household
creation intents and verified removal-or-absence entries for the exact household
`2ae5c460-4758-4a73-8dc3-4cd3435ab592`, member
`f3df1e85-65af-4d97-a1ad-33714af4f832` and owner
`5b0399de-eec7-440e-8142-9833b08e946b`. Under the accepted helper, these entries follow exact
run-marker/owner/name and authoritative absence checks; uncertain household cleanup cannot be
bypassed through an account cascade. QA verified the actual `login.json` is absent without reading
credentials. The fixture/archive directories are mode 0700; manifest/result files are mode 0600.

The archived Next result records exit 0 and `stoppedByOwner: true`. The Chair reported terminating
only the recorded launcher after the runner, waiting for its exit and verifying no listener remained
on port 3117. QA inspected the saved result/attestation rather than independently querying live
processes or socket state. Original simulator sessions and Metro were outside this HTTP run.

## Limits and remaining checks

This closes the exercised real bearer receipt/household/stock HTTP path. It does not establish all
Next routes, browser cookie/CSRF/session behavior, production deployment, real foreign-household
HTTP isolation, camera/media/OCR, or HTTP lost-response recovery. A timeout would have remained
uncertain; no such fault was injected and no write was replayed.

Native conflict/navigation/in-flight/uncertain-save, dirty account changes, accessibility and
standalone/physical-device checks still require their own evidence. The native run follows a new
sequential fixture after this cleanup; it cannot reuse these deleted accounts. Final independent
QA/Council acceptance and ticket Done remain separate. Existing PR-head CI is historical evidence,
not a fresh CI or test invocation on the merged `dev` commit.

Related evidence: [connected shared-client checks](sckrl-304-406-312-connected-review.md),
[native checks](sckrl-304-406-312-native-review.md),
[312 source review](sckrl-312-review.md), and
[312 development installation](sckrl-312-development-migration-plan.md).
