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
  type ParsedReceiptDocument,
  type ParsedReceiptLineItem,
  type ReceiptItemConfidenceLevel,
} from './receipt-parsing';

export const receiptStatuses = ['uploaded', 'parsing', 'parsed', 'failed'] as const;
export const receiptReviewStatuses = ['not_started', 'needs_review', 'reviewed'] as const;
export const receiptItemReviewStates = ['unresolved', 'reviewed'] as const;
export const receiptItemSources = ['parser', 'manual'] as const;

export type ReceiptStatus = (typeof receiptStatuses)[number];
export type ReceiptReviewStatus = (typeof receiptReviewStatuses)[number];
export type ReceiptItemReviewState = (typeof receiptItemReviewStates)[number];
export type ReceiptItemSource = (typeof receiptItemSources)[number];
export type ReceiptReviewUnresolvedField =
  | 'categoryId'
  | 'name'
  | 'qtyUnit'
  | 'qtyValue'
  | 'reviewState';

export type ReceiptReviewUnresolvedFieldRef = {
  readonly field: ReceiptReviewUnresolvedField;
  readonly itemId: string;
};

export type Receipt = {
  readonly activeParseGenerationId: string | null;
  readonly capturedAt: string;
  readonly createdAt: string;
  readonly currency: string;
  readonly householdId: string;
  readonly id: string;
  readonly imageUrl: string;
  readonly parsedAt: string | null;
  readonly purchasedOn: string | null;
  readonly reviewedAt: string | null;
  readonly reviewedBy: string | null;
  readonly reviewRevision: number;
  readonly reviewStatus: ReceiptReviewStatus;
  readonly status: ReceiptStatus;
  readonly storeName: string | null;
  readonly totalCents: number | null;
  readonly updatedAt: string;
};

export type DatabaseReceiptRow = {
  readonly active_parse_generation_id: string | null;
  readonly captured_at: string;
  readonly created_at: string;
  readonly currency: string;
  readonly household_id: string;
  readonly id: string;
  readonly image_url: string;
  readonly parsed_at: string | null;
  readonly purchased_on: string | null;
  readonly reviewed_at: string | null;
  readonly reviewed_by: string | null;
  readonly review_revision: number;
  readonly review_status: ReceiptReviewStatus;
  readonly status: ReceiptStatus;
  readonly store_name: string | null;
  readonly total_cents: number | null;
  readonly updated_at: string;
};

export type ReceiptItemMoneyFields = {
  readonly discountCents: number | null;
  readonly lineTotalCents: number | null;
  readonly taxCents: number | null;
  readonly unitPriceCents: number | null;
};

export type ReceiptItem = {
  readonly clientLineId: string | null;
  readonly confidence: number | null;
  readonly confidenceLevel: ReceiptItemConfidenceLevel | null;
  readonly correctedAt: string | null;
  readonly correctedBy: string | null;
  readonly correctedCategoryId: ItemCategoryId | null;
  readonly correctedName: string | null;
  readonly correctedQtyUnit: ItemQuantityUnit | null;
  readonly correctedQtyValue: number | null;
  readonly createdAt: string;
  readonly effectiveCategoryId: ItemCategoryId | null;
  readonly effectiveName: string | null;
  readonly effectiveQtyUnit: ItemQuantityUnit | null;
  readonly effectiveQtyValue: number | null;
  readonly generationId: string;
  readonly householdId: string;
  readonly id: string;
  readonly included: boolean;
  readonly inferredCategoryId: ItemCategoryId | null;
  readonly inferredDiscountCents: number | null;
  readonly inferredLineTotalCents: number | null;
  readonly inferredName: string | null;
  readonly inferredQtyUnit: ItemQuantityUnit | null;
  readonly inferredQtyValue: number | null;
  readonly inferredTaxCents: number | null;
  readonly inferredUnitPriceCents: number | null;
  readonly lineIndex: number;
  readonly parserVersion: string | null;
  readonly rawText: string | null;
  readonly receiptId: string;
  readonly reviewedAt: string | null;
  readonly reviewedBy: string | null;
  readonly reviewState: ReceiptItemReviewState;
  readonly source: ReceiptItemSource;
  readonly unresolvedFields: readonly ReceiptReviewUnresolvedField[];
  readonly updatedAt: string;
};

