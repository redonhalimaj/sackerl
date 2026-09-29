import { describe, expect, it, vi } from 'vitest';

import {
  categoryZoneEstimatorVersion,
  createSackerlItemsClient,
  declarableExpiryFactSources,
  estimateExpiryDate,
  estimateExpiryDays,
  expiryEstimateDaysByCategoryZone,
  expiryEstimateZoneKeys,
  expiryFactOrigins,
  expiryFactSources,
  expiryPrintedMarkings,
  isDeclarableExpiryFactSource,
  isExpiryFactOrigin,
  isExpiryFactSource,
  isExpiryPrintedMarking,
  isItemCategoryId,
  isItemQuantityUnit,
  isItemRemovalReason,
  isItemSource,
  isUnconfirmedExpiryEstimate,
  itemCategories,
  itemCategoryIds,
  itemQuantityUnits,
  itemRemovalReasons,
  itemSources,
  mapItemExpiryFactRow,
  mapItemExpiryProvenance,
  mapStockItemRow,
} from './items';
import type { ApiRequestError, AuthenticatedUserContext } from './profile';

const config = {
  anonKey: 'public-key',
  url: 'https://sackerl.supabase.co',
};

const context = {
  accessToken: 'access-token',
  user: {
    email: 'test@sackerl.com',
    id: 'user-123',
  },
} satisfies AuthenticatedUserContext;

const itemRow = {
  added_on: '2026-05-31',
  category_id: 'dairy',
  expires_on: '2026-06-05',
  household_id: 'household-123',
  id: 'item-123',
  name: 'Milk',
  qty_unit: 'l',
  qty_value: '1.000',
  removal_reason: null,
  removed_on: null,
  source: 'manual',
  zone_id: 'zone-123',
} as const;

function requireString(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Expected a string value.');
  }

  return value;
}

function requestBody(call: readonly unknown[] | undefined): Record<string, unknown> {
  return JSON.parse(requireString((call?.[1] as RequestInit | undefined)?.body)) as Record<
    string,
    unknown
  >;
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', ...init.headers },
    status: 200,
    ...init,
  });
}

describe('item data model metadata', () => {
  it('keeps the category seed keys aligned with SK.categories', () => {
    expect(itemCategoryIds).toEqual([
      'dairy',
      'produce',
      'meat',
      'pantry',
      'canned',
      'frozen',
      'bakery',
      'snacks',
      'drinks',
      'spices',
    ]);
    expect(itemCategories).toHaveLength(10);
    expect(itemCategories[0]).toMatchObject({ id: 'dairy', label: 'Dairy', short: 'MK' });
    expect(itemCategories.at(-1)).toMatchObject({ id: 'spices', label: 'Spices', short: 'SP' });
  });

  it('exposes the accepted quantity units and item sources', () => {
    expect(itemQuantityUnits).toEqual(['g', 'kg', 'ml', 'l', 'pcs']);
    expect(itemSources).toEqual(['manual', 'receipt', 'imported']);
    expect(itemRemovalReasons).toEqual(['used', 'composted']);
  });

  it('guards accepted enum values', () => {
    expect(isItemQuantityUnit('kg')).toBe(true);
    expect(isItemQuantityUnit('oz')).toBe(false);
    expect(isItemSource('receipt')).toBe(true);
    expect(isItemSource('scan')).toBe(false);
    expect(isItemRemovalReason('used')).toBe(true);
    expect(isItemRemovalReason('trash')).toBe(false);
    expect(isItemCategoryId('produce')).toBe(true);
    expect(isItemCategoryId('unknown')).toBe(false);
  });

  it('maps stock item database rows into API model shape', () => {
    expect(
      mapStockItemRow({
        added_on: '2026-05-31',
        category_id: 'produce',
        expires_on: '2026-06-05',
        household_id: 'household-123',
        id: 'item-123',
        name: 'Tomatoes',
        qty_unit: 'g',
        qty_value: '500.000',
        removal_reason: null,
        removed_on: null,
        source: 'manual',
        zone_id: 'zone-123',
      }),
    ).toEqual({
      addedOn: '2026-05-31',
      categoryId: 'produce',
      expiresOn: '2026-06-05',
      expiryProvenance: {
        confirmedAt: null,
        factId: null,
        origin: null,
        printedMarking: null,
        source: null,
      },
      householdId: 'household-123',
      id: 'item-123',
      name: 'Tomatoes',
      qtyUnit: 'g',
      qtyValue: 500,
      removalReason: null,
      removedOn: null,
      source: 'manual',
      zoneId: 'zone-123',
    });
  });
});

