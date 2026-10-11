# SCKRL-304/406/312 remaining native gates

Prepared: 2026-10-05. Scope: SCKRL-304/406/312 and their bounded SCKRL-908 smoke checks.
Updated: 2026-10-11. Owner manual-QA follow-up: **closed with recorded results and release deferrals**.
Engineering status: **Pending execution and independent outcome review.** This document grants no Done or
complete SCKRL-908 acceptance. Independent QA uses the recorded `gpt-6.1-sol` high fallback.

## Owner result and scope of closure — 2026-10-11

The owner reports clean swipe returning Home, a light-yellow check label after the edit step,
and the Keep/edit/discard step working; they like the iPhone options. These are owner-reported
Expo Go observations, not independently inspected audio or a build-identity proof. The yellow
label does not establish that the dirty-navigation warning appeared. Individual draft restoration
and device/version details were not separately reported.

The owner explicitly accepts this follow-up for now, defers VoiceOver and large text to release,
and requests commit/push. Record these as **deferred**, not executed passes. The manual follow-up
is closed; [release QA](../../temp/release-qa.md) preserves the tests and expected results.
The original pending test matrix below remains the specification for future execution, not a
claim that all rows passed. Account/failure/pending-save/build gates and final acceptance remain
open; SCKRL-304/406/312 retain Review and scoped SCKRL-908 retains In Progress.

## Preparation checkpoint

QA independently reviewed the test-only native fault proposal v2, registry SHA-256
`befd5c95b2daf4d5921b0d6ef7d435be5f9d96cfc3e9f70ae9829706632eb6a0`, under
`/tmp/sackerl-native-fault-fAXZzi`. All seventeen packet artifacts, forty-two product files,
eight SDK files, one holding-controller prerequisite and the fifteen accepted fixture hashes match.
This is preparation evidence; Council execution votes, actual launched bundle/source-map/singleton
equivalence and observed outcomes remain separate prerequisites. No hosted, UI or device action
was performed by QA.

## Pending owner-assisted iPhone checks

The owner reports an iPhone already running Sackerl through Expo Go. Preserve its existing account,
household and session: no sign-out, new login, receipt import, stock creation, Save review, Save
calendar or item Save. Use an existing review/Edit modal and temporary local edits only. Do not send
passwords, tokens, receipt contents, account names or identifying screenshots with results.
If no suitable review exists, report that prerequisite rather than creating one in the owner household.

Record iPhone model, iOS version, Expo Go version, observation time and how this Sackerl session was
opened. The Chair must correlate the served source/bundle with the accepted development baseline;
visible control names alone cannot prove a commit or backend target. Until that correlation is
available, report the tested session's identity as unverified. Expo Go on a physical iPhone is
physical-device evidence; it is not a standalone/development-build installation.

The owner operates iOS Settings themselves. Record the initial VoiceOver and text-size settings,
enable VoiceOver for these checks, and restore those settings afterward. Capture actual spoken
output and successful activation, not just the displayed accessibility tree. A short optional
recording must contain only synthetic/nonidentifying UI; otherwise provide the specific operator
observations below. Operator-reported speech remains distinct from audio independently inspected by QA.

The Chair's immediate phone instructions additionally request a clean saved-review edge-back to
Home as the positive control, then resuming the same receipt and making a temporary local `QA`
name edit. Repeat the same edge gesture from the same position: the dirty warning must appear,
and Keep editing must retain `QA`. Finish by using header Back and explicitly discarding this
test draft. Report clean and dirty edge results separately; if the clean gesture fails, unchanged
dirty content does not establish a working guard. Clean swipe and Keep/edit/discard now have
owner-reported results above; unreported assertions and the release matrix remain pending.

