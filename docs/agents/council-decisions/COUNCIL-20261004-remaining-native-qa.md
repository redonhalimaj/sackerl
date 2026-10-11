# Council: remaining receipt and expiry native QA

Prepared 2026-10-04; executable proposal published 2026-10-05.
State: **Pending review — owner deferred continuation; not ratified**. Recommendation **v1** binds Infrastructure
fault packet **v2**. The earlier investigating draft had no votes and was not an execution decision.

Immutable recommendation SHA256: `a1a591e9d17c52aa53de219f281dc5ce0aa102e501736e00e088b19e63dbb743` (UTF-8 bytes between the begin/end markers,
including every newline immediately after BEGIN and before END; split on the literal marker
strings without stripping a newline). Mutable vote/decision metadata lies outside the markers.

Freeze clarification: the initial `07d452…4cea1` calculation stripped the first newline after
BEGIN. The full recommendation bytes never changed. Chair, Infrastructure and QA independently
confirmed canonical `a1a591…b743`, 16,315 UTF-8 bytes with two leading and two trailing LF bytes.
No specialist preliminary vote was cast before correction. Deputy’s earlier unratified Support
referenced the noncanonical calculation; a fresh exact-canonical vote remains pending.

At the owner’s night-stop request, all fresh votes and runtime work are deferred to the next
session. No synthetic fixture, fault controller or new Metro server was launched; root owns
restoration/cleanup of the prepared QA simulator and the root `temp/iphone-qa.md` handoff.

<!-- BEGIN IMMUTABLE EXECUTION RECOMMENDATION V1 -->

## Execution recommendation v1

Proceed with the smallest reviewed reversible native QA path for the owner's explicit request:
actual remaining SCKRL-304/406/312 receipt/expiry recovery and scoped SCKRL-908 checks, using one
isolated QA device, a fresh synthetic development fixture and a separate QA entry/bundle. This
approves a test approach, not passing results, ticket Done, a new feature or full Stage 1 acceptance.

### Participants, ownership and exclusions

| Seat                          | Actual route                                                                   | Ownership                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Chair `/root`                 | Runtime model/effort not exposed; preferred route is not an identity claim     | Reciprocal review, device/UI execution, integration, status and evidence capture. |
| Deputy `/root/deputy2`        | Existing explicit fallback `gpt-6.1-sol`, xhigh; preferred GPT-5.5 unavailable | This decision record and exact recommendation/vote coordination.                  |
| Infrastructure `/root/infra2` | Existing explicit fallback `gpt-6.1-sol`, xhigh                                | Temporary fault/Metro/controller packet, guarded lifecycle and build feasibility. |
| Independent QA `/root/qa2`    | Existing explicit fallback `gpt-6.1-sol`, high                                 | Independent artifact and actual result/cleanup acceptance.                        |

Chair declared these four seats before votes. Product UI, auth/provider contracts and accepted
source are unchanged; no debug UI is added. Real Router/Auth singleton commands are QA-only
instrumentation, so Frontend is not added for this proposal. Any material product/UI/source change
returns to the Chair for the affected seat and a fresh revision. Ticket primary ownership stays
Frontend for304/312, Backend for406 and QA for908. Deputy edits this record only.

Exclude migrations, production writes, original-device/session/data changes, global network/VPN/
proxy/certificate controls, source/env edits, provider/build publication and new features. Preserve
original simulator `534D9647-8E3B-4EFE-A3F6-CF45A0905324` and Metro8081/PID59445. No direct dev push,
merge or deployment is authorized by this QA decision.

### Exact packet and hard prerequisites

