import { assertSupabaseAuthConfig, type SupabaseAuthConfig } from './auth';
import {
  isItemCategoryId,
  isItemQuantityUnit,
  type ItemCategoryId,
  type ItemQuantityUnit,
} from './items';
import { ApiRequestError, type AuthenticatedUserContext } from './profile';
import {
  confidenceLevelForScore,
  isReceiptItemConfidenceLevel,
  type ParsedReceiptLineItem,
  type ReceiptItemConfidenceLevel,
} from './receipt-parsing';

export const receiptStatuses = ['uploaded', 'parsing', 'parsed', 'failed'] as const;

export type ReceiptStatus = (typeof receiptStatuses)[number];

export type Receipt = {
  readonly capturedAt: string;
  readonly createdAt: string;
  readonly currency: string;
  readonly householdId: string;
  readonly id: string;
  readonly imageUrl: string;
  readonly parsedAt: string | null;
  readonly purchasedOn: string | null;
  readonly status: ReceiptStatus;
  readonly storeName: string | null;
  readonly totalCents: number | null;
  readonly updatedAt: string;
};

export type DatabaseReceiptRow = {
  readonly captured_at: string;
  readonly created_at: string;
  readonly currency: string;
  readonly household_id: string;
  readonly id: string;
  readonly image_url: string;
  readonly parsed_at: string | null;
  readonly purchased_on: string | null;
  readonly status: ReceiptStatus;
  readonly store_name: string | null;
  readonly total_cents: number | null;
  readonly updated_at: string;
};

export type ReceiptItem = {
  readonly categoryId: ItemCategoryId;
  readonly confidence: number;
  readonly confidenceLevel: ReceiptItemConfidenceLevel;
  readonly createdAt: string;
  readonly householdId: string;
  readonly id: string;
  readonly inferredName: string;
  readonly lineIndex: number;
  readonly qtyUnit: ItemQuantityUnit;
  readonly qtyValue: number;
  readonly rawText: string;
  readonly receiptId: string;
  readonly updatedAt: string;
};

export type DatabaseReceiptItemRow = {
  readonly category_id: ItemCategoryId;
  readonly confidence: number | string;
  readonly confidence_level: ReceiptItemConfidenceLevel;
  readonly created_at: string;
  readonly household_id: string;
  readonly id: string;
  readonly inferred_name: string;
  readonly line_index: number;
  readonly qty_unit: ItemQuantityUnit;
  readonly qty_value: number | string;
  readonly raw_text: string;
  readonly receipt_id: string;
  readonly updated_at: string;
};

export type CreateReceiptInput = {
  readonly capturedAt?: string | undefined;
  readonly currency?: string | undefined;
  readonly householdId: string;
  readonly imageUrl: string;
  readonly status?: ReceiptStatus | undefined;
  readonly storeName?: string | null | undefined;
  readonly totalCents?: number | null | undefined;
};

export type ListReceiptsInput = {
  readonly householdId: string;
  readonly page?: number | undefined;
  readonly pageSize?: number | undefined;
  readonly status?: ReceiptStatus | undefined;
};

export type ListReceiptsResult = {
  readonly pagination: ReceiptPagination;
  readonly receipts: readonly Receipt[];
};

export type GetReceiptInput = {
  readonly householdId: string;
  readonly id: string;
};

export type UpdateReceiptInput = {
  readonly capturedAt?: string | undefined;
  readonly currency?: string | undefined;
  readonly householdId: string;
  readonly id: string;
  readonly parsedAt?: string | null | undefined;
  readonly purchasedOn?: string | null | undefined;
  readonly status?: ReceiptStatus | undefined;
  readonly storeName?: string | null | undefined;
  readonly totalCents?: number | null | undefined;
};

export type ListReceiptItemsInput = {
  readonly householdId: string;
  readonly receiptId: string;
};

export type ReplaceReceiptItemsInput = {
  readonly householdId: string;
  readonly items: readonly ParsedReceiptLineItem[];
  readonly receiptId: string;
};

