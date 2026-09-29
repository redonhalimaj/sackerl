# ADR-0001: Reliable Food Loop Architecture

Date: 2026-09-06

Ticket: SCKRL-023

Status: Accepted for Stage 1 implementation; retention values require review before production.

## Context

Sackerl currently has authenticated Supabase CRUD, a receipt table, deterministic receipt parsing,
and useful shared client tests. The mobile scan screen still creates synthetic `sackerl://` URLs,
production OCR adapters are not wired, receipt item replacement uses separate delete and insert
requests, and expiry estimates are stored like exact dates.

SCKRL-304 Review and SCKRL-305 Placement would turn uncertain parsed data into household inventory.
Their contracts must prevent cross-household access, partial writes, duplicate placement, lost good
parse data, and false expiry precision.

## Decision

### Platform

- Keep Expo, Next.js route handlers, Supabase Auth, Supabase Postgres, and RLS.
- Use Supabase Storage for the first private receipt-media implementation.
- Keep direct RLS-protected reads and simple single-record prototype mutations where they already
  work. New multi-record receipt, inventory, and learning-sensitive transitions use server-owned
  commands backed by transactional Postgres functions.
- Never expose a service-role key or OCR-provider secret to web or mobile clients.

### Receipt Media

- Create a private `receipt-media` bucket with no public read policy.
- Store objects under a household and receipt-scoped path. The server authorizes the household and
  returns a short-lived signed upload or read operation.
- Persist bucket, object path, media type, byte size, checksum where available, upload state, and
  capture source. Do not persist signed URLs as durable identifiers.
- Validate allowed image/PDF types and size before upload finalization. Do not trust filename or
  client MIME type alone.
- An upload finalization command verifies the object before a receipt becomes eligible for OCR.
- Cleanup removes abandoned upload objects and database records through an idempotent job.

### Receipt Lifecycle And OCR Jobs

- Separate media, processing, review, and placement state rather than adding more meaning to the
  existing `receipts.status` field.
- Add durable processing attempts with receipt, job kind, state, attempt count, maximum attempts,
  next-attempt time, lease expiry, provider, provider version, parser version, safe error code, and
  timestamps.
- Enqueue is idempotent per receipt plus parser/provider version. Workers claim jobs with a lease;
  retries cannot run the same attempt concurrently.
- The minimum client completion contract is polling a receipt-status endpoint. Supabase Realtime or
  push may be added later, but durable database state remains authoritative.
- Production OCR does not run inside the request that accepts upload. Deterministic text parsing
  remains available only for tests and explicit local development.
- Worker hosting is time-boxed to SCKRL-309: compare a Supabase-native worker with the selected app
  host using retry support, operational visibility, regional processing, and cost. This does not
  block schema and command work.

### Parse Promotion And Review

- A parse attempt writes a complete candidate generation. The receipt points to a generation only
  after every candidate line and receipt-header update succeeds in one transaction.
- Failed reprocessing leaves the prior active generation unchanged.
- Receipt lines preserve immutable raw text and original inferred fields. User-reviewed fields,
  include/ignore state, review state, reviewed time, reviewer, and parser version are stored
  separately.
- Parser confidence does not equal user approval. Every unresolved line must be accepted, edited, or
  ignored before the receipt can become reviewed.
- Price, discount, tax, and retailer identity fields are nullable in Stage 1, but their null behavior
  is explicit so later budget work does not reinterpret missing values as zero.

### Expiry Provenance

- Keep `items.expires_on` as the current read projection for compatibility.
- Add an append-only expiry-fact record containing the item, date, source, confidence when relevant,
  estimator/parser version, actor, confirmed time, created time, and superseded fact.
- Initial sources are `printed`, `user`, `estimated`, and `model`. Model-derived values are not part
  of Stage 1 behavior but the enum prevents a later ambiguous migration.
- Existing non-null expiry dates are backfilled as `estimated` unless reliable historical evidence
  proves a different source. Their visible date does not change.
- UI and notifications use the active fact to distinguish estimated from confirmed dates.

### Inventory Events And Placement

- Keep `items` as the read-optimized current stock projection. Do not implement full event sourcing.
- Add a lightweight append-only inventory event for acquisition, adjustment, move, consume, discard,
  and correction. Events include quantity delta, zones where relevant, source receipt line, actor,
  occurrence time, reason, and idempotency key.
- SCKRL-311 provides one `finalize_receipt_placement` command. It validates household ownership and
  reviewed lines, creates stock rows, links each row to its receipt line, writes acquisition and
  expiry facts, and marks the receipt placed in one transaction.
- A unique source receipt-line link plus command idempotency key prevents duplicate placement.
- Failure leaves the reviewed receipt and existing stock unchanged.

### Authorization And Privacy

- Every table and storage policy is household scoped through membership checks.
- Server commands derive household membership from the authenticated session; they do not trust a
  client-supplied household identifier without validation.
- Logs and analytics exclude receipt text, product names, signed URLs, access tokens, provider raw
  payloads, and user-entered content.
