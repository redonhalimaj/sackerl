# SCKRL-311 atomic receipt placement contract

Status: design ratified by COUNCIL-20261015-02 placement v1. Local implementation is ready for
source-v3 review. The 2026-11-01 disposable SQL replay passes the calendar, multi-zone,
pending-list and mutation-race checks, including the added opposing-order concurrent placements
and placement-before-zone-deletion evidence. The exact Council result is recorded separately.
Exact-source Council acceptance, hosted activation, connected Auth/PostgREST acceptance and full
ticket completion remain separate gates.

SCKRL-311 converts one saved receipt review into stock in one server-owned transaction. The
implementation boundary and decision are recorded in the [ratified placement decision](../agents/council-decisions/COUNCIL-20261015-02-placement.md)
and [ADR-0001 addendum](../architecture/adr-0001-reliable-food-loop.md#addendum-2026-10-18-sckrl-311-atomic-placement).
The command input contains only the idempotency key, generation/revision token, and exact
receipt-line-to-zone assignments. It never accepts item values, expiry, actor, household, or time.

`POST /receipts/{receiptId}/placement` validates the caller's current household membership before
reading a cached result, locks the receipt and assigned zones, and checks the exact reviewed
included-line set. It creates stock, applicable SCKRL-406 expiry facts, acquisition events, and one
immutable placement result atomically. Same-key/same-normalized-input replay returns the original
result before stale checks; changed input with that key is a conflict. Another key for a committed
receipt returns its canonical result without binding that key. Keys are unique within a household.
The authenticated status RPC and opt-in `GET /receipts/pending-placement` provide canonical state
and saved unplaced reviews. Existing Home discovery remains unchanged until the later client
activation gates.

`items.source_receipt_item_id` is a protected, unique, same-household source-line reference. New
stock labelled `source = 'receipt'` must be created by placement. Existing unlinked receipt-source
rows are grandfathered and retain ordinary edits. Parent receipt deletion clears the lineage while
preserving stock. The placement and acquisition records preserve the original normalized command,
result, actor, time, quantity, unit, and assigned zone; they do not recreate stock during a retry.
Purchase day is retained separately; `items.added_on` uses the household calendar day of placement.

Expiry reads the persisted review only. `unknown` stores no date and creates no fact. `dated` and
`no_date` create declared user facts with `confirm: false`, unknown printed marking, and no estimate.
The placer is the initial fact writer; receipt-line expiry-editor and reviewer attribution remain
on the receipt. Excluded lines create no stock, facts, or acquisition events. Receipt review saves,
parse promotion/failure, receipt header updates, and source-line/generation mutations reject a
committed placement under the receipt lock. Initial placement is read-only afterward; correction
and re-entry require a separate contract.

Malformed input returns 400, missing authentication 401, membership failure 403, foreign/missing
receipt 404, key reuse/stale review/already placed mutation 409, and incomplete/empty/invalid line or
zone sets 422. Timeout, lost response, network/abort, 408/5xx, and malformed success are unknown
outcomes: retain the exact key/input, read canonical status, and retry only that command. Never
mint a fresh key automatically. No placement UI, OCR/media, estimates, reminders, providers, or
post-placement correction is added here.

Executed disposable database fixtures cover clean schema, legacy preservation, auth/scope and exact
assignment validation, all expiry states, normalized replay, immutable results after stock
edits/deletion, placed review/parse/header freeze, injected rollback, service-role and authenticated
lineage grants, and parent deletion. The main command fixture now assigns included lines across two
zones, forces a household day distinct from UTC, checks normalized retry with reversed assignments
and uppercase UUIDs, and verifies post-placement pending-list pagination. The bounded two-session
runner observes database blocking for same-key replay, alternate keys, household-key conflicts,
review-save/parse-promotion/parse-failure versus placement, membership revocation, and zone deletion.
The separately authorized 2026-11-01 run passed all 95 subprocess steps, with nine concurrency
scenarios, unchanged source hashes and confirmed cluster shutdown. Its new combined scenario
uses fresh zones: a lower-zone delete probe is observed blocked by the high-first placement
before the second placement starts, proving lower-before-higher locking despite request order.
Both opposing-order placements then contend on the higher-zone gate, and a later deletion waits
on an observed placement before rejecting with the stock foreign key. Canonical results, stock
and event identities/zones remain exact. The earlier failed observer attempt remains documented
as history, not a product failure or successful run.
The replacement evidence is preserved under the ignored workspace directory
`.env.qa-sckrl311-evidence-20261101`, with raw results, all 95 step logs and a file-hash registry.
The October temporary artifacts have expired; their reports remain historical. See
[database evidence and limits](../qa/sckrl-311-database-review.md). This does not authorize hosted
migration application, activation or SCKRL-311 completion.