| Evidence                                                                        | Exact revision/digest                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fault packet `/tmp/sackerl-native-fault-fAXZzi/review-hashes.json`              | v2; SHA256 `befd5c95b2daf4d5921b0d6ef7d435be5f9d96cfc3e9f70ae9829706632eb6a0`                                                                                                                                                                                                                     |
| Packet coverage                                                                 | 17 packet artifacts,42 unchanged product files,8 installed SDK files,1 holding-controller prerequisite.                                                                                                                                                                                           |
| Holding controller `/tmp/sckrl-next-http.JFywx2/hold-controller.py`             | SHA256 `e12ca4d9875d15c759232d5307df0bc7decb2997b520b8e4fcda1a717afc8800`                                                                                                                                                                                                                         |
| Accepted fixture registry `/tmp/sckrl-native-fixture.LBV655/review-hashes.json` | SHA256 `3e5e92b9f508a2c2a44b9ca69fea36334d4fa0c8ef496aefd04321679106ac75`; all15 entries unchanged.                                                                                                                                                                                               |
| Offline evidence                                                                | Infrastructure reports9 passing offline tests, syntax/format/self-check and installed Babel/router context/Auth realpath probes. Deputy independently verified all68 packet/source/SDK/prerequisite hashes; QA verified those plus fixture15. Neither offline tests nor probes are native passes. |
| QA device                                                                       | Existing isolated `4B17DAA3-0605-40E7-A048-EC320DB6DBBD`; root binds actual creation/installation metadata.                                                                                                                                                                                       |
| Baseline bundle                                                                 | Uninstrumented SHA256 `c3f81af19f5af8cf71dea72347024406a5783a7dd181e5eb96e529a82b86a3f5`; instrumented entry has a separately recorded digest.                                                                                                                                                    |

Rehash the registry and its entries immediately before launch. Use the installed Expo Go binary,
shadow source links and separate Metro8082/private TMPDIR/control3218; original8081 stays intact.
The launcher injects public dev configuration only, disables dotenv/online Expo checks and records
owned process identities. Only the exact development origin
`https://raqqhpeailkxqvubgzir.supabase.co` receives ordinary app Auth/PostgREST requests.

**Before QA login or faults/writes**, download the actual served QA bundle/source map into private
evidence and prove unchanged route/product modules and one original mobile Auth singleton, with
matching Router/React/SDK realpaths and actual route root. Record QA-entry differences and digest;
stop for refinement if Metro identity/rendering differs. Static source links are not this runtime
proof. Do not arm faults or submit credentials against an unverified bundle.

Use a fresh sequential held fixture: exactly2 generated owner/member users,1 household,1 saved
receipt/generation and initial stock. Verify exact run/project/IDs, accepted hashes, controller and
worker PID/start/command, phaseholding and future lease before commands/UI writes. Interception
requires at least240seconds lease remaining. No expired run, original account or real household
can participate. Private login files stay0600 in0700 directories; no passwords/tokens/raw receipt
body in bundle artifacts, logs, screenshots or command arguments. The local nonce is an ephemeral
synthetic-test capability, not a production security design. Mobile Auth uses its unchanged storage
on this QA device; external evidence sessions use private Map storage and local logout.

### Bounded actions and required observations

Only exact bound `get_receipt_review`/`save_receipt_review` RPCs are faulted. Ordinary Auth and
other endpoints retain their actual transport. One matching read/save arm is consumed once within
90seconds; maximum6 faults,20 target claims,6 lines,45minutes bridge/controller lifetime. Forwarded
RPC timeout is30seconds; successful-response hold is at most180seconds. Root serializes commands,
uses recorded request IDs, and never automatically retries an uncertain write.

1. **Read failure:** arm `reject_read_before_send`, open the receipt, observe actual load error,
   then use Retry. Dispatch count0 for the rejected read and unchanged canonical data are required;
   the consumed arm allows the retry to be an actual ordinary read.
2. **Mutation failure:** arm `reject_before_send`, make a valid local draft and save. Prove no
   dispatch/commit, retained draft, uncertain/reconcile copy and no Done/success. Explicit Reload
   reconciles the unchanged snapshot; a deliberate fresh save can subsequently succeed once.
   These are app-specific simulated connectivity failures, not OS-wide offline evidence.
