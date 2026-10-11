# SCKRL-304/312 native follow-up validation

Date: 2026-10-04 UTC. Decision: **Support the exercised native draft and conflict behavior**.
This is bounded Expo Go simulator evidence. SCKRL-304/312 remain Review; it is not a final
Council Done decision, standalone-build acceptance or complete navigation/accessibility validation.

## Execution and independent review

The owner authorized actual remaining QA and generated synthetic GUI logins. The Chair executed
the isolated setup, Simulator interactions, ordinary member conflict command, readbacks and final
cleanup. QA independently reviewed the preparation packet and the saved UI screenshots/accessibility
captures, command result, ordinary-session readbacks, fixture records and device cleanup record.
QA did not perform network, database, GUI or device actions, rerun hosted assertions or read credentials.
The actual independent QA route was `gpt-6.1-sol` at high reasoning, the recorded fallback for the
unavailable preferred `gpt-5.5` QA route.

Fixture run: `sckrl-native-20261004211724910-395d1a42`, under
`/tmp/sckrl-native-fixture.LBV655/runs`. UI/device evidence is under
`/var/folders/sz/htc75wrs1gqc7qxrylld40sc0000gn/T/sackerl-native-followup-xzhh_95u`.
The fixture had two synthetic owner/member accounts, one household, one labelled three-line saved
receipt and one estimated stock item. This was a fresh native fixture after the separate real Next
HTTP fixture was cleaned; the HTTP evidence remains archived separately.

The fresh QA device was `B11DBEC8-F0FE-45D2-81D3-FA8EAE1AEC3F`, named
`Sackerl QA 78f46f971c`. The original device
`534D9647-8E3B-4EFE-A3F6-CF45A0905324` was outside the test identity/session scope.
Device metadata verifies the development target and running bundle SHA-256
`c3f81af19f5af8cf71dea72347024406a5783a7dd181e5eb96e529a82b86a3f5`.

## Reviewed preparation

| Artifact                        | SHA-256                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| Native conflict v2 registry     | `d1186d9716c7901881b1a564d575c66b10f08d0650399bff2a2117e8674edbfb` |
| Ordinary member conflict runner | `5f7f50bc0ac6b2a53487c2bddccd28d9eb886ddad1077757cdc36fa929624e0c` |
| Native remaining-QA plan        | `f49d7b6c41286ddc4c6eaad94d68c15196f64c5cc4792c7ee78268062c7518db` |
| Immutable fixture registry      | `3e5e92b9f508a2c2a44b9ca69fea36334d4fa0c8ef496aefd04321679106ac75` |
| Holding controller              | `e12ca4d9875d15c759232d5307df0bc7decb2997b520b8e4fcda1a717afc8800` |
| Device setup                    | `d4cee12707e9611d62cc02c7c4892cd373c2bd6d3d670f97033363aed39bdb6a` |
| Exact-device cleanup            | `15bb20c4b236fa247f26080775f4bcdde96b655f95c22ebd54c516b89e5cb2a4` |

The reviewed member runner binds the exact fixture, household, receipt, generation and revision;
checks the holding process, lease and accepted source hashes; and sends one guarded review save.
It changes one parser line's corrected name and marks it unresolved, omitting expiry keys. Private
Auth storage, explicit refresh stops and local-scoped final logout preserve the owner's GUI session.
An exclusive write intent prevents repeating an uncertain command. Admin access is confined to
the accepted fixture helper's provisioning/cleanup. No product source was changed.

## Accepted observations

