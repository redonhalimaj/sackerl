# SCKRL-908 source recovery review

Date: 2026-10-11. Independent reviewer: `/root/qa`, recorded `gpt-6.1-sol` / `high`
fallback. Result: **Support the bounded source increment; no blocking finding.** Final Council
source acceptance is separate. SCKRL-304/406/312 retain Review; SCKRL-908 retains In Progress.
Stage 1 remains incomplete.

## Scope and independence

Reviewed the actual provider/test and receipt-screen-test diff, canonical junior guidance,
generated map, current handoff and ratified design v1 in
[COUNCIL-20261011-01](../agents/council-decisions/COUNCIL-20261011-01.md), SHA-256
`fb72532930bf03fe97afe9e38358b6dec70f8622b730012a6f1a3087367c9ced` (8,321 canonical bytes).
Infrastructure implemented the provider/tests; the Chair implemented screen regressions and
integrated documentation. QA's only durable edit is this report; it did not implement or supervise the
implementation it accepts. No hosted, credential, GUI, native, build or migration action occurred.

The provider preserves its public API, auth storage, route behavior and error text. Generation
and mounted guards suppress old initialization/refresh results and sign-out returned errors
after newer reads/events; effect-local callback liveness also prevents callbacks from a cleaned
StrictMode effect publishing into its replacement. Explicit refresh rejection still rejects its
returned promise, including when superseded, without publishing a new error state.

Mounted tests inspect observable actor/token/status/error using a controlled SDK facade.
Screen regressions use the real route with mocked clients/navigation. They exercise member
context after account switching during reads, saves, household lookup and explicit reload;
stale warning callbacks cannot discard/reload the member draft. Distinct local markers separate
owner drafts from legitimate shared-household canonical data. Deliberate retry follows simulated
rejection before mutation. The separate loss model advances one canonical revision, preserves
manual client-line identity, rejects the old-revision retry with 409 and requires confirmed
Reload before adopting the saved snapshot. Its mutation count is a model assertion, not a
provider dispatch/transaction measurement. Receipt review still creates no stock.

## Reproduction and verification evidence

Infrastructure reported **15 failed, 8 passed** against unchanged source before correction.
QA independently corroborated that result without reverting shared source: copied the exact
`git show HEAD:apps/mobile/lib/auth-session.tsx` bytes into a unique temporary sibling module,
copied the final provider suite with exactly one import substitution, and ran only that copied
suite. Its JSON reporter records exit 1, **15 failed, 8 passed**. Inspected assertions show the
old owner snapshot replacing a newer member event, stale sign-out errors changing ready to error,
and a cleaned StrictMode callback restoring the owner. The baseline provider SHA-256 is
`afb852d367a592bb59e8d2d6668f889fdc42d9c8172a44e75997d37e42dab773`.

Evidence: `/tmp/sackerl-qa-original-provider-0yfxg__l/{summary.json,vitest-results.json,run.log}`.
The exact copied-suite command and one-import proof are in the summary. Copied-test SHA-256:
`f5be3bb5a3b6c24e037acd3b7b1f843800f179d9e7a78e6fbb66052413b49df3`.
Summary SHA-256: `289b998cf3c80f5de755a5ad94bd2ea7ecc43520ddaacaa34de9f89ae0236bae`;
JSON reporter SHA-256: `6dd244bb6a2a1ffb2e8d834682f1ba55b8971e4a4409e7a5884eebeb8c585a89`.
Only the two uniquely created workspace copies were removed in finally; all three final source
hashes below were unchanged. No map/lint/typecheck ran while these copies existed. The separately
executed final suite below establishes the pass-after side of this source reproduction.

| Independently executed check                                                                                                                       | Result                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `pnpm --filter @sackerl/mobile exec vitest run lib/receipt-review-screen.test.tsx lib/auth-session.test.tsx`                                       | Exit 0; 52 tests: provider 23, screen 29.                                                                           |
| `pnpm --filter @sackerl/mobile typecheck`                                                                                                          | Exit 0.                                                                                                             |
| `pnpm --filter @sackerl/mobile lint`                                                                                                               | Exit 0; zero warnings required.                                                                                     |
| `pnpm --filter @sackerl/api-client exec vitest run src/receipts.test.ts`                                                                           | Exit 0; 51 tests.                                                                                                   |
| `pnpm exec prettier --check apps/mobile/lib/auth-session.tsx apps/mobile/lib/auth-session.test.tsx apps/mobile/lib/receipt-review-screen.test.tsx` | Exit 0.                                                                                                             |
| `pnpm code:map:check`                                                                                                                              | Exit 0; 672 callables, 1,232 relationships, 83 modules, zero stale files.                                           |
| Local canonical-document link and roster check                                                                                                     | No missing local targets; TEAM junior anchor exists; AGENTS/TEAM/PROGRAM/agent README agree on `gpt-6-luna`, `low`. |

