import { assertSupabaseAuthConfig, type SupabaseAuthConfig } from './auth';
import { ApiRequestError, type AuthenticatedUserContext } from './profile';

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
  readonly status: ReceiptStatus;
  readonly store_name: string | null;
  readonly total_cents: number | null;
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
  status?: ReceiptStatus;
  store_name?: string | null;
  total_cents?: number | null;
};

const receiptSelect =
  'id,household_id,image_url,store_name,total_cents,currency,captured_at,parsed_at,status,created_at,updated_at';
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
    status: row.status,
    storeName: row.store_name,
    totalCents: row.total_cents,
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

function normaliseCapturedAt(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!timestampPattern.test(value) || Number.isNaN(Date.parse(value))) {
    throw new ApiRequestError('capturedAt must be an ISO timestamp.', 400);
  }

  return value;
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
    const capturedAt = normaliseCapturedAt(input.capturedAt);
    const storeName = normaliseStoreName(input.storeName);
    const totalCents = normaliseTotalCents(input.totalCents);

    if (capturedAt !== undefined) {
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

  private async request<T>(
    table: string,
    context: AuthenticatedUserContext,
    query: Record<string, QueryValue | undefined>,
    options: {
      readonly body?: object | undefined;
      readonly count?: boolean | undefined;
      readonly method?: 'GET' | 'POST' | undefined;
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
      headers.Prefer = 'return=representation';
    }

    if (options.count) {
      headers.Prefer = headers.Prefer ? `${headers.Prefer},count=exact` : 'count=exact';
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
