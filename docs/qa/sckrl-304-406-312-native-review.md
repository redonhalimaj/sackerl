# SCKRL-304/406/312 native validation

Date: 2026-10-04. Decision: **Support the bounded partial native evidence below**.
SCKRL-304/406/312 remain Review. This report does not grant Done, merge, complete SCKRL-908,
or Stage 1 acceptance. Remaining native checks require additional evidence.

## Execution and independent review

The Chair operated Expo Go on a fresh iPhone 17 iOS 26.5 simulator against development project
`raqqhpeailkxqvubgzir`. The owner explicitly authorized transmitting generated synthetic QA
logins to that development destination. No original account credentials were used for this run.

The authenticated fixture run is
`/tmp/sckrl-native-fixture.LBV655/runs/sckrl-native-20261004091449853-76b2a26b`.
Device records and saved Computer Use accessibility text/screenshots are under
`/var/folders/sz/htc75wrs1gqc7qxrylld40sc0000gn/T/sackerl-native-device.whc8nite`.
The new simulator UUID was `F978F765-3F66-4E72-9598-A57693621E23`, named
`Sackerl QA f0eadb12dd`. The original simulator
`534D9647-8E3B-4EFE-A3F6-CF45A0905324` and its existing session were preserved.

Independent QA reviewed the setup/cleanup helper before execution, then inspected this run's
three ordinary-owner API readbacks, saved UI text, selected screenshots, manifest, summary,
result and device records. QA performed no hosted, simulator or GUI actions and never read the
private login file. UI operation, Expo Go termination/relaunch, process exits and original-session
continuity are Chair-executed observations; saved artifacts were independently inspected.

The helper seeded two synthetic owner/member accounts, one owned household, a saved labelled
receipt with three unknown-expiry rows and one unconfirmed estimated stock item. This seed does
not establish UI acquisition or the Load sample button. Readback signs out only its own Auth
session with scope `local`, preserving the native session during checks.

The reviewed fixture registry SHA-256 is
`3e5e92b9f508a2c2a44b9ca69fea36334d4fa0c8ef496aefd04321679106ac75`, covering
six temporary artifacts, eight shared-source dependencies and the accepted connected reference.
The helper SHA-256 is
`9642c6e42b63c95cab10b478e96358eaa42ae8b7d31c02b92ae8dd7a26b2f672`.
The copied device and cleanup executors still match
`d4cee12707e9611d62cc02c7c4892cd373c2bd6d3d670f97033363aed39bdb6a` and
`15bb20c4b236fa247f26080775f4bcdde96b655f95c22ebd54c516b89e5cb2a4` respectively.
The device record reports the checked running bundle digest
`c3f81af19f5af8cf71dea72347024406a5783a7dd181e5eb96e529a82b86a3f5` and development-target pin.

## Accepted receipt evidence

Saved UI observations show the owner correcting milk name, quantity, unit and category;
selecting a leap-day expiry `2040-02-29`; choosing Bread's `No expiry date`; excluding Rice;
and adding a manual oats row with explicit valid quantity. The invalid receipt date
`2040-02-30` displayed a real-calendar-date error. Attempting to save incomplete manual details
displayed quantity/completion errors before the successful save.

The Bread accessibility snapshot distinguishes Unknown from No expiry date and includes the
explicit helper. The dirty Back action displayed `Leave this review?`, `Reload latest`,
`Discard changes` and `Keep editing`. The Chair chose Keep editing and subsequently saved the
retained draft. The saved review displayed `Review saved. Items are not in stock yet.`, disabled
placement and enabled Done for now. These observations do not exercise every exit path.

The first readback, `readback-20261004094206765.json`, establishes:

- Receipt `ee9f93be-f8b8-43f4-99d4-374210cd629b`, original active generation
  `8e75ae5d-7c1a-4b56-bade-d50ad2a55e6d`, revision 2 and reviewed status.
- Milk's effective corrected values are `Native QA corrected milk`, 2 pcs, Pantry, dated
  `2040-02-29`. Its parser projection remains original Milk, 1 l, Dairy, confidence 0.95,
  `synthetic-native-qa-v1`. Correction and expiry attribution identify the synthetic owner.
- Bread has `no_date` with null date and owner expiry attribution. Excluded Rice retains
  unknown/null expiry and null expiry attribution. Manual oats is included/reviewed with
  unknown/null expiry, explicit 1 pcs/Pantry and no invented parser evidence.
