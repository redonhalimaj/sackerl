# SCKRL-406 expiry provenance and confirmation contract

SCKRL-406 separates _what date an item shows_ from _where that date came from_ and _whether a
person confirmed it_. It follows ADR-0001's **Expiry Provenance** decision: `items.expires_on`
stays the compatible current-date projection, and an append-only fact table carries source,
confidence, estimator version, actor, confirmation time, creation time and the superseded fact.

This document is the accepted contract for the backend slice. It is deliberately explicit about
what the database will **not** claim, because an expiry date is never proof that food is safe.

**Scope of this slice.** Database schema, atomic write behaviour, shared TypeScript types and the
web payload/route surface, completed on return with mobile Add/Edit and household-calendar
integration. Warning UI (SCKRL-407) and snooze (SCKRL-408) remain outside this ticket.

## Vocabulary

| Term                | Meaning                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Displayed date**  | `items.expires_on`. Unchanged shape, unchanged semantics, still nullable.                                     |
| **Expiry fact**     | One immutable row in `public.item_expiry_facts` describing one recorded date and its provenance.              |
| **Active fact**     | The single fact per item with `is_active = true`. Its `expires_on` always equals `items.expires_on`.          |
| **Declaration**     | A write-only JSON value a caller attaches to an item write to state the provenance of the date it is writing. |
| **Origin**          | How the provenance itself was obtained: `declared`, `inferred`, or `backfill`.                                |
| **Printed marking** | What the package label said: `use_by`, `best_before`, or `unknown`. Independent of source and confirmation.   |

## Data model

### `public.item_expiry_facts` (append-only)

| Column               | Type                                                | Notes                                                                                                                     |
| -------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `id`                 | `uuid` pk                                           |                                                                                                                           |
| `household_id`       | `uuid`                                              | Composite FK `(item_id, household_id) -> items (id, household_id)`, `on delete cascade`, `deferrable initially deferred`. |
| `item_id`            | `uuid`                                              | See above.                                                                                                                |
| `expires_on`         | `date` null                                         | `null` is a recorded fact meaning "this item has no expiry date", not "unknown".                                          |
| `source`             | `expiry_fact_source`                                | `printed`, `user`, `estimated`, `model`.                                                                                  |
| `origin`             | `expiry_fact_origin`                                | `declared`, `inferred`, `backfill`.                                                                                       |
| `printed_marking`    | `expiry_printed_marking` not null default `unknown` | `use_by`, `best_before`, `unknown`.                                                                                       |
| `confidence`         | `numeric(4,3)` null                                 | Only meaningful for `estimated` / `model`. `null` means "not scored", never `0`.                                          |
| `estimator_version`  | `text` null                                         | Only for `estimated` / `model`, e.g. `category-zone-v1`.                                                                  |
| `confirmed_at`       | `timestamptz` null                                  | Database-owned. Set only by an explicit confirmation.                                                                     |
| `confirmed_by`       | `uuid` null                                         | Database-owned; always `auth.uid()` of the confirming session.                                                            |
| `supersedes_fact_id` | `uuid` null                                         | Composite self-FK scoped to `household_id`.                                                                               |
| `superseded_at`      | `timestamptz` null                                  | Set when this fact stops being active.                                                                                    |
| `is_active`          | `boolean` not null                                  | At most one `true` per item (partial unique index).                                                                       |
| `recorded_by`        | `uuid` null                                         | Database-owned; `auth.uid()`, or `null` for the migration backfill.                                                       |
| `recorded_at`        | `timestamptz` not null default `now()`              | Database-owned.                                                                                                           |

`recorded_by`, `recorded_at`, `confirmed_by`, `confirmed_at`, `origin`, `is_active`,
`superseded_at` and `supersedes_fact_id` are **never** taken from a client payload. A caller cannot
name a different actor, backdate a fact, or assert someone else's confirmation.

