import { assertSupabaseAuthConfig, type SupabaseAuthConfig } from './auth';
import {
  isItemCategoryId,
  isItemQuantityUnit,
  type ItemCategoryId,
  type ItemQuantityUnit,
} from './items';
import { ApiRequestError, type AuthenticatedUserContext } from './profile';

export const shoppingListSources = ['manual', 'recipe', 'suggested'] as const;

export type ShoppingListSource = (typeof shoppingListSources)[number];

export type ShoppingListItem = {
  readonly categoryId: ItemCategoryId | null;
  readonly checkedAt: string | null;
  readonly createdAt: string;
  readonly householdId: string;
  readonly id: string;
  readonly name: string;
  readonly qtyUnit: ItemQuantityUnit;
  readonly qtyValue: number;
  readonly recipeId: string | null;
  readonly source: ShoppingListSource;
  readonly updatedAt: string;
};

export type DatabaseShoppingListItemRow = {
  readonly category_id: ItemCategoryId | null;
  readonly checked_at: string | null;
  readonly created_at: string;
  readonly household_id: string;
  readonly id: string;
  readonly name: string;
  readonly qty_unit: ItemQuantityUnit;
  readonly qty_value: number | string;
  readonly recipe_id: string | null;
  readonly source: ShoppingListSource;
  readonly updated_at: string;
};

export type ShoppingListSuggestion = {
  readonly categoryId: ItemCategoryId | null;
  readonly lastSeenOn: string;
  readonly name: string;
  readonly qtyUnit: ItemQuantityUnit;
};

export type DatabaseShoppingListSuggestionRow = {
  readonly added_on: string;
  readonly category_id: ItemCategoryId | null;
  readonly name: string;
  readonly qty_unit: ItemQuantityUnit;
};

export type ListShoppingListItemsInput = {
  readonly householdId: string;
  readonly includeArchived?: boolean | undefined;
  readonly page?: number | undefined;
  readonly pageSize?: number | undefined;
};

export type ListShoppingListItemsResult = {
  readonly items: readonly ShoppingListItem[];
  readonly pagination: ShoppingListPagination;
};

export type ShoppingListPagination = {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number | null;
};

export type CreateShoppingListItemInput = {
  readonly categoryId?: ItemCategoryId | null | undefined;
  readonly householdId: string;
  readonly name: string;
  readonly qtyUnit?: ItemQuantityUnit | undefined;
  readonly qtyValue?: number | undefined;
  readonly recipeId?: string | null | undefined;
  readonly source?: ShoppingListSource | undefined;
};

export type CreateShoppingListItemsBatchInput = {
  readonly householdId: string;
  readonly items: readonly Omit<CreateShoppingListItemInput, 'householdId'>[];
};

export type UpdateShoppingListItemInput = {
  readonly categoryId?: ItemCategoryId | null | undefined;
  readonly checked?: boolean | undefined;
  readonly checkedAt?: string | null | undefined;
  readonly householdId: string;
  readonly id: string;
  readonly name?: string | undefined;
  readonly qtyUnit?: ItemQuantityUnit | undefined;
  readonly qtyValue?: number | undefined;
  readonly recipeId?: string | null | undefined;
  readonly source?: ShoppingListSource | undefined;
};

export type DeleteShoppingListItemInput = {
  readonly householdId: string;
  readonly id: string;
};

export type ListShoppingListSuggestionsInput = {
  readonly householdId: string;
  readonly limit?: number | undefined;
};

export type ShoppingListClientOptions = {
  readonly fetch?: typeof fetch | undefined;
};

type QueryValue = boolean | number | string;

type RequestResult<T> = {
  readonly rows: readonly T[];
  readonly total: number | null;
};

type ShoppingListMutationRow = {
  category_id?: ItemCategoryId | null;
  checked_at?: string | null;
  household_id?: string;
  name?: string;
  qty_unit?: ItemQuantityUnit;
  qty_value?: number;
  recipe_id?: string | null;
  source?: ShoppingListSource;
};

type PreparedShoppingListMutationRow = ShoppingListMutationRow & {
  readonly category_id: ItemCategoryId | null;
  readonly household_id: string;
  readonly name: string;
  readonly qty_unit: ItemQuantityUnit;
  readonly qty_value: number;
  readonly recipe_id: string | null;
  readonly source: ShoppingListSource;
};

const defaultPageSize = 50;
const defaultSuggestionLimit = 8;
const maxBatchItems = 50;
const shoppingListSelect =
  'id,household_id,name,qty_value,qty_unit,category_id,source,recipe_id,checked_at,created_at,updated_at';
const receiptSuggestionSelect = 'name,category_id,qty_unit,added_on';