describe('expiry estimation', () => {
  it('keeps every category covered for the supported storage zones', () => {
    for (const categoryId of itemCategoryIds) {
      expect(Object.keys(expiryEstimateDaysByCategoryZone[categoryId]).sort()).toEqual(
        [...expiryEstimateZoneKeys].sort(),
      );

      for (const zoneKey of expiryEstimateZoneKeys) {
        expect(expiryEstimateDaysByCategoryZone[categoryId][zoneKey]).toBeGreaterThan(0);
      }
    }
  });

  it('estimates days from category and zone rules', () => {
    expect(estimateExpiryDays({ categoryId: 'dairy', zoneKey: 'fridge' })).toBe(7);
    expect(estimateExpiryDays({ categoryId: 'dairy', zoneKey: 'freezer' })).toBe(60);
    expect(estimateExpiryDays({ categoryId: 'meat', zoneKey: 'fridge' })).toBe(3);
    expect(estimateExpiryDays({ categoryId: 'frozen', zoneKey: 'freezer' })).toBe(180);
    expect(estimateExpiryDays({ categoryId: 'pantry', zoneKey: 'basement' })).toBe(120);
  });

  it('falls back to the pantry rule for custom zones', () => {
    expect(estimateExpiryDays({ categoryId: 'produce', zoneKey: 'cellar' })).toBe(
      expiryEstimateDaysByCategoryZone.produce.pantry,
    );
  });

  it('returns an ISO date from a deterministic base date', () => {
    expect(
      estimateExpiryDate({
        baseDate: '2026-06-05',
        categoryId: 'dairy',
        zoneKey: 'freezer',
      }),
    ).toBe('2026-08-04');
    expect(
      estimateExpiryDate({
        baseDate: '2026-06-05',
        categoryId: 'produce',
        zoneKey: 'fridge',
      }),
    ).toBe('2026-06-11');
  });

  it('rejects invalid estimate inputs', () => {
    expect(() => estimateExpiryDays({ categoryId: 'produce', zoneKey: 'bad zone' })).toThrow(
      'Storage zone is invalid.',
    );
    expect(() =>
      estimateExpiryDate({
        baseDate: 'June 5',
        categoryId: 'produce',
        zoneKey: 'fridge',
      }),
    ).toThrow('baseDate must be an ISO date.');
  });
});