`fact_sequence bigint generated always as identity` is an internal, database-owned append-order
key. History orders by this sequence descending, not by transaction timestamps or random UUIDs.
The history guard makes it immutable. It is not exposed as a JavaScript number in the client.
Sequences can have gaps; the order within one item's serialized writes is what matters.

### Honesty invariants (enforced by CHECK constraints)

1. `source = 'printed'` requires a non-null `expires_on`. A missing date is not package evidence.
2. `expires_on is null` requires `source = 'user'`. Only a person clears a date.
3. `confidence` and `estimator_version` are non-null only for `source in ('estimated','model')`;
   `confidence` is between `0` and `1`.
4. `printed_marking <> 'unknown'` requires `source in ('printed','user')`. A guess has no label.
5. `confirmed_at` and `confirmed_by` are both null or both non-null.
6. `origin <> 'declared'` forces the weakest honest shape: `source` is `estimated` (dated) or
   `user` (cleared), `confidence`, `estimator_version`, `confirmed_at` and `confirmed_by` are
   null, and `printed_marking` is `unknown`.
7. `origin = 'backfill'` requires `recorded_by is null`.
8. `is_active = true` requires `superseded_at is null`, and vice versa.

Invariant 6 is the rule that stops an undeclared write from claiming provenance it does not have.

### Read projection on `public.items`

Five nullable columns mirror the active fact so list screens need one query, not N:

`expiry_fact_id`, `expiry_source`, `expiry_origin`, `expiry_printed_marking`, `expiry_confirmed_at`.

They are maintained exclusively by the item trigger. Any client-supplied value for them is
discarded on every insert and update, so they cannot drift or be forged. They are a cache of
`item_expiry_facts`, which remains the source of truth; `expiry_fact_id` fetches the full fact
(confidence, estimator version, actor, history) when a screen needs it.

### Household calendar zone

`households.calendar_time_zone text not null default 'Europe/Vienna'` with a validating trigger
against `pg_timezone_names` and a syntactic CHECK. The default reproduces SCKRL-506's current
pilot behaviour exactly, so no existing recipe eligibility result changes. Existing rows take the
default; the column is owner-updatable through the existing household RLS policies.

Members can read their household/calendar through a SELECT policy using `is_household_member`.
Profile lookup prefers the owned household, then the caller's first membership by household ID;
the returned role reflects `households.owner_id`. Calendar updates retain the existing owner-only
policy. `ensureHousehold` reuses a member household. This does not introduce household switching.

## Write contract

### The declaration column

`items.expiry_declaration jsonb` is a **write-only command column**. The trigger reads it, applies
it, and always stores `null`. It therefore works over plain PostgREST inserts, batch inserts and
patches — the paths the app already uses — with no extra round trip and no separate transaction.

```jsonc
{
  "source": "printed" | "user" | "estimated" | "model",
  "printed_marking": "use_by" | "best_before" | "unknown", // optional, default "unknown"
  "confidence": 0.82,                                       // optional, estimated/model only
  "estimator_version": "category-zone-v1",                  // optional, estimated/model only
  "confirm": true,                                          // optional, default false
  "expected_fact_id": "uuid" | null                         // optional; null expects no fact
}
```

`source` is required. Unknown keys raise `PT400` so a typo loses a rejection, not the provenance.
`model` is **rejected** in Stage 1 (`PT400`): the enum value exists so a later migration is
unambiguous, but no model provider is wired and the database will not accept fabricated model
evidence. `confirm: true` records `confirmed_at = now()` and `confirmed_by = auth.uid()`; a client
cannot supply either value.

### When a fact is appended

The single `BEFORE INSERT OR UPDATE ON public.items` trigger decides:

