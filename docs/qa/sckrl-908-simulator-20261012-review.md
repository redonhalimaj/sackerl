# SCKRL-908 ordinary simulator review — 2026-10-12

Independent QA: `/root/qa`, recorded `gpt-6.1-sol` / `high` fallback.
Recommendation: **Support the exercised ordinary Expo Go simulator result; no blocking finding.**
Final Council result acceptance is separate. SCKRL-304/406/312 remain Review, SCKRL-908 remains
In Progress and Stage 1 remains incomplete.

## Evidence and independence

The Chair executed the native GUI, ordinary synthetic development fixture, readbacks and cleanup
under [Council02 execution v4](../agents/council-decisions/COUNCIL-20261011-02-simulator.md),
canonical SHA-256 `a780f672aef7334dceda43de16023739e718e4d7be9d0f9947a280290e2f37f5`
(4,225 bytes). QA inspected the actual sealed screenshots/AX captures, action records,
served-source proof, before/after snapshots and cleanup results. QA performed local read-only
hash/comparison checks and changed only this report; it did not implement accepted source,
operate the GUI, rerun hosted assertions or read login credentials.

Private packet: `.env.qa-simulator-20261012-v4`; run `20261012-0fa12931e442`.
QA device: `4FE6CDC0-F0DB-49B5-B374-AA7CB1A798F0`, a new iPhone 17/iOS 26.5 running installed
Expo Go 57.0.9. Owned Metro PID: **11318**; authoritative fixture worker PID: **55939**.
The Chair confirmed **83849** was its terminal tool session identifier, not an OS worker PID.

QA independently verified all **100 evidence hashes** and all **2,169 packet/source bindings**,
including accepted source14. Evidence registry:
`.env.qa-simulator-20261012-v4/ui-evidence/evidence-hashes.json`, SHA-256
`c9a9376d974af693c163164bbf61d7d90b5313ee6d64a690840cf8489b5c8a75`.
Packet registry SHA-256:
`7fd6d6e503a1a89eab42df203cf7382b81e8dbd7a403ba439d9e10996993ada6`.

Fresh served bundle/map and proof bind the run to owned Metro before credentials. The six
critical app/shared sources match once and exactly, with current SDK roots/text, sole auth
context, three pinned virtual sources and 13 pinned binary assets. Actual bundle injection and
compiled Auth/environment bindings prove the development origin; the map's `//` environment
stub does not contain a URL. Bundle/map SHA-256 values are
`9f88c573d8a9e5174461dacfbb910f5be534ce22849a614a6e5d487c4a9318ba` and
`45305735d61d62945e848ec9855be649d5aa7942d699b0bb064b5fe764934a9e`.
Source-proof `nativeRendered:false` correctly describes parser evidence. Native rendering is
established separately by the inspected GUI captures.

## Accepted native observations

| Case                                    | Independently inspected evidence and result                                                                                                                                                                                                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ordinary owner login and saved review   | Sanitized native sign-in actions and settled Home captures 18/38 show the run's resumable receipt; the persisted native correction is attributed to the owner. Capture 07 contains a transient system Save Password overlay and is not used as clean proof.                                                        |
| Dirty header Back and clean control     | Captures 14/15 show the leave warning and retained temporary Milk draft after Keep editing. Captures 18/20 show Home after explicit Discard and canonical Milk after reopening. Capture 21 shows clean header Back returning Home. This is header navigation, not edge-swipe evidence.                             |
| Calendar validation and explicit expiry | Capture 28 shows `2040-02-30`, the inline real-calendar error and retained `Milk QA corrected` draft. Capture 29 shows correction to `2040-02-29`; 33 shows Bread's deliberate No expiry date choice/helper. Capture 35 shows all three included rows Reviewed, with dated Milk, no-date Bread and unknown Apples. |
| Save and honest exit                    | Capture 37 and AX show “Review saved. Items are not in stock yet.”, disabled Continue to placement and Done for now. Capture 38 shows the saved Home resume entry after Done.                                                                                                                                      |
| Actual cold resume                      | The action record identifies termination/reopen on the QA UUID. Settled capture 39 shows authenticated Home; 41 shows the same receipt and saved name/date/no-date/unknown choices after reopening. This is observed GUI behavior, not inference from API readback.                                                |
| Empty selected stock zone               | Settled PNG 43 shows Fridge with zero items. Its earlier AX capture still says Loading Fridge, so that transitional text is not treated as loaded-state proof. Ordinary household readbacks independently show zero stock and expiry facts.                                                                        |

