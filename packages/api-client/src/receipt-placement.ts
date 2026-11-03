import { ApiRequestError } from './profile';

export const receiptPlacementOutcomes = ['placed', 'replayed', 'already_placed'] as const;
export type ReceiptPlacementOutcome = (typeof receiptPlacementOutcomes)[number];

export const receiptPlacementErrorCodes = [
  'INVALID_PLACEMENT_INPUT',
  'AUTH_REQUIRED',
  'HOUSEHOLD_ACCESS_REQUIRED',
  'RECEIPT_NOT_FOUND',
  'PLACEMENT_KEY_REUSED',
  'STALE_RECEIPT_REVIEW',
  'PLACEMENT_CONFLICT',
  'RECEIPT_ALREADY_PLACED',
  'RECEIPT_NOT_REVIEWED',
  'EMPTY_RECEIPT_PLACEMENT',
  'PLACEMENT_LINE_SET_MISMATCH',
  'INVALID_PLACEMENT_LINE',
  'INVALID_PLACEMENT_ZONE',
  'RECEIPT_LINEAGE_REQUIRED',
] as const;
export type ReceiptPlacementErrorCode = (typeof receiptPlacementErrorCodes)[number];

export type ReceiptPlacementAssignment = {
  readonly receiptItemId: string;
  readonly zoneId: string;
};

export type ReceiptPlacementCommandBody = {
  readonly assignments: readonly ReceiptPlacementAssignment[];
  readonly expectedReviewRevision: number;
  readonly generationId: string;
  readonly idempotencyKey: string;
};

export type FinalizeReceiptPlacementInput = ReceiptPlacementCommandBody & {
  readonly householdId: string;
  readonly receiptId: string;
};

export type ReceiptPlacementItem = {
  readonly acquisitionEventId: string;
  readonly categoryId: string;
  readonly expiresOn: string | null;
  readonly expiryFactId: string | null;
  readonly itemId: string;
  readonly name: string;
  readonly qtyUnit: string;
  readonly qtyValue: number;
  readonly receiptItemId: string;
  readonly zoneId: string;
};

export type ReceiptPlacement = {
  readonly addedOn: string;
  readonly generationId: string;
  readonly householdId: string;
  readonly idempotencyKey: string;
  readonly items: readonly ReceiptPlacementItem[];
  readonly placedAt: string;
  readonly placedBy: string;
  readonly placementId: string;
  readonly purchasedOn: string | null;
  readonly receiptId: string;
  readonly reviewRevision: number;
};

export type FinalizeReceiptPlacementResult = {
  readonly outcome: ReceiptPlacementOutcome;
  readonly placement: ReceiptPlacement;
};

export type GetReceiptPlacementInput = {
  readonly householdId: string;
  readonly idempotencyKey?: string | undefined;
  readonly receiptId: string;
};

export type ReceiptPlacementStatus = {
  readonly keyMatches: boolean | null;
  readonly placement: ReceiptPlacement | null;
  readonly receiptId: string;
  readonly state: 'placed' | 'unplaced';
};

export type ListUnplacedReceiptReviewsInput = {
  readonly householdId: string;
  readonly page?: number | undefined;
  readonly pageSize?: number | undefined;
};

export type ReceiptPlacementApiErrorOptions = {
  readonly code?: ReceiptPlacementErrorCode | undefined;
  readonly field?: string | undefined;
  readonly outcomeUnknown?: boolean | undefined;
  readonly receiptItemId?: string | undefined;
};

export class ReceiptPlacementApiError extends ApiRequestError {
  readonly code: ReceiptPlacementErrorCode | undefined;
  readonly field: string | undefined;
  readonly outcomeUnknown: boolean;
  readonly receiptItemId: string | undefined;

