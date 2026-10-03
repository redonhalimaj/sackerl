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