| Situation                                                                       | Result                                                                                                                                                     |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Insert with `expires_on` and a declaration                                      | `origin = 'declared'` fact with the declared provenance.                                                                                                   |
| Insert with `expires_on`, no declaration                                        | `origin = 'inferred'` fact: `source = 'estimated'`, unconfirmed, no confidence, no estimator version.                                                      |
| Insert with `expires_on is null`, no declaration                                | No fact. Absence of an active fact means no date.                                                                                                          |
| Update that changes `expires_on`, with a declaration                            | New declared fact superseding the old one.                                                                                                                 |
| Update that changes `expires_on`, no declaration                                | New `inferred` fact superseding the old one.                                                                                                               |
| Update that leaves `expires_on` unchanged, no declaration                       | **Nothing happens.** Provenance and confirmation are preserved.                                                                                            |
| Update with a declaration and an unchanged date                                 | New fact recording the re-declaration (this is how a confirmation, a printed marking, or an estimate→user correction is recorded without moving the date). |
| Update setting `expires_on` to null                                             | A `user` "no expiry date" fact supersedes the previous one.                                                                                                |
| Any item write that does not touch `expires_on` (name, quantity, zone, removal) | No fact, no projection change.                                                                                                                             |

A new fact **never** inherits `confirmed_at` / `confirmed_by`. Changing a date always drops the old
date's confirmation; re-confirming the new date is a separate, explicit user action.

Appending is idempotent: if the resulting fact would be byte-identical to the current active fact
(same date, source, origin, marking, confidence, estimator version, and already-confirmed when
`confirm` is requested), no row is written and no history noise is created. This makes client
retries safe.

Confidence is rounded to the column's three decimal places before both the comparison and
insertion. Thus retrying a declaration such as `0.1234` compares to its stored `0.123` value and
does not append duplicate history solely because of database rounding.

### Optimistic concurrency

`expected_fact_id` is optional.

- Omitted → unconditional write. Two concurrent writers serialise on the item row lock; both facts
  land in order and the later one is active. The projection and history stay coherent.
- Explicit null → expect no active fact; a now-existing fact raises `PT409`.
- UUID equal to the current active fact id → the write proceeds.
- Stale UUID, UUID when no fact exists, or a fact from another item → `PT409`; another household
  is rejected as `PT403`. The statement mutates nothing.

Edit screens should pass the `expiry_fact_id` they rendered, so a second device cannot silently
overwrite a date the user just confirmed. Add screens pass nothing.

The guard is checked before identical-fact retry detection. If a guarded save succeeded but its
response was lost, retrying with the old fact ID returns a conflict and requires a reload; it does
not append duplicate history or silently overwrite the new active fact.

### Transaction and failure behaviour

Every supported write path is one SQL statement, so the fact append, the supersede and the
`items.expires_on` change commit or roll back together. A rejected declaration raises before any
row is written. A failed statement leaves the previous active fact active and
`items.expires_on` unchanged; there is no partial state in which the projection and the active
fact disagree.

### History protection

`item_expiry_facts` has RLS enabled with a **select-only** policy for household members, table
grants reduced to `select` for `authenticated`, and a guard trigger that rejects direct `delete`
and every `update` other than the `is_active true→false` / `superseded_at` supersede transition.
Deleting the parent item can cascade its history; ordinary app removal is a soft update and
preserves it. Evidence fields stay immutable, while supersession metadata is maintained internally.
The item trigger is `security definer` so it can append; nothing else can. Cross-household
references are impossible because both the item FK and the supersede self-FK are composite on
`household_id`.

## Error codes

