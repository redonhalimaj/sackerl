import { assertSupabaseAuthConfig, type SupabaseAuthConfig } from './auth';
import { ApiRequestError, type AuthenticatedUserContext } from './profile';

export const itemQuantityUnits = ['g', 'kg', 'ml', 'l', 'pcs'] as const;

export type ItemQuantityUnit = (typeof itemQuantityUnits)[number];

export const itemSources = ['manual', 'receipt', 'imported'] as const;

export type ItemSource = (typeof itemSources)[number];

export const itemRemovalReasons = ['used', 'composted'] as const;

export type ItemRemovalReason = (typeof itemRemovalReasons)[number];

export const expiryFactSources = ['printed', 'user', 'estimated', 'model'] as const;

export type ExpiryFactSource = (typeof expiryFactSources)[number];

export const expiryFactOrigins = ['declared', 'inferred', 'backfill'] as const;

export type ExpiryFactOrigin = (typeof expiryFactOrigins)[number];

export const expiryPrintedMarkings = ['use_by', 'best_before', 'unknown'] as const;

export type ExpiryPrintedMarking = (typeof expiryPrintedMarkings)[number];

/**
 * Identity of the category-zone lookup behind `estimateExpiryDate`. Declaring it keeps an accepted
 * estimate distinguishable from a typed date for the life of the item.
 */
export const categoryZoneEstimatorVersion = 'category-zone-v1';

/**
 * Model-derived provenance is reserved in the schema but rejected by the database in Stage 1, so
 * no fabricated model evidence can be recorded before a provider exists.
 */
export const declarableExpiryFactSources = ['printed', 'user', 'estimated'] as const;

export type DeclarableExpiryFactSource = (typeof declarableExpiryFactSources)[number];

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

export const expiryEstimateZoneKeys = [
  'fridge',
  'freezer',
  'pantry',
  'basement',
  'cabinet',
] as const;

export type ExpiryEstimateZoneKey = (typeof expiryEstimateZoneKeys)[number];

export const expiryEstimateDaysByCategoryZone: Readonly<
  Record<ItemCategoryId, Readonly<Record<ExpiryEstimateZoneKey, number>>>
> = {
  bakery: {
    basement: 5,
    cabinet: 5,
    freezer: 90,
    fridge: 10,
    pantry: 5,
  },
  canned: {
    basement: 365,
    cabinet: 365,
    freezer: 180,
    fridge: 5,
    pantry: 365,
  },
  dairy: {
    basement: 1,
    cabinet: 1,
    freezer: 60,
    fridge: 7,
    pantry: 1,
  },
  drinks: {
    basement: 90,
    cabinet: 90,
    freezer: 1,
    fridge: 14,
    pantry: 90,
  },
  frozen: {
    basement: 1,
    cabinet: 1,
    freezer: 180,
    fridge: 2,
    pantry: 1,
  },
  meat: {
    basement: 1,
    cabinet: 1,
    freezer: 60,
    fridge: 3,
    pantry: 1,
  },
  pantry: {
    basement: 120,
    cabinet: 90,
    freezer: 180,
    fridge: 30,
    pantry: 90,
  },
  produce: {
    basement: 7,
    cabinet: 5,
    freezer: 180,
    fridge: 6,
    pantry: 5,
  },
  snacks: {
    basement: 60,
    cabinet: 60,
    freezer: 90,
    fridge: 30,
    pantry: 60,
  },
  spices: {
    basement: 365,
    cabinet: 365,
    freezer: 365,
    fridge: 365,
    pantry: 365,
  },
} as const;

export type EstimateExpiryDaysInput = {
  readonly categoryId: ItemCategoryId;
  readonly zoneKey?: string | null | undefined;
};

export type EstimateExpiryDateInput = EstimateExpiryDaysInput & {
  readonly baseDate?: string | undefined;
};

export type StorageZone = {
  readonly createdAt: string;
  readonly householdId: string;
  readonly id: string;
  readonly key: string;
  readonly label: string;
  readonly sortOrder: number;
};

/**
 * Provenance of the currently displayed expiry date. Every field is `null` when the item has no
 * recorded expiry fact. No combination of these values means the food is safe.
 */
export type ItemExpiryProvenance = {
  readonly confirmedAt: string | null;
  readonly factId: string | null;
  readonly origin: ExpiryFactOrigin | null;
  readonly printedMarking: ExpiryPrintedMarking | null;
  readonly source: ExpiryFactSource | null;
};

/** One immutable row of expiry history. */
export type ItemExpiryFact = {
  readonly confidence: number | null;
  readonly confirmedAt: string | null;
  readonly confirmedBy: string | null;
  readonly estimatorVersion: string | null;
  readonly expiresOn: string | null;
  readonly householdId: string;
  readonly id: string;
  readonly isActive: boolean;
  readonly itemId: string;
  readonly origin: ExpiryFactOrigin;
  readonly printedMarking: ExpiryPrintedMarking;
  readonly recordedAt: string;
  readonly recordedBy: string | null;
  readonly source: ExpiryFactSource;
  readonly supersededAt: string | null;
  readonly supersedesFactId: string | null;
};

/**
 * Provenance a caller states for the date it is writing. Omitting it records the weakest honest
 * provenance instead of claiming a source the write path does not actually know.
 */
