import { randomUUID } from 'node:crypto';

import { expectJson, type ApiClient } from '../fixtures';

/** Response shapes mirrored from packages/api-client (kept local so specs stay transport-level). */
export type HouseholdBody = {
  readonly household: {
    readonly calendarTimeZone: string;
    readonly id: string;
    readonly name: string;
    readonly ownerId: string;
    readonly role: 'member' | 'owner';
    readonly zones: readonly string[];
  };
};

export type ExpiryProvenance = {
  readonly confirmedAt: string | null;
  readonly factId: string | null;
  readonly origin: 'backfill' | 'declared' | 'inferred' | null;
  readonly printedMarking: 'best_before' | 'unknown' | 'use_by' | null;
  readonly source: 'estimated' | 'model' | 'printed' | 'user' | null;
};

export type StockItemBody = {
  readonly addedOn: string;
  readonly categoryId: string;
  readonly expiresOn: string | null;
  readonly expiryProvenance: ExpiryProvenance;
  readonly householdId: string;
  readonly id: string;
  readonly name: string;
  readonly qtyUnit: string;
  readonly qtyValue: number;
  readonly removalReason: 'composted' | 'used' | null;
  readonly removedOn: string | null;
  readonly source: string;
  readonly zoneId: string;
};

export type ShoppingListItemBody = {
  readonly categoryId: string | null;
  readonly checkedAt: string | null;
  readonly householdId: string;
  readonly id: string;
  readonly name: string;
  readonly qtyUnit: string;
  readonly qtyValue: number;
  readonly recipeId: string | null;
  readonly source: string;
};

export type Pagination = {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number | null;
};

/** Unique, human-readable name for test data. */
export function uniqueName(label: string): string {
  return `e2e ${label} ${randomUUID().slice(0, 8)}`;
}

/** A uuid that cannot belong to any real row. */
export function missingId(): string {
  return randomUUID();
}

export function isoDateFromToday(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Bootstraps the caller's household. A fresh user has none; PATCH /household creates it
 * (app/household/route.ts falls back to ensureHousehold when getHousehold is null).
 * GET /me first so the profile row exists.
 */
export async function setupHousehold(client: ApiClient, name = uniqueName('household')) {
  await expectJson(await client.get('/me'), 200);
  const body = await expectJson<HouseholdBody>(await client.patch('/household', { name }), 200);
  return body.household;
}

export function itemInput(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    categoryId: 'dairy',
    name: uniqueName('milk'),
    qtyUnit: 'l',
    qtyValue: 1,
    zone: 'fridge',
    ...overrides,
  };
}

export async function createItem(client: ApiClient, overrides: Record<string, unknown> = {}) {
  const body = await expectJson<{ item: StockItemBody }>(
    await client.post('/items', itemInput(overrides)),
    201,
  );
  return body.item;
}

export async function createListItem(client: ApiClient, overrides: Record<string, unknown> = {}) {
  const body = await expectJson<{ item: ShoppingListItemBody }>(
    await client.post('/shopping-list', { name: uniqueName('list'), ...overrides }),
    201,
  );
  return body.item;
}
