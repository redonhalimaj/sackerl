import {
  ApiRequestError,
  type ItemCategoryId,
  type ItemQuantityUnit,
  type ReceiptItemReviewState,
  type SaveManualReceiptReviewLineInput,
  type SavePersistedReceiptReviewLineInput,
  type SaveReceiptReviewInput,
  type SaveReceiptReviewLineInput,
} from '@sackerl/api-client';

type JsonRecord = Record<string, unknown>;

type SaveReceiptReviewBody = Omit<SaveReceiptReviewInput, 'householdId' | 'receiptId'>;

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

function readRequiredNumber(record: JsonRecord, key: string): number {
  const value = record[key];

  if (typeof value !== 'number') {
    throw new ApiRequestError(`${key} is required.`, 400);
  }

  return value;
}

function readRequiredBoolean(record: JsonRecord, key: string): boolean {
  const value = record[key];

  if (typeof value !== 'boolean') {
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

function readRequiredLine(record: JsonRecord): SaveReceiptReviewLineInput {
  const id = readOptionalString(record, 'id');
  const clientLineId = readOptionalString(record, 'clientLineId');
  const base = {
    categoryId: readRequiredString(record, 'categoryId') as ItemCategoryId,
    included: readRequiredBoolean(record, 'included'),
    name: readRequiredString(record, 'name'),
    qtyUnit: readRequiredString(record, 'qtyUnit') as ItemQuantityUnit,
    qtyValue: readRequiredNumber(record, 'qtyValue'),
    reviewState: readRequiredString(record, 'reviewState') as ReceiptItemReviewState,
  };

  if ((id === undefined) === (clientLineId === undefined)) {
    throw new ApiRequestError(
      'Receipt review lines require exactly one of id or clientLineId.',
      400,
    );
  }

  if (id !== undefined) {
    return {
      ...base,
      id,
    } satisfies SavePersistedReceiptReviewLineInput;
  }

  return {
    ...base,
    clientLineId: clientLineId as string,
  } satisfies SaveManualReceiptReviewLineInput;
}

export function readSaveReceiptReviewBody(body: unknown): SaveReceiptReviewBody {
  const record = requireRecord(body);

  if (!Array.isArray(record.lines)) {
    throw new ApiRequestError('lines must be an array.', 400);
  }

  return {
    expectedReviewRevision: readRequiredNumber(record, 'expectedReviewRevision'),
    generationId: readRequiredString(record, 'generationId'),
    lines: record.lines.map((line) => readRequiredLine(requireRecord(line))),
  };
}
