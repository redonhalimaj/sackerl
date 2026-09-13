import { describe, expect, it, vi } from 'vitest';

import type { ApiRequestError, AuthenticatedUserContext } from './profile';
import type { ParsedReceiptLineItem } from './receipt-parsing';
import {
  createSackerlReceiptsClient,
  isReceiptItemReviewState,
  isReceiptItemSource,
  isReceiptReviewStatus,
  isReceiptStatus,
  mapReceiptItemRow,
  mapReceiptReviewSnapshot,
  mapReceiptRow,
  receiptItemReviewStates,
  receiptItemSources,
  receiptReviewStatuses,
  receiptStatuses,
  type DatabaseReceiptItemRow,
  type DatabaseReceiptReviewSnapshot,
  type DatabaseReceiptRow,
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

const baseReceiptRow = {
  active_parse_generation_id: 'generation-123',
  captured_at: '2026-06-21T17:00:00Z',
  created_at: '2026-06-21T17:00:01Z',
  currency: 'EUR',
  household_id: 'household-123',
  id: 'receipt-123',
  image_url: 'sackerl://receipt/mock-camera',
  parsed_at: '2026-06-21T17:00:10Z',
  purchased_on: '2026-06-21',
  reviewed_at: null,
  reviewed_by: null,
  review_revision: 0,
  review_status: 'needs_review',
  status: 'parsed',
  store_name: 'Sackerl Mart',
  total_cents: 2480,
  updated_at: '2026-06-21T17:00:10Z',
} satisfies DatabaseReceiptRow;

const baseItemRow = {
  category_id: 'dairy',
  client_line_id: null,
  confidence: '0.950',
  confidence_level: 'high',
  corrected_at: null,
  corrected_by: null,
  corrected_category_id: null,
  corrected_name: null,
  corrected_qty_unit: null,
  corrected_qty_value: null,
  created_at: '2026-06-21T17:00:02Z',
  generation_id: 'generation-123',
  household_id: 'household-123',
  id: 'receipt-item-123',
  included: true,
  inferred_discount_cents: null,
  inferred_line_total_cents: null,
  inferred_name: 'Milk',
  inferred_tax_cents: null,
  inferred_unit_price_cents: null,
  line_index: 0,
  parser_version: 'deterministic-rules-v1',
  qty_unit: 'l',
  qty_value: '1.000',
  raw_text: 'Milk 1L 1.49',
  receipt_id: 'receipt-123',
  reviewed_at: null,
  reviewed_by: null,
  review_state: 'unresolved',
  source: 'parser',
  updated_at: '2026-06-21T17:00:02Z',
} satisfies DatabaseReceiptItemRow;

function receiptRow(overrides: Partial<DatabaseReceiptRow> = {}): DatabaseReceiptRow {
  return { ...baseReceiptRow, ...overrides };
}

function itemRow(overrides: Partial<DatabaseReceiptItemRow> = {}): DatabaseReceiptItemRow {
  return { ...baseItemRow, ...overrides };
}

function snapshot(
  receipt: DatabaseReceiptRow = receiptRow(),
  items: readonly DatabaseReceiptItemRow[] = [itemRow()],
): DatabaseReceiptReviewSnapshot {
  return { items, receipt };
}

function parsedItem(overrides: Partial<ParsedReceiptLineItem> = {}): ParsedReceiptLineItem {
  return {
    categoryId: 'dairy',
    confidence: 0.95,
    confidenceLevel: 'high',
    discountCents: null,
    inferredName: 'Milk',
    lineTotalCents: null,
    qtyUnit: 'l',
    qtyValue: 1,
    rawText: 'Milk 1L 1.49',
    taxCents: null,
    unitPriceCents: null,
    ...overrides,
  };
}

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
  it('exposes receipt and review state guards', () => {
    expect(receiptStatuses).toEqual(['uploaded', 'parsing', 'parsed', 'failed']);
    expect(receiptReviewStatuses).toEqual(['not_started', 'needs_review', 'reviewed']);
    expect(receiptItemReviewStates).toEqual(['unresolved', 'reviewed']);
    expect(receiptItemSources).toEqual(['parser', 'manual']);
    expect(isReceiptStatus('uploaded')).toBe(true);
    expect(isReceiptStatus('queued')).toBe(false);
    expect(isReceiptReviewStatus('needs_review')).toBe(true);
    expect(isReceiptReviewStatus('high')).toBe(false);
    expect(isReceiptItemReviewState('reviewed')).toBe(true);
    expect(isReceiptItemReviewState('high')).toBe(false);
    expect(isReceiptItemSource('manual')).toBe(true);
    expect(isReceiptItemSource('receipt')).toBe(false);
  });

  it('maps receipt database rows into API model shape with review metadata', () => {
    expect(mapReceiptRow(receiptRow())).toEqual({
      activeParseGenerationId: 'generation-123',
      capturedAt: '2026-06-21T17:00:00Z',
      createdAt: '2026-06-21T17:00:01Z',
      currency: 'EUR',
      householdId: 'household-123',
      id: 'receipt-123',
      imageUrl: 'sackerl://receipt/mock-camera',
      parsedAt: '2026-06-21T17:00:10Z',
      purchasedOn: '2026-06-21',
      reviewedAt: null,
      reviewedBy: null,
      reviewRevision: 0,
      reviewStatus: 'needs_review',
      status: 'parsed',
      storeName: 'Sackerl Mart',
      totalCents: 2480,
      updatedAt: '2026-06-21T17:00:10Z',
    });
  });

  it('maps immutable inferred evidence separately from corrected and effective values', () => {
    expect(
      mapReceiptItemRow(
        itemRow({
          corrected_at: '2026-06-21T17:05:00Z',
          corrected_by: 'user-123',
          corrected_category_id: 'produce',
          corrected_name: 'Oat Milk',
          corrected_qty_unit: 'pcs',
          corrected_qty_value: '2.000',
          inferred_discount_cents: null,
          inferred_line_total_cents: '149',
          inferred_tax_cents: null,
          inferred_unit_price_cents: null,
          reviewed_at: '2026-06-21T17:05:00Z',
          reviewed_by: 'user-123',
          review_state: 'reviewed',
        }),
      ),
    ).toMatchObject({
      confidence: 0.95,
      correctedAt: '2026-06-21T17:05:00Z',
      correctedBy: 'user-123',
      correctedCategoryId: 'produce',
      correctedName: 'Oat Milk',
      correctedQtyUnit: 'pcs',
      correctedQtyValue: 2,
      effectiveCategoryId: 'produce',
      effectiveName: 'Oat Milk',
      effectiveQtyUnit: 'pcs',
      effectiveQtyValue: 2,
      inferredCategoryId: 'dairy',
      inferredDiscountCents: null,
      inferredLineTotalCents: 149,
      inferredName: 'Milk',
      inferredQtyUnit: 'l',
      inferredQtyValue: 1,
      parserVersion: 'deterministic-rules-v1',
      rawText: 'Milk 1L 1.49',
      reviewState: 'reviewed',
      source: 'parser',
      unresolvedFields: [],
    });
  });

  it('builds a typed review summary from an atomic snapshot', () => {
    const review = mapReceiptReviewSnapshot(
      snapshot(receiptRow({ review_revision: 2 }), [
        itemRow({ id: 'item-reviewed', review_state: 'reviewed' }),
        itemRow({
          category_id: null,
          confidence: null,
          confidence_level: null,
          id: 'item-manual',
          inferred_name: null,
          parser_version: null,
          qty_unit: null,
          qty_value: null,
          raw_text: null,
          review_state: 'unresolved',
          source: 'manual',
        }),
      ]),
    );

    expect(review.summary).toEqual({
      canComplete: false,
      generationId: 'generation-123',
      includedCount: 2,
      receiptId: 'receipt-123',
      reviewedCount: 1,
      reviewRevision: 2,
      reviewStatus: 'needs_review',
      totalLines: 2,
      unresolvedCount: 1,
      unresolvedFields: [
        { field: 'reviewState', itemId: 'item-manual' },
        { field: 'name', itemId: 'item-manual' },
        { field: 'qtyValue', itemId: 'item-manual' },
        { field: 'qtyUnit', itemId: 'item-manual' },
        { field: 'categoryId', itemId: 'item-manual' },
      ],
    });
  });

  it('creates an uploaded receipt row without workflow columns in the mutation body', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse([
        receiptRow({
          active_parse_generation_id: null,
          parsed_at: null,
          purchased_on: null,
          review_status: 'not_started',
          status: 'uploaded',
          store_name: null,
          total_cents: null,
        }),
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
      activeParseGenerationId: null,
      householdId: 'household-123',
      id: 'receipt-123',
      imageUrl: 'sackerl://receipt/mock-camera',
      reviewRevision: 0,
      reviewStatus: 'not_started',
      status: 'uploaded',
    });

    const url = new URL(requireString(fetchMock.mock.calls[0]?.[0]));

    expect(url.pathname).toBe('/rest/v1/receipts');
    expect(url.searchParams.get('select')).toContain('active_parse_generation_id');
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

  it('lists receipts with pagination and review metadata', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse([receiptRow()], { headers: { 'Content-Range': '0-24/1' } }),
      );
    const client = createSackerlReceiptsClient(config, { fetch: fetchMock });

    await expect(
      client.listReceipts(context, {
        householdId: 'household-123',
        page: 1,
        pageSize: 25,
        status: 'parsed',
      }),
    ).resolves.toMatchObject({
      pagination: { page: 1, pageSize: 25, total: 1 },
      receipts: [
        { activeParseGenerationId: 'generation-123', id: 'receipt-123', status: 'parsed' },
      ],
    });

    const url = new URL(requireString(fetchMock.mock.calls[0]?.[0]));

    expect(url.pathname).toBe('/rest/v1/receipts');
    expect(url.searchParams.get('household_id')).toBe('eq.household-123');
    expect(url.searchParams.get('status')).toBe('eq.parsed');
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      Prefer: 'count=exact',
      Range: '0-24',
    });
  });

  it('reads receipt review through a single snapshot RPC', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse(snapshot()));
    const client = createSackerlReceiptsClient(config, { fetch: fetchMock });

    await expect(
      client.getReceiptReview(context, {
        householdId: 'household-123',
        receiptId: 'receipt-123',
      }),
    ).resolves.toMatchObject({
      items: [{ id: 'receipt-item-123', inferredName: 'Milk' }],
      receipt: { id: 'receipt-123', reviewRevision: 0 },
      summary: { generationId: 'generation-123', reviewRevision: 0 },
    });

    const url = new URL(requireString(fetchMock.mock.calls[0]?.[0]));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(url.pathname).toBe('/rest/v1/rpc/get_receipt_review');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST');
    expect(JSON.parse(requireString(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      p_household_id: 'household-123',
      p_receipt_id: 'receipt-123',
    });
  });

  it('promotes a parsed receipt through one optimistic snapshot RPC', async () => {
    const promotedSnapshot = snapshot(receiptRow({ review_revision: 0 }), [
      itemRow({ inferred_line_total_cents: null }),
    ]);
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse(promotedSnapshot));
    const client = createSackerlReceiptsClient(config, { fetch: fetchMock });

    await expect(
      client.promoteReceiptParse(context, {
        expectedActiveParseGenerationId: null,
        expectedReviewRevision: 0,
        householdId: 'household-123',
        parsed: {
          currency: 'eur',
          items: [parsedItem()],
          purchasedOn: '2026-06-21',
          storeName: 'Sackerl Mart',
          totalCents: 149,
        },
        parserVersion: 'deterministic-rules-v1',
        provider: 'deterministic',
        receiptId: 'receipt-123',
      }),
    ).resolves.toMatchObject({ receipt: { id: 'receipt-123' }, summary: { reviewRevision: 0 } });

    const url = new URL(requireString(fetchMock.mock.calls[0]?.[0]));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(url.pathname).toBe('/rest/v1/rpc/promote_receipt_parse');
    expect(JSON.parse(requireString(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      p_currency: 'EUR',
      p_expected_active_generation_id: null,
      p_expected_review_revision: 0,
      p_household_id: 'household-123',
      p_items: [
        {
          category_id: 'dairy',
          confidence: 0.95,
          confidence_level: 'high',
          discount_cents: null,
          inferred_name: 'Milk',
          line_total_cents: null,
          qty_unit: 'l',
          qty_value: 1,
          raw_text: 'Milk 1L 1.49',
          tax_cents: null,
          unit_price_cents: null,
        },
      ],
      p_parser_version: 'deterministic-rules-v1',
      p_provider: 'deterministic',
      p_purchased_on: '2026-06-21',
      p_receipt_id: 'receipt-123',
      p_store_name: 'Sackerl Mart',
      p_total_cents: 149,
    });
  });

  it('conditionally marks parse failure without a direct receipt patch', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(
          snapshot(receiptRow({ active_parse_generation_id: null, status: 'failed' }), []),
        ),
      );
    const client = createSackerlReceiptsClient(config, { fetch: fetchMock });

    await expect(
      client.markReceiptParseFailed(context, {
        expectedActiveParseGenerationId: null,
        expectedReviewRevision: 0,
        householdId: 'household-123',
        receiptId: 'receipt-123',
      }),
    ).resolves.toMatchObject({ receipt: { status: 'failed' } });

    const url = new URL(requireString(fetchMock.mock.calls[0]?.[0]));

    expect(url.pathname).toBe('/rest/v1/rpc/mark_receipt_parse_failed');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST');
    expect(JSON.parse(requireString(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      p_expected_active_generation_id: null,
      p_expected_review_revision: 0,
      p_household_id: 'household-123',
      p_receipt_id: 'receipt-123',
    });
  });

  it('saves review edits and manual lines through one snapshot RPC', async () => {
    const savedSnapshot = snapshot(receiptRow({ review_revision: 3, review_status: 'reviewed' }), [
      itemRow({
        corrected_name: 'Whole Milk',
        reviewed_at: '2026-06-21T17:05:00Z',
        review_state: 'reviewed',
      }),
      itemRow({
        category_id: null,
        client_line_id: 'manual-1',
        confidence: null,
        confidence_level: null,
        corrected_category_id: 'produce',
        corrected_name: 'Apples',
        corrected_qty_unit: 'kg',
        corrected_qty_value: '1.000',
        id: 'manual-row-1',
        inferred_name: null,
        line_index: 1,
        parser_version: null,
        qty_unit: null,
        qty_value: null,
        raw_text: null,
        review_state: 'reviewed',
        source: 'manual',
      }),
    ]);
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse(savedSnapshot));
    const client = createSackerlReceiptsClient(config, { fetch: fetchMock });

    await expect(
      client.saveReceiptReview(context, {
        expectedReviewRevision: 2,
        generationId: 'generation-123',
        householdId: 'household-123',
        lines: [
          {
            categoryId: 'dairy',
            id: 'receipt-item-123',
            included: true,
            name: 'Whole Milk',
            qtyUnit: 'l',
            qtyValue: 1,
            reviewState: 'reviewed',
          },
          {
            categoryId: 'produce',
            clientLineId: 'manual-1',
            included: true,
            name: 'Apples',
            qtyUnit: 'kg',
            qtyValue: 1,
            reviewState: 'reviewed',
          },
        ],
        receiptId: 'receipt-123',
      }),
    ).resolves.toMatchObject({
      receipt: { reviewRevision: 3, reviewStatus: 'reviewed' },
      summary: { canComplete: true, reviewRevision: 3 },
    });

    const url = new URL(requireString(fetchMock.mock.calls[0]?.[0]));

    expect(url.pathname).toBe('/rest/v1/rpc/save_receipt_review');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(requireString(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      p_expected_review_revision: 2,
      p_generation_id: 'generation-123',
      p_household_id: 'household-123',
      p_lines: [
        {
          category_id: 'dairy',
          id: 'receipt-item-123',
          included: true,
          name: 'Whole Milk',
          qty_unit: 'l',
          qty_value: 1,
          review_state: 'reviewed',
        },
        {
          category_id: 'produce',
          client_line_id: 'manual-1',
          included: true,
          name: 'Apples',
          qty_unit: 'kg',
          qty_value: 1,
          review_state: 'reviewed',
        },
      ],
      p_receipt_id: 'receipt-123',
    });
  });

  it('keeps replaceReceiptItems as an optimistic promotion compatibility wrapper', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse([receiptRow({ review_revision: 4 })]))
      .mockResolvedValueOnce(jsonResponse(snapshot(receiptRow({ review_revision: 0 }))));
    const client = createSackerlReceiptsClient(config, { fetch: fetchMock });

    await expect(
      client.replaceReceiptItems(context, {
        householdId: 'household-123',
        items: [parsedItem()],
        receiptId: 'receipt-123',
      }),
    ).resolves.toMatchObject([{ id: 'receipt-item-123' }]);

    const promoteUrl = new URL(requireString(fetchMock.mock.calls[1]?.[0]));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(promoteUrl.pathname).toBe('/rest/v1/rpc/promote_receipt_parse');
    expect(JSON.parse(requireString(fetchMock.mock.calls[1]?.[1]?.body))).toMatchObject({
      p_expected_active_generation_id: 'generation-123',
      p_expected_review_revision: 4,
      p_parser_version: 'legacy-replace-receipt-items',
      p_provider: 'client',
    });
  });

  it('maps stale review RPC failures to ApiRequestError 409', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(
          { message: 'Receipt review has changed. Reload before saving.' },
          { status: 409 },
        ),
      );
    const client = createSackerlReceiptsClient(config, { fetch: fetchMock });

    await expect(
      client.saveReceiptReview(context, {
        expectedReviewRevision: 1,
        generationId: 'generation-123',
        householdId: 'household-123',
        lines: [
          {
            categoryId: 'dairy',
            id: 'receipt-item-123',
            included: true,
            name: 'Milk',
            qtyUnit: 'l',
            qtyValue: 1,
            reviewState: 'reviewed',
          },
        ],
        receiptId: 'receipt-123',
      }),
    ).rejects.toMatchObject({
      message: 'Receipt review has changed. Reload before saving.',
      status: 409,
    } satisfies Partial<ApiRequestError>);
  });

  it('rejects ambiguous or duplicate review lines before calling the API', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const client = createSackerlReceiptsClient(config, { fetch: fetchMock });

    await expect(
      client.saveReceiptReview(context, {
        expectedReviewRevision: 0,
        generationId: 'generation-123',
        householdId: 'household-123',
        lines: [
          {
            categoryId: 'dairy',
            id: 'item-1',
            included: true,
            name: 'Milk',
            qtyUnit: 'l',
            qtyValue: 1,
            reviewState: 'reviewed',
          },
          {
            categoryId: 'dairy',
            id: 'item-1',
            included: true,
            name: 'Milk',
            qtyUnit: 'l',
            qtyValue: 1,
            reviewState: 'reviewed',
          },
        ],
        receiptId: 'receipt-123',
      }),
    ).rejects.toMatchObject({
      message: 'Receipt review contains duplicate line ids.',
      status: 400,
    } satisfies Partial<ApiRequestError>);

    await expect(
      client.saveReceiptReview(context, {
        expectedReviewRevision: 0,
        generationId: 'generation-123',
        householdId: 'household-123',
        lines: [
          {
            categoryId: 'produce',
            clientLineId: 'manual-1',
            id: 'item-2',
            included: true,
            name: 'Apples',
            qtyUnit: 'kg',
            qtyValue: 1,
            reviewState: 'reviewed',
          } as never,
        ],
        receiptId: 'receipt-123',
      }),
    ).rejects.toMatchObject({
      message: 'Receipt review lines require exactly one of id or clientLineId.',
      status: 400,
    } satisfies Partial<ApiRequestError>);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects invalid receipt and parse inputs before calling the API', async () => {
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
      client.promoteReceiptParse(context, {
        expectedActiveParseGenerationId: null,
        expectedReviewRevision: 0,
        householdId: 'household-123',
        parsed: {
          currency: 'EUR',
          items: [parsedItem({ confidence: 0.8, confidenceLevel: 'high' })],
          purchasedOn: null,
          storeName: null,
          totalCents: null,
        },
        parserVersion: 'deterministic-rules-v1',
        provider: 'deterministic',
        receiptId: 'receipt-123',
      }),
    ).rejects.toMatchObject({
      message: 'Receipt item confidence level does not match confidence.',
      status: 400,
    } satisfies Partial<ApiRequestError>);
    await expect(
      client.markReceiptParseFailed(context, {
        expectedActiveParseGenerationId: null,
        expectedReviewRevision: -1,
        householdId: 'household-123',
        receiptId: 'receipt-123',
      }),
    ).rejects.toMatchObject({
      message: 'Expected review revision is invalid.',
      status: 400,
    } satisfies Partial<ApiRequestError>);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