- Stock remains the single seeded item; receipt review created no stock item or stock fact.

After the Chair terminated/reopened Expo Go on only the QA UUID, Home displayed the labelled
saved-review resume button. The loaded review showed the same four rows; reopening Milk's editor
displayed the corrected values and `2040-02-29`. Subsequent readbacks retain the same receipt,
generation, revision, line identities and values. This supports saved-only Home resume after the
exercised cold app restart, not recovery of an unsaved or uncertain draft.

## Accepted stock evidence

`readback-20261004100351967.json` records the stock name changing to
`Native QA metadata changed` while the date, unconfirmed declared/estimated provenance,
`category-zone-v1`, original fact ID, actor/time and single history entry remain unchanged.
This supports metadata-only Edit preserving expiry evidence.

The Chair then retyped the displayed `2040-02-29` in the existing Edit field and saved.
`readback-20261004102137797.json` records the same date, a new active declared/user fact,
owner `confirmedBy`/`confirmedAt`, no estimator version, and the original estimated fact retained
inactive with an explicit supersession link. The date did not move. This exercised the existing
Edit confirmation flow, not a separate confirmation button.

The stock editor snapshot `44-stock-invalid-date-blocked.txt` and its screenshot show
`2040-02-30` rejected with the real-date error while the editor remained open.

## Partial observations requiring completion

Later UI snapshots show the seeded item with no date after clear, a second Produce item after
Add, and honest estimate copy before Add. Owner Settings rejected `Invalid/NativeQA`, then
displayed `Europe/London` and `Household calendar saved.`. These are UI observations only:
there is **no completed final API readback** proving clear fact history, the added item's
provenance/confirmation or the new calendar value in this run.

The holding lease ended at `2026-10-04T10:44:56.905Z`. The Chair reports that the final readback
started only at approximately 16:11 UTC after execution-approval latency and failed the helper's
`fixture still held` guard. Only the three earlier readbacks exist. This failure is retained as
an evidence gap; no expired-run replay or inferred persistence substitutes for a successful check.
Member login was submitted, but member identity/Settings read-only UI was not observed.

Some receipt screenshots, including `12-no-date-helper.png` and
`15-dirty-draft-retained.png`, contain an iOS Save Password prompt over the app. Their corresponding
app accessibility observations and later persistence checks support the bounded facts above,
but these images do not establish an unobstructed visual or complete accessibility pass. Fresh
visual evidence should dismiss the prompt first. Accessibility-tree labels are not a VoiceOver test.

## Cleanup

The independently inspected result records `provisioningFailed: false` and
`cleanupComplete: true`. Manifest/summary agree on phase `cleaned`, `fixtureReady: false`, all
settled creation intents and verified household/member/owner removal-or-absence entries. Under
the reviewed helper those entries follow exact owner/name/run-marker checks and authoritative
absence checks; a household mismatch blocks account-cascade cleanup. The run directory remains
mode 0700, and `login.json` is absent.

The Chair reports the held process exiting 0 with eleven tests passed/four modes skipped;
these are helper/control tests, not eleven native UI acceptance tests. Device cleanup also
exited 0. `device.json` records `cleanup_verified: true`; the reviewed executor requires QA-device
absence and the original device remaining Booted before recording this flag. Original Home/session
continuity was separately observed by the Chair. QA did not independently query hosted absence or
simulator inventory.

## Supplementary native evidence

A deliberately new isolated run, `sckrl-native-20261004161856338-b0183049`, used the unchanged
reviewed helper and a fresh simulator `F60FD01D-356C-4B68-8247-6EFCE62C61B7`, named
`Sackerl QA c08884db20`. Its fixture directory is under the same helper `runs` directory;
UI captures are under
`/var/folders/sz/htc75wrs1gqc7qxrylld40sc0000gn/T/sackerl-native-device.nn31_y1v/ui`.
QA independently inspected `readback-20261004164722217.json`, the holding summary, Settings/Add/
expiry accessibility text and selected screenshots. The Chair reports the successful readback
process exiting 0 with eleven helper tests passed/four modes skipped.

This readback closes the earlier persistence gaps for the following freshly exercised actions:

- Owner Settings saved Europe/London, and the ordinary-owner readback reports that calendar.
  After signing out and signing in as the generated member, `10-member-settings.txt` identifies
  that exact member email, a disabled Europe/London field, owner-only explanatory copy and no
  Save calendar button. This supports the owner/member calendar UI boundary and persistence.
