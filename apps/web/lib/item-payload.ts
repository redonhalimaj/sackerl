import {
  ApiRequestError,
  type CreateStockItemInput,
  type ItemCategoryId,
  type ItemQuantityUnit,
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

export function readCreateItemBody(body: unknown): CreateItemBody {
  const record = requireRecord(body);
  const addedOn = readOptionalString(record, 'addedOn');
  const expiresOn = readOptionalNullableString(record, 'expiresOn');
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
  const name = readOptionalString(record, 'name');
  const qtyUnit = readOptionalString(record, 'qtyUnit');
  const qtyValue = readOptionalNumber(record, 'qtyValue');
  const removedOn = readOptionalNullableString(record, 'removedOn');
  const source = readOptionalString(record, 'source');
  const zone = readOptionalString(record, 'zone');
  const zoneId = readOptionalString(record, 'zoneId');

  return {
    ...(addedOn !== undefined ? { addedOn } : {}),
    ...(categoryId !== undefined ? { categoryId: categoryId as ItemCategoryId } : {}),
    ...('expiresOn' in record ? { expiresOn } : {}),
    ...(name !== undefined ? { name } : {}),
    ...(qtyUnit !== undefined ? { qtyUnit: qtyUnit as ItemQuantityUnit } : {}),
    ...(qtyValue !== undefined ? { qtyValue } : {}),
    ...('removedOn' in record ? { removedOn } : {}),
    ...(source !== undefined ? { source: source as ItemSource } : {}),
    ...(zone !== undefined ? { zone } : {}),
    ...(zoneId !== undefined ? { zoneId } : {}),
  };
}