export type ExpiryDeclarationInput = {
  readonly confidence?: number | null | undefined;
  readonly confirm?: boolean | undefined;
  readonly estimatorVersion?: string | null | undefined;
  readonly expectedFactId?: string | null | undefined;
  readonly printedMarking?: ExpiryPrintedMarking | undefined;
  readonly source: DeclarableExpiryFactSource;
};

export type StockItem = {
  readonly addedOn: string;
  readonly categoryId: ItemCategoryId;
  readonly expiresOn: string | null;
  readonly expiryProvenance: ItemExpiryProvenance;
  readonly householdId: string;
  readonly id: string;
  readonly name: string;
  readonly qtyUnit: ItemQuantityUnit;
  readonly qtyValue: number;
  readonly removalReason: ItemRemovalReason | null;
  readonly removedOn: string | null;
  readonly source: ItemSource;
  readonly zoneId: string;
};

export type DatabaseStorageZoneRow = {
  readonly created_at: string;
  readonly household_id: string;
  readonly id: string;
  readonly key: string;
  readonly label: string;
  readonly sort_order: number;
};

export type DatabaseStockItemRow = {
  readonly added_on: string;
  readonly category_id: ItemCategoryId;
  readonly expires_on: string | null;
  readonly expiry_confirmed_at?: string | null | undefined;
  readonly expiry_fact_id?: string | null | undefined;
  readonly expiry_origin?: ExpiryFactOrigin | null | undefined;
  readonly expiry_printed_marking?: ExpiryPrintedMarking | null | undefined;
  readonly expiry_source?: ExpiryFactSource | null | undefined;
  readonly household_id: string;
  readonly id: string;
  readonly name: string;
  readonly qty_unit: ItemQuantityUnit;
  readonly qty_value: number | string;
  readonly removal_reason: ItemRemovalReason | null;
  readonly removed_on: string | null;
  readonly source: ItemSource;
  readonly zone_id: string;
};

export type DatabaseItemExpiryFactRow = {
  readonly confidence: number | string | null;
  readonly confirmed_at: string | null;
  readonly confirmed_by: string | null;
  readonly estimator_version: string | null;
  readonly expires_on: string | null;
  readonly household_id: string;
  readonly id: string;
  readonly is_active: boolean;
  readonly item_id: string;
  readonly origin: ExpiryFactOrigin;
  readonly printed_marking: ExpiryPrintedMarking;
  readonly recorded_at: string;
  readonly recorded_by: string | null;
  readonly source: ExpiryFactSource;
  readonly superseded_at: string | null;
  readonly supersedes_fact_id: string | null;
};

export type ItemsClientOptions = {
  readonly fetch?: typeof fetch | undefined;
};

export type ItemPagination = {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number | null;
};

export type ListItemsInput = {
  readonly categoryId?: ItemCategoryId | undefined;
  readonly expiresWithinDays?: number | undefined;
  readonly householdId: string;
  readonly includeRemoved?: boolean | undefined;
  readonly page?: number | undefined;
  readonly pageSize?: number | undefined;
  readonly zone?: string | undefined;
  readonly zoneId?: string | undefined;
};

export type ListItemsResult = {
  readonly items: readonly StockItem[];
  readonly pagination: ItemPagination;
};

export type CreateStockItemInput = {
  readonly addedOn?: string | undefined;
  readonly categoryId: ItemCategoryId;
  readonly expiresOn?: string | null | undefined;
  readonly expiry?: ExpiryDeclarationInput | undefined;
  readonly householdId: string;
  readonly name: string;
  readonly qtyUnit: ItemQuantityUnit;
  readonly qtyValue: number;
  readonly source?: ItemSource | undefined;
  readonly zone?: string | undefined;
  readonly zoneId?: string | undefined;
};

export type CreateStockItemsBatchInput = {
  readonly householdId: string;
  readonly items: readonly Omit<CreateStockItemInput, 'householdId'>[];
};

export type UpdateStockItemInput = {
  readonly addedOn?: string | undefined;
  readonly categoryId?: ItemCategoryId | undefined;
  readonly expiresOn?: string | null | undefined;
  readonly expiry?: ExpiryDeclarationInput | undefined;
  readonly householdId: string;
  readonly id: string;
  readonly name?: string | undefined;
  readonly qtyUnit?: ItemQuantityUnit | undefined;
  readonly qtyValue?: number | undefined;
  readonly removalReason?: ItemRemovalReason | null | undefined;
  readonly removedOn?: string | null | undefined;
  readonly source?: ItemSource | undefined;
  readonly zone?: string | undefined;
  readonly zoneId?: string | undefined;
};

export type DeleteStockItemInput = {
  readonly householdId: string;
  readonly id: string;
  readonly removalReason?: ItemRemovalReason | undefined;
  readonly removedOn?: string | undefined;
};

export type ConfirmItemExpiryInput = {
  readonly expectedFactId?: string | null | undefined;
  readonly householdId: string;
  readonly id: string;
};

export type ClearItemExpiryInput = {
  readonly changes?:
    | Omit<UpdateStockItemInput, 'expiresOn' | 'expiry' | 'householdId' | 'id'>
    | undefined;
  readonly confirm?: boolean | undefined;
  readonly expectedFactId?: string | null | undefined;
  readonly householdId: string;
  readonly id: string;
};

export type ListItemExpiryHistoryInput = {
  readonly householdId: string;
  readonly itemId: string;
  readonly limit?: number | undefined;
};

