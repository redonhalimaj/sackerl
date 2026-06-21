import { ApiRequestError, type CreateReceiptInput, type ReceiptStatus } from '@sackerl/api-client';

type JsonRecord = Record<string, unknown>;

type CreateReceiptBody = Omit<CreateReceiptInput, 'householdId'>;

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

export function readCreateReceiptBody(body: unknown): CreateReceiptBody {
  const record = requireRecord(body);
  const capturedAt = readOptionalString(record, 'capturedAt');
  const currency = readOptionalString(record, 'currency');
  const status = readOptionalString(record, 'status');
  const storeName = readOptionalNullableString(record, 'storeName');
  const totalCents = readOptionalNullableNumber(record, 'totalCents');

  return {
    imageUrl: readRequiredString(record, 'imageUrl'),
    ...(capturedAt !== undefined ? { capturedAt } : {}),
    ...(currency !== undefined ? { currency } : {}),
    ...(status !== undefined ? { status: status as ReceiptStatus } : {}),
    ...('storeName' in record ? { storeName } : {}),
    ...('totalCents' in record ? { totalCents } : {}),
  };
}
