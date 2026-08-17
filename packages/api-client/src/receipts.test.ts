import { describe, expect, it, vi } from 'vitest';

import type { ApiRequestError, AuthenticatedUserContext } from './profile';
import {
  createSackerlReceiptsClient,
  isReceiptStatus,
  mapReceiptItemRow,
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

function emptyResponse(): Response {
  return new Response(null, { status: 204 });
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
        purchased_on: '2026-06-21',
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
      purchasedOn: '2026-06-21',
      status: 'uploaded',
      storeName: 'Sackerl Mart',
      totalCents: 2480,
      updatedAt: '2026-06-21T17:00:01Z',
    });
  });

  it('maps receipt item database rows into API model shape', () => {
    expect(
      mapReceiptItemRow({
        category_id: 'dairy',
        confidence: '0.950',
        confidence_level: 'high',
        created_at: '2026-06-21T17:00:02Z',
        household_id: 'household-123',
        id: 'receipt-item-123',
        inferred_name: 'Milk',
        line_index: 0,
        qty_unit: 'l',
        qty_value: '1.000',
        raw_text: 'Milk 1L 1.49',
        receipt_id: 'receipt-123',
        updated_at: '2026-06-21T17:00:02Z',
      }),
    ).toEqual({
      categoryId: 'dairy',
      confidence: 0.95,
      confidenceLevel: 'high',
      createdAt: '2026-06-21T17:00:02Z',
      householdId: 'household-123',
      id: 'receipt-item-123',
      inferredName: 'Milk',
      lineIndex: 0,
      qtyUnit: 'l',
      qtyValue: 1,
      rawText: 'Milk 1L 1.49',
      receiptId: 'receipt-123',
      updatedAt: '2026-06-21T17:00:02Z',
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
          purchased_on: null,
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
            purchased_on: null,
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

  it('updates parsed receipt metadata', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse([
        {
          captured_at: '2026-06-21T17:00:00Z',
          created_at: '2026-06-21T17:00:01Z',
          currency: 'EUR',
          household_id: 'household-123',
          id: 'receipt-123',
          image_url: 'sackerl://receipt/mock-camera',
          parsed_at: '2026-06-21T17:00:10Z',
          purchased_on: '2026-06-21',
          status: 'parsed',
          store_name: 'Sackerl Mart',
          total_cents: 549,
          updated_at: '2026-06-21T17:00:10Z',
        },
      ]),
    );
    const client = createSackerlReceiptsClient(config, { fetch: fetchMock });

    await expect(
      client.updateReceipt(context, {
        currency: 'eur',
        householdId: 'household-123',
        id: 'receipt-123',
        parsedAt: '2026-06-21T17:00:10Z',
        purchasedOn: '2026-06-21',
        status: 'parsed',
        storeName: 'Sackerl Mart',
        totalCents: 549,
      }),
    ).resolves.toMatchObject({
      parsedAt: '2026-06-21T17:00:10Z',
      purchasedOn: '2026-06-21',
      status: 'parsed',
      totalCents: 549,
    });

    const url = new URL(requireString(fetchMock.mock.calls[0]?.[0]));

    expect(url.pathname).toBe('/rest/v1/receipts');
    expect(url.searchParams.get('id')).toBe('eq.receipt-123');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('PATCH');
    expect(JSON.parse(requireString(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      currency: 'EUR',
      parsed_at: '2026-06-21T17:00:10Z',
      purchased_on: '2026-06-21',
      status: 'parsed',
      store_name: 'Sackerl Mart',
      total_cents: 549,
    });
  });

  it('replaces parsed receipt items transactionally from the client perspective', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(emptyResponse())
      .mockResolvedValueOnce(
        jsonResponse([
          {
            category_id: 'dairy',
            confidence: '0.950',
            confidence_level: 'high',
            created_at: '2026-06-21T17:00:02Z',
            household_id: 'household-123',
            id: 'receipt-item-123',
            inferred_name: 'Milk',
            line_index: 0,
            qty_unit: 'l',
            qty_value: '1.000',
            raw_text: 'Milk 1L 1.49',
            receipt_id: 'receipt-123',
            updated_at: '2026-06-21T17:00:02Z',
          },
        ]),
      );
    const client = createSackerlReceiptsClient(config, { fetch: fetchMock });

    await expect(
      client.replaceReceiptItems(context, {
        householdId: 'household-123',
        receiptId: 'receipt-123',
        items: [
          {
            categoryId: 'dairy',
            confidence: 0.95,
            confidenceLevel: 'high',
            inferredName: 'Milk',
            qtyUnit: 'l',
            qtyValue: 1,
            rawText: 'Milk 1L 1.49',
          },
        ],
      }),
    ).resolves.toMatchObject([{ id: 'receipt-item-123', inferredName: 'Milk' }]);

    const deleteUrl = new URL(requireString(fetchMock.mock.calls[0]?.[0]));
    const insertUrl = new URL(requireString(fetchMock.mock.calls[1]?.[0]));

    expect(deleteUrl.pathname).toBe('/rest/v1/receipt_items');
    expect(deleteUrl.searchParams.get('receipt_id')).toBe('eq.receipt-123');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('DELETE');
    expect(insertUrl.pathname).toBe('/rest/v1/receipt_items');
    expect(fetchMock.mock.calls[1]?.[1]?.method).toBe('POST');
    expect(JSON.parse(requireString(fetchMock.mock.calls[1]?.[1]?.body))).toEqual([
      {
        category_id: 'dairy',
        confidence: 0.95,
        confidence_level: 'high',
        household_id: 'household-123',
        inferred_name: 'Milk',
        line_index: 0,
        qty_unit: 'l',
        qty_value: 1,
        raw_text: 'Milk 1L 1.49',
        receipt_id: 'receipt-123',
      },
    ]);
  });

  it('lists parsed receipt items in source order', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse([
        {
          category_id: 'produce',
          confidence: '0.900',
          confidence_level: 'high',
          created_at: '2026-06-21T17:00:02Z',
          household_id: 'household-123',
          id: 'receipt-item-123',
          inferred_name: 'Bananas',
          line_index: 0,
          qty_unit: 'kg',
          qty_value: '1.000',
          raw_text: 'Bananas 1 kg 2.20',
          receipt_id: 'receipt-123',
          updated_at: '2026-06-21T17:00:02Z',
        },
      ]),
    );
    const client = createSackerlReceiptsClient(config, { fetch: fetchMock });

    await expect(
      client.listReceiptItems(context, {
        householdId: 'household-123',
        receiptId: 'receipt-123',
      }),
    ).resolves.toMatchObject([{ inferredName: 'Bananas', lineIndex: 0 }]);

    const url = new URL(requireString(fetchMock.mock.calls[0]?.[0]));

    expect(url.pathname).toBe('/rest/v1/receipt_items');
    expect(url.searchParams.get('order')).toBe('line_index.asc');
    expect(url.searchParams.get('receipt_id')).toBe('eq.receipt-123');
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