export type GetItemRemovalStatsInput = {
  readonly householdId: string;
  readonly month?: string | undefined;
};

export type ItemRemovalStatsMonth = {
  readonly compostedCount: number;
  readonly month: string;
  readonly totalCount: number;
  readonly usedCount: number;
};

export type ItemRemovalStatsDelta = {
  readonly compostedCountPercent: number | null;
  readonly totalCountPercent: number | null;
  readonly usedCountPercent: number | null;
};

export type ItemRemovalStats = {
  readonly current: ItemRemovalStatsMonth;
  readonly delta: ItemRemovalStatsDelta;
  readonly householdId: string;
  readonly previous: ItemRemovalStatsMonth;
};

export type DatabaseItemRemovalStatsRow = {
  readonly removal_reason: ItemRemovalReason | null;
  readonly removed_on: string | null;
};

type QueryValue = boolean | number | string;

type RequestResult<T> = {
  readonly rows: readonly T[];
  readonly total: number | null;
};

type ExpiryDeclarationRow = {
  confidence?: number;
  confirm?: boolean;
  estimator_version?: string;
  expected_fact_id?: string | null;
  printed_marking?: ExpiryPrintedMarking;
  source: DeclarableExpiryFactSource;
};

type ItemMutationRow = {
  added_on?: string;
  category_id?: ItemCategoryId;
  expires_on?: string | null;
  expiry_declaration?: ExpiryDeclarationRow;
  household_id?: string;
  name?: string;
  qty_unit?: ItemQuantityUnit;
  qty_value?: number;
  removal_reason?: ItemRemovalReason | null;
  removed_on?: string | null;
  source?: ItemSource;
  zone_id?: string;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const monthPattern = /^\d{4}-\d{2}$/;
const itemSelect =
  'id,household_id,name,qty_value,qty_unit,category_id,zone_id,expires_on,added_on,removed_on,removal_reason,source,expiry_fact_id,expiry_source,expiry_origin,expiry_printed_marking,expiry_confirmed_at';
const expiryFactSelect =
  'id,household_id,item_id,expires_on,source,origin,printed_marking,confidence,estimator_version,confirmed_at,confirmed_by,supersedes_fact_id,superseded_at,is_active,recorded_by,recorded_at';
const removalStatsSelect = 'removed_on,removal_reason';
const zoneSelect = 'id,household_id,key,label,sort_order,created_at';

export function isItemQuantityUnit(value: unknown): value is ItemQuantityUnit {
  return typeof value === 'string' && itemQuantityUnits.includes(value as ItemQuantityUnit);
}

export function isItemSource(value: unknown): value is ItemSource {
  return typeof value === 'string' && itemSources.includes(value as ItemSource);
}

export function isItemRemovalReason(value: unknown): value is ItemRemovalReason {
  return typeof value === 'string' && itemRemovalReasons.includes(value as ItemRemovalReason);
}

export function isItemCategoryId(value: unknown): value is ItemCategoryId {
  return typeof value === 'string' && itemCategoryIds.includes(value as ItemCategoryId);
}

export function isExpiryFactSource(value: unknown): value is ExpiryFactSource {
  return typeof value === 'string' && expiryFactSources.includes(value as ExpiryFactSource);
}

export function isExpiryFactOrigin(value: unknown): value is ExpiryFactOrigin {
  return typeof value === 'string' && expiryFactOrigins.includes(value as ExpiryFactOrigin);
}

export function isExpiryPrintedMarking(value: unknown): value is ExpiryPrintedMarking {
  return typeof value === 'string' && expiryPrintedMarkings.includes(value as ExpiryPrintedMarking);
}

export function isDeclarableExpiryFactSource(value: unknown): value is DeclarableExpiryFactSource {
  return (
    typeof value === 'string' &&
    declarableExpiryFactSources.includes(value as DeclarableExpiryFactSource)
  );
}

/**
 * True when the displayed date came from a category-zone estimate that nobody has confirmed. This
 * is the state SCKRL-407 marks as uncertain and invites the user to correct.
 */
export function isUnconfirmedExpiryEstimate(provenance: ItemExpiryProvenance): boolean {
  return (
    provenance.origin === 'declared' &&
    provenance.source === 'estimated' &&
    provenance.confirmedAt === null
  );
}

export function mapStorageZoneRow(row: DatabaseStorageZoneRow): StorageZone {
  return {
    createdAt: row.created_at,
    householdId: row.household_id,
    id: row.id,
    key: row.key,
    label: row.label,
    sortOrder: row.sort_order,
  };
}

export function mapItemExpiryProvenance(row: DatabaseStockItemRow): ItemExpiryProvenance {
  const factId = row.expiry_fact_id ?? null;

  return {
    confirmedAt: factId ? (row.expiry_confirmed_at ?? null) : null,
    factId,
    origin: factId ? (row.expiry_origin ?? null) : null,
    printedMarking: factId ? (row.expiry_printed_marking ?? null) : null,
    source: factId ? (row.expiry_source ?? null) : null,
  };
}

export function mapItemExpiryFactRow(row: DatabaseItemExpiryFactRow): ItemExpiryFact {
  return {
    confidence: row.confidence == null ? null : Number(row.confidence),
    confirmedAt: row.confirmed_at,
    confirmedBy: row.confirmed_by,
    estimatorVersion: row.estimator_version,
    expiresOn: row.expires_on,
    householdId: row.household_id,
    id: row.id,
    isActive: row.is_active,
    itemId: row.item_id,
    origin: row.origin,
    printedMarking: row.printed_marking,
    recordedAt: row.recorded_at,
    recordedBy: row.recorded_by,
    source: row.source,
    supersededAt: row.superseded_at,
    supersedesFactId: row.supersedes_fact_id,
  };
}

export function mapStockItemRow(row: DatabaseStockItemRow): StockItem {
  return {
    addedOn: row.added_on,
    categoryId: row.category_id,
    expiresOn: row.expires_on,
    expiryProvenance: mapItemExpiryProvenance(row),
    householdId: row.household_id,
    id: row.id,
    name: row.name,
    qtyUnit: row.qty_unit,
    qtyValue: Number(row.qty_value),
    removalReason: row.removal_reason,
    removedOn: row.removed_on,
    source: row.source,
    zoneId: row.zone_id,
  };
}

function normaliseBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function encodeQuery(params: Record<string, QueryValue | undefined>): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      query.set(key, String(value));
    }
  }

  return query.toString();
}