| Check                                     | Required observation; local-only action                                                                                                                                                                                                                                                                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Review focus and opening                  | Swipe through review controls. Report the spoken Back/Edit/action labels, focus order and whether the focused item is visible. Double-tap Edit on one existing row and confirm the correct editor opens.                                                                                                                          |
| Name and date fields                      | Focus the name field and optional expiry field; report their spoken labels and the date-format instruction, without quoting existing private values. Confirm text entry is possible and that the keyboard does not hide the focused field or necessary modal controls.                                                            |
| Expiry choices                            | Focus Unknown, Has a date and No expiry date; report spoken names and checked/unchecked state. Activate each locally. For No expiry date, find the helper distinguishing a deliberate no-date record from an unknown date; report whether it is discoverable and spoken.                                                          |
| Date error and correction                 | Enter `2040-02-30` and attempt the editor's Mark reviewed action. Report the real-calendar error, how VoiceOver reaches it and whether focus stays usable. Change to `2040-02-29`; report the accepted calendar day. These are draft edits, not Save review.                                                                      |
| Modal exit and focus                      | Activate Close; report which control receives focus and whether the row remains reachable. Reopen if needed, then Mark reviewed to close a valid local edit. Neither action should be confused with the screen's cloud Save review.                                                                                               |
| Dirty Back warning                        | With an unsaved local change, activate the labelled Back button. Report the warning and spoken Keep editing/Discard changes options. Activate Keep editing; verify the local change remains and focus returns to usable review content. An actual edge-swipe is a separate check with a clean-back positive control.              |
| Larger text                               | Using iOS text-size settings, record the actual larger setting and return to the same editor/review. Report clipping, overlapping controls, scroll reachability, visible keyboard fields and whether Close, Back and expiry choices remain operable. Restore the initial setting.                                                 |
| SCKRL-406 Add/Edit/Settings accessibility | Inspect existing stock Edit and Settings without saving. Report spoken item-name/expiry labels, error discoverability, modal Close/focus return and calendar field/read-only state appropriate to the existing account role. An owner account does not prove member behavior. Do not change household settings or create an item. |

Afterward explicitly discard only the temporary local draft through the warning, restore the initial
OS accessibility settings, and verify the original session is still signed in. If the owner had an
unsaved draft before starting, stop rather than discard or overwrite it. A test that cannot be
completed is recorded as blocked; lack of an error is not automatically a pass.

## Required owner result fields

For each table row report **Pass**, **Fail** or **Blocked**, plus:

- Device/iOS/Expo Go versions, time and session/source identity status.
- The exact control/action tried and relevant spoken label, state or error, excluding private values.
- What focus/activation visibly did and where focus returned; for errors, how the error was reached.
- Initial/larger/restored text-size settings and any clipped or unreachable controls.
- Whether an actual iOS VoiceOver gesture/double-tap was used, or the action was only a normal tap.
- Confirmation that no cloud Save/import/account/household action occurred, temporary edits were
  discarded safely, accessibility settings were restored and the original session remains intact.

A general “looks okay” response or screenshot does not establish spoken focus, activation, modal
return, keyboard reachability or error discovery. Partial observations close only their exercised
axes after independent review; an operator report is not an automated or complete VoiceOver audit.

## Other pending boundaries

Fault transport and real session-event checks require their reviewed isolated fixture/packet and
actual outcomes. A custom Back tap ignored during saving proves disabled UI only; an instrumented
real Router dispatch can exercise the removal callback but cannot prove a physical edge gesture.
Same-household session transitions test actor scope, not foreign-household native isolation.
Uncertain receipt-review recovery uses revision guards; SCKRL-311 placement is outside this scope.

Actual device locale/timezone/past-date/DST-boundary observations and standalone/development-build
evidence remain separate. An Intl shim, Expo export or Expo Go launch cannot substitute for those
observations. Future placement/media journeys and full program-stage acceptance remain excluded.

Related evidence: [native follow-up](sckrl-304-312-native-followup-review.md),
[earlier native checks](sckrl-304-406-312-native-review.md), and
[real Next HTTP checks](sckrl-304-312-next-http-review.md).