Vite CJS and react-test-renderer deprecation warnings remain visible; no test failure or lint
warning was hidden. The Chair additionally reports a full mobile run of 116 tests across nine
files and a global formatting pass. QA did not repeat those broader checks after the targeted
passes, because there was no new failure or unresolved concern requiring them.

Junior guidance consistently permits mechanical support for every senior with one supervisor,
exact file scope, short local context, exclusions/checks and supervisor review. It grants no
ticket ownership, delegation, Council vote, service setup or independent QA authority. The
renderer-document correction matches the installed mobile React/renderer 19.2.3 without
rewriting historical acceptance. TEAM's pricing/deprecation statements are attributed to the
Chair's 2026-10-11 official model/pricing-page verification; QA reviewed their local consistency,
not external prices. The text distinguishes published rates from this session's billing.

## Reviewed snapshot

SHA-256 values bind the source and stable documentation inspected for this review. Mutable
status/handoff/vote metadata may subsequently record these outcomes; it cannot broaden them.

| File                                                                | SHA-256                                                            |
| ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/mobile/lib/auth-session.tsx`                                  | `6a8d3f5c52374ee4c214e1afaabb3e29aba5219f3f4e7cebaab6cf2547d04e93` |
| `apps/mobile/lib/auth-session.test.tsx`                             | `52b423aec232a524187726e0d3c903f02622b1e8b9e7c7f0de9a4b4be5caa105` |
| `apps/mobile/lib/receipt-review-screen.test.tsx`                    | `2b41b0bf501383d07e7a9ce95d5d9cfaf4a3f0eec60366e5f712261712a7b643` |
| `AGENTS.md`                                                         | `7f9b36a46592399fcc660e0fa3227c71d3e7d43f62bc2f91edbd6562ae6ef7df` |
| `TEAM.md`                                                           | `fa9276af2ae3109b5f70bb401127d035befbb80b0013ff26384d259eac148c39` |
| `PROGRAM.md`                                                        | `c8517116197f18dbe0fffa1b45208e99cc020fa742c16786452c205ad68bb4ec` |
| `CLAUDE.md`                                                         | `d562cef79f1c0827c59e195fa442a40a17e7dcda57df9ad188b6b28153bc1eb0` |
| `docs/agents/README.md`                                             | `0fc8c041dea360633e7b2c4a8dccff57a439e9aa14f63e44c85211a1a336f58a` |
| `docs/agents/junior.md`                                             | `a5886d4c703fa79a09a1db52724ba1ef38e06c157d7023939b6b928c09c82a79` |
| `docs/agents/council-workflow.md`                                   | `05acba32e7a308e5d1a00368db8f780e37508a55377e808c0a9598e48a01610c` |
| `docs/qa/application-test-harness.md`                               | `bd61fd845d1611aa94c17082ca2034429bba4580d948ff97c352c66d4a144ac4` |
| `docs/code-map/Method Index.md`                                     | `9426b03d8fa64268730417d866cb5434f1eeb119844e7fcef35308fe95ee79c0` |
| `docs/code-map/generated/Methods - apps-mobile-lib-auth-session.md` | `1ccc905432bac43f7ad7ce6289daa55967108ffdfe020b9569da874c92e97581` |

## Acceptance limits and next evidence

These passes establish deterministic source lifecycle behavior under supplied schedules. They do
not establish actual SDK scheduling/Auth-singleton events, wire failures, hosted commits, native
pending navigation/account transitions, physical dirty-swipe prevention or development-build
behavior. The native packet/controllers/fixture are absent; historical hashes cannot bind a new
run. Future runtime execution requires freshly reviewed artifacts, actual served-bundle/singleton
proof, isolated synthetic fixture target/lease, ordinary readback and exact cleanup.

VoiceOver and larger text remain owner-deferred to [release QA](../../temp/release-qa.md),
unexecuted. Actual locale/timezone/DST and keyboard/modal/focus coverage remain separate. No
SCKRL-311/305 placement, acquisition/media/OCR, stock creation, broader SCKRL-908 journey or
Stage 1 completion is accepted. This report supports source-slice Council review only.