describe('items API client', () => {
  it('lists active items with pagination and zone/category filters', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse([
          {
            created_at: '2026-05-31T20:00:00Z',
            household_id: 'household-123',
            id: 'zone-123',
            key: 'fridge',
            label: 'Fridge',
            sort_order: 1,
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          [
            {
              added_on: '2026-05-31',
              category_id: 'produce',
              expires_on: '2026-06-05',
              household_id: 'household-123',
              id: 'item-123',
              name: 'Tomatoes',
              qty_unit: 'g',
              qty_value: '500.000',
              removal_reason: null,
              removed_on: null,
              source: 'manual',
              zone_id: 'zone-123',
            },
          ],
          { headers: { 'Content-Range': '20-39/42' } },
        ),
      );
    const client = createSackerlItemsClient(config, { fetch: fetchMock });

    await expect(
      client.listItems(context, {
        categoryId: 'produce',
        householdId: 'household-123',
        page: 2,
        pageSize: 20,
        zone: 'Fridge',
      }),
    ).resolves.toEqual({
      items: [
        {
          addedOn: '2026-05-31',
          categoryId: 'produce',
          expiresOn: '2026-06-05',
          expiryProvenance: {
            confirmedAt: null,
            factId: null,
            origin: null,
            printedMarking: null,
            source: null,
          },
          householdId: 'household-123',
          id: 'item-123',
          name: 'Tomatoes',
          qtyUnit: 'g',
          qtyValue: 500,
          removalReason: null,
          removedOn: null,
          source: 'manual',
          zoneId: 'zone-123',
        },
      ],
      pagination: { page: 2, pageSize: 20, total: 42 },
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://sackerl.supabase.co/rest/v1/zones?household_id=eq.household-123&key=eq.fridge&limit=1&select=id%2Chousehold_id%2Ckey%2Clabel%2Csort_order%2Ccreated_at',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'https://sackerl.supabase.co/rest/v1/items?category_id=eq.produce&household_id=eq.household-123&order=expires_on.asc.nullslast%2Cadded_on.desc%2Cid.asc&removed_on=is.null&select=id%2Chousehold_id%2Cname%2Cqty_value%2Cqty_unit%2Ccategory_id%2Czone_id%2Cexpires_on%2Cadded_on%2Cremoved_on%2Cremoval_reason%2Csource%2Cexpiry_fact_id%2Cexpiry_source%2Cexpiry_origin%2Cexpiry_printed_marking%2Cexpiry_confirmed_at&zone_id=eq.zone-123',
    );
    expect(fetchMock.mock.calls[1]?.[1]?.method).toBe('GET');
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toMatchObject({
      Prefer: 'count=exact',
      Range: '20-39',
    });
  });

  it('creates a single item from a zone key', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse([
          {
            created_at: '2026-05-31T20:00:00Z',
            household_id: 'household-123',
            id: 'zone-123',
            key: 'pantry',
            label: 'Pantry',
            sort_order: 2,
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            added_on: '2026-05-31',
            category_id: 'pantry',
            expires_on: null,
            household_id: 'household-123',
            id: 'item-123',
            name: 'Rice',
            qty_unit: 'kg',
            qty_value: 1,
            removal_reason: null,
            removed_on: null,
            source: 'manual',
            zone_id: 'zone-123',
          },
        ]),
      );
    const client = createSackerlItemsClient(config, { fetch: fetchMock });

    await expect(
      client.createItem(context, {
        categoryId: 'pantry',
        householdId: 'household-123',
        name: ' Rice ',
        qtyUnit: 'kg',
        qtyValue: 1,
        zone: 'pantry',
      }),
    ).resolves.toMatchObject({ id: 'item-123', name: 'Rice' });

    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'https://sackerl.supabase.co/rest/v1/items?select=id%2Chousehold_id%2Cname%2Cqty_value%2Cqty_unit%2Ccategory_id%2Czone_id%2Cexpires_on%2Cadded_on%2Cremoved_on%2Cremoval_reason%2Csource%2Cexpiry_fact_id%2Cexpiry_source%2Cexpiry_origin%2Cexpiry_printed_marking%2Cexpiry_confirmed_at',
    );
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      body: JSON.stringify({
        category_id: 'pantry',
        household_id: 'household-123',
        name: 'Rice',
        qty_unit: 'kg',
        qty_value: 1,
        source: 'manual',
        zone_id: 'zone-123',
      }),
      method: 'POST',
    });
  });

  it('creates a batch of items', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse([
        {
          added_on: '2026-05-31',
          category_id: 'dairy',
          expires_on: '2026-06-02',
          household_id: 'household-123',
          id: 'item-123',
          name: 'Milk',
          qty_unit: 'l',
          qty_value: 1,
          removal_reason: null,
          removed_on: null,
          source: 'receipt',
          zone_id: 'zone-123',
        },
      ]),
    );
    const client = createSackerlItemsClient(config, { fetch: fetchMock });

    await expect(
      client.createItemsBatch(context, {
        householdId: 'household-123',
        items: [
          {
            categoryId: 'dairy',
            expiresOn: '2026-06-02',
            name: 'Milk',
            qtyUnit: 'l',
            qtyValue: 1,
            source: 'receipt',
            zoneId: 'zone-123',
          },
        ],
      }),
    ).resolves.toHaveLength(1);

    expect(requireString(fetchMock.mock.calls[0]?.[0])).toBe(
      'https://sackerl.supabase.co/rest/v1/items?select=id%2Chousehold_id%2Cname%2Cqty_value%2Cqty_unit%2Ccategory_id%2Czone_id%2Cexpires_on%2Cadded_on%2Cremoved_on%2Cremoval_reason%2Csource%2Cexpiry_fact_id%2Cexpiry_source%2Cexpiry_origin%2Cexpiry_printed_marking%2Cexpiry_confirmed_at',
    );
    const batchBody = fetchMock.mock.calls[0]?.[1]?.body;

    expect(typeof batchBody).toBe('string');
    expect(JSON.parse(batchBody as string)).toEqual({
      category_id: 'dairy',
      expires_on: '2026-06-02',
      household_id: 'household-123',
      name: 'Milk',
      qty_unit: 'l',
      qty_value: 1,
      source: 'receipt',
      zone_id: 'zone-123',
    });
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
    });
  });

  it('updates and soft-deletes items by household id', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse([
          {
            added_on: '2026-05-31',
            category_id: 'produce',
            expires_on: '2026-06-06',
            household_id: 'household-123',
            id: 'item-123',
            name: 'Cherry tomatoes',
            qty_unit: 'g',
            qty_value: 250,
            removal_reason: null,
            removed_on: null,
            source: 'manual',
            zone_id: 'zone-123',
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            added_on: '2026-05-31',
            category_id: 'produce',
            expires_on: '2026-06-06',
            household_id: 'household-123',
            id: 'item-123',
            name: 'Cherry tomatoes',
            qty_unit: 'g',
            qty_value: 250,
            removal_reason: 'used',
            removed_on: '2026-06-01',
            source: 'manual',
            zone_id: 'zone-123',
          },
        ]),
      );
    const client = createSackerlItemsClient(config, { fetch: fetchMock });

    await client.updateItem(context, {
      expiresOn: '2026-06-06',
      householdId: 'household-123',
      id: 'item-123',
      name: 'Cherry tomatoes',
      qtyValue: 250,
    });
    await expect(
      client.deleteItem(context, {
        householdId: 'household-123',
        id: 'item-123',
        removalReason: 'used',
        removedOn: '2026-06-01',
      }),
    ).resolves.toMatchObject({ removalReason: 'used', removedOn: '2026-06-01' });

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      body: JSON.stringify({
        name: 'Cherry tomatoes',
        qty_value: 250,
        expires_on: '2026-06-06',
      }),
      method: 'PATCH',
    });
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      body: JSON.stringify({ removed_on: '2026-06-01', removal_reason: 'used' }),
      method: 'PATCH',
    });
  });

  it('aggregates used and composted removals by current and previous month', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse([
        { removal_reason: 'used', removed_on: '2026-06-05' },
        { removal_reason: 'used', removed_on: '2026-06-15' },
        { removal_reason: 'composted', removed_on: '2026-06-20' },
        { removal_reason: 'used', removed_on: '2026-05-08' },
        { removal_reason: 'composted', removed_on: '2026-05-12' },
      ]),
    );
    const client = createSackerlItemsClient(config, { fetch: fetchMock });

    await expect(
      client.getRemovalStats(context, {
        householdId: 'household-123',
        month: '2026-06',
      }),
    ).resolves.toEqual({
      current: {
        compostedCount: 1,
        month: '2026-06',
        totalCount: 3,
        usedCount: 2,
      },
      delta: {
        compostedCountPercent: 0,
        totalCountPercent: 50,
        usedCountPercent: 100,
      },
      householdId: 'household-123',
      previous: {
        compostedCount: 1,
        month: '2026-05',
        totalCount: 2,
        usedCount: 1,
      },
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://sackerl.supabase.co/rest/v1/items?and=%28removed_on.gte.2026-05-01%2Cremoved_on.lt.2026-07-01%29&household_id=eq.household-123&removal_reason=in.%28used%2Ccomposted%29&select=removed_on%2Cremoval_reason',
    );
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('GET');
  });

  it('rejects invalid item payloads before calling the API', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const client = createSackerlItemsClient(config, { fetch: fetchMock });

    await expect(
      client.createItem(context, {
        categoryId: 'produce',
        householdId: 'household-123',
        name: '',
        qtyUnit: 'g',
        qtyValue: 0,
        zoneId: 'zone-123',
      }),
    ).rejects.toMatchObject({
      message: 'Item name is required.',
      status: 400,
    } satisfies Partial<ApiRequestError>);
    expect(fetchMock).not.toHaveBeenCalled();

    await expect(
      client.deleteItem(context, {
        householdId: 'household-123',
        id: 'item-123',
        removalReason: 'trash' as never,
      }),
    ).rejects.toMatchObject({
      message: 'Item removal reason is invalid.',
      status: 400,
    } satisfies Partial<ApiRequestError>);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('expiry provenance', () => {
  const factRow = {
    confidence: '0.500',
    confirmed_at: null,
    confirmed_by: null,
    estimator_version: 'category-zone-v1',
    expires_on: '2026-06-05',
    household_id: 'household-123',
    id: 'aaaaaaaa-1111-4111-8111-111111111111',
    is_active: true,
    item_id: 'item-123',
    origin: 'declared',
    printed_marking: 'unknown',
    recorded_at: '2026-06-01T08:00:00Z',
    recorded_by: 'user-123',
    source: 'estimated',
    superseded_at: null,
    supersedes_fact_id: null,
  } as const;

  it('keeps the reserved and declarable source lists distinct', () => {
    expect(expiryFactSources).toEqual(['printed', 'user', 'estimated', 'model']);
    expect(declarableExpiryFactSources).toEqual(['printed', 'user', 'estimated']);
    expect(isExpiryFactSource('model')).toBe(true);
    expect(isDeclarableExpiryFactSource('model')).toBe(false);
    expect(expiryFactOrigins).toEqual(['declared', 'inferred', 'backfill']);
    expect(expiryPrintedMarkings).toEqual(['use_by', 'best_before', 'unknown']);
    expect(isExpiryPrintedMarking('sell_by')).toBe(false);
    expect(isExpiryFactOrigin('backfill')).toBe(true);
  });

  it('maps the active-fact projection onto stock items', () => {
    const item = mapStockItemRow({
      added_on: '2026-05-31',
      category_id: 'dairy',
      expires_on: '2026-06-05',
      expiry_confirmed_at: '2026-06-01T09:00:00Z',
      expiry_fact_id: 'aaaaaaaa-1111-4111-8111-111111111111',
      expiry_origin: 'declared',
      expiry_printed_marking: 'use_by',
      expiry_source: 'printed',
      household_id: 'household-123',
      id: 'item-123',
      name: 'Milk',
      qty_unit: 'l',
      qty_value: '1.000',
      removal_reason: null,
      removed_on: null,
      source: 'manual',
      zone_id: 'zone-123',
    });

    expect(item.expiryProvenance).toEqual({
      confirmedAt: '2026-06-01T09:00:00Z',
      factId: 'aaaaaaaa-1111-4111-8111-111111111111',
      origin: 'declared',
      printedMarking: 'use_by',
      source: 'printed',
    });
  });

  it('reports no provenance when an item has no recorded fact', () => {
    const provenance = mapItemExpiryProvenance({
      added_on: '2026-05-31',
      category_id: 'dairy',
      expires_on: null,
      expiry_confirmed_at: '2026-06-01T09:00:00Z',
      expiry_fact_id: null,
      expiry_origin: 'declared',
      expiry_source: 'printed',
      household_id: 'household-123',
      id: 'item-123',
      name: 'Salt',
      qty_unit: 'g',
      qty_value: '500.000',
      removal_reason: null,
      removed_on: null,
      source: 'manual',
      zone_id: 'zone-123',
    });

    expect(provenance).toEqual({
      confirmedAt: null,
      factId: null,
      origin: null,
      printedMarking: null,
      source: null,
    });
  });

  it('separates an unconfirmed estimate from a confirmed one', () => {
    expect(
      isUnconfirmedExpiryEstimate({
        confirmedAt: null,
        factId: 'aaaaaaaa-1111-4111-8111-111111111111',
        origin: 'declared',
        printedMarking: 'unknown',
        source: 'estimated',
      }),
    ).toBe(true);
    expect(
      isUnconfirmedExpiryEstimate({
        confirmedAt: '2026-06-01T09:00:00Z',
        factId: 'bbbbbbbb-2222-4222-8222-222222222222',
        origin: 'declared',
        printedMarking: 'unknown',
        source: 'estimated',
      }),
    ).toBe(false);
    expect(
      isUnconfirmedExpiryEstimate({
        confirmedAt: null,
        factId: 'cccccccc-3333-4333-8333-333333333333',
        origin: 'declared',
        printedMarking: 'use_by',
        source: 'printed',
      }),
    ).toBe(false);
    expect(
      isUnconfirmedExpiryEstimate({
        confirmedAt: null,
        factId: 'dddddddd-4444-4444-8444-444444444444',
        origin: 'inferred',
        printedMarking: 'unknown',
        source: 'estimated',
      }),
    ).toBe(false);
    expect(
      isUnconfirmedExpiryEstimate({
        confirmedAt: null,
        factId: 'eeeeeeee-5555-4555-8555-555555555555',
        origin: 'backfill',
        printedMarking: 'unknown',
        source: 'estimated',
      }),
    ).toBe(false);
  });

  it('numbers the confidence a database row returns as text', () => {
    expect(mapItemExpiryFactRow(factRow)).toEqual({
      confidence: 0.5,
      confirmedAt: null,
      confirmedBy: null,
      estimatorVersion: 'category-zone-v1',
      expiresOn: '2026-06-05',
      householdId: 'household-123',
      id: 'aaaaaaaa-1111-4111-8111-111111111111',
      isActive: true,
      itemId: 'item-123',
      origin: 'declared',
      printedMarking: 'unknown',
      recordedAt: '2026-06-01T08:00:00Z',
      recordedBy: 'user-123',
      source: 'estimated',
      supersededAt: null,
      supersedesFactId: null,
    });
  });

  it('sends a declared estimate as the write-only command value', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse([{ ...itemRow, expiry_fact_id: 'aaaaaaaa-1111-4111-8111-111111111111' }]),
      );
    const client = createSackerlItemsClient(config, { fetch: fetchMock });

    await client.createItem(context, {
      categoryId: 'dairy',
      confidenceUnused: undefined,
      expiresOn: '2026-06-05',
      expiry: {
        confidence: 0.5,
        estimatorVersion: categoryZoneEstimatorVersion,
        source: 'estimated',
      },
      householdId: 'household-123',
      name: 'Milk',
      qtyUnit: 'l',
      qtyValue: 1,
      zoneId: 'zone-123',
    } as never);

    expect(requestBody(fetchMock.mock.calls[0]).expiry_declaration).toEqual({
      confidence: 0.5,
      estimator_version: 'category-zone-v1',
      source: 'estimated',
    });
  });

  it('re-declares provenance without sending a date change', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse([{ ...itemRow, expiry_fact_id: 'bbbbbbbb-2222-4222-8222-222222222222' }]),
      );
    const client = createSackerlItemsClient(config, { fetch: fetchMock });

    await client.updateItem(context, {
      expiry: {
        confirm: true,
        expectedFactId: '11111111-2222-4333-8444-555555555555',
        printedMarking: 'best_before',
        source: 'printed',
      },
      householdId: 'household-123',
      id: 'item-123',
    });

    const body = requestBody(fetchMock.mock.calls[0]);

    expect(body).toEqual({
      expiry_declaration: {
        confirm: true,
        expected_fact_id: '11111111-2222-4333-8444-555555555555',
        printed_marking: 'best_before',
        source: 'printed',
      },
    });
    expect('expires_on' in body).toBe(false);
  });

  it('preserves an explicit null expected fact id in the declaration', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse([{ ...itemRow, expiry_fact_id: null }]));
    const client = createSackerlItemsClient(config, { fetch: fetchMock });

    await client.updateItem(context, {
      expiresOn: '2026-06-05',
      expiry: {
        expectedFactId: null,
        source: 'user',
      },
      householdId: 'household-123',
      id: 'item-123',
    });

    expect(requestBody(fetchMock.mock.calls[0]).expiry_declaration).toEqual({
      expected_fact_id: null,
      source: 'user',
    });
  });

  it('treats null estimate metadata as omitted in the command row', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse([{ ...itemRow, expiry_fact_id: 'aaaaaaaa-1111-4111-8111-111111111111' }]),
      );
    const client = createSackerlItemsClient(config, { fetch: fetchMock });

    await client.updateItem(context, {
      expiresOn: '2026-06-05',
      expiry: {
        confidence: null,
        estimatorVersion: null,
        source: 'estimated',
      },
      householdId: 'household-123',
      id: 'item-123',
    });

    expect(requestBody(fetchMock.mock.calls[0]).expiry_declaration).toEqual({
      source: 'estimated',
    });
  });

  it.each([
    [{ source: 'model' } as const, 'Model-derived expiry provenance is not enabled.'],
    [{ source: 'guessed' } as const, 'Expiry source is invalid.'],
    [
      { confidence: 0.5, source: 'user' } as const,
      'Confidence is only valid for an estimated expiry date.',
    ],
    [
      { confidence: 1.5, source: 'estimated' } as const,
      'Expiry confidence must be between 0 and 1.',
    ],
    [
      { estimatorVersion: 'v1', source: 'printed' } as const,
      'An estimator version is only valid for an estimated expiry date.',
    ],
    [
      { printedMarking: 'use_by', source: 'estimated' } as const,
      'A printed marking requires a printed or user-entered date.',
    ],
    [{ printedMarking: 'sell_by', source: 'printed' } as const, 'Printed marking is invalid.'],
    [{ expectedFactId: 'not-a-uuid', source: 'user' } as const, 'expectedFactId must be a uuid.'],
  ])('rejects the invalid declaration %j', async (expiry, message) => {
    const fetchMock = vi.fn<typeof fetch>();
    const client = createSackerlItemsClient(config, { fetch: fetchMock });

    await expect(
      client.updateItem(context, {
        expiresOn: '2026-06-05',
        expiry: expiry as never,
        householdId: 'household-123',
        id: 'item-123',
      }),
    ).rejects.toThrow(message);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses to clear a date under a source that is not the user', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const client = createSackerlItemsClient(config, { fetch: fetchMock });

    await expect(
      client.updateItem(context, {
        expiresOn: null,
        expiry: { source: 'printed' },
        householdId: 'household-123',
        id: 'item-123',
      }),
    ).rejects.toThrow('A printed expiry source requires a date.');

    await expect(
      client.updateItem(context, {
        expiresOn: null,
        expiry: { estimatorVersion: 'category-zone-v1', source: 'estimated' },
        householdId: 'household-123',
        id: 'item-123',
      }),
    ).rejects.toThrow('Clearing an expiry date requires the user source.');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('confirms the active fact without moving the date or changing its source', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse([factRow]))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            ...itemRow,
            expiry_confirmed_at: '2026-06-02T10:00:00Z',
            expiry_fact_id: 'bbbbbbbb-2222-4222-8222-222222222222',
            expiry_origin: 'declared',
            expiry_printed_marking: 'unknown',
            expiry_source: 'estimated',
          },
        ]),
      );
    const client = createSackerlItemsClient(config, { fetch: fetchMock });
    const item = await client.confirmItemExpiry(context, {
      householdId: 'household-123',
      id: 'item-123',
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://sackerl.supabase.co/rest/v1/item_expiry_facts?household_id=eq.household-123&is_active=is.true&item_id=eq.item-123&limit=1&select=id%2Chousehold_id%2Citem_id%2Cexpires_on%2Csource%2Corigin%2Cprinted_marking%2Cconfidence%2Cestimator_version%2Cconfirmed_at%2Cconfirmed_by%2Csupersedes_fact_id%2Csuperseded_at%2Cis_active%2Crecorded_by%2Crecorded_at',
    );

    const body = requestBody(fetchMock.mock.calls[1]);

    expect(body).toEqual({
      expiry_declaration: {
        confidence: 0.5,
        confirm: true,
        estimator_version: 'category-zone-v1',
        expected_fact_id: 'aaaaaaaa-1111-4111-8111-111111111111',
        printed_marking: 'unknown',
        source: 'estimated',
      },
    });
    expect('expires_on' in body).toBe(false);
    expect(item.expiryProvenance.source).toBe('estimated');
    expect(item.expiryProvenance.confirmedAt).toBe('2026-06-02T10:00:00Z');
  });

  it.each(['backfill', 'inferred'] as const)(
    'confirms a %s estimate as a user assertion without estimator metadata',
    async (origin) => {
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          jsonResponse([
            {
              ...factRow,
              confidence: null,
              estimator_version: null,
              origin,
            },
          ]),
        )
        .mockResolvedValueOnce(
          jsonResponse([
            {
              ...itemRow,
              expiry_confirmed_at: '2026-06-02T10:00:00Z',
              expiry_fact_id: 'bbbbbbbb-2222-4222-8222-222222222222',
              expiry_origin: 'declared',
              expiry_printed_marking: 'unknown',
              expiry_source: 'user',
            },
          ]),
        );
      const client = createSackerlItemsClient(config, { fetch: fetchMock });

      await client.confirmItemExpiry(context, {
        expectedFactId: 'aaaaaaaa-1111-4111-8111-111111111111',
        householdId: 'household-123',
        id: 'item-123',
      });

      expect(requestBody(fetchMock.mock.calls[1])).toEqual({
        expiry_declaration: {
          confirm: true,
          expected_fact_id: 'aaaaaaaa-1111-4111-8111-111111111111',
          printed_marking: 'unknown',
          source: 'user',
        },
      });
    },
  );

  it('refuses to confirm an item that has no recorded expiry fact', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse([]));
    const client = createSackerlItemsClient(config, { fetch: fetchMock });

    await expect(
      client.confirmItemExpiry(context, { householdId: 'household-123', id: 'item-123' }),
    ).rejects.toThrow('This item has no recorded expiry date to confirm.');
  });

  it('returns a conflict when an expected fact id is supplied but no active fact exists', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse([]));
    const client = createSackerlItemsClient(config, { fetch: fetchMock });

    await expect(
      client.confirmItemExpiry(context, {
        expectedFactId: 'aaaaaaaa-1111-4111-8111-111111111111',
        householdId: 'household-123',
        id: 'item-123',
      }),
    ).rejects.toMatchObject({
      message: 'The expiry date changed. Reload the item before saving.',
      status: 409,
    } satisfies Partial<ApiRequestError>);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps no-active confirmation as a clear no-date error when the caller expected no fact', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse([]));
    const client = createSackerlItemsClient(config, { fetch: fetchMock });

    await expect(
      client.confirmItemExpiry(context, {
        expectedFactId: null,
        householdId: 'household-123',
        id: 'item-123',
      }),
    ).rejects.toThrow('This item has no recorded expiry date to confirm.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refuses to confirm when the caller snapshot differs from the active fact', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse([factRow]));
    const client = createSackerlItemsClient(config, { fetch: fetchMock });

    await expect(
      client.confirmItemExpiry(context, {
        expectedFactId: 'bbbbbbbb-2222-4222-8222-222222222222',
        householdId: 'household-123',
        id: 'item-123',
      }),
    ).rejects.toMatchObject({
      message: 'The expiry date changed. Reload the item before saving.',
      status: 409,
    } satisfies Partial<ApiRequestError>);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refuses to confirm an explicit no-date fact', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse([
        {
          ...factRow,
          confidence: null,
          estimator_version: null,
          expires_on: null,
          source: 'user',
        },
      ]),
    );
    const client = createSackerlItemsClient(config, { fetch: fetchMock });

    await expect(
      client.confirmItemExpiry(context, { householdId: 'household-123', id: 'item-123' }),
    ).rejects.toThrow('This item has no expiry date to confirm.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('records a cleared date as an explicit user fact', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse([
        {
          ...itemRow,
          expires_on: null,
          expiry_confirmed_at: '2026-06-02T10:00:00Z',
          expiry_fact_id: 'cccccccc-3333-4333-8333-333333333333',
          expiry_origin: 'declared',
          expiry_printed_marking: 'unknown',
          expiry_source: 'user',
        },
      ]),
    );
    const client = createSackerlItemsClient(config, { fetch: fetchMock });
    const item = await client.clearItemExpiry(context, {
      expectedFactId: '11111111-2222-4333-8444-555555555555',
      householdId: 'household-123',
      id: 'item-123',
    });

    expect(requestBody(fetchMock.mock.calls[0])).toEqual({
      expires_on: null,
      expiry_declaration: {
        confirm: true,
        expected_fact_id: '11111111-2222-4333-8444-555555555555',
        source: 'user',
      },
    });
    expect(item.expiresOn).toBeNull();
    expect(item.expiryProvenance.source).toBe('user');
  });

  it('can clear with item field changes and an explicit no-active-fact guard', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse([
        {
          ...itemRow,
          expires_on: null,
          name: 'Milk, no date',
          qty_value: 2,
        },
      ]),
    );
    const client = createSackerlItemsClient(config, { fetch: fetchMock });

    await client.clearItemExpiry(context, {
      changes: {
        name: 'Milk, no date',
        qtyValue: 2,
      },
      expectedFactId: null,
      householdId: 'household-123',
      id: 'item-123',
    });

    expect(requestBody(fetchMock.mock.calls[0])).toEqual({
      name: 'Milk, no date',
      qty_value: 2,
      expires_on: null,
      expiry_declaration: {
        confirm: true,
        expected_fact_id: null,
        source: 'user',
      },
    });
  });

  it('reads newest-first history for one item', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse([
        { ...factRow, id: 'bbbbbbbb-2222-4222-8222-222222222222' },
        {
          ...factRow,
          id: 'aaaaaaaa-1111-4111-8111-111111111111',
          is_active: false,
          superseded_at: '2026-06-02T10:00:00Z',
        },
      ]),
    );
    const client = createSackerlItemsClient(config, { fetch: fetchMock });
    const history = await client.listItemExpiryHistory(context, {
      householdId: 'household-123',
      itemId: 'item-123',
      limit: 10,
    });

    expect(history.map((fact) => fact.id)).toEqual([
      'bbbbbbbb-2222-4222-8222-222222222222',
      'aaaaaaaa-1111-4111-8111-111111111111',
    ]);
    expect(history[1]?.isActive).toBe(false);
    expect(requireString(fetchMock.mock.calls[0]?.[0])).toContain(
      'order=fact_sequence.desc&select=',
    );
  });
});