export function isShoppingListSource(value: unknown): value is ShoppingListSource {
  return typeof value === 'string' && shoppingListSources.includes(value as ShoppingListSource);
}

export function mapShoppingListItemRow(row: DatabaseShoppingListItemRow): ShoppingListItem {
  return {
    categoryId: row.category_id,
    checkedAt: row.checked_at,
    createdAt: row.created_at,
    householdId: row.household_id,
    id: row.id,
    name: row.name,
    qtyUnit: row.qty_unit,
    qtyValue: Number(row.qty_value),
    recipeId: row.recipe_id,
    source: row.source,
    updatedAt: row.updated_at,
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
  return Math.min(parsePositiveInteger(value, defaultPageSize), 100);
}

function validateHouseholdId(householdId: string): string {
  const value = householdId.trim();

  if (!value) {
    throw new ApiRequestError('Household is required.', 400);
  }

  return value;
}

function validateShoppingListItemId(id: string): string {
  const value = id.trim();

  if (!value) {
    throw new ApiRequestError('Shopping list item id is required.', 400);
  }

  return value;
}

function validateName(name: string): string {
  const value = name.trim().replace(/\s+/g, ' ');

  if (!value) {
    throw new ApiRequestError('Shopping list item name is required.', 400);
  }

  if (value.length > 120) {
    throw new ApiRequestError('Shopping list item name must be 120 characters or less.', 400);
  }

  return value;
}

function validateQuantityValue(value: number | undefined): number {
  const quantity = value ?? 1;

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new ApiRequestError('Quantity value must be greater than zero.', 400);
  }

  return quantity;
}

function validateQuantityUnit(value: ItemQuantityUnit | undefined): ItemQuantityUnit {
  const unit = value ?? 'pcs';

  if (!isItemQuantityUnit(unit)) {
    throw new ApiRequestError('Quantity unit is invalid.', 400);
  }

  return unit;
}

function validateCategoryId(value: ItemCategoryId | null | undefined): ItemCategoryId | null {
  if (value == null) {
    return null;
  }

  if (!isItemCategoryId(value)) {
    throw new ApiRequestError('Item category is invalid.', 400);
  }

  return value;
}

function validateSource(value: ShoppingListSource | undefined): ShoppingListSource {
  const source = value ?? 'manual';

  if (!isShoppingListSource(source)) {
    throw new ApiRequestError('Shopping list source is invalid.', 400);
  }

  return source;
}

function validateRecipeId(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const recipeId = value.trim();

  if (!/^[a-z0-9-]{1,120}$/.test(recipeId)) {
    throw new ApiRequestError('Recipe id is invalid.', 400);
  }

  return recipeId;
}

function normaliseTimestamp(
  value: string | null | undefined,
  fieldName: string,
): string | null | undefined {
  if (value == null) {
    return value;
  }

  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    throw new ApiRequestError(`${fieldName} must be an ISO timestamp.`, 400);
  }

  return new Date(parsed).toISOString();
}