  constructor(message: string, status: number, options: ReceiptPlacementApiErrorOptions = {}) {
    super(message, status);
    this.name = 'ReceiptPlacementApiError';
    this.code = options.code;
    this.field = options.field;
    this.outcomeUnknown = options.outcomeUnknown ?? false;
    this.receiptItemId = options.receiptItemId;
  }
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timestampPattern = /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/;

function isGregorianDate(value: string): boolean {
  if (!datePattern.test(value)) {
    return false;
  }
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysByMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= (daysByMonth[month - 1] ?? 0);
}

function invalidInput(message: string): never {
  throw new ReceiptPlacementApiError(message, 400, { code: 'INVALID_PLACEMENT_INPUT' });
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return invalidInput(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function requireExactKeys(
  record: Record<string, unknown>,
  expected: readonly string[],
  label: string,
): void {
  if (Object.keys(record).some((key) => !expected.includes(key))) {
    invalidInput(`${label} contains an unsupported field.`);
  }

  if (expected.some((key) => !Object.prototype.hasOwnProperty.call(record, key))) {
    invalidInput(`${label} is missing a required field.`);
  }
}

export function normalizePlacementUuid(value: unknown, field: string): string {
  if (typeof value !== 'string' || !uuidPattern.test(value)) {
    invalidInput(`${field} must be a UUID.`);
  }

  return value.toLowerCase();
}

export function validateReceiptPlacementCommandBody(value: unknown): ReceiptPlacementCommandBody {
  const record = requireRecord(value, 'Placement body');
  requireExactKeys(
    record,
    ['idempotencyKey', 'generationId', 'expectedReviewRevision', 'assignments'],
    'Placement body',
  );

  if (
    !Number.isSafeInteger(record.expectedReviewRevision) ||
    Number(record.expectedReviewRevision) < 0
  ) {
    invalidInput('expectedReviewRevision must be a non-negative integer.');
  }

  if (!Array.isArray(record.assignments) || record.assignments.length > 150) {
    invalidInput('assignments must be an array of at most 150 entries.');
  }

  const assignments = record.assignments.map((value) => {
    const assignment = requireRecord(value, 'Assignment');
    requireExactKeys(assignment, ['receiptItemId', 'zoneId'], 'Assignment');

    return {
      receiptItemId: normalizePlacementUuid(assignment.receiptItemId, 'receiptItemId'),
      zoneId: normalizePlacementUuid(assignment.zoneId, 'zoneId'),
    };
  });

  if (
    new Set(assignments.map((assignment) => assignment.receiptItemId)).size !== assignments.length
  ) {
    invalidInput('assignments contains duplicate receiptItemId values.');
  }
  assignments.sort((left, right) => left.receiptItemId.localeCompare(right.receiptItemId));

  return {
    assignments,
    expectedReviewRevision: Number(record.expectedReviewRevision),
    generationId: normalizePlacementUuid(record.generationId, 'generationId'),
    idempotencyKey: normalizePlacementUuid(record.idempotencyKey, 'idempotencyKey'),
  };
}

export function parseReceiptPlacement(value: unknown): ReceiptPlacement {
  const record = requireRecord(value, 'placement');
  const keys = [
    'placementId',
    'householdId',
    'receiptId',
    'idempotencyKey',
    'generationId',
    'reviewRevision',
    'placedBy',
    'placedAt',
    'addedOn',
    'purchasedOn',
    'items',
  ];
  requireExactKeys(record, keys, 'placement');

  if (!Number.isSafeInteger(record.reviewRevision) || Number(record.reviewRevision) < 0) {
    throw new TypeError('Malformed placement reviewRevision.');
  }
  if (
    typeof record.placedAt !== 'string' ||
    !timestampPattern.test(record.placedAt) ||
    !Number.isFinite(Date.parse(record.placedAt))
  ) {
    throw new TypeError('Malformed placement placedAt.');
  }
  if (typeof record.addedOn !== 'string' || !isGregorianDate(record.addedOn)) {
    throw new TypeError('Malformed placement addedOn.');
  }
  if (
    record.purchasedOn !== null &&
    (typeof record.purchasedOn !== 'string' || !isGregorianDate(record.purchasedOn))
  ) {
    throw new TypeError('Malformed placement purchasedOn.');
  }
  if (!Array.isArray(record.items) || record.items.length === 0) {
    throw new TypeError('Malformed placement items.');
  }

  const items = record.items.map((value) => {
    const item = requireRecord(value, 'placement item');
    requireExactKeys(
      item,
      [
        'receiptItemId',
        'itemId',
        'acquisitionEventId',
        'name',
        'qtyValue',
        'qtyUnit',
        'categoryId',
        'zoneId',
        'expiresOn',
        'expiryFactId',
      ],
      'placement item',
    );
    if (
      typeof item.name !== 'string' ||
      item.name.trim().length === 0 ||
      typeof item.qtyUnit !== 'string' ||
      item.qtyUnit.trim().length === 0 ||
      typeof item.categoryId !== 'string' ||
      item.categoryId.trim().length === 0 ||
      typeof item.qtyValue !== 'number' ||
      !Number.isFinite(item.qtyValue) ||
      item.qtyValue <= 0 ||
      (item.expiresOn !== null &&
        (typeof item.expiresOn !== 'string' || !isGregorianDate(item.expiresOn)))
    ) {
      throw new TypeError('Malformed placement item values.');
    }

    return {
      acquisitionEventId: normalizePlacementUuid(item.acquisitionEventId, 'acquisitionEventId'),
      categoryId: item.categoryId,
      expiresOn: item.expiresOn,
      expiryFactId:
        item.expiryFactId === null
          ? null
          : normalizePlacementUuid(item.expiryFactId, 'expiryFactId'),
      itemId: normalizePlacementUuid(item.itemId, 'itemId'),
      name: item.name,
      qtyUnit: item.qtyUnit,
      qtyValue: item.qtyValue,
      receiptItemId: normalizePlacementUuid(item.receiptItemId, 'receiptItemId'),
      zoneId: normalizePlacementUuid(item.zoneId, 'zoneId'),
    } satisfies ReceiptPlacementItem;
  });

  const receiptItemIds = items.map((item) => item.receiptItemId);
  if (
    new Set(receiptItemIds).size !== receiptItemIds.length ||
    items.some((item, index) => index > 0 && receiptItemIds[index - 1]! > item.receiptItemId)
  ) {
    throw new TypeError('Malformed placement item order.');
  }

  return {
    addedOn: record.addedOn,
    generationId: normalizePlacementUuid(record.generationId, 'generationId'),
    householdId: normalizePlacementUuid(record.householdId, 'householdId'),
    idempotencyKey: normalizePlacementUuid(record.idempotencyKey, 'idempotencyKey'),
    items,
    placedAt: record.placedAt,
    placedBy: normalizePlacementUuid(record.placedBy, 'placedBy'),
    placementId: normalizePlacementUuid(record.placementId, 'placementId'),
    purchasedOn: record.purchasedOn,
    receiptId: normalizePlacementUuid(record.receiptId, 'receiptId'),
    reviewRevision: Number(record.reviewRevision),
  };
}

export function parseFinalizeReceiptPlacementResult(
  value: unknown,
): FinalizeReceiptPlacementResult {
  const record = requireRecord(value, 'placement response');
  requireExactKeys(record, ['outcome', 'placement'], 'placement response');
  if (!receiptPlacementOutcomes.includes(record.outcome as ReceiptPlacementOutcome)) {
    throw new TypeError('Malformed placement outcome.');
  }

  return {
    outcome: record.outcome as ReceiptPlacementOutcome,
    placement: parseReceiptPlacement(record.placement),
  };
}

export function parseReceiptPlacementStatus(value: unknown): ReceiptPlacementStatus {
  const record = requireRecord(value, 'placement status');
  requireExactKeys(record, ['state', 'receiptId', 'placement', 'keyMatches'], 'placement status');
  if (
    (record.state !== 'placed' && record.state !== 'unplaced') ||
    (record.keyMatches !== null && typeof record.keyMatches !== 'boolean')
  ) {
    throw new TypeError('Malformed placement status.');
  }
  const placement = record.placement === null ? null : parseReceiptPlacement(record.placement);
  if ((record.state === 'placed') !== (placement !== null)) {
    throw new TypeError('Malformed placement status state.');
  }
  if (
    (record.state === 'unplaced' && record.keyMatches !== null) ||
    (placement && placement.receiptId !== record.receiptId)
  ) {
    throw new TypeError('Malformed placement status key or receipt.');
  }

  return {
    keyMatches: record.keyMatches,
    placement,
    receiptId: normalizePlacementUuid(record.receiptId, 'receiptId'),
    state: record.state,
  };
}

export function parseReceiptPlacementErrorCode(
  value: unknown,
): ReceiptPlacementErrorCode | undefined {
  return typeof value === 'string' &&
    receiptPlacementErrorCodes.includes(value as ReceiptPlacementErrorCode)
    ? (value as ReceiptPlacementErrorCode)
    : undefined;
}
