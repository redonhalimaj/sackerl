import {
  ApiRequestError,
  isDeclarableExpiryFactSource,
  isExpiryPrintedMarking,
  type CreateStockItemInput,
  type ExpiryDeclarationInput,
  type ItemCategoryId,
  type ItemQuantityUnit,
  type ItemRemovalReason,
  type ItemSource,
  type UpdateStockItemInput,
} from '@sackerl/api-client';

type JsonRecord = Record<string, unknown>;

type CreateItemBody = Omit<CreateStockItemInput, 'householdId'>;

type UpdateItemBody = Omit<UpdateStockItemInput, 'householdId' | 'id'>;

function requireRecord(value: unknown): JsonRecord {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiRequestError('JSON object body is required.', 400);
  }

  return value as JsonRecord;
}

function readRequiredString(record: JsonRecord, key: string): string {
  const value = record[key];

  if (typeof value !== 'string') {
    throw new ApiRequestError(`${key} is required.`, 400);
  }

  return value;
}

function readOptionalString(record: JsonRecord, key: string): string | undefined {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new ApiRequestError(`${key} must be a string.`, 400);
  }

  return value;
}

function readOptionalNullableString(record: JsonRecord, key: string): string | null | undefined {
  const value = record[key];

  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value !== 'string') {
    throw new ApiRequestError(`${key} must be a string or null.`, 400);
  }

  return value;
}

function readRequiredNumber(record: JsonRecord, key: string): number {
  const value = record[key];

  if (typeof value !== 'number') {
    throw new ApiRequestError(`${key} is required.`, 400);
  }

  return value;
}

function readOptionalNumber(record: JsonRecord, key: string): number | undefined {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'number') {
    throw new ApiRequestError(`${key} must be a number.`, 400);
  }

  return value;
}

function readOptionalNullableNumber(record: JsonRecord, key: string): number | null | undefined {
  const value = record[key];

  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value !== 'number') {
    throw new ApiRequestError(`${key} must be a number or null.`, 400);
  }

  return value;
}

const expiryDeclarationKeys = [
  'confidence',
  'confirm',
  'estimatorVersion',
  'expectedFactId',
  'printedMarking',
  'source',
] as const;

/**
 * Reads the optional expiry provenance a caller states for the date it is writing. Actor and
 * timestamps are database owned and are not accepted here, so an unknown key is a rejection
 * rather than a silently ignored field.
 */
function readExpiryDeclaration(record: JsonRecord): ExpiryDeclarationInput | undefined {
  const value = record.expiry;

  if (value === undefined) {
    return undefined;
  }

  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiRequestError('expiry must be a JSON object.', 400);
  }

  const declaration = value as JsonRecord;

  for (const key of Object.keys(declaration)) {
    if (!expiryDeclarationKeys.includes(key as (typeof expiryDeclarationKeys)[number])) {
      throw new ApiRequestError(`expiry.${key} is not a supported field.`, 400);
    }
  }

  const source = readRequiredString(declaration, 'source');

  if (!isDeclarableExpiryFactSource(source)) {
    throw new ApiRequestError(
      source === 'model'
        ? 'Model-derived expiry provenance is not enabled.'
        : 'expiry.source is invalid.',
      400,
    );
  }

  const confidence = readOptionalNullableNumber(declaration, 'confidence');
  const estimatorVersion = readOptionalNullableString(declaration, 'estimatorVersion');
  const expectedFactId = readOptionalNullableString(declaration, 'expectedFactId');
  const printedMarking = readOptionalString(declaration, 'printedMarking');
  const confirm = declaration.confirm;

  if (confirm !== undefined && typeof confirm !== 'boolean') {
    throw new ApiRequestError('expiry.confirm must be a boolean.', 400);
  }

  if (printedMarking !== undefined && !isExpiryPrintedMarking(printedMarking)) {
    throw new ApiRequestError('expiry.printedMarking is invalid.', 400);
  }

  return {
    source,
    ...(confidence !== undefined ? { confidence } : {}),
    ...(confirm !== undefined ? { confirm } : {}),
    ...(estimatorVersion !== undefined ? { estimatorVersion } : {}),
    ...(expectedFactId !== undefined ? { expectedFactId } : {}),
    ...(printedMarking !== undefined ? { printedMarking } : {}),
  };
}

export function readCreateItemBody(body: unknown): CreateItemBody {
  const record = requireRecord(body);
  const addedOn = readOptionalString(record, 'addedOn');
  const expiresOn = readOptionalNullableString(record, 'expiresOn');
  const expiry = readExpiryDeclaration(record);
  const source = readOptionalString(record, 'source');
  const zone = readOptionalString(record, 'zone');
  const zoneId = readOptionalString(record, 'zoneId');

  return {
    categoryId: readRequiredString(record, 'categoryId') as ItemCategoryId,
    name: readRequiredString(record, 'name'),
    qtyUnit: readRequiredString(record, 'qtyUnit') as ItemQuantityUnit,
    qtyValue: readRequiredNumber(record, 'qtyValue'),
    ...(addedOn !== undefined ? { addedOn } : {}),
    ...('expiresOn' in record ? { expiresOn } : {}),
    ...(expiry !== undefined ? { expiry } : {}),
    ...(source !== undefined ? { source: source as ItemSource } : {}),
    ...(zone !== undefined ? { zone } : {}),
    ...(zoneId !== undefined ? { zoneId } : {}),
  };
}

export function readCreateItemBatchBody(body: unknown): readonly CreateItemBody[] {
  const record = requireRecord(body);

  if (!Array.isArray(record.items)) {
    throw new ApiRequestError('items must be an array.', 400);
  }

  return record.items.map(readCreateItemBody);
}

export function readUpdateItemBody(body: unknown): UpdateItemBody {
  const record = requireRecord(body);
  const addedOn = readOptionalString(record, 'addedOn');
  const categoryId = readOptionalString(record, 'categoryId');
  const expiresOn = readOptionalNullableString(record, 'expiresOn');
  const expiry = readExpiryDeclaration(record);
  const name = readOptionalString(record, 'name');
  const qtyUnit = readOptionalString(record, 'qtyUnit');
  const qtyValue = readOptionalNumber(record, 'qtyValue');
  const removalReason = readOptionalNullableString(record, 'removalReason');
  const removedOn = readOptionalNullableString(record, 'removedOn');
  const source = readOptionalString(record, 'source');
  const zone = readOptionalString(record, 'zone');
  const zoneId = readOptionalString(record, 'zoneId');

  return {
    ...(addedOn !== undefined ? { addedOn } : {}),
    ...(categoryId !== undefined ? { categoryId: categoryId as ItemCategoryId } : {}),
    ...('expiresOn' in record ? { expiresOn } : {}),
    ...(expiry !== undefined ? { expiry } : {}),
    ...(name !== undefined ? { name } : {}),
    ...(qtyUnit !== undefined ? { qtyUnit: qtyUnit as ItemQuantityUnit } : {}),
    ...(qtyValue !== undefined ? { qtyValue } : {}),
    ...('removalReason' in record
      ? { removalReason: removalReason as ItemRemovalReason | null }
      : {}),
    ...('removedOn' in record ? { removedOn } : {}),
    ...(source !== undefined ? { source: source as ItemSource } : {}),
    ...(zone !== undefined ? { zone } : {}),
    ...(zoneId !== undefined ? { zoneId } : {}),
  };
}
