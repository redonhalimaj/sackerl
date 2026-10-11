# Sackerl iPhone QA checklist

Prepared: 2026-10-05. Updated: 2026-10-11. **Owner manual-QA follow-up closed.**

The owner accepts the exercised flow for now and requests VoiceOver and large-text testing
at release. This is owner acceptance of this follow-up, not complete engineering QA.

This checks the current receipt-review flow on your iPhone using **Expo Go**. It provides
physical-device evidence, but does not count as a standalone development-build test.

## Before starting

- Use an existing saved receipt, preferably the labelled sample used previously.
- Start with a clean saved review. Preserve any existing unsaved work before testing.
- These steps use temporary local edits. **Do not tap Save review.** At the end, discard only
  the edits made for this test.
- Note your current VoiceOver and text-size settings so you can restore them afterward.
- If there is no saved review to resume, mark the affected checks **Couldn't test**.

## 1. Clean swipe-back

1. Open Sackerl → Home → resume the saved receipt review.
2. Without editing anything, swipe from the far left edge toward the right.
3. Expected: the review closes and Home appears.

Record whether navigation actually occurred. This establishes that the gesture is recognized
before testing the unsaved-change guard.

## 2. Unsaved-change warning and retained draft

1. Resume the same saved review.
2. Open an item editor and add `QA` to its name. Close the editor without saving.
3. Repeat the same left-edge swipe used in test 1.
4. Expected: **Leave this review?** appears with **Keep editing**, **Reload latest** and
   **Discard changes**.
5. Choose **Keep editing**. Expected: the item name still contains `QA`.
6. Use the visible Back button → **Discard changes**.
7. Expected: Home appears. Resume the receipt once more and confirm the original saved name
   is shown.

If test 1 did not navigate, record test 2's gesture result as **Couldn't test**; an unchanged
screen alone does not prove the guard worked. You can still check the visible Back button.

## 3. VoiceOver

1. On your iPhone, open Settings → Accessibility → VoiceOver and enable it.
2. Return to Sackerl and resume the saved review.
3. Swipe left/right with one finger to move VoiceOver focus. Double-tap to activate the
   focused control.
4. Check that Back and the item-edit controls have clear spoken names.
5. Open an item editor. Check the spoken names for Name, Quantity, Close and the expiry
   choices: **Unknown**, **Has a date**, **No expiry date**.
6. Check that the selected expiry choice is announced. If you change a choice, keep the change
   unsaved and discard it afterward.
7. Check that focus stays inside the editor while it is open, and that Close is reachable.
   After closing it, check that focus returns to a useful place in the review.
8. Restore your original VoiceOver setting. Discard any test edits using Back → Discard changes.

Record what VoiceOver actually says for any unclear control, selection or focus problem.
This is a focused manual check; save-error announcements and the full screen-reader matrix
remain separate checks.

## 4. Large text

1. With VoiceOver off, open Settings → Accessibility → Display & Text Size → Larger Text.
2. Enable the larger accessibility sizes if needed and increase text size substantially.
3. Return to Sackerl and reopen the saved review and an item editor.
4. Check that text is readable, labels are not cut off, and controls do not overlap.
5. Check that you can reach the name/quantity fields, expiry choices, date field when shown,
   Close and Back. Scroll where necessary.
6. Restore the original text-size and VoiceOver settings. Discard remaining test edits.

Record the size tested and any clipped text, unreachable control or keyboard obstruction.

## Results to send back

Use **Pass / Fail / Couldn't test** for each row. Include what happened for a failure;
passwords and personal receipt details are unnecessary.

| Check                              | Result                                   | Observation                                                                                                     |
| ---------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Clean left-edge swipe returns Home | Owner-reported pass                      | “It returned Home.”                                                                                             |
| Dirty review after item edit       | Observation recorded; warning unverified | “It assigns a light yellowish check label.” The leave-warning appearance was not reported.                      |
| Keep editing / discard sequence    | Owner-reported pass                      | “It worked”; owner likes the iPhone options shown. Individual restoration details were not separately reported. |
| VoiceOver                          | Deferred to release                      | Owner accepts for now; no spoken-output/focus result provided.                                                  |
| Large text                         | Deferred to release                      | Owner accepts for now; no size/layout result provided.                                                          |
| Accessibility settings restoration | Not reported                             | No restoration claim made.                                                                                      |

Phone model / iOS version, if known:

App: Expo Go. Current Sackerl code/build identity, if known:

## Session checkpoint

The owner reported results on 2026-10-11 and requested closure, commit and push. This manual
follow-up is closed with the explicit observations and deferrals above. Release checks are tracked
in [temp/release-qa.md](release-qa.md). A yellow row label alone is not evidence of a dirty-navigation
warning; that specific guard still needs confirmation.

Controlled native offline/interrupted-save/account-transition tests remain unrun; their Council
recommendation is unratified. SCKRL-304/406/312 remain Review and SCKRL-908 remains In Progress.

See [status.md](../status.md) and the [QA record](../docs/qa/sckrl-remaining-native-gates-review.md)
for the remaining engineering work. There was no new automated/device execution for this update.