- Provider processing must use an approved EU-compatible region and documented data-processing terms
  before production receipt data is enabled.

### Retention

- Original receipt media is deleted 30 days after successful placement, or 30 days after capture for
  abandoned and failed receipts. User-requested deletion runs earlier.
- Structured receipt headers and reviewed lines remain for receipt history until the user deletes
  the receipt, household, or account.
- OCR provider raw responses are not retained after normalized parse promotion unless a separately
  approved de-identified evaluation fixture is created.
- Development QA data and media are deleted immediately after validation.
- These are engineering defaults, not legal advice. Privacy/legal review and user-facing disclosure
  are required before production; that review may shorten the defaults without changing contracts.

## Consequences

- SCKRL-307 and SCKRL-308 can implement real acquisition and private upload against a stable media
  boundary.
- SCKRL-309 owns durable asynchronous processing, provider selection, and completion signaling.
- SCKRL-310 owns versioned parse promotion and the durable review contract.
- SCKRL-406 owns expiry facts and confirmation behavior.
- SCKRL-311 owns atomic receipt placement, receipt-line lineage, and initial inventory events.
- SCKRL-304 depends on SCKRL-310. SCKRL-305 depends on SCKRL-304, SCKRL-406, and SCKRL-311.
- Existing direct CRUD remains compatible while commands are migrated incrementally.
- Additional migrations and a worker deployment are required before the receipt loop is production
  ready.

## Rejected Alternatives

- **Continue direct client multi-table writes.** Rejected because retries and partial failure can
  create duplicate stock or erase good receipt lines.
- **Run OCR synchronously in the parse request.** Rejected because provider latency and timeouts do
  not provide durable retries or observable recovery.
- **Store public receipt URLs.** Rejected because receipts may contain sensitive household and
  payment-adjacent information.
- **Treat confidence as review approval.** Rejected because model confidence is not user consent or
  correction evidence.
- **Replace the current model with full event sourcing.** Rejected as unnecessary complexity. A
  current-state projection plus an operational event ledger meets the learning need.
- **Add AI before the event ledger.** Rejected because there is no trustworthy behavioral data or
  deterministic evaluation baseline yet.

## Validation Required By Follow-Up Tickets

- Migration replay from a clean database and from the current dev schema.
- RLS and storage-policy tests for member, non-member, expired URL, and deleted-object paths.
- Job concurrency, lease expiry, retry exhaustion, and duplicate enqueue tests.
- Failed parse promotion preserving the previous active generation.
- Duplicate placement and injected mid-transaction failure tests.
- Existing-item expiry backfill without visible date changes.

## Addendum 2026-09-16: SCKRL-406 Expiry Provenance Persistence

Ticket: SCKRL-406. Status: accepted for the backend slice; Codex owns review and the mobile and
calendar consumers. This addendum records the persistence and authorization choices made while
implementing the **Expiry Provenance** decision above. It refines that decision and does not
replace it: `items.expires_on` remains the compatible projection and the fact record stays
append-only.

### Persistence

- The append-only record is `public.item_expiry_facts`, one immutable row per recorded date, with
  `source`, `printed_marking`, `confidence`, `estimator_version`, `confirmed_at`, `confirmed_by`,
  `supersedes_fact_id`, `superseded_at`, `is_active`, `recorded_by` and `recorded_at`.
- A partial unique index enforces at most one active fact per item. The active fact's `expires_on`
  always equals `items.expires_on`.
- Five read-only projection columns on `items` (`expiry_fact_id`, `expiry_source`,
  `expiry_origin`, `expiry_printed_marking`, `expiry_confirmed_at`) mirror the active fact so list
  screens keep one query. They are a cache maintained solely by the trigger, not the record of
  truth, and are not client-writable.

### Trigger over RPC

Writes go through one `before insert or update on public.items` `security definer` trigger rather
than a new command RPC. This was chosen because the existing app writes items through plain
PostgREST inserts, batch inserts and patches. A trigger keeps every one of those paths atomic and
consistent inside a single statement without rewriting callers, whereas an RPC would leave the
existing direct paths free to move a date without recording a fact. Callers state provenance with
a write-only `items.expiry_declaration jsonb` command column, which the trigger consumes, applies,
and always stores as `null`. Optimistic concurrency uses an optional `expected_fact_id` inside that
declaration; the item row lock serialises concurrent writers, and a stale expectation raises
`PT409` without mutating anything.

SCKRL-311 will still be a single transactional command as decided above. It writes items the same
way and therefore inherits this behaviour rather than duplicating it.

### Honesty over completeness

- A third axis, `origin` (`declared`, `inferred`, `backfill`), records how the provenance itself was
  obtained. `origin <> 'declared'` is constrained to the weakest honest shape: `estimated` for a
  date or `user` for a cleared date, with no confidence, no estimator version, no printed marking
  and no confirmation. An undeclared legacy write therefore cannot claim provenance it does not
  have, and a migration backfill (`origin = 'backfill'`, `recorded_by is null`) stays permanently
  distinguishable from a real category-zone estimate.