QA visually inspected PNGs 14/15/18/20/21/28/29/33/35/37/38/39/41/43 and relevant AX/action
records. Some transition captures expose only Simulator chrome; screenshots and settled states
support only their exercised assertions. AX labels are not a VoiceOver, focus or keyboard audit.
The Node REPL helper's `globalThis.qaState` repair concerns the operator's captured AX state;
sanitized prior/current action logs record no product AuthContext or session-storage mutation.

## Independent persistence comparison

QA compared the actual `before.json` and `after.json`, rather than accepting the summary flags
alone. Authoritative ordinary owner/member snapshots agree on each canonical review. Receipt
`40814629-fb85-40be-a811-f760e096bfcf` remains in generation
`151e9196-3ffe-4ded-a107-4748c0c1f078`; revision advances **1 → 2**, exactly one persisted native
save. All three line IDs/order, parser/raw/inferred values, confidence and receipt money fields
remain unchanged. All lines are included/reviewed; only the expected correction/expiry metadata
changes. Milk is `Milk QA corrected`, dated `2040-02-29`; Bread is `no_date`; Apples stays unknown.
Milk/Bread expiry attribution is the synthetic owner
`2228064d-dfe1-43f4-9f44-f416380c10bf`; Apples retains null expiry attribution. Review attribution
remains owner. Both actors read **zero stock and zero expiry facts** before and after. This proves
no stock/fact creation in this fixture, not preservation of populated inventory.

| Bound result artifact  | SHA-256                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `source-proof.json`    | `4176f39f68d96b34b592eaec3ccf904b57195d29fccf9bb8c48a0ea3ae2acc46` |
| `before.json`          | `5fd62230d76e2cfc9eb8b6c1527a48a921812b66c4f22f9c9d4e5fe247c05a5e` |
| `after.json`           | `86d1e0cbde4fed5c65ac6e75cb6655b1cde4087ddbd8a21a11caeb1b0f5b2b9e` |
| `fixture.json`         | `104b562aabfc21f6921a41a33f78a73d1c5a86ab4e5bf72065c11c70477f2f2e` |
| `cleanup.json`         | `1c36b1bfd9c7136901b1dc801deeea3176ac781c850ae951b4b536d579fde249` |
| `runtime-cleanup.json` | `dd1cb90e9e626b49ce2e5b72a2e6e646d0fae86f491ed87cc476e5f3e0970463` |

## Cleanup and limits

The reviewed helper's cleanup record verifies exact household, memberships, receipt/lines/
generation, stock/facts and both auth/profile users absent. Manifest is cleaned, not ready;
creation states are deleted; `login.json` is absent. The Chair observed worker completion with
exit 0. Device manifest records only the fresh QA device deleted; Metro records stopped.
Runtime cleanup reports owned resources removed, preservation verified and no issues: original
simulator remains Booted, all initial device states preserved and ports 8081/8082 restored free.
QA inspected these actual records and helper guards; it did not independently query the host or
simulator inventory. Cleanup success does not substitute for the native assertions above.

Earlier proof-tooling failures stopped before device/fixture/login and were cleaned; they are
not app failures or native passes. This completed run accepts ordinary owner receipt review,
save/exit/resume and zero-stock compatibility only. Optional member UI login and Settings were
skipped. Held/lost/offline/uncertain-save recovery, pending navigation, dirty account changes,
adversarial SDK/refresh ordering, gestures, locale/timezone/DST, populated-stock preservation,
remaining modal/focus/keyboard coverage and development-build/physical-device evidence remain
open. VoiceOver and larger text remain owner-deferred to [release QA](../../temp/release-qa.md),
unexecuted. No placement, SCKRL-311/305, full SCKRL-908, ticket Done or Stage 1 completion follows.
This report supports a separate exact Council result recommendation.
