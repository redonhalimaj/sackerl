# Council decision: SCKRL-311 atomic placement backend

Opened: 2026-10-15. Ratified: 2026-10-18. Revision: v1, immutable proposal below.
State: Ratified design and bounded local implementation. Lane: Complex (transactions, authorization, lineage and immutable recovery).

<!-- proposal:v1:start -->

## Scope, participants and ownership

The owner asked to continue the next program roadmap item. Prepare SCKRL-311's exact contract,
then implement and review a bounded local backend slice after design ratification. This decision
does not apply a migration or authorize hosted writes, provider calls, deployment or publication.
Disposable SQL execution needs a concrete reviewed runner and the applicable execution permission;
no migration application or replay is part of this design review.

| Participant                 | Actual model / effort                          | Assignment and files                                                                                     |
| --------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Chair `/root`               | Root runtime; exact variant/effort not exposed | Complex reasoning, integration, status.md and features.md                                                |
| Deputy `/root/astra_deputy` | `gpt-6-astra`, `xhigh`                         | Design synthesis and this decision record only                                                           |
| Luna A `/root/luna_a`       | `gpt-6-luna`, `high`                           | Backend owner; feature contract, ADR addendum, new migration and SQL fixtures after ratification         |
| Luna B `/root/luna_b`       | `gpt-6-luna`, `high`                           | Independent Infrastructure/API challenge; shared client, web boundary and their tests after ratification |
| Luna C `/root/workflow_qa`  | `gpt-6-luna`, `high`                           | Independent QA; no implementation edits                                                                  |

The existing Luna sessions retain their actual effort for bounded source investigation and delivery.
Chair and Astra perform the complex reasoning with the responsible domain workers and independent
QA. Do not claim their effort changed, create extra agents, or count one person as two voters.
All five participants are required final voters; preliminary voters are Deputy and all three Lunas.
Use waves under the four-slot limit and one writer per file set.

SCKRL-202/310 are Done. SCKRL-312 persistence/source and local SQL prerequisites, SCKRL-406
SQL/concurrency and bounded connected/native evidence support this design. SCKRL-304/406/312
remain Review; SCKRL-908 remains In Progress. Full 908/build/VoiceOver completion is not an added
prerequisite for this bounded contract. Source readiness is not activation or full ticket acceptance.

## Recommendation and alternatives

Build one server-owned placement transaction, an authenticated canonical status read, and an
additional authoritative unplaced-review list. Keep current Home and its existing receipt reads
unchanged. SCKRL-305 must adopt the new list/status contracts only after migration and activation
gates are met. This slice adds no placement UI, OCR/media, expiry estimation, reminders,
post-placement correction, general inventory event framework or provider integration.

Use a singleton placement row per receipt with immutable normalized input and initial result;
unique protected stock lineage; and acquisition-only events. Keep current stock as the projection.
Alternatives rejected: separate client stock writes (partial/duplicate risk); triggers alone for
placed RPC rejection (parse-failure can return without a write); changing the live Home query before
schema installation (breaks unmigrated development); and general event sourcing (outside scope).

Strongest counterargument: dependent 312/406 tickets are not Done and leaving Home unchanged does
not complete end-to-end placement. Response: accepted backend contracts and executed SQL foundations
support a local increment; keep those gates and 311's remaining integration/activation gates visible.
Do not enable placement or mark full SCKRL-311 Done from this source-only increment.

## Exact command and read boundary

`POST /receipts/{receiptId}/placement` authenticates the bearer user and resolves the current
household on the server. The strict JSON body contains exactly:

```json
{
  "idempotencyKey": "<uuid>",
  "generationId": "<uuid>",
  "expectedReviewRevision": 1,
  "assignments": [{ "receiptItemId": "<uuid>", "zoneId": "<uuid>" }]
}
```

UUIDs normalize to canonical lowercase. Revision is an integer >= 0. Assignments is an array of
0 through 150 strict two-field objects; duplicate receiptItemId values reject rather than collapse.
No household, item values, expiry, actor, timestamp, confirmation or extra keys are accepted.
An empty array is structurally valid so zero included lines receives the semantic 422 below.
Both the client/web boundary and SQL validate; direct RPC callers cannot bypass semantic checks.