- `source = 'model'` is reserved in the enum, as decided above, and actively rejected at write time
  in Stage 1 so no fabricated model evidence can enter the record before a provider exists.
- Changing a date never carries the previous date's confirmation forward. Confirmation is always a
  separate explicit user action recorded as its own fact.
- `printed_marking` stays independent of `source` and `confirmed_at`. No combination of values in
  this model asserts that food is safe.

### Authorization

- `item_expiry_facts` is household scoped through the existing `is_household_member` check, has a
  select-only RLS policy, and has its `authenticated` grants reduced to `select`.
- A guard trigger rejects every delete and every update except the `is_active true -> false`
  supersede transition, so history survives an accidentally broad grant.
- Both the item foreign key and the supersede self-foreign key are composite on `household_id`, so
  a cross-household reference is not expressible.
- `recorded_by`, `recorded_at`, `confirmed_by`, `confirmed_at`, `origin`, `is_active`,
  `superseded_at` and `supersedes_fact_id` are database-owned and are discarded if a client sends
  them.

### Household calendar zone

`households.calendar_time_zone` is `text not null default 'Europe/Vienna'`, validated against
`pg_timezone_names` by a trigger plus a syntactic check constraint. The default reproduces
SCKRL-506's current pilot configuration exactly, so existing recipe eligibility results do not
change. It replaces the hard-coded constant in the web recipe factory; the factory keeps its old
signature and default so existing callers are unaffected.

### Codex return review — 2026-09-16

Infrastructure (`gpt-5.5`, xhigh) and Orchestrator (`gpt-5.6-sol`, xhigh) independently reviewed
the uncommitted design. The trigger is accepted as a bounded persistence refinement for the
existing direct item writes; it does not replace SCKRL-311's transactional placement command.
The command column stores no request payload after execution. History is append-only in its
evidence fields; activation/supersession metadata can change, and deleting the parent item
cascades its history. This is not an immutable audit archive independent of item retention.

The `origin` axis is accepted with explicit precedence: for `inferred` and `backfill`, the stored
`estimated` source is a compatibility placeholder, not evidence an estimator ran. Those facts
are unknown/unverified. A declared estimate may identify an estimator; migration/compatibility
writes never invent one. Consumers must not flatten these states into a known category estimate.
Confirming an inferred/backfill date creates a new `declared` **user** assertion with unknown
marking and no estimator/confidence. Its predecessor retains the original unknown/backfill
evidence. Confirming a declared estimate preserves that estimated source. This makes confirmation
orthogonal to known source without retrospectively inventing the source of an unknown date.

Alternatives considered: using null confidence/version as an implicit "unknown" flag would also
match legitimate unscored declarations; using a null actor would mix migration history with
privileged compatibility writes. Adding an `unknown` source would change the original four-source
contract and still would not distinguish migration from ongoing compatibility writes. A
database-owned origin field records those three cases directly without widening who can assert
provenance. It is not a trust score: `declared` means supplied by the caller, not independently
verified package evidence. Removing the axis from consumer decisions would defeat its purpose.

Review found and required an optimistic-guard correction: omitted `expected_fact_id` remains
unconditional, explicit JSON null expects no active fact, and a UUID expects that exact fact.
Mobile expiry edits always supply an expectation; unrelated item edits omit the expiry command.
An explicit new date can be confirmed in the same save, but no confirmation is inherited.

Further review corrections use an immutable, database-owned `fact_sequence` identity for
history order because transaction timestamps can tie or precede lock acquisition. Confidence
is normalized to its persisted three-decimal precision before retry comparison. These do not
alter expiry evidence or eligibility; they make the stated ordering and retry contracts hold.

Settings is the owner-editable calendar surface. All three mobile recipe scoring entry points
and the web suggestions endpoint use the household zone; Add uses it for the estimator base
day. Stock/Expiring urgency grouping and the known expiry-changing snooze implementation remain
separately tracked in SCKRL-407/408 and are not accepted as corrected by this ticket.

These decisions accept the architecture refinement, not the implementation's final QA gate.
Pending migrations remain unapplied under the owner's current instruction; corrected SQL still
requires runtime validation after that restriction is lifted.

### Integration correction — 2026-09-27: member calendar reads

Final Orchestrator review found that the accepted member-readable Settings contract was
unreachable: the profile lookup and original household SELECT policy only served owners.
SCKRL-406 adds a member SELECT policy using the existing security-definer membership predicate;
household/calendar UPDATE remains owner-only. Profile resolution preserves the owned household
first, then resolves the caller's membership in a deterministic household-ID order. It derives
the returned role from the actual household owner ID, not a membership role string. `ensureHousehold`
reuses a member household rather than creating an unintended second one. This is read access for
existing members; invitations, household switching and member calendar writes are not added.
Profile request tests and member/nonmember SQL fixtures must cover this path. SQL remains
unexecuted under the owner's migration restriction.
