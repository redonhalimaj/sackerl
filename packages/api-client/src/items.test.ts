import { describe, expect, it, vi } from 'vitest';

import {
  createSackerlItemsClient,
  estimateExpiryDate,
  estimateExpiryDays,
  expiryEstimateDaysByCategoryZone,
  expiryEstimateZoneKeys,
  isItemCategoryId,
  isItemQuantityUnit,
  isItemRemovalReason,
  isItemSource,
  itemCategories,
  itemCategoryIds,
  itemQuantityUnits,
  itemRemovalReasons,
  itemSources,
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
      'https://sackerl.supabase.co/rest/v1/items?category_id=eq.produce&household_id=eq.household-123&order=expires_on.asc.nullslast%2Cadded_on.desc%2Cid.asc&removed_on=is.null&select=id%2Chousehold_id%2Cname%2Cqty_value%2Cqty_unit%2Ccategory_id%2Czone_id%2Cexpires_on%2Cadded_on%2Cremoved_on%2Cremoval_reason%2Csource&zone_id=eq.zone-123',
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
      'https://sackerl.supabase.co/rest/v1/items?select=id%2Chousehold_id%2Cname%2Cqty_value%2Cqty_unit%2Ccategory_id%2Czone_id%2Cexpires_on%2Cadded_on%2Cremoved_on%2Cremoval_reason%2Csource',
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

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://sackerl.supabase.co/rest/v1/items?select=id%2Chousehold_id%2Cname%2Cqty_value%2Cqty_unit%2Ccategory_id%2Czone_id%2Cexpires_on%2Cadded_on%2Cremoved_on%2Cremoval_reason%2Csource',
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