function firstRow<T>(rows: readonly T[]): T | undefined {
  return rows[0];
}

function parsePositiveInteger(value: number | undefined, fallback: number): number {
  return Number.isInteger(value) && value && value > 0 ? value : fallback;
}

function clampPageSize(value: number | undefined): number {
  return Math.min(parsePositiveInteger(value, 25), 100);
}

function normaliseExpiresWithinDays(value: number | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Number.isInteger(value) || value < 0 || value > 3650) {
    throw new ApiRequestError('expiresWithinDays must be a non-negative integer.', 400);
  }

  return value;
}

function normaliseDate(
  value: string | null | undefined,
  fieldName: string,
): string | null | undefined {
  if (value == null) {
    return value;
  }

  if (!datePattern.test(value)) {
    throw new ApiRequestError(`${fieldName} must be an ISO date.`, 400);
  }

  return value;
}

function normaliseMonth(value: string | undefined): string {
  const month = value ?? todayIsoDate().slice(0, 7);

  if (!monthPattern.test(month)) {
    throw new ApiRequestError('month must use YYYY-MM format.', 400);
  }

  return month;
}

function addMonths(month: string, months: number): string {
  const [year, monthIndex] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (monthIndex ?? 1) - 1 + months, 1));

  return date.toISOString().slice(0, 7);
}