export type ReceiptPagination = {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number | null;
};

export type ReceiptsClientOptions = {
  readonly fetch?: typeof fetch | undefined;
};

type QueryValue = boolean | number | string;

type RequestResult<T> = {
  readonly rows: readonly T[];
  readonly total: number | null;
};

type ReceiptMutationRow = {
  captured_at?: string;
  currency?: string;
  household_id: string;
  image_url: string;
  parsed_at?: string | null;
  purchased_on?: string | null;
  status?: ReceiptStatus;
  store_name?: string | null;
  total_cents?: number | null;
};

type ReceiptPatchRow = Omit<Partial<ReceiptMutationRow>, 'household_id' | 'image_url'>;

type ReceiptItemMutationRow = {
  category_id: ItemCategoryId;
  confidence: number;
  confidence_level: ReceiptItemConfidenceLevel;
  household_id: string;
  inferred_name: string;
  line_index: number;
  qty_unit: ItemQuantityUnit;
  qty_value: number;
  raw_text: string;
  receipt_id: string;
};

const receiptSelect =
  'id,household_id,image_url,store_name,total_cents,currency,captured_at,purchased_on,parsed_at,status,created_at,updated_at';
const receiptItemSelect =
  'id,receipt_id,household_id,line_index,raw_text,inferred_name,qty_value,qty_unit,category_id,confidence,confidence_level,created_at,updated_at';
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timestampPattern = /^\d{4}-\d{2}-\d{2}T/;

export function isReceiptStatus(value: unknown): value is ReceiptStatus {
  return typeof value === 'string' && receiptStatuses.includes(value as ReceiptStatus);
}

export function mapReceiptRow(row: DatabaseReceiptRow): Receipt {
  return {
    capturedAt: row.captured_at,
    createdAt: row.created_at,
    currency: row.currency,
    householdId: row.household_id,
    id: row.id,
    imageUrl: row.image_url,
    parsedAt: row.parsed_at,
    purchasedOn: row.purchased_on,
    status: row.status,
    storeName: row.store_name,
    totalCents: row.total_cents,
    updatedAt: row.updated_at,
  };
}

