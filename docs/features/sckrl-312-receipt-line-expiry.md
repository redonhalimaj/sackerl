# SCKRL-312 receipt-line expiry and review continuation

State: **contract ratified for implementation planning** by [COUNCIL-20260930-01 v2](../agents/council-decisions/COUNCIL-20260930-01.md). This decision makes the work ready to implement; it does not mark SCKRL-312, SCKRL-304 or SCKRL-406 Done. Frontend owns SCKRL-312. Backend owns schema, command and client prerequisites; Infrastructure reviews the ADR-0001 addendum; independent QA remains the acceptance gate.

## Owner evidence and outcome

On 2026-09-29, the owner opened the labelled sample receipt's edit sheet, marked all three sample rows reviewed and saw a UI-reported save success. The owner reported that the edit sheet had no expiry control and that the disabled placement action left no clear way to continue. The screenshots do not establish persistence after reload, a saved field correction, placement behavior, or the cause of the separate Home/review content observations near the Dynamic Island. See [status.md](../../status.md) and [simulator findings](../product/simulator-findings-2026-09-29.md).

SCKRL-312 adds optional, durable expiry choices during receipt review and a safe way to leave and resume a saved review. Receipt parsing does not detect package expiry in this contract. Purchase date and parser confidence are never expiry evidence.

## Accepted receipt expiry states

Each line stores exactly one state:

| State     | Meaning                                                                                              | Result when placed                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `unknown` | No date has been entered or asserted. This is the default for parser and manual lines.               | `expires_on: null`; no expiry fact.                                                                          |
| `dated`   | The user entered one valid Gregorian calendar date, stored as `YYYY-MM-DD`.                          | A declared SCKRL-406 `user` fact with unknown printed marking, null confidence/version and `confirm: false`. |
| `no_date` | The user deliberately chose **No expiry date** as an app record, without asserting package evidence. | A declared SCKRL-406 `user` fact with `expires_on: null`, unknown printed marking and `confirm: false`.      |

The **No expiry date** control and accessibility label identify a deliberate no-expiry choice. Its helper text is: “Record this item with no expiry date. If you do not know the date or have not checked it, choose Unknown.” The **Unknown** control says the date is not entered or not known. Removing an entered date returns it to `unknown`; it does not silently create a `no_date` assertion. There is no separate “cleared” state.

A typed date is user-supplied, not evidence of a package marking. Receipt entry does not offer an estimate in this increment. Unknown remains without a date at placement; it is not estimated from purchase date, placement day, parser confidence, category or zone. This is a scoped receipt-flow exception to SCKRL-405; manual Add/Edit retains its existing estimate behavior.

## Durable review save and conflicts

Expiry is part of the complete SCKRL-310 review snapshot and uses its generation and `review_revision` guards. It is an optional strict state/date object with these compatibility rules:

- Omitting expiry preserves a previously saved choice; new lines default to `unknown`. Older clients therefore cannot erase expiry accidentally.
- Explicit `unknown` resets a saved value. Explicit `no_date` records the deliberate no-expiry choice.
- Invalid state/date combinations, impossible calendar dates and client-supplied actor/time values are rejected atomically.
- Database-owned `expiry_changed_by` and `expiry_changed_at` change only when the normalized expiry state/date changes, including an explicit reset. They survive unrelated edits and unchanged saves and remain distinct from the line's `reviewed_by`.
- Expiry participates in correction/review equality. Changing expiry on an included line requires explicit review again. Choosing optional `unknown` or `no_date` is valid and does not create a missing-date blocker.
- Excluded lines may retain their review choice, but exclusion means no stock, expiry facts or acquisition events are created for that line.

A stale generation/revision conflict or save failure must leave the local expiry draft visible. The client loads the current snapshot and requires explicit reconciliation; it must not silently replace the draft or write over newer review state.

## Stock provenance and placement transaction

SCKRL-311 reads expiry from the locked, persisted review. Its client input does not copy or override the date or provenance. Initial placement always uses `confirm: false`: SCKRL-406 records the authenticated placer as the fact writer, while receipt-line reviewer attribution remains on the receipt line. The reviewer's confirmation must not be attributed to a different placer. No placement confirmation control is included. The existing stock confirmation flow may later confirm a dated fact as the acting user.