RPC: `finalize_receipt_placement(p_household_id uuid, p_receipt_id uuid, p_generation_id uuid,
p_expected_review_revision integer, p_idempotency_key uuid, p_assignments jsonb) returns jsonb`.
JSON assignment keys are the same camelCase keys as HTTP. Normalized input includes household ID,
receipt ID, generation ID, expected revision and assignments sorted by receiptItemId; the key is
stored separately. Array order and UUID spelling do not change operation identity. No stock,
expiry or display data participates in client input.

Successful POST always returns HTTP 200 with exactly `{ outcome, placement }`. `outcome` is
`placed`, `replayed` or `already_placed`. The immutable `placement` object contains:

```text
placementId, householdId, receiptId, idempotencyKey, generationId,
reviewRevision, placedBy, placedAt, addedOn, purchasedOn,
items: [{ receiptItemId, itemId, acquisitionEventId, name, qtyValue, qtyUnit,
          categoryId, zoneId, expiresOn, expiryFactId }]
```

IDs are UUID strings; placedAt is one ISO timestamp with an explicit UTC offset; addedOn is
YYYY-MM-DD; purchasedOn/expiresOn are YYYY-MM-DD or null; expiryFactId is UUID or null; qtyValue is
a finite positive JSON number. Items sort by receiptItemId. These are original committed values,
not current stock reads. Later stock edits, soft removal or hard deletion never rewrite the result
or cause replay to recreate stock. The canonical result does not assert that its items still exist.

`GET /receipts/{receiptId}/placement?idempotency_key=<optional uuid>` calls
`get_receipt_placement(p_household_id uuid, p_receipt_id uuid, p_idempotency_key uuid default null)`.
It returns HTTP 200 with exactly `{ state, receiptId, placement, keyMatches }`: state is `unplaced`
or `placed`; placement is null or the immutable object above; keyMatches is null when unplaced or
no key was supplied, otherwise compares the supplied key with the committed placement key.
It does not expose a running/failed operation state. An unplaced observation, including while a
command is in flight, never proves rollback or permits another key.

`GET /receipts/pending-placement?page=1&page_size=25` is an additional opt-in endpoint calling
`list_unplaced_receipt_reviews(p_household_id uuid, p_page integer default 1,
p_page_size integer default 25)`. Integers must be positive, pageSize <= 100. The RPC returns
`{ receipts: DatabaseReceiptRow[], pagination: { page, pageSize, total } }`; the shared client maps
rows to the existing Receipt type and HTTP returns that mapped shape. Match the legacy saved-review
predicates (active generation and revision > 0), exclude any receipt with a committed placement,
order by updated_at descending then id descending, and compute count/page from one query snapshot.
Do not require every included line reviewed for discovery: an incomplete saved review must remain
resumable. The existing `listPendingReceiptReviews` method and Home caller remain unchanged.

New shared methods: `finalizeReceiptPlacement`, `getReceiptPlacement` and
`listUnplacedReceiptReviews`. New placement/status/list responses use `Cache-Control: no-store`.
New RPCs require current authenticated membership and explicitly constrained execute grants.
Missing schema/RPC is an error, never a silent fallback to legacy discovery.

## Deterministic validation, replay and errors

1. Validate authentication and structural input. Lock the caller's exact household membership
   row `FOR KEY SHARE`; absence is 403. This lock is the authorization ordering point and is held
   through the transaction, so deletion/key-changing revocation cannot commit first afterward.
2. Finalize locks the receipt `FOR UPDATE`, scoped to that household. A missing/foreign receipt is
   404; do not reveal another household's data. Membership remains locked while waiting; do not rely
   solely on an earlier `is_household_member` snapshot. Status/list also lock membership while read.
3. Check committed placement before stale/business validation. Same receipt/key and identical
   normalized input returns `replayed`; same key with different normalized input is 409. Another
   key on an already placed receipt returns `already_placed` with its canonical committed result.
   That alternate key is not registered, bound or added as an alias to the placement. Returning the
   canonical result does not modify the committed input, key, result, lineage or events.
