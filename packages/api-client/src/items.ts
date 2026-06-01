import { assertSupabaseAuthConfig, type SupabaseAuthConfig } from './auth';
import { ApiRequestError, type AuthenticatedUserContext } from './profile';

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
  readonly household_id: string;
  readonly id: string;
  readonly name: string;
  readonly qty_unit: ItemQuantityUnit;
  readonly qty_value: number | string;
  readonly removed_on: string | null;
  readonly source: ItemSource;
  readonly zone_id: string;
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
  readonly householdId: string;
  readonly id: string;
  readonly name?: string | undefined;
  readonly qtyUnit?: ItemQuantityUnit | undefined;
  readonly qtyValue?: number | undefined;
  readonly removedOn?: string | null | undefined;
  readonly source?: ItemSource | undefined;
  readonly zone?: string | undefined;
  readonly zoneId?: string | undefined;
};

export type DeleteStockItemInput = {
  readonly householdId: string;
  readonly id: string;
  readonly removedOn?: string | undefined;
};

type QueryValue = boolean | number | string;

type RequestResult<T> = {
  readonly rows: readonly T[];
  readonly total: number | null;
};

type ItemMutationRow = {
  added_on?: string;
  category_id?: ItemCategoryId;
  expires_on?: string | null;
  household_id?: string;
  name?: string;
  qty_unit?: ItemQuantityUnit;
  qty_value?: number;
  removed_on?: string | null;
  source?: ItemSource;
  zone_id?: string;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const itemSelect =
  'id,household_id,name,qty_value,qty_unit,category_id,zone_id,expires_on,added_on,removed_on,source';
const zoneSelect = 'id,household_id,key,label,sort_order,created_at';

export function isItemQuantityUnit(value: unknown): value is ItemQuantityUnit {
  return typeof value === 'string' && itemQuantityUnits.includes(value as ItemQuantityUnit);
}

export function isItemSource(value: unknown): value is ItemSource {
  return typeof value === 'string' && itemSources.includes(value as ItemSource);
}

export function isItemCategoryId(value: unknown): value is ItemCategoryId {
  return typeof value === 'string' && itemCategoryIds.includes(value as ItemCategoryId);
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

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIsoDate(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
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

function validateSource(value: ItemSource | undefined): ItemSource {
  const source = value ?? 'manual';

  if (!isItemSource(source)) {
    throw new ApiRequestError('Item source is invalid.', 400);
  }

  return source;
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
      patch.removed_on = normaliseDate(input.removedOn, 'removedOn') ?? null;
    }

    if (input.source !== undefined) {
      patch.source = validateSource(input.source);
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
      removedOn: input.removedOn ?? todayIsoDate(),
    });
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