Placement validates current authenticated household membership, the reviewed included-line set and the assigned household zones. In one transaction it commits stock, unique source-line lineage, applicable expiry facts, acquisition events and an immutable placement result, or commits none of them. Repeating the same idempotency key with identical normalized input returns the original result before stale-token checks; reusing that key with different input conflicts. A second key cannot place an already placed receipt and returns an authenticated canonical result. Membership is checked before replaying cached results.

For a timeout or uncertain response, the app retains the same key, immutable input and local draft, reads canonical receipt/key status and may retry only that same operation. An unplaced read alone does not prove that a command is not in flight. Uncertain responses never claim success or failure. Validation failures identify the field and preserve a recoverable state; stale review requires reconciliation; already-placed status opens the committed result. Only confirmed transaction success says items were added to stock. Copy does not claim reminders were scheduled unless reminder capability committed.

After placement, review saves and parse promotion/failure commands reject under the same receipt lock. The initial review is read-only. Post-placement correction/re-edit, including the original SCKRL-306 re-edit aspiration, is deferred until a separate contract defines the source snapshot and stock-lineage behavior.

## Calendar and interaction

Store the date as a calendar day. It must retain the same year, month and day across locale, device timezone, household timezone and daylight-saving changes; locale changes display only and never convert the stored value through a timestamp. Validate real Gregorian dates, including leap days. Past dates are allowed and shown as ordinary dates without a safety claim.

Provide accessible **Unknown**, **Date**, and **No expiry date** choices, a labelled optional date control, readable state labels and tap/screen-reader paths. The Unknown and No expiry date helper and accessibility copy preserve the distinction above.

## Exit and durable resume

A clean saved review offers **Done for now** and returns to the deterministic Home route with: **Review saved. Items are not in stock yet.** Home includes a bounded, authenticated pending-review entry that opens the same persisted receipt ID after app restart. The entry is limited to pending reviews and does not introduce full receipt history. It is scoped to the signed-in account and household and checks authoritative receipt status before reopening, so stale or another account's entries cannot be resumed.

Unsaved, failed, conflicted or uncertain saves do not qualify for the safe saved exit. Preserve the draft and offer keep editing, save/reconcile, or explicit discard before leaving. All-excluded reviews may save and exit, but cannot place zero stock.

## Dependencies, ownership and acceptance gates

- SCKRL-304 owns the review UI and existing generation/revision-guarded save behavior; its connected and native visual/accessibility gates remain independent.
- SCKRL-310 owns the durable review model and command foundation. Backend must add the strict expiry state/date, metadata and compatibility behavior before dependent placement work.
- SCKRL-406 owns expiry provenance and actor-confirmation semantics; its connected/native gates remain open.
- SCKRL-311 implements the atomic placement command after this contract and the ADR-0001 addendum have recorded persistence, attribution, placement freeze and idempotency.
- SCKRL-312 implements the enabled saved-review Home exit and durable same-receipt resume before placement is available. SCKRL-305 later integrates that flow with its accessible placement screen after SCKRL-311.
- SCKRL-405 retains manual Add/Edit estimates; its receipt-specific no-estimate exception is recorded in [features.md](../../features.md).
- SCKRL-306 may show committed receipts read-only. Post-placement edit/re-entry cannot place again and awaits a separate correction contract.
- SCKRL-308 remains a separate private-media workstream before real capture/OCR work.

Independent QA must cover legacy and old-client omission, parser/manual defaults, invalid states and dates, unknown/no-date distinction, attribution and two-member placement, unchanged metadata, review reset after expiry edits, included/excluded/all-excluded lines, stale generation/revision, household isolation, races, rollback, same/different-key retries, lost responses, placed immutability, reload/restart resume, account changes, locale/timezone/DST, keyboard/modal/accessibility, and honest success copy. Migration replay and connected/native checks remain pending under existing authorization restrictions; design ratification and source checks do not substitute for them.

References: [receipt review data contract](sckrl-310-receipt-review-data.md), [expiry provenance contract](sckrl-406-expiry-provenance.md), [SCKRL-312 backlog entry](../../features.md), and [Council decision](../agents/council-decisions/COUNCIL-20260930-01.md).
