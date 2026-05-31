import { describe, expect, it } from 'vitest';

import {
  isItemCategoryId,
  isItemQuantityUnit,
  isItemSource,
  itemCategories,
  itemCategoryIds,
  itemQuantityUnits,
  itemSources,
  mapStockItemRow,
} from './items';

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
  });

  it('guards accepted enum values', () => {
    expect(isItemQuantityUnit('kg')).toBe(true);
    expect(isItemQuantityUnit('oz')).toBe(false);
    expect(isItemSource('receipt')).toBe(true);
    expect(isItemSource('scan')).toBe(false);
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
      removedOn: null,
      source: 'manual',
      zoneId: 'zone-123',
    });
  });
});