| Case                         | Evidence and result                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Calendar validation          | Capture `17-native-invalid-calendar-save-blocked` shows `2040-02-30` in the reopened editor with “Enter a real date in YYYY-MM-DD format.” Capture 18 shows `2040-02-29` accepted as “February 29, 2040.” The date was then reset to Unknown in an unsaved draft; this is editor validation, not a persisted date change.                            |
| Dirty header navigation      | Capture 21 shows the leave warning with Reload latest, Discard changes and Keep editing. Capture 23 retains the exact `Native QA owner Gesture Draft` after Keep editing. A second header-back warning and explicit discard lead to Home in capture 26; stock remains one item and the saved receipt remains resumable.                              |
| Controlled concurrent change | The ordinary member runner records one successful guarded save, revision 1 to 2, changing Milk to `Native QA Milk QA concurrent edit` and leaving one line unresolved. Its result reports three receipt lines, one stock item, preserved parser/expiry evidence and accepted local logout. This command result explicitly makes no native assertion. |
| Native stale-save handling   | The owner reviewed a different local draft at revision 1, then pressed Save after the member's revision 2. Capture 32 shows the changed-elsewhere conflict message, retains `Native QA owner conflict draft`, offers Reload latest review and omits Done for now. Placement remains disabled.                                                        |
| Explicit reload              | Capture 33 warns that reloading replaces unsaved edits and offers Keep editing/Reload. After explicit Reload, capture 35 shows the member's saved name and one unresolved line. Done for now is available with the saved-but-not-in-stock explanation; placement remains disabled.                                                                   |

The important invalid-date, conflict and reload-warning screenshots were visually inspected in
addition to their accessibility text. Field entry and modal/button interaction were exercised;
these observations do not constitute a complete software/hardware keyboard or screen-reader matrix.

Initial owner readback `readback-20261004212017622.json` reports the same receipt/generation at
revision 1, all three lines reviewed and unknown expiry. Final owner readback
`readback-20261004213712145.json` reports revision 2, the member's corrected Milk name/actor and
one unresolved line. QA compared the snapshots: parser evidence, line identities, expiry values/
actors/timestamps, the complete stock snapshot and expiry-fact history are unchanged. The owner's
unsaved/conflicting names were not persisted, and no stock was created by review.

## Cleanup evidence

Fixture result records `provisioningFailed: false` and `cleanupComplete: true`. Manifest/summary
agree on phase `cleaned`, `fixtureReady: false`, settled creation intents and verified
removal-or-absence entries for the exact household `4b73969d-f58b-45c7-af33-b56b247a9fa3`,
member `84f3b997-ef6e-4c43-8c43-055344089947` and owner
`67b85a9f-8f6e-4f4f-8d62-33f6ac4ac6b0`. The accepted helper checks exact run ownership and
authoritative absence; an uncertain household cleanup cannot be bypassed by deleting an account.
QA verified the actual singular `login.json` is absent without reading it.

The controller result identifies this native manifest and records worker exit 0. The Chair reported
the holding controller exited 0 after the exact offline finish signal. The reviewed device cleanup
hash still matches; `device.json` records `cleanup_verified: true` for the fresh QA device.
The Chair's actual cleanup invocation exited 0 with `qa_device_absent: true` and
`original_booted: true`. QA inspected saved evidence rather than querying live hosted accounts or
device inventory. No new claim about the original app's visible session is inferred from boot state.

## Remaining gates

Actual receipt edge drags failed with `noWindowsAvailable` for both Simulator name and resolved
bundle ID. A welcome-screen transport diagnostic does not validate receipt navigation, and the
planned clean-receipt positive control was not completed. Native edge/swipe-back remains unverified.

The transient In progress save capture does not prove attempted navigation during an in-flight
save. In-flight navigation, offline/network interruption, uncertain/lost-response recovery, dirty
account changes, full accessibility/VoiceOver/dynamic-text coverage and standalone/physical-device
checks remain open. These require their own bounded execution plans and evidence; no timing-only
or clean-account-switch substitute was accepted. Final independent QA/Council Done acceptance is
still separate from the existing integration into `dev`.

Related evidence: [earlier native checks](sckrl-304-406-312-native-review.md),
[real Next HTTP checks](sckrl-304-312-next-http-review.md), and
[312 source review](sckrl-312-review.md).
