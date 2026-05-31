export const itemQuantityUnits = ['g', 'kg', 'ml', 'l', 'pcs'] as const;

export type ItemQuantityUnit = (typeof itemQuantityUnits)[number];

export const itemSources = ['manual', 'receipt', 'imported'] as const;

export type ItemSource = (typeof itemSources)[number];

export const itemCategories = [
  { id: 'dairy', label: 'Dairy', short: 'MK', sortOrder: 10 },
  { id: 'produce', label: 'Produce', short: 'PR', sortOrder: 20 },
  { id: 'meat', label: 'Meat & Fish', short: 'MT', sortOrder: 30 },
  { id: 'pantry', label: 'Pantry', short: 'PN', sortOrder: 40 },
  { id: 'canned', label: 'Canned', short: 'CN', sortOrder: 50 },
  { id: 'frozen', label: 'Frozen', short: 'FR', sortOrder: 60 },
  { id: 'bakery', label: 'Bakery', short: 'BK', sortOrder: 70 },
  { id: 'snacks', label: 'Snacks', short: 'SN', sortOrder: 80 },
  { id: 'drinks', label: 'Drinks', short: 'DR', sortOrder: 90 },
  { id: 'spices', label: 'Spices', short: 'SP', sortOrder: 100 },
] as const;

export type ItemCategory = (typeof itemCategories)[number];

export type ItemCategoryId = ItemCategory['id'];

export const itemCategoryIds = itemCategories.map(
  (category) => category.id,
) as readonly ItemCategoryId[];

export type StorageZone = {
  readonly createdAt: string;
  readonly householdId: string;
  readonly id: string;
  readonly key: string;
  readonly label: string;
  readonly sortOrder: number;
};

export type StockItem = {
  readonly addedOn: string;
  readonly categoryId: ItemCategoryId;
  readonly expiresOn: string | null;
  readonly householdId: string;
  readonly id: string;
  readonly name: string;
  readonly qtyUnit: ItemQuantityUnit;
  readonly qtyValue: number;
  readonly removedOn: string | null;
  readonly source: ItemSource;
  readonly zoneId: string;
};

export type DatabaseStockItemRow = {
  readonly added_on: string;
  readonly category_id: ItemCategoryId;
  readonly expires_on: string | null;
  readonly household_id: string;
  readonly id: string;
  readonly name: string;
  readonly qty_unit: ItemQuantityUnit;
  readonly qty_value: number | string;
  readonly removed_on: string | null;
  readonly source: ItemSource;
  readonly zone_id: string;
};

export function isItemQuantityUnit(value: unknown): value is ItemQuantityUnit {
  return typeof value === 'string' && itemQuantityUnits.includes(value as ItemQuantityUnit);
}

export function isItemSource(value: unknown): value is ItemSource {
  return typeof value === 'string' && itemSources.includes(value as ItemSource);
}

export function isItemCategoryId(value: unknown): value is ItemCategoryId {
  return typeof value === 'string' && itemCategoryIds.includes(value as ItemCategoryId);
}

export function mapStockItemRow(row: DatabaseStockItemRow): StockItem {
  return {
    addedOn: row.added_on,
    categoryId: row.category_id,
    expiresOn: row.expires_on,
    householdId: row.household_id,
    id: row.id,
    name: row.name,
    qtyUnit: row.qty_unit,
    qtyValue: Number(row.qty_value),
    removedOn: row.removed_on,
    source: row.source,
    zoneId: row.zone_id,
  };
}