- Member Edit cleared the seeded stock expiry. Readback has a new active declared/user fact
  with null date, member recorder/confirmer and a supersession link to the inactive original
  owner-recorded estimate. Exactly one fact remains active; clear did not destroy history.
- Member Add created one Produce item while leaving expiry untouched. Readback records
  `2026-10-10`, declared/estimated provenance, `category-zone-v1`, member recorder, null
  confirmation and one active fact. Stock has exactly the two expected items. The UI Add
  observation explicitly labels the estimated date and explains typing a date to confirm it.
- The saved receipt remains the seeded three unknown-expiry rows, reviewed revision 1 with
  the original generation and null expiry attribution. Stock growth is attributable to the
  separate manual Add, not receipt placement.

`10-member-settings.png` and `14-member-add-estimate.png` still show an iOS Save Password
overlay, despite the app accessibility observations and persisted API results. They do not
establish unobstructed visual acceptance. A later `21-clean-no-date-helper.png` is unobstructed
and visibly shows all three expiry states and the explicit No expiry date versus Unknown helper;
its accessibility text agrees. That frame is editor-copy evidence, not an additional persisted
receipt save. No full screen-reader or gesture acceptance follows from it.

The later `27-member-settings-unobscured.png` and matching accessibility snapshot were
independently inspected. The screenshot is unobstructed and visibly identifies the generated
member, Europe/London, owner-only change copy and Sign out, with no Save calendar control.
The accessibility snapshot marks the time-zone field disabled. This supplies clean visual
evidence for the member Settings boundary without rewriting the earlier obstructed captures.
The Chair discarded only the supplementary run's unsaved synthetic receipt draft before this
capture; this action is not an additional persisted receipt save.

At the intermediate inspection the supplementary run remained phase `holding` with
`fixtureReady: true`, a lease ending at `2026-10-04T17:49:01.477Z` and no cleanup entries. Its cleanup was
then open; the earlier run's cleanup was not substituted for these new identities or simulator.

### Supplementary cleanup acceptance

After the Chair's finish signal, independently inspected final manifest/summary/result now agree
on phase `cleaned`, `fixtureReady: false`, all creation intents settled,
`provisioningFailed: false` and `cleanupComplete: true`. The exact household
`9ae3aa97-aecd-4bf8-871f-a5dae78d4402`, member
`faa28b50-fae2-4f74-b7a8-181e9ef34c98` and owner
`a4a59ba4-046c-4fff-8c58-8c19bf293e80` have the reviewed helper's verified removal-or-absence
entries. QA checked the actual helper filename **`login.json`** and confirmed it absent without
reading credentials; the private run directory remains mode 0700.

The copied guarded cleanup executor still matches its reviewed SHA-256, and `device.json`
records `cleanup_verified: true` for this run's exact QA UUID. The Chair reports finish, holding
process and device-cleanup exits 0, eleven helper tests passed/four modes skipped, and the cleanup
output `qa_device_absent: true` / `original_booted: true`. Under the inspected cleanup executor,
that output requires exact QA-device absence and the original device remaining Booted. The Chair
also reports clearing private Node login memory. QA inspected these saved records rather than
performing new hosted or device queries. This accepts supplementary cleanup; it adds no new
claim about original app/session continuity or full native journey completion.

## Remaining gates

Complete remaining native journey assertions with their actual evidence. Preserve both cleaned
runs, including the first run's expired final-readback gap. The fresh
supplementary evidence supports clear/Add/calendar/member Settings without converting the earlier
missing readback into a pass.

Edge-swipe exits, dirty account switching, in-flight navigation/saving, conflict/uncertain-result
copy, lost-response/offline recovery, full VoiceOver/dynamic-text/keyboard matrix, physical-device
or standalone-development-build behavior and Next.js middleware are not accepted by this run.
The exercised keyboard/modal/back-button flow and Expo Go restart provide bounded simulator
smoke evidence only. SCKRL-311 placement, real acquisition/OCR, notifications, broad SCKRL-908,
final Council acceptance, merge and program exit remain outside this report.

Related evidence remains separate: [connected shared-client validation](sckrl-304-406-312-connected-review.md),
[406 local database/concurrency](sckrl-406-database-review.md),
[312 source review](sckrl-312-review.md), and
[312 development installation](sckrl-312-development-migration-plan.md).
