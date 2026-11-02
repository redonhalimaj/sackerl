import {
  ReceiptPlacementApiError,
  validateReceiptPlacementCommandBody,
  type ReceiptPlacementCommandBody,
} from '@sackerl/api-client';

export function readReceiptPlacementCommandBody(value: unknown): ReceiptPlacementCommandBody {
  return validateReceiptPlacementCommandBody(value);
}

export function readReceiptPlacementStatusKey(value: string | null): string | undefined {
  if (value === null) {
    return undefined;
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new ReceiptPlacementApiError('idempotency_key must be a UUID.', 400, {
      code: 'INVALID_PLACEMENT_INPUT',
    });
  }
  return value.toLowerCase();
}

export function readReceiptPlacementStatusQuery(url: URL): string | undefined {
  for (const key of url.searchParams.keys()) {
    if (key !== 'idempotency_key' || url.searchParams.getAll(key).length !== 1) {
      throw new ReceiptPlacementApiError(
        'Placement status query contains an unsupported parameter.',
        400,
        {
          code: 'INVALID_PLACEMENT_INPUT',
        },
      );
    }
  }
  return readReceiptPlacementStatusKey(url.searchParams.get('idempotency_key'));
}

export function readReceiptPlacementPageParams(url: URL): {
  readonly page: number;
  readonly pageSize: number;
} {
  const allowed = new Set(['page', 'page_size']);
  for (const key of url.searchParams.keys()) {
    if (!allowed.has(key) || url.searchParams.getAll(key).length !== 1) {
      throw new ReceiptPlacementApiError(
        'Placement list query contains an unsupported parameter.',
        400,
        {
          code: 'INVALID_PLACEMENT_INPUT',
        },
      );
    }
  }
  const page = readPositiveQueryInteger(url.searchParams.get('page'), 1, 'page');
  const pageSize = readPositiveQueryInteger(url.searchParams.get('page_size'), 25, 'page_size');
  if (pageSize > 100) {
    throw new ReceiptPlacementApiError('page_size must be at most 100.', 400, {
      code: 'INVALID_PLACEMENT_INPUT',
    });
  }
  return { page, pageSize };
}

function readPositiveQueryInteger(value: string | null, fallback: number, field: string): number {
  if (value === null) {
    return fallback;
  }
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new ReceiptPlacementApiError(`${field} must be a positive integer.`, 400, {
      code: 'INVALID_PLACEMENT_INPUT',
    });
  }
  return Number(value);
}