export type DatabaseReceiptItemRow = {
  readonly category_id: ItemCategoryId | null;
  readonly client_line_id: string | null;
  readonly confidence: number | string | null;
  readonly confidence_level: ReceiptItemConfidenceLevel | null;
  readonly corrected_at: string | null;
  readonly corrected_by: string | null;
  readonly corrected_category_id: ItemCategoryId | null;
  readonly corrected_name: string | null;
  readonly corrected_qty_unit: ItemQuantityUnit | null;
  readonly corrected_qty_value: number | string | null;
  readonly created_at: string;
  readonly generation_id: string;
  readonly household_id: string;
  readonly id: string;
  readonly included: boolean;
  readonly inferred_discount_cents: number | string | null;
  readonly inferred_line_total_cents: number | string | null;
  readonly inferred_name: string | null;
  readonly inferred_tax_cents: number | string | null;
  readonly inferred_unit_price_cents: number | string | null;
  readonly line_index: number;
  readonly parser_version: string | null;
  readonly qty_unit: ItemQuantityUnit | null;
  readonly qty_value: number | string | null;
  readonly raw_text: string | null;
  readonly receipt_id: string;
  readonly reviewed_at: string | null;
  readonly reviewed_by: string | null;
  readonly review_state: ReceiptItemReviewState;
  readonly source: ReceiptItemSource;
  readonly updated_at: string;
};