4. Keys are unique within a household across receipts. Reuse for another receipt is 409, including
   concurrent calls. Check existing key ownership before returning any replay/already-placed result.
   The unique constraint is the final race defense; translate only its named unique violation into
   this conflict, rolling back all provisional stock/events/facts. Other unique errors are failures.
5. For an unplaced receipt, exact generation/revision must match. Require a saved reviewed active
   snapshot and at least one included line; then require assignments equal the exact included set.
   Every included line must be reviewed with valid resolved name/quantity/unit/category. Excluded
   lines create no stock, facts or events. Resolve corrected values before parser values.
6. Lock referenced zones in sorted UUID order `FOR KEY SHARE`, require each zone belongs to the
   household, and retain locks through commit. No missing/foreign zones, invented lines, duplicate
   assignments or extra/excluded/generation-mismatched lines are accepted.
7. After locks/validation, record one placement timestamp and the household calendar zone observed
   for this command. Set items.added_on to that timestamp's household calendar day; use that same
   timestamp for placement/event/result metadata. Preserve purchased_on separately without treating
   a date-only parser value as an exact acquisition time. Calendar changes later do not alter results.
8. Insert stock, applicable expiry facts through the existing 406 trigger, acquisition events and
   immutable placement/result in one transaction. Any error rolls back the complete operation.

Database domain errors use SQLSTATE PT400/PT401/PT403/PT404/PT409/PT422 as appropriate, with a
stable code and optional field/receiptItemId in JSON exception DETAIL. The placement client parses
known details into a dedicated ApiRequestError subtype. HTTP preserves `{ error, code, field?,
receiptItemId? }` without leaking raw SQL details. Client/web structural errors use the same shape.

| HTTP | Code                        | Meaning                                                                                           |
| ---- | --------------------------- | ------------------------------------------------------------------------------------------------- |
| 400  | INVALID_PLACEMENT_INPUT     | Malformed/extra fields, UUID/revision/array/page values, duplicate assignment                     |
| 401  | AUTH_REQUIRED               | Missing or invalid authenticated user                                                             |
| 403  | HOUSEHOLD_ACCESS_REQUIRED   | No current membership; applies before replay/status/list                                          |
| 404  | RECEIPT_NOT_FOUND           | Receipt absent from the authorized household                                                      |
| 409  | PLACEMENT_KEY_REUSED        | Same household key bound to different normalized input or receipt                                 |
| 409  | STALE_RECEIPT_REVIEW        | Unplaced receipt generation/revision changed                                                      |
| 409  | RECEIPT_ALREADY_PLACED      | Review/parse/header mutation against committed placement                                          |
| 422  | RECEIPT_NOT_REVIEWED        | Missing saved active review or included unresolved line                                           |
| 422  | EMPTY_RECEIPT_PLACEMENT     | No included lines; no zero-stock commit                                                           |
| 422  | PLACEMENT_LINE_SET_MISMATCH | Assignment IDs differ from the active included set                                                |
| 422  | INVALID_PLACEMENT_LINE      | Invalid persisted resolved field; include field and receiptItemId                                 |
| 422  | INVALID_PLACEMENT_ZONE      | Missing/foreign zone; identify assignment without foreign data                                    |
| 422  | RECEIPT_LINEAGE_REQUIRED    | New receipt-source stock or a transition to receipt source lacks protected same-household lineage |

An all-excluded saved review returns EMPTY_RECEIPT_PLACEMENT before line-set validation. For valid
RPC shapes, a placed mutation returns RECEIPT_ALREADY_PLACED before stale/business checks. SQL
argument-cast failures may occur before function entry and map to structural 400; this is not a
promise to mask malformed payloads as placed conflicts. Existing review/parse HTTP error envelopes
stay compatible; their new SQL placed error is 409 without a wholesale unrelated error refactor.