3. **Pending completion:** arm `hold_response`, save once and verify an actual successful200 and
   advanced revision are withheld from the app. The hosted transaction has committed; only app
   completion is pending. Attempt real UI navigation and the reviewed QA `back` command invoking
   mounted `ExpoRouter.back()`. Observe the original Saving alert/removal prevention, no Done,
   no discard exit or second save; release once and verify one saved result. A disabled custom
   Back tap alone is not removal-hook proof. Router dispatch is instrumented lifecycle evidence,
   not a physical gesture pass.
4. **Committed response loss:** arm `drop_confirmed_response`; forward once and use accepted
   ordinary readback to prove the exact committed revision. `confirm-drop` validates same-run
   receipt/generation/revision evidence before dropping. Observe uncertain retained draft,
   guarded exit and no false success/Done. An explicitly tested old-revision retry must409 without
   another mutation; Reload reveals the committed values, stable manual client-line identity and
   unchanged stock/facts. Review uses revision guards, not placement operation-key replay. Failed
   corroboration or hold expiry delivers the real response and is not a successful drop test.
5. **Account/late-response scope:** hold an owner response and invoke the SAME device Auth
   singleton's ordinary member sign-in; verify authoritative synthetic identity and real provider
   event. Observe cleared owner local draft/actor scope and freshly authorized member canonical
   load, then release the old response and verify it cannot restore old local state/success.
   The previously reviewed `/tmp/sckrl-native-conflict.DPy395` member helper (registry
   `d1186d9716c7901881b1a564d575c66b10f08d0650399bff2a2117e8674edbfb`) may make one guarded
   change to strengthen canonical comparison, after fresh hash/binding review under its exact guards. Shared committed
   same-household data may legitimately appear. Label instrumented SDK-triggered transition;
   there is no ordinary dirty-account-switch UI. No global logout, token injection or storage tamper.
6. **Same-account refresh:** optional single `refresh` calls the same SDK's actual refresh API.
   Require real `TOKEN_REFRESHED` and `accessTokenChanged:true` to claim token-change suppression.
   Refresh during held completion must preserve draft/enter uncertainty; releasing old completion
   must not overwrite it. Missing event, failed refresh or unchanged token leaves this axis open.
   Maximum2 role switches and8 real-router-back commands apply to the run.
7. **Actual larger text/keyboard:** record current QA-only content size, use the supported scoped
   CLI `xcrun simctl ui <QA_UUID> content_size accessibility-extra-extra-extra-large`, then inspect
   actual receipt/stock Add/Edit/owner-member Settings labels, errors, modal focus/return, scroll,
   keyboard and reachable critical actions through Sky. This is native OS Dynamic Type, not a
   font shim. Restore the recorded initial size in finally before QA-device cleanup. Technical
   terminal configuration is within the owner's test authorization and normal sandbox approval;
   the Computer Use GUI-settings confirmation policy is not bypassed or applied to terminal work.

The executable commands are in `/tmp/sackerl-native-fault-fAXZzi/plan.md`, whose bytes are bound
by the registry. They use `SACKERL_NATIVE_FAULT_APPROVE=bounded-native-fault-qa`, the exact current
manifest, argument arrays and clean environments. No new dependency or unreviewed command hook.

### Evidence still requiring a separate actual observation

Physical gesture remains open: on the fresh435x930 QA window, Sky drag using
`com.apple.iphonesimulator`, from30,445 to330,445, still returned `noWindowsAvailable` despite
working read/AX/click/type. Require successful clean back on the SAME coordinates before dirty
prevention/Keep/Discard can be accepted. A Router command or welcome diagnostic cannot substitute.

Actual locale/device-household time-zone/DST-date evidence is not an Intl shim. Minimal new smoke
is real QA English→German and Europe/Vienna→America/Los_Angeles preferences, known household
London unchanged, same persisted2040-02-29 and valid past DST-boundary date2020-03-29 with unchanged
ISO readback. Restore QA preferences; any GUI setting action follows action-time skill handling.