| SQLSTATE | Meaning                                                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PT400`  | Invalid declaration: unknown key, bad source, `model` source, out-of-range confidence, marking/source mismatch, or a null date without `source = 'user'`. |
| `PT403`  | The declaration referenced a fact outside the caller's household.                                                                                         |
| `PT409`  | `expected_fact_id` did not match the current active fact.                                                                                                 |

PostgREST maps these to 400 / 403 / 409, and `ApiRequestError` already carries the status through.

## Backfill

Every existing item with a non-null `expires_on` gets exactly one fact:

`origin = 'backfill'`, `source = 'estimated'`, `printed_marking = 'unknown'`, `confidence = null`,
`estimator_version = null`, `confirmed_at = null`, `confirmed_by = null`, `recorded_by = null`.

The date is copied verbatim; **no visible date changes**. `origin = 'backfill'` with
`recorded_by is null` is what makes a legacy row honestly distinguishable from a real
category-zone estimate, which always carries `origin = 'declared'` and an `estimator_version`.
Items with a null `expires_on` get no fact. The migration invents no estimator version, no
confidence, no package evidence and no user confirmation.

## TypeScript client contract

`@sackerl/api-client` adds:

```ts
export const expiryFactSources = ['printed', 'user', 'estimated', 'model'] as const;
export const expiryFactOrigins = ['declared', 'inferred', 'backfill'] as const;
export const expiryPrintedMarkings = ['use_by', 'best_before', 'unknown'] as const;

export type ItemExpiryProvenance = {
  readonly confirmedAt: string | null;
  readonly factId: string | null;
  readonly origin: ExpiryFactOrigin | null;
  readonly printedMarking: ExpiryPrintedMarking | null;
  readonly source: ExpiryFactSource | null;
};

export type ItemExpiryFact = {
  /* full row, camelCased */
};

export type ExpiryDeclarationInput = {
  readonly confidence?: number | null;
  readonly confirm?: boolean;
  readonly estimatorVersion?: string | null;
  readonly expectedFactId?: string | null;
  readonly printedMarking?: ExpiryPrintedMarking;
  readonly source: DeclarableExpiryFactSource;
};
```

`StockItem` gains `expiryProvenance: ItemExpiryProvenance`, always present, with every field `null`
when the item has no active fact. `CreateStockItemInput` and `UpdateStockItemInput` gain an
optional `expiry?: ExpiryDeclarationInput`. Existing callers compile unchanged and keep working;
they simply produce `origin: 'inferred'` facts.

New client methods:

- `confirmItemExpiry({ householdId, id, expectedFactId })` — records the confirmation of the date
  currently shown, without moving it.
- `clearItemExpiry({ householdId, id, expectedFactId })` — records a `user` "no expiry date" fact.
- `listItemExpiryHistory({ householdId, itemId, limit })` — newest-first facts, RLS scoped.

`clearItemExpiry` also accepts `changes` containing non-expiry item edits. It combines those
fields with the clear declaration in one `updateItem` request; clearing cannot partially commit
before a name, quantity or zone update fails.

`estimateExpiryDays` / `estimateExpiryDate` are unchanged. The estimator identity used by callers
is the exported constant `categoryZoneEstimatorVersion = 'category-zone-v1'`, so an accepted
estimate is recorded as `{ source: 'estimated', estimatorVersion: categoryZoneEstimatorVersion }`
and is distinguishable from a typed date forever after.

### Examples for the mobile slice (SCKRL-406 remainder, owned by Codex)

```ts
// Add Item, user typed a date and tapped save
expiry: { source: 'user', confirm: true }

// Add Item, user typed a date read off the package
expiry: { source: 'printed', printedMarking: 'best_before', confirm: true }

// Add Item, the prefilled category-zone estimate was accepted untouched
expiry: { source: 'estimated', estimatorVersion: categoryZoneEstimatorVersion }

// Edit, user corrected an estimated date to the printed use-by date
expiry: { source: 'printed', printedMarking: 'use_by', confirm: true,
          expectedFactId: item.expiryProvenance.factId }

// "Yes, that date is right" on an estimated date, without changing it
await items.confirmItemExpiry(context, { householdId, id, expectedFactId })