export function mapReceiptItemRow(row: DatabaseReceiptItemRow): ReceiptItem {
  return {
    categoryId: row.category_id,
    confidence: Number(row.confidence),
    confidenceLevel: row.confidence_level,
    createdAt: row.created_at,
    householdId: row.household_id,
    id: row.id,
    inferredName: row.inferred_name,
    lineIndex: row.line_index,
    qtyUnit: row.qty_unit,
    qtyValue: Number(row.qty_value),
    rawText: row.raw_text,
    receiptId: row.receipt_id,
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

function validateHouseholdId(householdId: string): string {
  const value = householdId.trim();

  if (!value) {
    throw new ApiRequestError('Household is required.', 400);
  }

  return value;
}

function validateReceiptId(id: string): string {
  const value = id.trim();

  if (!value) {
    throw new ApiRequestError('Receipt id is required.', 400);
  }

  return value;
}

function validateImageUrl(imageUrl: string): string {
  const value = imageUrl.trim();

  if (!value) {
    throw new ApiRequestError('Receipt image URL is required.', 400);
  }

  if (value.length > 2048) {
    throw new ApiRequestError('Receipt image URL must be 2048 characters or less.', 400);
  }

  return value;
}

function normaliseReceiptStatus(value: ReceiptStatus | undefined): ReceiptStatus {
  const status = value ?? 'uploaded';

  if (!isReceiptStatus(status)) {
    throw new ApiRequestError('Receipt status is invalid.', 400);
  }

  return status;
}

function normaliseOptionalReceiptStatus(
  value: ReceiptStatus | undefined,
): ReceiptStatus | undefined {
  if (value === undefined) {
    return undefined;
  }

  return normaliseReceiptStatus(value);
}

function normaliseCurrency(value: string | undefined): string {
  const currency = (value ?? 'EUR').trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new ApiRequestError('Receipt currency must be a 3-letter code.', 400);
  }

  return currency;
}

function normaliseStoreName(value: string | null | undefined): string | null | undefined {
  if (value == null) {
    return value;
  }

  const storeName = value.trim();

  if (!storeName) {
    return null;
  }

  if (storeName.length > 120) {
    throw new ApiRequestError('Receipt store name must be 120 characters or less.', 400);
  }

  return storeName;
}

function normaliseTotalCents(value: number | null | undefined): number | null | undefined {
  if (value == null) {
    return value;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new ApiRequestError('Receipt total must be a non-negative integer.', 400);
  }

  return value;
}

function normaliseTimestamp(
  value: string | null | undefined,
  fieldName: string,
): string | null | undefined {
  if (value == null) {
    return value;
  }

  if (!timestampPattern.test(value) || Number.isNaN(Date.parse(value))) {
    throw new ApiRequestError(`${fieldName} must be an ISO timestamp.`, 400);
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

function validateLineIndex(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 999) {
    throw new ApiRequestError('Receipt item line index is invalid.', 400);
  }

  return value;
}

function validateReceiptItemText(value: string, fieldName: string, maxLength: number): string {
  const text = value.trim().replace(/\s+/g, ' ');

  if (!text) {
    throw new ApiRequestError(`${fieldName} is required.`, 400);
  }

  if (text.length > maxLength) {
    throw new ApiRequestError(`${fieldName} is too long.`, 400);
  }

  return text;
}

function validateQuantityValue(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ApiRequestError('Receipt item quantity must be greater than zero.', 400);
  }

  return value;
}

function validateQuantityUnit(value: ItemQuantityUnit): ItemQuantityUnit {
  if (!isItemQuantityUnit(value)) {
    throw new ApiRequestError('Receipt item quantity unit is invalid.', 400);
  }

  return value;
}

function validateCategoryId(value: ItemCategoryId): ItemCategoryId {
  if (!isItemCategoryId(value)) {
    throw new ApiRequestError('Receipt item category is invalid.', 400);
  }

  return value;
}

function validateConfidenceLevel(value: ReceiptItemConfidenceLevel): ReceiptItemConfidenceLevel {
  if (!isReceiptItemConfidenceLevel(value)) {
    throw new ApiRequestError('Receipt item confidence level is invalid.', 400);
  }

  return value;
}

function prepareReceiptItemRow(
  householdId: string,
  receiptId: string,
  item: ParsedReceiptLineItem,
  lineIndex: number,
): ReceiptItemMutationRow {
  const confidenceLevel = confidenceLevelForScore(item.confidence);

  if (validateConfidenceLevel(item.confidenceLevel) !== confidenceLevel) {
    throw new ApiRequestError('Receipt item confidence level does not match confidence.', 400);
  }

  return {
    category_id: validateCategoryId(item.categoryId),
    confidence: item.confidence,
    confidence_level: confidenceLevel,
    household_id: householdId,
    inferred_name: validateReceiptItemText(item.inferredName, 'Receipt item inferred name', 120),
    line_index: validateLineIndex(lineIndex),
    qty_unit: validateQuantityUnit(item.qtyUnit),
    qty_value: validateQuantityValue(item.qtyValue),
    raw_text: validateReceiptItemText(item.rawText, 'Receipt item raw text', 300),
    receipt_id: receiptId,
  };
}

function parsePositiveInteger(value: number | undefined, fallback: number): number {
  return Number.isInteger(value) && value && value > 0 ? value : fallback;
}

function clampPageSize(value: number | undefined): number {
  return Math.min(parsePositiveInteger(value, 25), 100);
}

function parseTotalFromContentRange(value: string | null): number | null {
  const total = value?.match(/\/(\d+|\*)$/)?.[1];

  return total && total !== '*' ? Number(total) : null;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { readonly message?: string | undefined };

    return data.message ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

export class SackerlReceiptsClient {
  private readonly anonKey: string;
  private readonly fetch: typeof fetch;
  private readonly restUrl: string;

  constructor(config: SupabaseAuthConfig, options: ReceiptsClientOptions = {}) {
    const resolvedConfig = assertSupabaseAuthConfig(config);

    this.anonKey = resolvedConfig.anonKey;
    this.fetch = options.fetch ?? fetch;
    this.restUrl = `${normaliseBaseUrl(resolvedConfig.url)}/rest/v1`;
  }

  async createReceipt(
    context: AuthenticatedUserContext,
    input: CreateReceiptInput,
  ): Promise<Receipt> {
    const body: ReceiptMutationRow = {
      currency: normaliseCurrency(input.currency),
      household_id: validateHouseholdId(input.householdId),
      image_url: validateImageUrl(input.imageUrl),
      status: normaliseReceiptStatus(input.status),
    };
    const capturedAt = normaliseTimestamp(input.capturedAt, 'capturedAt');
    const storeName = normaliseStoreName(input.storeName);
    const totalCents = normaliseTotalCents(input.totalCents);

    if (capturedAt) {
      body.captured_at = capturedAt;
    }

    if (storeName !== undefined) {
      body.store_name = storeName;
    }

    if (totalCents !== undefined) {
      body.total_cents = totalCents;
    }

    const result = await this.request<DatabaseReceiptRow>(
      'receipts',
      context,
      { select: receiptSelect },
      {
        body,
        method: 'POST',
        prefer: 'return=representation',
      },
    );
    const receipt = result.rows[0];

    if (!receipt) {
      throw new ApiRequestError('Unable to create receipt.', 500);
    }

    return mapReceiptRow(receipt);
  }

  async listReceipts(
    context: AuthenticatedUserContext,
    input: ListReceiptsInput,
  ): Promise<ListReceiptsResult> {
    const householdId = validateHouseholdId(input.householdId);
    const page = parsePositiveInteger(input.page, 1);
    const pageSize = clampPageSize(input.pageSize);
    const offset = (page - 1) * pageSize;
    const status = normaliseOptionalReceiptStatus(input.status);
    const result = await this.request<DatabaseReceiptRow>(
      'receipts',
      context,
      {
        household_id: `eq.${householdId}`,
        order: 'captured_at.desc,id.desc',
        select: receiptSelect,
        status: status ? `eq.${status}` : undefined,
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
      pagination: {
        page,
        pageSize,
        total: result.total,
      },
      receipts: result.rows.map(mapReceiptRow),
    };
  }

  async getReceipt(context: AuthenticatedUserContext, input: GetReceiptInput): Promise<Receipt> {
    const householdId = validateHouseholdId(input.householdId);
    const id = validateReceiptId(input.id);
    const result = await this.request<DatabaseReceiptRow>('receipts', context, {
      household_id: `eq.${householdId}`,
      id: `eq.${id}`,
      limit: 1,
      select: receiptSelect,
    });
    const receipt = result.rows[0];

    if (!receipt) {
      throw new ApiRequestError('Receipt not found.', 404);
    }

    return mapReceiptRow(receipt);
  }

  async updateReceipt(
    context: AuthenticatedUserContext,
    input: UpdateReceiptInput,
  ): Promise<Receipt> {
    const householdId = validateHouseholdId(input.householdId);
    const id = validateReceiptId(input.id);
    const patch: ReceiptPatchRow = {};

    if (input.capturedAt !== undefined) {
      const capturedAt = normaliseTimestamp(input.capturedAt, 'capturedAt');

      if (capturedAt) {
        patch.captured_at = capturedAt;
      }
    }

    if ('parsedAt' in input) {
      patch.parsed_at = normaliseTimestamp(input.parsedAt, 'parsedAt') ?? null;
    }

    if ('purchasedOn' in input) {
      patch.purchased_on = normaliseDate(input.purchasedOn, 'purchasedOn') ?? null;
    }

    if (input.currency !== undefined) {
      patch.currency = normaliseCurrency(input.currency);
    }

    if (input.status !== undefined) {
      patch.status = normaliseReceiptStatus(input.status);
    }

    if ('storeName' in input) {
      patch.store_name = normaliseStoreName(input.storeName) ?? null;
    }

    if ('totalCents' in input) {
      patch.total_cents = normaliseTotalCents(input.totalCents) ?? null;
    }

    if (Object.keys(patch).length < 1) {
      throw new ApiRequestError('No receipt changes were provided.', 400);
    }

    const result = await this.request<DatabaseReceiptRow>(
      'receipts',
      context,
      {
        household_id: `eq.${householdId}`,
        id: `eq.${id}`,
        select: receiptSelect,
      },
      {
        body: patch,
        method: 'PATCH',
        prefer: 'return=representation',
      },
    );
    const receipt = result.rows[0];

    if (!receipt) {
      throw new ApiRequestError('Receipt not found.', 404);
    }

    return mapReceiptRow(receipt);
  }

  async listReceiptItems(
    context: AuthenticatedUserContext,
    input: ListReceiptItemsInput,
  ): Promise<readonly ReceiptItem[]> {
    const householdId = validateHouseholdId(input.householdId);
    const receiptId = validateReceiptId(input.receiptId);
    const result = await this.request<DatabaseReceiptItemRow>('receipt_items', context, {
      household_id: `eq.${householdId}`,
      order: 'line_index.asc',
      receipt_id: `eq.${receiptId}`,
      select: receiptItemSelect,
    });

    return result.rows.map(mapReceiptItemRow);
  }

  async replaceReceiptItems(
    context: AuthenticatedUserContext,
    input: ReplaceReceiptItemsInput,
  ): Promise<readonly ReceiptItem[]> {
    const householdId = validateHouseholdId(input.householdId);
    const receiptId = validateReceiptId(input.receiptId);

    if (input.items.length > 100) {
      throw new ApiRequestError('A receipt parse can contain at most 100 items.', 400);
    }

    await this.request<DatabaseReceiptItemRow>(
      'receipt_items',
      context,
      {
        household_id: `eq.${householdId}`,
        receipt_id: `eq.${receiptId}`,
        select: receiptItemSelect,
      },
      { method: 'DELETE' },
    );

    if (input.items.length < 1) {
      return [];
    }

    const rows = input.items.map((item, index) =>
      prepareReceiptItemRow(householdId, receiptId, item, index),
    );
    const result = await this.request<DatabaseReceiptItemRow>(
      'receipt_items',
      context,
      { select: receiptItemSelect },
      {
        body: rows,
        method: 'POST',
        prefer: 'return=representation',
      },
    );

    return result.rows.map(mapReceiptItemRow);
  }

  private async request<T>(
    table: string,
    context: AuthenticatedUserContext,
    query: Record<string, QueryValue | undefined>,
    options: {
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

    const headers: Record<string, string> = {
      Accept: 'application/json',
      apikey: this.anonKey,
      Authorization: `Bearer ${context.accessToken}`,
    };

    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    const preferences = [options.prefer, options.count ? 'count=exact' : undefined].filter(Boolean);

    if (preferences.length > 0) {
      headers.Prefer = preferences.join(',');
    }

    if (options.range) {
      headers.Range = `${options.range.from}-${options.range.to}`;
    }

    const requestInit: RequestInit = {
      headers,
      method: options.method ?? 'GET',
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    };
    const response = await this.fetch(
      `${this.restUrl}/${table}?${encodeQuery(query)}`,
      requestInit,
    );

    if (!response.ok) {
      const message = await readErrorMessage(response);

      throw new ApiRequestError(message, response.status);
    }

    if (response.status === 204) {
      return {
        rows: [],
        total: parseTotalFromContentRange(response.headers.get('Content-Range')),
      };
    }

    return {
      rows: (await response.json()) as readonly T[],
      total: parseTotalFromContentRange(response.headers.get('Content-Range')),
    };
  }
}

export function createSackerlReceiptsClient(
  config: SupabaseAuthConfig,
  options?: ReceiptsClientOptions,
): SackerlReceiptsClient {
  return new SackerlReceiptsClient(config, options);
}
