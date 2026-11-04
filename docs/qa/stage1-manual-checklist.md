# Stage 1 manual checklist (SCKRL-304 / 312 / 305)

On 2026-11-04 the owner accepted the items below. They have no live Maestro coverage and are accepted on unit and
connected-test evidence plus this one-time manual check (decision A). Run it once on an iPhone, or the simulator
for the items marked (sim ok), against dev. Tick each box and write the date. If an item fails, open a ticket; it
does not reopen 305.

Device / build: (fill in) · Date: (fill in)

## 1. Save failures and conflicts (304) (sim ok)

- [ ] Open a receipt review on two devices or sessions. Edit and save on A, then edit and save on B. B shows a
      conflict, keeps your draft, and offers keep editing / reconcile / discard. Nothing is silently lost.
- [ ] Turn on airplane mode, edit a line and tap Save. You see a clear failure, the draft is kept, and you stay in
      review.

## 2. Back with unsaved edits (304) (sim ok)

- [ ] Edit a line without saving and tap Back. You are asked to keep editing, save, or discard. Discarding
      leaves the saved review unchanged.

## 3. VoiceOver (304, 305)

Settings → Accessibility → VoiceOver on.

- [ ] Review rows read the item name, quantity and state, for example "Edit Milk" and "Mark Milk reviewed".
- [ ] Placement: you can place every item using only VoiceOver. Select an item, then use the zone actions (swipe
      up/down) or zone buttons. No drag is needed.
- [ ] The "Add to stock" result and the toast are announced.

## 4. Expiry choice (312) (sim ok)

- [ ] On a review line, set expiry to **unknown**, then to **a date**, then to **no date**. Save, leave, and reopen
      the review. Each choice persists.

## 5. Offline (312, 305)

- [ ] Airplane mode on Home: pending reviews show an error or retry state, not an empty list that pretends
      nothing is pending.
- [ ] Airplane mode on "Add to stock": you see the neutral "not sure yet" state, not success or failure. Turn
      the network back on and use Check status / Try again. Items appear exactly once.

## 6. Account isolation (312) (sim ok)

- [ ] Account A saves a review and taps Done for now. Sign out, then sign in as account B. A's pending review
      does **not** appear on B's Home.

Result: (n) / 11 passed. Tickets opened: (list)
