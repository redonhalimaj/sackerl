import { describe, expect, it, vi } from 'vitest';

import type { ApiRequestError, AuthenticatedUserContext } from './profile';
import {
  createSackerlReceiptsClient,
  isReceiptStatus,
  mapReceiptRow,
  receiptStatuses,
} from './receipts';

const config = {
  anonKey: 'public-key',
  url: 'https://sackerl.supabase.co',
};

const context = {
  accessToken: 'access-token',
  user: {
    email: 'test@sackerl.com',
    id: 'user-123',
  },
} satisfies AuthenticatedUserContext;

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', ...init.headers },
    status: 200,
    ...init,
  });
}

function requireString(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Expected a string value.');
  }

  return value;
}

describe('receipts API client', () => {
  it('exposes receipt statuses and guards accepted values', () => {
    expect(receiptStatuses).toEqual(['uploaded', 'parsing', 'parsed', 'failed']);
    expect(isReceiptStatus('uploaded')).toBe(true);
    expect(isReceiptStatus('queued')).toBe(false);
  });

  it('maps receipt database rows into API model shape', () => {
    expect(
      mapReceiptRow({
        captured_at: '2026-06-21T17:00:00Z',
        created_at: '2026-06-21T17:00:01Z',
        currency: 'EUR',
        household_id: 'household-123',
        id: 'receipt-123',
        image_url: 'sackerl://receipt/mock-camera',
        parsed_at: null,
        status: 'uploaded',
        store_name: 'Sackerl Mart',
        total_cents: 2480,
        updated_at: '2026-06-21T17:00:01Z',
      }),
    ).toEqual({
      capturedAt: '2026-06-21T17:00:00Z',
      createdAt: '2026-06-21T17:00:01Z',
      currency: 'EUR',
      householdId: 'household-123',
      id: 'receipt-123',
      imageUrl: 'sackerl://receipt/mock-camera',
      parsedAt: null,
      status: 'uploaded',
      storeName: 'Sackerl Mart',
      totalCents: 2480,
      updatedAt: '2026-06-21T17:00:01Z',
    });
  });

  it('creates an uploaded receipt row', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse([
        {
          captured_at: '2026-06-21T17:00:00Z',
          created_at: '2026-06-21T17:00:01Z',
          currency: 'EUR',
          household_id: 'household-123',
          id: 'receipt-123',
          image_url: 'sackerl://receipt/mock-camera',
          parsed_at: null,
          status: 'uploaded',
          store_name: null,
          total_cents: null,
          updated_at: '2026-06-21T17:00:01Z',
        },
      ]),
    );
    const client = createSackerlReceiptsClient(config, { fetch: fetchMock });

    await expect(
      client.createReceipt(context, {
        capturedAt: '2026-06-21T17:00:00Z',
        householdId: 'household-123',
        imageUrl: 'sackerl://receipt/mock-camera',
      }),
    ).resolves.toMatchObject({
      householdId: 'household-123',
      id: 'receipt-123',
      imageUrl: 'sackerl://receipt/mock-camera',
      status: 'uploaded',
    });

    const url = new URL(requireString(fetchMock.mock.calls[0]?.[0]));

    expect(url.pathname).toBe('/rest/v1/receipts');
    expect(url.searchParams.get('select')).toContain('image_url');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST');
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      Prefer: 'return=representation',
    });
    expect(JSON.parse(requireString(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      captured_at: '2026-06-21T17:00:00Z',
      currency: 'EUR',
      household_id: 'household-123',
      image_url: 'sackerl://receipt/mock-camera',
      status: 'uploaded',
    });
  });

  it('lists receipts with pagination and status filter', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse(
        [
          {
            captured_at: '2026-06-21T17:00:00Z',
            created_at: '2026-06-21T17:00:01Z',
            currency: 'EUR',
            household_id: 'household-123',
            id: 'receipt-123',
            image_url: 'sackerl://receipt/mock-camera',
            parsed_at: null,
            status: 'uploaded',
            store_name: null,
            total_cents: null,
            updated_at: '2026-06-21T17:00:01Z',
          },
        ],
        { headers: { 'Content-Range': '0-24/1' } },
      ),
    );
    const client = createSackerlReceiptsClient(config, { fetch: fetchMock });

    await expect(
      client.listReceipts(context, {
        householdId: 'household-123',
        page: 1,
        pageSize: 25,
        status: 'uploaded',
      }),
    ).resolves.toMatchObject({
      pagination: { page: 1, pageSize: 25, total: 1 },
      receipts: [{ id: 'receipt-123', status: 'uploaded' }],
    });

    const url = new URL(requireString(fetchMock.mock.calls[0]?.[0]));

    expect(url.pathname).toBe('/rest/v1/receipts');
    expect(url.searchParams.get('household_id')).toBe('eq.household-123');
    expect(url.searchParams.get('status')).toBe('eq.uploaded');
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      Prefer: 'count=exact',
      Range: '0-24',
    });
  });

  it('rejects invalid receipt inputs before calling the API', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const client = createSackerlReceiptsClient(config, { fetch: fetchMock });

    await expect(
      client.createReceipt(context, {
        householdId: 'household-123',
        imageUrl: '',
      }),
    ).rejects.toMatchObject({
      message: 'Receipt image URL is required.',
      status: 400,
    } satisfies Partial<ApiRequestError>);
    await expect(
      client.createReceipt(context, {
        currency: 'Euro',
        householdId: 'household-123',
        imageUrl: 'sackerl://receipt/mock-camera',
      }),
    ).rejects.toMatchObject({
      message: 'Receipt currency must be a 3-letter code.',
      status: 400,
    } satisfies Partial<ApiRequestError>);
    await expect(
      client.createReceipt(context, {
        capturedAt: 'today',
        householdId: 'household-123',
        imageUrl: 'sackerl://receipt/mock-camera',
      }),
    ).rejects.toMatchObject({
      message: 'capturedAt must be an ISO timestamp.',
      status: 400,
    } satisfies Partial<ApiRequestError>);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