function archiveCutoffIso(): string {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

function normaliseSuggestionKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function recipeDedupeKey(
  item: Pick<PreparedShoppingListMutationRow, 'household_id' | 'name' | 'recipe_id' | 'source'>,
): string | null {
  if (item.source !== 'recipe' || !item.recipe_id) {
    return null;
  }

  return `${item.household_id}:${item.recipe_id}:${normaliseSuggestionKey(item.name)}`;
}

function mapReceiptSuggestions(
  rows: readonly DatabaseShoppingListSuggestionRow[],
  limit: number,
): readonly ShoppingListSuggestion[] {
  const seen = new Set<string>();
  const suggestions: ShoppingListSuggestion[] = [];

  for (const row of rows) {
    const name = validateName(row.name);
    const key = normaliseSuggestionKey(name);

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    suggestions.push({
      categoryId: row.category_id,
      lastSeenOn: row.added_on,
      name,
      qtyUnit: row.qty_unit,
    });

    if (suggestions.length >= limit) {
      break;
    }
  }

  return suggestions;
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

export class SackerlShoppingListClient {
  private readonly anonKey: string;
  private readonly fetch: typeof fetch;
  private readonly restUrl: string;

  constructor(config: SupabaseAuthConfig, options: ShoppingListClientOptions = {}) {
    const resolvedConfig = assertSupabaseAuthConfig(config);

    this.anonKey = resolvedConfig.anonKey;
    this.fetch = options.fetch ?? fetch;
    this.restUrl = `${normaliseBaseUrl(resolvedConfig.url)}/rest/v1`;
  }

  async listItems(
    context: AuthenticatedUserContext,
    input: ListShoppingListItemsInput,
  ): Promise<ListShoppingListItemsResult> {
    const householdId = validateHouseholdId(input.householdId);
    const page = parsePositiveInteger(input.page, 1);
    const pageSize = clampPageSize(input.pageSize);
    const offset = (page - 1) * pageSize;
    const result = await this.request<DatabaseShoppingListItemRow>(
      'shopping_list_items',
      context,
      {
        household_id: `eq.${householdId}`,
        order: 'checked_at.asc.nullsfirst,created_at.desc,id.asc',
        or: input.includeArchived
          ? undefined
          : `(checked_at.is.null,checked_at.gte.${archiveCutoffIso()})`,
        select: shoppingListSelect,
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
      items: result.rows.map(mapShoppingListItemRow),
      pagination: {
        page,
        pageSize,
        total: result.total,
      },
    };
  }

  async createItem(
    context: AuthenticatedUserContext,
    input: CreateShoppingListItemInput,
  ): Promise<ShoppingListItem> {
    const row = await this.createItemRows(context, [input]);
    const item = firstRow(row);

    if (!item) {
      throw new ApiRequestError('Unable to create shopping list item.', 500);
    }

    return item;
  }

  async createItemsBatch(
    context: AuthenticatedUserContext,
    input: CreateShoppingListItemsBatchInput,
  ): Promise<readonly ShoppingListItem[]> {
    const householdId = validateHouseholdId(input.householdId);

    if (input.items.length < 1) {
      throw new ApiRequestError('At least one shopping list item is required.', 400);
    }

    if (input.items.length > maxBatchItems) {
      throw new ApiRequestError(`A batch can contain at most ${maxBatchItems} items.`, 400);
    }

    return this.createItemRows(
      context,
      input.items.map((item) => ({ ...item, householdId })),
    );
  }

  async updateItem(
    context: AuthenticatedUserContext,
    input: UpdateShoppingListItemInput,
  ): Promise<ShoppingListItem> {
    const householdId = validateHouseholdId(input.householdId);
    const id = validateShoppingListItemId(input.id);
    const patch: ShoppingListMutationRow = {};

    if (input.name !== undefined) {
      patch.name = validateName(input.name);
    }

    if (input.qtyValue !== undefined) {
      patch.qty_value = validateQuantityValue(input.qtyValue);
    }

    if (input.qtyUnit !== undefined) {
      patch.qty_unit = validateQuantityUnit(input.qtyUnit);
    }

    if ('categoryId' in input) {
      patch.category_id = validateCategoryId(input.categoryId);
    }

    if (input.source !== undefined) {
      patch.source = validateSource(input.source);
    }

    if ('recipeId' in input) {
      patch.recipe_id = validateRecipeId(input.recipeId);
    }

    if (input.checked !== undefined) {
      patch.checked_at = input.checked
        ? (normaliseTimestamp(input.checkedAt, 'checkedAt') ?? new Date().toISOString())
        : null;
    } else if ('checkedAt' in input) {
      patch.checked_at = normaliseTimestamp(input.checkedAt, 'checkedAt') ?? null;
    }

    if (Object.keys(patch).length < 1) {
      throw new ApiRequestError('No shopping list changes were provided.', 400);
    }

    const rows = await this.requestRows<DatabaseShoppingListItemRow>(
      'shopping_list_items',
      context,
      {
        household_id: `eq.${householdId}`,
        id: `eq.${id}`,
        select: shoppingListSelect,
      },
      {
        body: patch,
        method: 'PATCH',
        prefer: 'return=representation',
      },
    );
    const row = firstRow(rows);

    if (!row) {
      throw new ApiRequestError('Shopping list item not found.', 404);
    }

    return mapShoppingListItemRow(row);
  }

  async deleteItem(
    context: AuthenticatedUserContext,
    input: DeleteShoppingListItemInput,
  ): Promise<ShoppingListItem> {
    const householdId = validateHouseholdId(input.householdId);
    const id = validateShoppingListItemId(input.id);
    const rows = await this.requestRows<DatabaseShoppingListItemRow>(
      'shopping_list_items',
      context,
      {
        household_id: `eq.${householdId}`,
        id: `eq.${id}`,
        select: shoppingListSelect,
      },
      {
        method: 'DELETE',
        prefer: 'return=representation',
      },
    );
    const row = firstRow(rows);

    if (!row) {
      throw new ApiRequestError('Shopping list item not found.', 404);
    }

    return mapShoppingListItemRow(row);
  }

  async listSuggestions(
    context: AuthenticatedUserContext,
    input: ListShoppingListSuggestionsInput,
  ): Promise<readonly ShoppingListSuggestion[]> {
    const householdId = validateHouseholdId(input.householdId);
    const limit = Math.min(parsePositiveInteger(input.limit, defaultSuggestionLimit), 20);
    const rows = await this.requestRows<DatabaseShoppingListSuggestionRow>('items', context, {
      household_id: `eq.${householdId}`,
      limit: Math.min(limit * 5, 100),
      order: 'added_on.desc,id.desc',
      select: receiptSuggestionSelect,
      source: 'eq.receipt',
    });

    return mapReceiptSuggestions(rows, limit);
  }

  private async createItemRows(
    context: AuthenticatedUserContext,
    inputItems: readonly CreateShoppingListItemInput[],
  ): Promise<readonly ShoppingListItem[]> {
    const rows: PreparedShoppingListMutationRow[] = inputItems.map((input) => ({
      category_id: validateCategoryId(input.categoryId),
      household_id: validateHouseholdId(input.householdId),
      name: validateName(input.name),
      qty_unit: validateQuantityUnit(input.qtyUnit),
      qty_value: validateQuantityValue(input.qtyValue),
      recipe_id: validateRecipeId(input.recipeId),
      source: validateSource(input.source),
    }));
    const { existingItems, rowsToCreate } = await this.filterExistingRecipeRows(context, rows);

    if (rowsToCreate.length < 1) {
      return existingItems;
    }

    const createdRows = await this.requestRows<DatabaseShoppingListItemRow>(
      'shopping_list_items',
      context,
      { select: shoppingListSelect },
      {
        body: rowsToCreate.length === 1 ? rowsToCreate[0] : rowsToCreate,
        method: 'POST',
        prefer: 'return=representation',
      },
    );

    return [...existingItems, ...createdRows.map(mapShoppingListItemRow)];
  }

  private async filterExistingRecipeRows(
    context: AuthenticatedUserContext,
    rows: readonly PreparedShoppingListMutationRow[],
  ): Promise<{
    readonly existingItems: readonly ShoppingListItem[];
    readonly rowsToCreate: readonly PreparedShoppingListMutationRow[];
  }> {
    const recipeRows = rows.filter((row) => recipeDedupeKey(row));

    if (recipeRows.length < 1) {
      return { existingItems: [], rowsToCreate: rows };
    }

    const householdIds = [...new Set(recipeRows.map((row) => row.household_id))];
    const existingItemsByKey = new Map<string, ShoppingListItem>();

    for (const householdId of householdIds) {
      const existingRows = await this.requestRows<DatabaseShoppingListItemRow>(
        'shopping_list_items',
        context,
        {
          household_id: `eq.${householdId}`,
          or: `(checked_at.is.null,checked_at.gte.${archiveCutoffIso()})`,
          select: shoppingListSelect,
          source: 'eq.recipe',
        },
      );

      for (const row of existingRows.map(mapShoppingListItemRow)) {
        const key = recipeDedupeKey({
          household_id: row.householdId,
          name: row.name,
          recipe_id: row.recipeId,
          source: row.source,
        });

        if (key && !existingItemsByKey.has(key)) {
          existingItemsByKey.set(key, row);
        }
      }
    }

    const existingItems: ShoppingListItem[] = [];
    const rowsToCreate: PreparedShoppingListMutationRow[] = [];
    const returnedExistingKeys = new Set<string>();
    const seenRecipeKeys = new Set(existingItemsByKey.keys());

    for (const row of rows) {
      const key = recipeDedupeKey(row);

      if (!key) {
        rowsToCreate.push(row);
        continue;
      }

      const existingItem = existingItemsByKey.get(key);

      if (existingItem) {
        if (!returnedExistingKeys.has(key)) {
          returnedExistingKeys.add(key);
          existingItems.push(existingItem);
        }

        continue;
      }

      if (!seenRecipeKeys.has(key)) {
        seenRecipeKeys.add(key);
        rowsToCreate.push(row);
      }
    }

    return { existingItems, rowsToCreate };
  }

  private async requestRows<T>(
    table: string,
    context: AuthenticatedUserContext,
    query: Record<string, QueryValue | undefined>,
    init: {
      readonly body?: object | readonly object[] | undefined;
      readonly method?: 'DELETE' | 'GET' | 'PATCH' | 'POST' | undefined;
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
      readonly method?: 'DELETE' | 'GET' | 'PATCH' | 'POST' | undefined;
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

export function createSackerlShoppingListClient(
  config: SupabaseAuthConfig,
  options?: ShoppingListClientOptions,
): SackerlShoppingListClient {
  return new SackerlShoppingListClient(config, options);
}