// "This item has no date"
await items.clearItemExpiry(context, { householdId, id, expectedFactId })
```

An unconfirmed declared estimate is identified by `expiryProvenance.source === 'estimated'`,
`expiryProvenance.origin === 'declared'` **and** `expiryProvenance.confirmedAt === null`.
For inferred/backfill facts, `estimated` is a compatibility placeholder and the actual source
is unknown/unverified; no estimator is implied. A confirmed declared estimate keeps `source: 'estimated'` — the
date is still estimate-derived — but gains `confirmedAt`, which is exactly the distinction
SCKRL-407 needs for its yellow affordance.

Confirming an inferred/backfill date instead creates a declared `user` assertion, with unknown
marking and no estimator/confidence. The immutable predecessor preserves the original origin;
the active fact describes what the user now asserted. Confirming never invents how that legacy
date was produced. `confirmItemExpiry` rejects a no-date fact and a stale supplied expectation
before constructing the declaration; its write still uses the fetched fact ID as a race guard.

## Web API surface

`POST /items`, `POST /items/batch` and `PATCH /items/[id]` accept an optional `expiry` object with
the camelCase shape above. Omitted means "no declaration" (`inferred`). `expiresOn: null` with
`expiry: { source: 'user' }` is the clear path. Unknown fields inside `expiry` are rejected with
400 before the request reaches the database.

`GET /suggestions` now reads `household.calendarTimeZone` instead of the hard-coded
`'Europe/Vienna'` constant in `apps/web/lib/recipes.ts`. `getWebRecipesClient(calendarTimeZone?)`
keeps its old no-argument signature and its `'Europe/Vienna'` default, caching one client per
zone, so every existing caller compiles and behaves identically. With the column default equal to
the old constant, SCKRL-506's eligibility results are byte-identical after this change.

## What this contract deliberately does not do

- It does not claim a date proves food is safe. `use_by` and `best_before` are recorded as _what
  the package said_, and no state in this model means "safe" or "unsafe".
- It does not implement warning UI, colour, copy or overdue interaction (SCKRL-407).
- It does not implement snooze or reminder state (SCKRL-408); snooze must be a separate column or
  table and must never write an expiry fact.
- It does not implement receipt placement (SCKRL-311). Placement will supply a declaration per
  created item exactly like Add Item does — `{ source: 'printed', printedMarking, confirm: true }`
  for a reviewed printed date, `{ source: 'estimated', estimatorVersion }` for a filled estimate —
  and needs no further schema from this ticket.
- It does not enable model-derived provenance. `source: 'model'` is reserved and rejected.
- It does not change SCKRL-506 recipe eligibility behaviour.

## Product decisions resolved by Codex — 2026-09-16

These decisions were reviewed by Orchestrator (`gpt-5.6-sol`, xhigh) and recorded before mobile
Add wiring. All three original open questions are resolved here.

1. **Add:** an untouched prefilled date or a blank-field fallback is `estimated`, unconfirmed,
   with `category-zone-v1`. Saving the form does not assert a package date. Explicitly typing a
   nonblank valid date records `user` with `confirm: true`, even if its value equals the estimate.
   The form must accurately describe the fallback and distinguish user entry from estimation.
2. **Edit:** preserve the date and fact when expiry was untouched; omit both expiry fields from
   an unrelated save. Explicitly entered dates are `user` with `confirm: true`; clearing means
   no date, never an automatic replacement estimate. Every mobile expiry intent sends the fact
   ID originally displayed. An explicit null expectation means "there was no active fact";
   omission remains an unconditional write for compatibility clients. Preserve this distinction
   through TypeScript, web JSON and SQL. A conflict keeps the draft and asks the user to reload.
   Metadata plus a clear must be one atomic item PATCH, not two independent mutations.
3. **Calendar:** household Settings, owner editable and member readable; no new onboarding step.
   Default stays Europe/Vienna, never silently follows device travel. Home suggestions, the
   Suggestions list and Recipe detail all use the loaded household calendar. SCKRL-506's date
   eligibility rule itself is unchanged. Invalid zones report an error instead of silently
   changing the household calendar.