Sky exposes no audio observation. First inspect actual QA Settings Accessibility for genuine iOS
VoiceOver availability without toggling; if absent/unusable, the smallest next requirement is a
prepared isolated app/account on an available real iPhone and operator-observed spoken focus and
activation. Mac VoiceOver/AX inspection is not iOS VoiceOver. Root has asked about physical-device
availability separately; no device or user response is assumed.

No standalone project/expo-dev-client/pod tooling is currently established. An isolated native
prebuild/dependency/build path needs its own concrete prerequisites/artifact review before any
new software/signing step. Expo Go/export does not close the development-build/automation gate.
Continue preparation for these gaps after this bounded run; do not mark them passed or stop the
owner's larger validation objective merely because this packet covers the reachable cases.

Full908 includes other existing journey automation; fullStage1 requires still-unimplemented real
acquisition/OCR/placement/reminders. No such feature is started or stage/ticket completion implied.

### Cleanup, alternatives and strongest counterargument

Root outer finally restores QA text/preferences, unloads/stops only QA experience, stops only
recorded3218/8082 children, finishes the exact held fixture and waits for authoritative household/
user absence and private-login removal. Clean the exact new QA device only. Preserve original
Metro PID/start/command and original device/session; retain counters/bundle/readbacks/results,
remove per-run bindings/nonce and verify no new orphan listeners. Cleanup success cannot turn a
failed assertion into a pass. Independent QA inspects actual UI, server evidence and cleanup before
any remaining gate or Done recommendation changes; Chair updates status.

Alternatives are ordinary Expo Go/concurrent saves (already passed conflict but insufficient for
controlled losses), global network controls (broader effects), and product debug UI/source edits
(change tested code). The selected separate entry is the smallest reversible route over actual
unchanged product modules. A native build remains necessary for its distinct gate, not substituted.

The strongest counterargument is that instrumentation manufactures passing behavior. The response
is actual-source/singleton/runtime equivalence as a hard gate, finite exact-request faults over real
Supabase commits, observed native callback/UI results, explicit instrumented labels and independent
readbacks/QA. This accepts a bounded test method, not production security design or unobserved
physical/accessibility/build outcomes. A mismatch returns to the Council rather than being waived.

Related scope/evidence: [Council workflow](../council-workflow.md), [features](../../../features.md),
[Stage1](../../../PROGRAM.md#stage-1-complete-the-reliable-food-loop),
[312 contract](../../features/sckrl-312-receipt-line-expiry.md),
[native follow-up](../../qa/sckrl-304-312-native-followup-review.md),
[HTTP report](../../qa/sckrl-304-312-next-http-review.md), and
[core journey matrix](../../qa/core-journey-test-matrix.md).

<!-- END IMMUTABLE EXECUTION RECOMMENDATION V1 -->

## Preliminary votes — execution v1

| Participant    | Vote    | Rationale                                                                                                                           |
| -------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Deputy         | Pending | Prior unratified Support used the noncanonical digest; fresh exact-canonical preliminary vote is pending and deferred by the owner. |
| Infrastructure | Pending | No preliminary Council vote inferred from packet preparation.                                                                       |
| Independent QA | Pending | Exact packet preparation Support received; full recommendation vote separate.                                                       |

## Chair review and responses

Pending unanimous preliminary recommendation; voting was paused at the owner’s request.
Neither Infrastructure nor QA cast a full-recommendation preliminary vote. No Chair reciprocal
review or fresh final vote cycle was completed. No execution before next-session exact votes,
normal reciprocal review and all fresh final Support votes on this recommendation and packet.

## Final votes — execution v1

| Participant    | Vote    | Rationale                  |
| -------------- | ------- | -------------------------- |
| Chair          | Pending | Fresh final vote required. |
| Deputy         | Pending | Fresh final vote required. |
| Infrastructure | Pending | Fresh final vote required. |
| Independent QA | Pending | Fresh final vote required. |

Decision: **Pending; not ratified; no execution authorization from the Council**. Resume from the
canonical recommendation and frozen packet only after checking they still match. Root remains
execution/integration owner; no native gate or ticket state changed through this proposal.