Timeout, lost response, network/abort, HTTP 408/5xx or malformed success are an **unknown outcome**,
represented by the placement client error's `outcomeUnknown: true` (status 0 for no HTTP response).
They do not establish failure. Caller retains the exact key/input, reads canonical status and may
retry only that same command; no automatic fresh-key retry. The UI orchestration belongs to 305.
Expected authenticated validation/conflict errors carry `outcomeUnknown: false`.

## Minimal persistence, protection and deletion

- `receipt_placements`: UUID id; household_id, receipt_id, generation_id, review_revision;
  idempotency_key; normalized_input JSONB; placed_by UUID; placed_at timestamptz; result JSONB.
  Unique receipt_id and unique (household_id, idempotency_key). Composite receipt/household and
  generation/receipt/household references prevent crossed lineage. Receipt/household deletion
  cascades the placement/result; no new independent archive or retention period. Actor IDs follow
  existing provenance behavior and are not rewritten when a member account disappears. Reuse the
  existing receipts(id, household_id) unique constraint from the SCKRL-303 migration; do not add a
  duplicate target constraint.
- `items.source_receipt_item_id`: nullable unique UUID, single-column FK to receipt_items(id)
  ON DELETE SET NULL. A database guard verifies a non-null source belongs to the item's household,
  source is `receipt`, and source lineage and household cannot be reassigned. The placement command
  supplies it; existing manual/imported rows remain null. A single-column FK deliberately avoids
  PostgreSQL 14 composite SET NULL also clearing the non-null household_id. Deleting a receipt must
  clear lineage and preserve its stock. Trusted referential clearing is allowed; direct client
  assignment/clearing is denied by privileges, not by a caller-controlled capability or GUC.
  New inserts with source='receipt', and updates that change manual/imported source to receipt,
  require this protected same-household lineage. Non-null lineage always requires source='receipt'.
  Existing unlinked receipt-source rows remain valid and may receive ordinary edits; referential
  clearing after parent deletion also leaves a valid unlinked receipt-source row. No backfill
  invents a receipt link. This is a deliberate, narrow change to generic Items API behavior, not
  a claim that every formerly permitted write remains compatible.
- `inventory_acquisition_events`: UUID id; household_id; item_id; nullable placement_id, receipt_id
  and source_receipt_item_id references; quantity_delta > 0, qty_unit, original zone_id UUID,
  actor_id UUID, occurred_at, idempotency_key. This is the original committed operation key, never
  an alternate retry key. Kind is acquisition only. One event per source line and item for initial
  placement; replay/already-placed responses add no events and change no existing event keys.
  zone_id is the original immutable event value, not a live FK that
  prevents later zone deletion after moving stock. RPC/source constraints establish its household.
  Receipt/line/placement deletion clears those nullable references and preserves the stock/event;
  item/household deletion cascades its event. No receipt/product text is copied into this event.
- New placement/event tables revoke default writes from PUBLIC/anon/authenticated; household RLS
  permits authenticated reads. Append-only guards reject ordinary mutations, while narrowly
  permitting the documented parent deletion cascades/reference clearing. New helper functions
  revoke execute from PUBLIC, anon, authenticated and service_role, including grants inherited from
  bootstrap defaults. No direct public event append API is added.
- Existing table-level items INSERT/UPDATE privileges must be revoked for PUBLIC/anon/authenticated/service_role
  before granting all explicit pre-311 writable columns, excluding source_receipt_item_id:
  id, household_id, name, qty_value, qty_unit, category_id, zone_id, expires_on, added_on, removed_on,
  source, removal_reason, expiry_fact_id, expiry_source, expiry_origin, expiry_printed_marking,
  expiry_confirmed_at and expiry_declaration. Existing 406 guards still own the expiry projections.
  Preserve item creation/edit/expiry declaration/removal operations; do not mistakenly restrict
  existing callers to only the columns of one client. Existing SELECT/DELETE/RLS semantics remain.
  This also denies direct service_role assignment/clearing of the new lineage column while
  preserving its other ordinary privileges and BYPASSRLS. It is a narrow server-owned-column
  boundary; the owner-definer placement command and legitimate parent-FK clearing remain allowed.
  Merely revoking the new column cannot override a table-level grant. Test actual has_column_privilege
  and direct application-role writes, including attempted cross-household/source reassignment.