function normaliseRemovalReason(
  value: ItemRemovalReason | null | undefined,
): ItemRemovalReason | null | undefined {
  if (value == null) {
    return value;
  }

  if (!isItemRemovalReason(value)) {
    throw new ApiRequestError('Item removal reason is invalid.', 400);
  }

  return value;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIsoDate(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function addDaysToIsoDate(baseDate: string, days: number): string {
  const [year, month, day] = baseDate.split('-').map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function isExpiryEstimateZoneKey(value: string): value is ExpiryEstimateZoneKey {
  return expiryEstimateZoneKeys.includes(value as ExpiryEstimateZoneKey);
}

export function estimateExpiryDays(input: EstimateExpiryDaysInput): number {
  const categoryId = validateCategoryId(input.categoryId);
  const zoneKey = input.zoneKey ? normaliseZoneKey(input.zoneKey) : 'pantry';
  const rules = expiryEstimateDaysByCategoryZone[categoryId];

  return isExpiryEstimateZoneKey(zoneKey) ? rules[zoneKey] : rules.pantry;
}

export function estimateExpiryDate(input: EstimateExpiryDateInput): string {
  const baseDate = normaliseDate(input.baseDate ?? todayIsoDate(), 'baseDate');

  if (!baseDate) {
    throw new ApiRequestError('baseDate is required.', 400);
  }

  return addDaysToIsoDate(baseDate, estimateExpiryDays(input));
}

function normaliseZoneKey(zone: string): string {
  const value = zone.trim().toLowerCase();

  if (!/^[a-z][a-z0-9-]{1,31}$/.test(value)) {
    throw new ApiRequestError('Storage zone is invalid.', 400);
  }

  return value;
}

function validateHouseholdId(householdId: string): string {
  const value = householdId.trim();

  if (!value) {
    throw new ApiRequestError('Household is required.', 400);
  }

  return value;
}

function validateItemId(id: string): string {
  const value = id.trim();

  if (!value) {
    throw new ApiRequestError('Item id is required.', 400);
  }

  return value;
}

function validateName(name: string): string {
  const value = name.trim();

  if (!value) {
    throw new ApiRequestError('Item name is required.', 400);
  }

  if (value.length > 120) {
    throw new ApiRequestError('Item name must be 120 characters or less.', 400);
  }

  return value;
}

function validateQuantityValue(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ApiRequestError('Quantity value must be greater than zero.', 400);
  }

  return value;
}

function validateCategoryId(value: ItemCategoryId): ItemCategoryId {
  if (!isItemCategoryId(value)) {
    throw new ApiRequestError('Item category is invalid.', 400);
  }

  return value;
}

function validateQuantityUnit(value: ItemQuantityUnit): ItemQuantityUnit {
  if (!isItemQuantityUnit(value)) {
    throw new ApiRequestError('Quantity unit is invalid.', 400);
  }

  return value;
}

function validateExpiryFactId(value: string, fieldName: string): string {
  const id = value.trim();

  if (!uuidPattern.test(id)) {
    throw new ApiRequestError(`${fieldName} must be a uuid.`, 400);
  }

  return id;
}

/**
 * Turns a declaration into the write-only command value the database trigger consumes. Everything
 * the database owns - actor, timestamps, origin, supersede chain - is deliberately absent here.
 */
function buildExpiryDeclarationRow(
  declaration: ExpiryDeclarationInput,
  /** `undefined` means the write leaves the existing date in place; the server checks the rest. */
  expiresOn: string | null | undefined,
): ExpiryDeclarationRow {
  if (!isDeclarableExpiryFactSource(declaration.source)) {
    throw new ApiRequestError(
      isExpiryFactSource(declaration.source)
        ? 'Model-derived expiry provenance is not enabled.'
        : 'Expiry source is invalid.',
      400,
    );
  }

  const row: ExpiryDeclarationRow = { source: declaration.source };

  if (expiresOn === null && declaration.source !== 'user') {
    throw new ApiRequestError(
      declaration.source === 'printed'
        ? 'A printed expiry source requires a date.'
        : 'Clearing an expiry date requires the user source.',
      400,
    );
  }

  if (declaration.printedMarking !== undefined) {
    if (!isExpiryPrintedMarking(declaration.printedMarking)) {
      throw new ApiRequestError('Printed marking is invalid.', 400);
    }

    if (declaration.printedMarking !== 'unknown' && declaration.source === 'estimated') {
      throw new ApiRequestError('A printed marking requires a printed or user-entered date.', 400);
    }

    row.printed_marking = declaration.printedMarking;
  }

  if (declaration.confidence != null) {
    if (
      !Number.isFinite(declaration.confidence) ||
      declaration.confidence < 0 ||
      declaration.confidence > 1
    ) {
      throw new ApiRequestError('Expiry confidence must be between 0 and 1.', 400);
    }

    if (declaration.source !== 'estimated') {
      throw new ApiRequestError('Confidence is only valid for an estimated expiry date.', 400);
    }

    row.confidence = declaration.confidence;
  }

  if (declaration.estimatorVersion != null) {
    const estimatorVersion = declaration.estimatorVersion.trim();

    if (!estimatorVersion || estimatorVersion.length > 80) {
      throw new ApiRequestError('Estimator version must be 1 to 80 characters.', 400);
    }

    if (declaration.source !== 'estimated') {
      throw new ApiRequestError(
        'An estimator version is only valid for an estimated expiry date.',
        400,
      );
    }

    row.estimator_version = estimatorVersion;
  }

  if (declaration.confirm !== undefined) {
    if (typeof declaration.confirm !== 'boolean') {
      throw new ApiRequestError('Expiry confirmation must be a boolean.', 400);
    }

    row.confirm = declaration.confirm;
  }

  if (declaration.expectedFactId != null) {
    row.expected_fact_id = validateExpiryFactId(declaration.expectedFactId, 'expectedFactId');
  } else if (declaration.expectedFactId === null) {
    row.expected_fact_id = null;
  }

  return row;
}

function validateSource(value: ItemSource | undefined): ItemSource {
  const source = value ?? 'manual';

  if (!isItemSource(source)) {
    throw new ApiRequestError('Item source is invalid.', 400);
  }

  return source;
}

function createEmptyRemovalStatsMonth(month: string): ItemRemovalStatsMonth {
  return {
    compostedCount: 0,
    month,
    totalCount: 0,
    usedCount: 0,
  };
}

function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return Math.round(((current - previous) / previous) * 100);
}

function addRemovalToStats(
  stats: ItemRemovalStatsMonth,
  reason: ItemRemovalReason,
): ItemRemovalStatsMonth {
  return {
    compostedCount: stats.compostedCount + (reason === 'composted' ? 1 : 0),
    month: stats.month,
    totalCount: stats.totalCount + 1,
    usedCount: stats.usedCount + (reason === 'used' ? 1 : 0),
  };
}

function aggregateRemovalStats(
  rows: readonly DatabaseItemRemovalStatsRow[],
  currentMonth: string,
  previousMonth: string,
): Pick<ItemRemovalStats, 'current' | 'delta' | 'previous'> {
  let current = createEmptyRemovalStatsMonth(currentMonth);
  let previous = createEmptyRemovalStatsMonth(previousMonth);

  for (const row of rows) {
    if (!row.removed_on || !row.removal_reason) {
      continue;
    }

    const removedMonth = row.removed_on.slice(0, 7);

    if (removedMonth === currentMonth) {
      current = addRemovalToStats(current, row.removal_reason);
    } else if (removedMonth === previousMonth) {
      previous = addRemovalToStats(previous, row.removal_reason);
    }
  }

  return {
    current,
    delta: {
      compostedCountPercent: percentDelta(current.compostedCount, previous.compostedCount),
      totalCountPercent: percentDelta(current.totalCount, previous.totalCount),
      usedCountPercent: percentDelta(current.usedCount, previous.usedCount),
    },
    previous,
  };
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { readonly message?: string | undefined };

    return data.message ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

function parseTotalFromContentRange(value: string | null): number | null {
  const total = value?.match(/\/(\d+|\*)$/)?.[1];

  return total && total !== '*' ? Number(total) : null;
}

export class SackerlItemsClient {
  private readonly anonKey: string;
  private readonly fetch: typeof fetch;
  private readonly restUrl: string;

  constructor(config: SupabaseAuthConfig, options: ItemsClientOptions = {}) {
    const resolvedConfig = assertSupabaseAuthConfig(config);

    this.anonKey = resolvedConfig.anonKey;
    this.fetch = options.fetch ?? fetch;
    this.restUrl = `${normaliseBaseUrl(resolvedConfig.url)}/rest/v1`;
  }

  async listZones(
    context: AuthenticatedUserContext,
    householdId: string,
  ): Promise<readonly StorageZone[]> {
    const rows = await this.requestRows<DatabaseStorageZoneRow>('zones', context, {
      household_id: `eq.${validateHouseholdId(householdId)}`,
      order: 'sort_order.asc,key.asc',
      select: zoneSelect,
    });

    return rows.map(mapStorageZoneRow);
  }

  async listItems(
    context: AuthenticatedUserContext,
    input: ListItemsInput,
  ): Promise<ListItemsResult> {
    const householdId = validateHouseholdId(input.householdId);
    const page = parsePositiveInteger(input.page, 1);
    const pageSize = clampPageSize(input.pageSize);
    const offset = (page - 1) * pageSize;
    const zoneId = await this.resolveFilterZoneId(context, householdId, input);

    if (zoneId === null) {
      return {
        items: [],
        pagination: { page, pageSize, total: 0 },
      };
    }

    if (input.categoryId) {
      validateCategoryId(input.categoryId);
    }

    const expiresWithinDays = normaliseExpiresWithinDays(input.expiresWithinDays);

    const result = await this.request<DatabaseStockItemRow>(
      'items',
      context,
      {
        category_id: input.categoryId ? `eq.${input.categoryId}` : undefined,
        expires_on:
          expiresWithinDays === undefined ? undefined : `lte.${addDaysIsoDate(expiresWithinDays)}`,
        household_id: `eq.${householdId}`,
        order: 'expires_on.asc.nullslast,added_on.desc,id.asc',
        removed_on: input.includeRemoved ? undefined : 'is.null',
        select: itemSelect,
        zone_id: zoneId ? `eq.${zoneId}` : undefined,
      },
      {
        count: true,
        range: {
          from: offset,
          to: offset + pageSize - 1,
        },
      },
    );

    return {
      items: result.rows.map(mapStockItemRow),
      pagination: {
        page,
        pageSize,
        total: result.total,
      },
    };
  }

  async createItem(
    context: AuthenticatedUserContext,
    input: CreateStockItemInput,
  ): Promise<StockItem> {
    const row = await this.createItemRows(context, [input]);
    const item = firstRow(row);

    if (!item) {
      throw new ApiRequestError('Unable to create item.', 500);
    }

    return item;
  }

  async createItemsBatch(
    context: AuthenticatedUserContext,
    input: CreateStockItemsBatchInput,
  ): Promise<readonly StockItem[]> {
    const householdId = validateHouseholdId(input.householdId);

    if (input.items.length < 1) {
      throw new ApiRequestError('At least one item is required.', 400);
    }

    if (input.items.length > 100) {
      throw new ApiRequestError('A batch can contain at most 100 items.', 400);
    }

    return this.createItemRows(
      context,
      input.items.map((item) => ({ ...item, householdId })),
    );
  }

  async updateItem(
    context: AuthenticatedUserContext,
    input: UpdateStockItemInput,
  ): Promise<StockItem> {
    const householdId = validateHouseholdId(input.householdId);
    const id = validateItemId(input.id);
    const patch: ItemMutationRow = {};

    if (input.name !== undefined) {
      patch.name = validateName(input.name);
    }

    if (input.qtyValue !== undefined) {
      patch.qty_value = validateQuantityValue(input.qtyValue);
    }

    if (input.qtyUnit !== undefined) {
      patch.qty_unit = validateQuantityUnit(input.qtyUnit);
    }

    if (input.categoryId !== undefined) {
      patch.category_id = validateCategoryId(input.categoryId);
    }

    if (input.zoneId !== undefined || input.zone !== undefined) {
      patch.zone_id = await this.resolveMutationZoneId(context, householdId, input);
    }

    if ('expiresOn' in input) {
      patch.expires_on = normaliseDate(input.expiresOn, 'expiresOn') ?? null;
    }

    if (input.addedOn !== undefined) {
      const addedOn = normaliseDate(input.addedOn, 'addedOn');

      if (addedOn) {
        patch.added_on = addedOn;
      }
    }

    if ('removedOn' in input) {
      const removedOn = normaliseDate(input.removedOn, 'removedOn');

      patch.removed_on = removedOn ?? null;

      if (!removedOn && !('removalReason' in input)) {
        patch.removal_reason = null;
      }
    }

    if ('removalReason' in input) {
      patch.removal_reason = normaliseRemovalReason(input.removalReason) ?? null;
    }

    if (input.source !== undefined) {
      patch.source = validateSource(input.source);
    }

    if (input.expiry !== undefined) {
      // A declaration with no date change re-records the provenance of the date already shown,
      // which is how a confirmation or a printed marking is saved without moving the date.
      patch.expiry_declaration = buildExpiryDeclarationRow(
        input.expiry,
        'expiresOn' in input ? (patch.expires_on ?? null) : undefined,
      );
    }

    if (Object.keys(patch).length < 1) {
      throw new ApiRequestError('No item changes were provided.', 400);
    }

    const rows = await this.requestRows<DatabaseStockItemRow>(
      'items',
      context,
      {
        household_id: `eq.${householdId}`,
        id: `eq.${id}`,
        select: itemSelect,
      },
      {
        body: patch,
        method: 'PATCH',
        prefer: 'return=representation',
      },
    );

    const row = firstRow(rows);

    if (!row) {
      throw new ApiRequestError('Item not found.', 404);
    }

    return mapStockItemRow(row);
  }

  async deleteItem(
    context: AuthenticatedUserContext,
    input: DeleteStockItemInput,
  ): Promise<StockItem> {
    return this.updateItem(context, {
      householdId: input.householdId,
      id: input.id,
      removalReason: input.removalReason,
      removedOn: input.removedOn ?? todayIsoDate(),
    });
  }

  /**
   * Records that the user confirmed the date currently shown, without moving it. Declared facts keep
   * their source, while inferred and backfilled dates become a user assertion of the shown date.
   */
  async confirmItemExpiry(
    context: AuthenticatedUserContext,
    input: ConfirmItemExpiryInput,
  ): Promise<StockItem> {
    const suppliedExpectedFactId =
      input.expectedFactId === undefined
        ? undefined
        : input.expectedFactId === null
          ? null
          : validateExpiryFactId(input.expectedFactId, 'expectedFactId');
    const active = await this.getActiveItemExpiryFact(context, input.householdId, input.id);

    if (suppliedExpectedFactId !== undefined && suppliedExpectedFactId !== (active?.id ?? null)) {
      throw new ApiRequestError('The expiry date changed. Reload the item before saving.', 409);
    }

    if (!active) {
      throw new ApiRequestError('This item has no recorded expiry date to confirm.', 400);
    }

    if (active.expiresOn === null) {
      throw new ApiRequestError('This item has no expiry date to confirm.', 400);
    }

    if (!isDeclarableExpiryFactSource(active.source)) {
      throw new ApiRequestError('This expiry source cannot be confirmed.', 400);
    }

    const expectedFactId = suppliedExpectedFactId ?? active.id;

    const declaredExpiry =
      active.origin === 'declared'
        ? {
            printedMarking: active.printedMarking,
            source: active.source,
            ...(active.confidence != null ? { confidence: active.confidence } : {}),
            ...(active.estimatorVersion ? { estimatorVersion: active.estimatorVersion } : {}),
          }
        : {
            printedMarking: 'unknown' as const,
            source: 'user' as const,
          };

    return this.updateItem(context, {
      householdId: input.householdId,
      id: input.id,
      expiry: {
        ...declaredExpiry,
        confirm: true,
        expectedFactId,
      },
    });
  }

  /** Records that the user says this item has no expiry date. */
  async clearItemExpiry(
    context: AuthenticatedUserContext,
    input: ClearItemExpiryInput,
  ): Promise<StockItem> {
    const expiry: ExpiryDeclarationInput = {
      confirm: input.confirm ?? true,
      source: 'user',
      ...(input.expectedFactId !== undefined ? { expectedFactId: input.expectedFactId } : {}),
    };

    return this.updateItem(context, {
      ...input.changes,
      householdId: input.householdId,
      id: input.id,
      expiresOn: null,
      expiry,
    });
  }

  /** Newest-first expiry history for one item. Read-only; the database owns every value here. */
  async listItemExpiryHistory(
    context: AuthenticatedUserContext,
    input: ListItemExpiryHistoryInput,
  ): Promise<readonly ItemExpiryFact[]> {
    const rows = await this.requestRows<DatabaseItemExpiryFactRow>('item_expiry_facts', context, {
      household_id: `eq.${validateHouseholdId(input.householdId)}`,
      item_id: `eq.${validateItemId(input.itemId)}`,
      limit: clampPageSize(input.limit),
      order: 'fact_sequence.desc',
      select: expiryFactSelect,
    });

    return rows.map(mapItemExpiryFactRow);
  }

  async getActiveItemExpiryFact(
    context: AuthenticatedUserContext,
    householdId: string,
    itemId: string,
  ): Promise<ItemExpiryFact | null> {
    const rows = await this.requestRows<DatabaseItemExpiryFactRow>('item_expiry_facts', context, {
      household_id: `eq.${validateHouseholdId(householdId)}`,
      is_active: 'is.true',
      item_id: `eq.${validateItemId(itemId)}`,
      limit: 1,
      select: expiryFactSelect,
    });
    const row = firstRow(rows);

    return row ? mapItemExpiryFactRow(row) : null;
  }

  async getRemovalStats(
    context: AuthenticatedUserContext,
    input: GetItemRemovalStatsInput,
  ): Promise<ItemRemovalStats> {
    const householdId = validateHouseholdId(input.householdId);
    const currentMonth = normaliseMonth(input.month);
    const previousMonth = addMonths(currentMonth, -1);
    const nextMonth = addMonths(currentMonth, 1);
    const rows = await this.requestRows<DatabaseItemRemovalStatsRow>('items', context, {
      and: `(removed_on.gte.${previousMonth}-01,removed_on.lt.${nextMonth}-01)`,
      household_id: `eq.${householdId}`,
      removal_reason: 'in.(used,composted)',
      select: removalStatsSelect,
    });

    return {
      householdId,
      ...aggregateRemovalStats(rows, currentMonth, previousMonth),
    };
  }

  private async createItemRows(
    context: AuthenticatedUserContext,
    inputItems: readonly CreateStockItemInput[],
  ): Promise<readonly StockItem[]> {
    const rows: ItemMutationRow[] = [];

    for (const input of inputItems) {
      const householdId = validateHouseholdId(input.householdId);
      const row: ItemMutationRow = {
        category_id: validateCategoryId(input.categoryId),
        household_id: householdId,
        name: validateName(input.name),
        qty_unit: validateQuantityUnit(input.qtyUnit),
        qty_value: validateQuantityValue(input.qtyValue),
        source: validateSource(input.source),
        zone_id: await this.resolveMutationZoneId(context, householdId, input),
      };
      const addedOn = normaliseDate(input.addedOn, 'addedOn');

      if (addedOn) {
        row.added_on = addedOn;
      }

      if ('expiresOn' in input) {
        row.expires_on = normaliseDate(input.expiresOn, 'expiresOn') ?? null;
      }

      if (input.expiry !== undefined) {
        row.expiry_declaration = buildExpiryDeclarationRow(input.expiry, row.expires_on ?? null);
      }

      rows.push(row);
    }

    const createdRows = await this.requestRows<DatabaseStockItemRow>(
      'items',
      context,
      { select: itemSelect },
      {
        body: rows.length === 1 ? rows[0] : rows,
        method: 'POST',
        prefer: 'return=representation',
      },
    );

    return createdRows.map(mapStockItemRow);
  }

  private async resolveFilterZoneId(
    context: AuthenticatedUserContext,
    householdId: string,
    input: Pick<ListItemsInput, 'zone' | 'zoneId'>,
  ): Promise<string | null | undefined> {
    if (input.zoneId) {
      return input.zoneId;
    }

    if (!input.zone) {
      return undefined;
    }

    const zone = await this.getZoneByKey(context, householdId, input.zone);

    return zone?.id ?? null;
  }

  private async resolveMutationZoneId(
    context: AuthenticatedUserContext,
    householdId: string,
    input: Pick<CreateStockItemInput | UpdateStockItemInput, 'zone' | 'zoneId'>,
  ): Promise<string> {
    if (input.zoneId) {
      return input.zoneId.trim();
    }

    if (!input.zone) {
      throw new ApiRequestError('Storage zone is required.', 400);
    }

    const zone = await this.getZoneByKey(context, householdId, input.zone);

    if (!zone) {
      throw new ApiRequestError('Storage zone not found.', 400);
    }

    return zone.id;
  }

  private async getZoneByKey(
    context: AuthenticatedUserContext,
    householdId: string,
    zone: string,
  ): Promise<StorageZone | null> {
    const rows = await this.requestRows<DatabaseStorageZoneRow>('zones', context, {
      household_id: `eq.${householdId}`,
      key: `eq.${normaliseZoneKey(zone)}`,
      limit: 1,
      select: zoneSelect,
    });

    const row = firstRow(rows);

    return row ? mapStorageZoneRow(row) : null;
  }

  private async requestRows<T>(
    table: string,
    context: AuthenticatedUserContext,
    query: Record<string, QueryValue | undefined>,
    init: {
      readonly body?: object | readonly object[] | undefined;
      readonly method?: 'GET' | 'PATCH' | 'POST' | undefined;
      readonly prefer?: string | undefined;
    } = {},
  ): Promise<readonly T[]> {
    const result = await this.request<T>(table, context, query, init);

    return result.rows;
  }

  private async request<T>(
    table: string,
    context: AuthenticatedUserContext,
    query: Record<string, QueryValue | undefined>,
    init: {
      readonly body?: object | readonly object[] | undefined;
      readonly count?: boolean | undefined;
      readonly method?: 'GET' | 'PATCH' | 'POST' | undefined;
      readonly prefer?: string | undefined;
      readonly range?: { readonly from: number; readonly to: number } | undefined;
    } = {},
  ): Promise<RequestResult<T>> {
    if (!context.accessToken) {
      throw new ApiRequestError('Missing auth access token.', 401);
    }

    const queryString = encodeQuery(query);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      apikey: this.anonKey,
      Authorization: `Bearer ${context.accessToken}`,
    };
    const preferences = [init.prefer, init.count ? 'count=exact' : undefined].filter(Boolean);

    if (init.body) {
      headers['Content-Type'] = 'application/json';
    }

    if (preferences.length > 0) {
      headers.Prefer = preferences.join(',');
    }

    if (init.range) {
      headers.Range = `${init.range.from}-${init.range.to}`;
    }

    const requestInit: RequestInit = {
      headers,
      method: init.method ?? 'GET',
    };

    if (init.body) {
      requestInit.body = JSON.stringify(init.body);
    }

    const response = await this.fetch(`${this.restUrl}/${table}?${queryString}`, requestInit);

    if (!response.ok) {
      const message = await readErrorMessage(response);

      throw new ApiRequestError(message, response.status);
    }

    if (response.status === 204) {
      return { rows: [], total: parseTotalFromContentRange(response.headers.get('content-range')) };
    }

    return {
      rows: (await response.json()) as readonly T[],
      total: parseTotalFromContentRange(response.headers.get('content-range')),
    };
  }
}

export function createSackerlItemsClient(
  config: SupabaseAuthConfig,
  options?: ItemsClientOptions,
): SackerlItemsClient {
  return new SackerlItemsClient(config, options);
}