export type DatabaseReceiptReviewSnapshot = {
  readonly items: readonly DatabaseReceiptItemRow[];
  readonly receipt: DatabaseReceiptRow;
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

export type GetReceiptReviewInput = ListReceiptItemsInput;

export type PromoteReceiptParseInput = {
  readonly expectedActiveParseGenerationId: string | null;
  readonly expectedReviewRevision: number;
  readonly householdId: string;
  readonly parsed: ParsedReceiptDocument;
  readonly parserVersion: string;
  readonly provider: string;
  readonly receiptId: string;
};

export type MarkReceiptParseFailedInput = {
  readonly expectedActiveParseGenerationId: string | null;
  readonly expectedReviewRevision: number;
  readonly householdId: string;
  readonly receiptId: string;
};

export type ReplaceReceiptItemsInput = {
  readonly householdId: string;
  readonly items: readonly ParsedReceiptLineItem[];
  readonly parserVersion?: string | undefined;
  readonly provider?: string | undefined;
  readonly receiptId: string;
};

type SaveReceiptReviewLineBaseInput = {
  readonly categoryId: ItemCategoryId;
  readonly included: boolean;
  readonly name: string;
  readonly qtyUnit: ItemQuantityUnit;
  readonly qtyValue: number;
  readonly reviewState: ReceiptItemReviewState;
};

export type SavePersistedReceiptReviewLineInput = SaveReceiptReviewLineBaseInput & {
  readonly clientLineId?: undefined;
  readonly id: string;
};

export type SaveManualReceiptReviewLineInput = SaveReceiptReviewLineBaseInput & {
  readonly clientLineId: string;
  readonly id?: undefined;
};

export type SaveReceiptReviewLineInput =
  | SaveManualReceiptReviewLineInput
  | SavePersistedReceiptReviewLineInput;

export type SaveReceiptReviewInput = {
  readonly expectedReviewRevision: number;
  readonly generationId: string;
  readonly householdId: string;
  readonly lines: readonly SaveReceiptReviewLineInput[];
  readonly receiptId: string;
};

export type ReceiptPagination = {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number | null;
};

export type ReceiptReviewSummary = {
  readonly canComplete: boolean;
  readonly generationId: string | null;
  readonly includedCount: number;
  readonly receiptId: string;
  readonly reviewRevision: number;
  readonly reviewStatus: ReceiptReviewStatus;
  readonly reviewedCount: number;
  readonly totalLines: number;
  readonly unresolvedCount: number;
  readonly unresolvedFields: readonly ReceiptReviewUnresolvedFieldRef[];
};

export type ReceiptReview = {
  readonly items: readonly ReceiptItem[];
  readonly receipt: Receipt;
  readonly summary: ReceiptReviewSummary;
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

type ParsedReceiptItemPromotionRow = {
  category_id: ItemCategoryId;
  confidence: number;
  confidence_level: ReceiptItemConfidenceLevel;
  discount_cents: number | null;
  inferred_name: string;
  line_total_cents: number | null;
  qty_unit: ItemQuantityUnit;
  qty_value: number;
  raw_text: string;
  tax_cents: number | null;
  unit_price_cents: number | null;
};

type ReceiptReviewLineMutationRow = {
  category_id: ItemCategoryId;
  client_line_id?: string;
  id?: string;
  included: boolean;
  name: string;
  qty_unit: ItemQuantityUnit;
  qty_value: number;
  review_state: ReceiptItemReviewState;
};

const receiptSelect =
  'id,household_id,image_url,store_name,total_cents,currency,captured_at,purchased_on,parsed_at,status,active_parse_generation_id,review_status,review_revision,reviewed_at,reviewed_by,created_at,updated_at';
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timestampPattern = /^\d{4}-\d{2}-\d{2}T/;

export function isReceiptStatus(value: unknown): value is ReceiptStatus {
  return typeof value === 'string' && receiptStatuses.includes(value as ReceiptStatus);
}

export function isReceiptReviewStatus(value: unknown): value is ReceiptReviewStatus {
  return typeof value === 'string' && receiptReviewStatuses.includes(value as ReceiptReviewStatus);
}

export function isReceiptItemReviewState(value: unknown): value is ReceiptItemReviewState {
  return (
    typeof value === 'string' && receiptItemReviewStates.includes(value as ReceiptItemReviewState)
  );
}

export function isReceiptItemSource(value: unknown): value is ReceiptItemSource {
  return typeof value === 'string' && receiptItemSources.includes(value as ReceiptItemSource);
}

export function mapReceiptRow(row: DatabaseReceiptRow): Receipt {
  return {
    activeParseGenerationId: row.active_parse_generation_id,
    capturedAt: row.captured_at,
    createdAt: row.created_at,
    currency: row.currency,
    householdId: row.household_id,
    id: row.id,
    imageUrl: row.image_url,
    parsedAt: row.parsed_at,
    purchasedOn: row.purchased_on,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    reviewRevision: row.review_revision,
    reviewStatus: row.review_status,
    status: row.status,
    storeName: row.store_name,
    totalCents: row.total_cents,
    updatedAt: row.updated_at,
  };
}

export function mapReceiptItemRow(row: DatabaseReceiptItemRow): ReceiptItem {
  const correctedQtyValue = nullableNumber(row.corrected_qty_value);
  const inferredQtyValue = nullableNumber(row.qty_value);
  const effectiveName = row.corrected_name ?? row.inferred_name;
  const effectiveQtyValue = correctedQtyValue ?? inferredQtyValue;
  const effectiveQtyUnit = row.corrected_qty_unit ?? row.qty_unit;
  const effectiveCategoryId = row.corrected_category_id ?? row.category_id;
  const item = {
    clientLineId: row.client_line_id,
    confidence: nullableNumber(row.confidence),
    confidenceLevel: row.confidence_level,
    correctedAt: row.corrected_at,
    correctedBy: row.corrected_by,
    correctedCategoryId: row.corrected_category_id,
    correctedName: row.corrected_name,
    correctedQtyUnit: row.corrected_qty_unit,
    correctedQtyValue,
    createdAt: row.created_at,
    effectiveCategoryId,
    effectiveName,
    effectiveQtyUnit,
    effectiveQtyValue,
    generationId: row.generation_id,
    householdId: row.household_id,
    id: row.id,
    included: row.included,
    inferredCategoryId: row.category_id,
    inferredDiscountCents: nullableNumber(row.inferred_discount_cents),
    inferredLineTotalCents: nullableNumber(row.inferred_line_total_cents),
    inferredName: row.inferred_name,
    inferredQtyUnit: row.qty_unit,
    inferredQtyValue,
    inferredTaxCents: nullableNumber(row.inferred_tax_cents),
    inferredUnitPriceCents: nullableNumber(row.inferred_unit_price_cents),
    lineIndex: row.line_index,
    parserVersion: row.parser_version,
    rawText: row.raw_text,
    receiptId: row.receipt_id,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    reviewState: row.review_state,
    source: row.source,
    unresolvedFields: [] as readonly ReceiptReviewUnresolvedField[],
    updatedAt: row.updated_at,
  };

  return {
    ...item,
    unresolvedFields: unresolvedFieldsForItem(item),
  };
}

export function mapReceiptReviewSnapshot(snapshot: DatabaseReceiptReviewSnapshot): ReceiptReview {
  return buildReceiptReview(mapReceiptRow(snapshot.receipt), snapshot.items.map(mapReceiptItemRow));
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

function validateReceiptItemId(id: string): string {
  const value = id.trim();

  if (!value) {
    throw new ApiRequestError('Receipt item id is required.', 400);
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

function normaliseMoneyCents(value: number | null | undefined, fieldName: string): number | null {
  if (value == null) {
    return null;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new ApiRequestError(`${fieldName} must be a non-negative integer or null.`, 400);
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

function normaliseVersion(value: string, fieldName: string): string {
  const version = value.trim();

  if (!version || version.length > 80) {
    throw new ApiRequestError(`${fieldName} must be between 1 and 80 characters.`, 400);
  }

  return version;
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

function validateIncluded(value: boolean): boolean {
  if (typeof value !== 'boolean') {
    throw new ApiRequestError('Receipt item included flag is required.', 400);
  }

  return value;
}

function validateReviewState(value: ReceiptItemReviewState): ReceiptItemReviewState {
  if (!isReceiptItemReviewState(value)) {
    throw new ApiRequestError('Receipt item review state is invalid.', 400);
  }

  return value;
}

function validateGenerationId(value: string): string {
  const id = value.trim();

  if (!id) {
    throw new ApiRequestError('Receipt parse generation is required.', 400);
  }

  return id;
}

function validateClientLineId(value: string): string {
  const id = value.trim();

  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(id)) {
    throw new ApiRequestError('Manual receipt line id is invalid.', 400);
  }

  return id;
}

function validateReviewRevision(value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new ApiRequestError('Expected review revision is invalid.', 400);
  }

  return value;
}

function prepareParsedReceiptItemRow(item: ParsedReceiptLineItem): ParsedReceiptItemPromotionRow {
  const confidenceLevel = confidenceLevelForScore(item.confidence);

  if (validateConfidenceLevel(item.confidenceLevel) !== confidenceLevel) {
    throw new ApiRequestError('Receipt item confidence level does not match confidence.', 400);
  }

  return {
    category_id: validateCategoryId(item.categoryId),
    confidence: item.confidence,
    confidence_level: confidenceLevel,
    discount_cents: normaliseMoneyCents(item.discountCents, 'discountCents'),
    inferred_name: validateReceiptItemText(item.inferredName, 'Receipt item inferred name', 120),
    line_total_cents: normaliseMoneyCents(item.lineTotalCents, 'lineTotalCents'),
    qty_unit: validateQuantityUnit(item.qtyUnit),
    qty_value: validateQuantityValue(item.qtyValue),
    raw_text: validateReceiptItemText(item.rawText, 'Receipt item raw text', 300),
    tax_cents: normaliseMoneyCents(item.taxCents, 'taxCents'),
    unit_price_cents: normaliseMoneyCents(item.unitPriceCents, 'unitPriceCents'),
  };
}

function prepareReviewLineRow(line: SaveReceiptReviewLineInput): ReceiptReviewLineMutationRow {
  const hasPersistedId = typeof line.id === 'string';
  const hasClientLineId = typeof line.clientLineId === 'string';

  if (hasPersistedId === hasClientLineId) {
    throw new ApiRequestError(
      'Receipt review lines require exactly one of id or clientLineId.',
      400,
    );
  }

  const row: ReceiptReviewLineMutationRow = {
    category_id: validateCategoryId(line.categoryId),
    included: validateIncluded(line.included),
    name: validateReceiptItemText(line.name, 'Receipt item name', 120),
    qty_unit: validateQuantityUnit(line.qtyUnit),
    qty_value: validateQuantityValue(line.qtyValue),
    review_state: validateReviewState(line.reviewState),
  };

  if (hasPersistedId) {
    row.id = validateReceiptItemId(line.id);
  }

  if (hasClientLineId) {
    row.client_line_id = validateClientLineId(line.clientLineId);
  }

  return row;
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

function nullableNumber(value: number | string | null): number | null {
  return value == null ? null : Number(value);
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { readonly message?: string | undefined };

    return data.message ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

function unresolvedFieldsForItem(
  item: Omit<ReceiptItem, 'unresolvedFields'>,
): readonly ReceiptReviewUnresolvedField[] {
  const fields: ReceiptReviewUnresolvedField[] = [];

  if (item.reviewState === 'unresolved') {
    fields.push('reviewState');
  }

  if (item.included) {
    if (!item.effectiveName) {
      fields.push('name');
    }

    if (item.effectiveQtyValue == null) {
      fields.push('qtyValue');
    }

    if (!item.effectiveQtyUnit) {
      fields.push('qtyUnit');
    }

    if (!item.effectiveCategoryId) {
      fields.push('categoryId');
    }
  }

  return fields;
}

function buildReceiptReview(receipt: Receipt, items: readonly ReceiptItem[]): ReceiptReview {
  const unresolvedFields = items.flatMap((item) =>
    item.unresolvedFields.map((field) => ({ field, itemId: item.id })),
  );
  const reviewedCount = items.filter((item) => item.reviewState === 'reviewed').length;
  const unresolvedCount = items.length - reviewedCount;

  return {
    items,
    receipt,
    summary: {
      canComplete: unresolvedFields.length === 0 && items.length > 0,
      generationId: receipt.activeParseGenerationId,
      includedCount: items.filter((item) => item.included).length,
      receiptId: receipt.id,
      reviewRevision: receipt.reviewRevision,
      reviewStatus: receipt.reviewStatus,
      reviewedCount,
      totalLines: items.length,
      unresolvedCount,
      unresolvedFields,
    },
  };
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

  async getReceiptReview(
    context: AuthenticatedUserContext,
    input: GetReceiptReviewInput,
  ): Promise<ReceiptReview> {
    const snapshot = await this.requestRpcJson<DatabaseReceiptReviewSnapshot>(
      'get_receipt_review',
      context,
      {
        p_household_id: validateHouseholdId(input.householdId),
        p_receipt_id: validateReceiptId(input.receiptId),
      },
    );

    return mapReceiptReviewSnapshot(snapshot);
  }

  async listReceiptItems(
    context: AuthenticatedUserContext,
    input: ListReceiptItemsInput,
  ): Promise<readonly ReceiptItem[]> {
    return (await this.getReceiptReview(context, input)).items;
  }

  async promoteReceiptParse(
    context: AuthenticatedUserContext,
    input: PromoteReceiptParseInput,
  ): Promise<ReceiptReview> {
    const householdId = validateHouseholdId(input.householdId);
    const receiptId = validateReceiptId(input.receiptId);
    const expectedReviewRevision = validateReviewRevision(input.expectedReviewRevision);
    const parsed = input.parsed;

    if (parsed.items.length > 100) {
      throw new ApiRequestError('A receipt parse can contain at most 100 items.', 400);
    }

    if (parsed.items.length < 1) {
      throw new ApiRequestError('A receipt parse must contain at least one item.', 400);
    }

    const snapshot = await this.requestRpcJson<DatabaseReceiptReviewSnapshot>(
      'promote_receipt_parse',
      context,
      {
        p_currency: normaliseCurrency(parsed.currency),
        p_expected_active_generation_id:
          input.expectedActiveParseGenerationId === null
            ? null
            : validateGenerationId(input.expectedActiveParseGenerationId),
        p_expected_review_revision: expectedReviewRevision,
        p_household_id: householdId,
        p_items: parsed.items.map(prepareParsedReceiptItemRow),
        p_parser_version: normaliseVersion(input.parserVersion, 'parserVersion'),
        p_provider: normaliseVersion(input.provider, 'provider'),
        p_purchased_on: normaliseDate(parsed.purchasedOn, 'purchasedOn'),
        p_receipt_id: receiptId,
        p_store_name: normaliseStoreName(parsed.storeName),
        p_total_cents: normaliseTotalCents(parsed.totalCents),
      },
    );

    return mapReceiptReviewSnapshot(snapshot);
  }

  async markReceiptParseFailed(
    context: AuthenticatedUserContext,
    input: MarkReceiptParseFailedInput,
  ): Promise<ReceiptReview> {
    const snapshot = await this.requestRpcJson<DatabaseReceiptReviewSnapshot>(
      'mark_receipt_parse_failed',
      context,
      {
        p_expected_active_generation_id:
          input.expectedActiveParseGenerationId === null
            ? null
            : validateGenerationId(input.expectedActiveParseGenerationId),
        p_expected_review_revision: validateReviewRevision(input.expectedReviewRevision),
        p_household_id: validateHouseholdId(input.householdId),
        p_receipt_id: validateReceiptId(input.receiptId),
      },
    );

    return mapReceiptReviewSnapshot(snapshot);
  }

  async replaceReceiptItems(
    context: AuthenticatedUserContext,
    input: ReplaceReceiptItemsInput,
  ): Promise<readonly ReceiptItem[]> {
    const receipt = await this.getReceipt(context, {
      householdId: input.householdId,
      id: input.receiptId,
    });
    const review = await this.promoteReceiptParse(context, {
      expectedActiveParseGenerationId: receipt.activeParseGenerationId,
      expectedReviewRevision: receipt.reviewRevision,
      householdId: input.householdId,
      parsed: {
        currency: receipt.currency,
        items: input.items,
        purchasedOn: receipt.purchasedOn,
        storeName: receipt.storeName,
        totalCents: receipt.totalCents,
      },
      parserVersion: input.parserVersion ?? 'legacy-replace-receipt-items',
      provider: input.provider ?? 'client',
      receiptId: input.receiptId,
    });

    return review.items;
  }

  async saveReceiptReview(
    context: AuthenticatedUserContext,
    input: SaveReceiptReviewInput,
  ): Promise<ReceiptReview> {
    const householdId = validateHouseholdId(input.householdId);
    const receiptId = validateReceiptId(input.receiptId);
    const generationId = validateGenerationId(input.generationId);
    const expectedReviewRevision = validateReviewRevision(input.expectedReviewRevision);

    if (input.lines.length < 1) {
      throw new ApiRequestError('Receipt review must contain at least one line.', 400);
    }

    if (input.lines.length > 150) {
      throw new ApiRequestError('Receipt review can contain at most 150 lines.', 400);
    }

    const ids = input.lines
      .filter((line): line is SavePersistedReceiptReviewLineInput => Boolean(line.id))
      .map((line) => validateReceiptItemId(line.id));
    const clientLineIds = input.lines
      .filter((line): line is SaveManualReceiptReviewLineInput => Boolean(line.clientLineId))
      .map((line) => validateClientLineId(line.clientLineId));

    if (new Set(ids).size !== ids.length) {
      throw new ApiRequestError('Receipt review contains duplicate line ids.', 400);
    }

    if (new Set(clientLineIds).size !== clientLineIds.length) {
      throw new ApiRequestError('Receipt review contains duplicate manual line ids.', 400);
    }

    const snapshot = await this.requestRpcJson<DatabaseReceiptReviewSnapshot>(
      'save_receipt_review',
      context,
      {
        p_expected_review_revision: expectedReviewRevision,
        p_generation_id: generationId,
        p_household_id: householdId,
        p_lines: input.lines.map(prepareReviewLineRow),
        p_receipt_id: receiptId,
      },
    );

    return mapReceiptReviewSnapshot(snapshot);
  }

  private async requestRpcJson<T>(
    functionName: string,
    context: AuthenticatedUserContext,
    body: object,
  ): Promise<T> {
    if (!context.accessToken) {
      throw new ApiRequestError('Missing auth access token.', 401);
    }

    const response = await this.fetch(`${this.restUrl}/rpc/${functionName}`, {
      body: JSON.stringify(body),
      headers: {
        Accept: 'application/json',
        apikey: this.anonKey,
        Authorization: `Bearer ${context.accessToken}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      const message = await readErrorMessage(response);

      throw new ApiRequestError(message, response.status);
    }

    return (await response.json()) as T;
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
