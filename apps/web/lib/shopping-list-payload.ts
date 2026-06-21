import {
  ApiRequestError,
  type CreateShoppingListItemInput,
  type ItemCategoryId,
  type ItemQuantityUnit,
  type ShoppingListSource,
  type UpdateShoppingListItemInput,
} from '@sackerl/api-client';

type JsonRecord = Record<string, unknown>;

type CreateShoppingListBody = Omit<CreateShoppingListItemInput, 'householdId'>;

type UpdateShoppingListBody = Omit<UpdateShoppingListItemInput, 'householdId' | 'id'>;

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

function readOptionalBoolean(record: JsonRecord, key: string): boolean | undefined {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    throw new ApiRequestError(`${key} must be a boolean.`, 400);
  }

  return value;
}

export function readCreateShoppingListItemBody(body: unknown): CreateShoppingListBody {
  const record = requireRecord(body);
  const categoryId = readOptionalNullableString(record, 'categoryId');
  const qtyUnit = readOptionalString(record, 'qtyUnit');
  const qtyValue = readOptionalNumber(record, 'qtyValue');
  const recipeId = readOptionalNullableString(record, 'recipeId');
  const source = readOptionalString(record, 'source');

  return {
    name: readRequiredString(record, 'name'),
    ...('categoryId' in record ? { categoryId: categoryId as ItemCategoryId | null } : {}),
    ...(qtyUnit !== undefined ? { qtyUnit: qtyUnit as ItemQuantityUnit } : {}),
    ...(qtyValue !== undefined ? { qtyValue } : {}),
    ...('recipeId' in record ? { recipeId } : {}),
    ...(source !== undefined ? { source: source as ShoppingListSource } : {}),
  };
}

export function readCreateShoppingListBatchBody(body: unknown): readonly CreateShoppingListBody[] {
  const record = requireRecord(body);

  if (!Array.isArray(record.items)) {
    throw new ApiRequestError('items must be an array.', 400);
  }

  return record.items.map(readCreateShoppingListItemBody);
}

export function readUpdateShoppingListItemBody(body: unknown): UpdateShoppingListBody {
  const record = requireRecord(body);
  const categoryId = readOptionalNullableString(record, 'categoryId');
  const checked = readOptionalBoolean(record, 'checked');
  const checkedAt = readOptionalNullableString(record, 'checkedAt');
  const name = readOptionalString(record, 'name');
  const qtyUnit = readOptionalString(record, 'qtyUnit');
  const qtyValue = readOptionalNumber(record, 'qtyValue');
  const recipeId = readOptionalNullableString(record, 'recipeId');
  const source = readOptionalString(record, 'source');

  return {
    ...('categoryId' in record ? { categoryId: categoryId as ItemCategoryId | null } : {}),
    ...(checked !== undefined ? { checked } : {}),
    ...('checkedAt' in record ? { checkedAt } : {}),
    ...(name !== undefined ? { name } : {}),
    ...(qtyUnit !== undefined ? { qtyUnit: qtyUnit as ItemQuantityUnit } : {}),
    ...(qtyValue !== undefined ? { qtyValue } : {}),
    ...('recipeId' in record ? { recipeId } : {}),
    ...(source !== undefined ? { source: source as ShoppingListSource } : {}),
  };
}