Expiry conversion is fixed by 312/406: unknown inserts expires_on null and no declaration/fact;
dated inserts its date and a declared user fact; no_date inserts null and a declared user fact.
Both declarations use unknown printed marking, no estimator/confidence, confirm:false. auth.uid()
is the fact writer; receipt editor/reviewer attribution stays on the source line. No inherited
confirmation and no automatic estimate. Initial expiryFactId in the result is immutable even after
later item edits create another fact.

## Placed freeze and compatibility

Add explicit locked placed checks to all three existing entry points: save_receipt_review,
promote_receipt_parse and mark_receipt_parse_failed. Prefer thin public wrappers retaining their
signatures and delegating unchanged legacy behavior to renamed, execute-revoked internal functions.
Revoke execute on renamed internals from PUBLIC, anon, authenticated and service_role explicitly.
Wrappers authenticate/lock membership and receipt, reject placed state, then invoke existing
validation. Never leave a callable legacy helper that bypasses freeze. In particular, parse-failure
with an existing generation must reject even though its previous implementation performs no UPDATE.

Also guard receipt header/status UPDATE and source line/generation mutation after placement so
direct granted header writes cannot change the frozen source. Parent receipt/household deletion
must still complete. Existing unplaced behavior and 310/312 semantics remain compatible. Guards,
wrapper bodies, grants and the new transaction share the receipt lock; no exception flag supplied
by a client or custom GUC bypass is permitted. Freeze begins with committed placement state, not
with an independently committed in-progress marker.

Legacy Receipt types/select columns and current Home discovery remain byte-compatible. Publish the
new authoritative list/status/placement methods without switching existing callers. Before any
305 enablement: install the reviewed migration under separate authorization, verify real
Auth/PostgREST behavior, switch pending discovery to authoritative unplaced results, reconcile
stale entries through canonical status, and provide read-only placed UI and safe uncertain recovery.
No placement-enabled client may silently use legacy discovery if the new schema is unavailable.

The generic Items SDK/web create and batch-create surfaces currently accept source='receipt', and
PATCH accepts a source value. After the new schema is installed, those routes cannot create receipt
stock or change a manual/imported item to receipt source without placement-owned lineage; a normal
client cannot supply that protected column. The database rejects these cases with PT422 and
RECEIPT_LINEAGE_REQUIRED; generic item HTTP handlers preserve their existing `{ error }` envelope
and return 422 through ApiRequestError. Existing unlinked receipt edits, receipt reads and all
manual/imported creation stay supported. Do not remove receipt from the source enum or reject an
unchanged legacy receipt source before the server can inspect the existing row. Test the changed
generic create/batch/transition behavior explicitly; a mocked successful receipt-source insert is
not evidence that the new schema still permits it.

## Required source and acceptance evidence

After ratification, A owns the new feature contract, ADR-0001 addendum,
`supabase/migrations/20261015100000_sckrl_311_atomic_receipt_placement.sql`, 311 SQL fixtures and
database test documentation. B owns receipts client/types/exports/tests, new placement payload
parser/tests, placement route/tests and pending-placement route/tests. Chair alone changes shared
status/features. C independently inspects actual final diff, checks and evidence. Code-map updates
are integration work when required. No mobile UI files are assigned.
B also owns the narrow packages/api-client/src/items.test.ts compatibility update: use
manual/imported source in ordinary successful generic batch fixtures and add server-rejection
coverage for unsupported new receipt-source writes. No broad Items SDK rewrite is assigned.

Minimum checks before source acceptance:

- Strict payload, typed result/error mapping, bearer/household handling and client/route tests;
  legacy receipt/Home read requests remain unchanged, missing schema never falls back.
  Route tests include a foreign-household receipt returning 404 without leaking content, and
  membership authorization before cached replay or canonical status disclosure.
- Independent SQL/grant/lock/trigger review and prepared clean/populated replay fixtures. Existing
  310 review, 312 expiry and 406 provenance tests must remain valid. Required lint/typecheck/format
  and code-map checks follow the actual changed files.
- Review a bounded disposable runner before executing SQL. A source check does not count as replay.
  A migration cannot be accepted for activation without executed clean/populated upgrade tests and
  adversarial application-role checks against the final source.

SQL execution/activation evidence must cover: included/excluded/all-excluded lines; exact line/zone
sets; all expiry states and different reviewer/placer actors; stale generation/revision; normalized
replay before stale checks; changed-input/same-key and second-key canonical results; same key across
two receipts including concurrent calls and rollback; same receipt same/different-key concurrency;
review/reparse/parse-failure versus placement; actual membership revocation ordering; sorted-zone
deletion races; injected failure after partial stock/event work; direct forged lineage/header/fact
writes; placed no-op parse-failure rejection; saved/placed list pagination; and receipt, item, member
account and household deletion semantics. Replaying after stock soft/hard deletion must not recreate
stock. A fixture verifies one placement timestamp drives event/result/household added_on across a
calendar-day boundary, while past/future purchased_on remains separate metadata.
Also verify new generic unlinked receipt inserts and manual/imported-to-receipt transitions return
422, existing unlinked receipt rows retain ordinary edits, manual/imported creates still work, all
18 old item column privileges are retained, and parent clearing/cascades do not trip lineage guards.
Both authenticated and service_role direct assignment/clearing of the new lineage column must fail;
service_role's other prior item privileges and BYPASSRLS remain intact.
Do not add a receipt_items DELETE guard that prevents receipt or household deletion cascades.

Connected Auth/PostgREST, hosted schema installation, mobile integration/uncertain recovery and
remaining prerequisite acceptance stay separate and explicitly unrun until authorized/executed.
Keep SCKRL-311 In Progress or Review for the bounded source increment, not Done for the whole ticket.

## Source evidence and review choices

The recommendation derives from [311 acceptance](../../../features.md#sckrl-311---atomic-receipt-placement-command),
[312 contract](../../features/sckrl-312-receipt-line-expiry.md),
[ADR placement addendum](../../architecture/adr-0001-reliable-food-loop.md#addendum-2026-09-30-sckrl-312-receipt-expiry-and-placement-boundary),
the 310/312 receipt RPCs, existing item/expiry schema, and receipts.ts pending-review TODO.
Local prerequisite evidence: [312 SQL](../../qa/sckrl-312-database-review.md),
[406 SQL/concurrency](../../qa/sckrl-406-database-review.md),
[development installation](../../qa/sckrl-312-development-migration-plan.md), and the current
[handover](../codex-next-work-package.md). No new SQL execution is claimed by this brief.

Explicit reconciliation: A proposed purchase-day added_on with a fallback; B and Deputy prefer
actual placement household-day because stock-added chronology must not inherit an old/future parser
date, and items.removed_on must be >= added_on. v1 selects placement day, retains purchased_on, and
records A's subsequent acceptance of that choice for freezing. v1 selects protected single-column
stock lineage over a separate lineage table
to keep item provenance discoverable without a new join; its FK/privilege/guard/deletion behavior
requires the listed adversarial tests.

A additionally proposed requiring protected lineage for all new receipt-source stock. Deputy's
counterargument is that protecting the new column alone can guarantee placement lineage without
changing the generic SCKRL-202 source contract. v1 deliberately chooses the stronger provenance
rule so newly receipt-labelled stock comes through the atomic placement path. B independently
supports that choice while confirming that generic SDK/web writes currently accept source='receipt';
the lack of an active mobile caller is not proof of API compatibility. Grandfathering, preserved old
column grants, explicit 422 responses, parent clearing and regression tests bound the change.
C independently supports the invariant and its legacy/cascade cases; the protected lineage-column
boundary explicitly includes service_role while preserving its other existing rights. All
exact-revision votes remain required; these findings are not votes.

<!-- proposal:v1:end -->

## Frozen proposal — v1

Frozen on 2026-10-18. SHA-256:
`5e2893426b531df517f844ad0b172791387f2e52e2e275fbddb26b2e13ef9840`.
Length: **28,021 UTF-8 bytes**. Hash exactly the bytes after the newline ending
`<!-- proposal:v1:start -->` and before `<!-- proposal:v1:end -->`, retaining all intervening
whitespace. The marker lines and this status/vote bookkeeping are outside the immutable proposal.
Any substantive proposal or participant change needs a new revision and fresh votes.

## Preliminary votes — v1

| Participant                 | Vote    | Evidence/rationale                                                                                                                                                                |
| --------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deputy                      | Support | Explicit preliminary Support on the frozen v1 hash; reviewed source, resolved chronology/compatibility/privilege/cascade choices, verified 28,021 bytes and hash after formatting |
| Luna A / Backend            | Support | Explicit preliminary Support on frozen v1; independently verified 28,021 bytes and SHA-256; authentic reply relayed by Chair                                                      |
| Luna B / Infrastructure/API | Support | Explicit preliminary Support on frozen v1; independently verified 28,021 bytes and SHA-256; authentic reply relayed by Chair                                                      |
| Luna C / independent QA     | Support | Explicit preliminary Support on frozen v1 after independent rehash/review; duplicate 312 link is non-blocking and frozen body remains unchanged; authentic reply relayed by Chair |

## Chair review and responses

All four preliminary voters explicitly support the exact frozen v1 proposal. Their votes approve
the design, not an unimplemented or untested outcome.

The Chair independently rehashed the 28,021-byte proposal and reviewed the choices against source.
The strongest concern is the intentional generic receipt-source API behavior change and correctness
of grants and parent clearing. Explicit compatibility notes, grandfathering tests, all 18 prior
column grants and separate SQL/activation gates address that concern. Meaningful SQL, race and
cascade execution remains necessary before activation. Legacy Home remains unchanged, and this
bounded slice cannot establish full SCKRL-311 Done. The Chair accepts v1 without material changes
and casts final Support on its exact SHA-256.

Deputy response: agree with that assessment after freshly rechecking the same body/hash. The new
provenance invariant is a deliberate API change, not a claim of universal write compatibility;
grandfathered ordinary edits, parent clearing and preserved prior privileges are explicit acceptance
cases. Source review cannot stand in for the required database execution. No proposal change is
needed. Deputy casts fresh final Support on the unchanged v1. Subsequently A, B and C each returned
fresh final Support after verifying the exact same 28,021-byte proposal and SHA-256; these votes
were received and relayed by the Chair, not inferred from their preliminary positions.

## Final votes — v1

| Participant                 | Vote    | Evidence/rationale                                                                                                                                        |
| --------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chair                       | Support | Explicit final design Support on unchanged v1/hash after independent rehash, source review and reciprocal challenge; no implementation acceptance implied |
| Deputy                      | Support | Fresh final design Support after verifying 28,021 bytes and exact v1 SHA-256 and responding to Chair's compatibility/grant/cascade concerns               |
| Luna A / Backend            | Support | Authentic fresh final Support after independently verifying unchanged v1, 28,021 bytes and SHA-256; received and relayed by Chair                         |
| Luna B / Infrastructure/API | Support | Authentic fresh final Support after independently verifying v1 and accepting the compatibility/grant/cascade response; received and relayed by Chair      |
| Luna C / independent QA     | Support | Authentic fresh final Support after independently verifying v1 and preserving source/SQL/activation separation; received and relayed by Chair             |

Decision: all five required participants explicitly support the exact frozen v1 proposal after
preliminary unanimity and reciprocal Chair review. The design and bounded local implementation are
unanimously ratified under the owner's existing roadmap instruction. Luna A owns the database and
contract work; Luna B owns the client/web work; Luna C independently validates the actual final diff.

This is not source acceptance, SQL execution permission, hosted migration/activation or full
SCKRL-311 Done. The final implementation needs its own reviewed evidence and acceptance votes.
Preserve the frozen proposal, separate execution/activation gates and the other tickets' open states.
