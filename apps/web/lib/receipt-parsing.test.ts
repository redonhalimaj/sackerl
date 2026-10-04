import {
  ApiRequestError,
  type ParsedReceiptDocument,
  type Receipt,
  type ReceiptReview,
} from '@sackerl/api-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getReceipt: vi.fn(),
  markReceiptParseFailed: vi.fn(),
  promoteReceiptParse: vi.fn(),
  updateReceipt: vi.fn(),
}));

vi.mock('./receipts', () => ({
  getWebReceiptsClient: () => mocks,
}));

import { readReceiptParseJobBody, runReceiptParseJob } from './receipt-parsing';

const context = { accessToken: 'token', user: { id: 'user-1' } };
const receipt = {
  activeParseGenerationId: 'generation-0',
  capturedAt: '2026-06-21T17:00:00Z',
  createdAt: '2026-06-21T17:00:00Z',
  currency: 'EUR',
  householdId: 'household-1',
  id: 'receipt-1',
  imageUrl: 'sackerl://receipt/mock-camera',
  parsedAt: null,
  purchasedOn: null,
  reviewedAt: null,
  reviewedBy: null,
  reviewRevision: 7,
  reviewStatus: 'needs_review',
  status: 'uploaded',
  storeName: null,
  totalCents: null,
  updatedAt: '2026-06-21T17:00:00Z',
} satisfies Receipt;
const review = {
  items: [{ id: 'line-1', inferredName: 'Milk' }],
  receipt: { ...receipt, activeParseGenerationId: 'generation-1', reviewRevision: 0 },
  summary: {
    canComplete: false,
    generationId: 'generation-1',
    includedCount: 1,
    receiptId: 'receipt-1',
    reviewedCount: 0,
    reviewRevision: 0,
    reviewStatus: 'needs_review',
    totalLines: 1,
    unresolvedCount: 1,
    unresolvedFields: [],
  },
} as unknown as ReceiptReview;

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('OCR_PROVIDER', 'deterministic');
  mocks.getReceipt.mockResolvedValue(receipt);
  mocks.promoteReceiptParse.mockResolvedValue(review);
  mocks.markReceiptParseFailed.mockResolvedValue({
    ...review,
    receipt: { ...receipt, status: 'failed' },
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('receipt parse job', () => {
  it('reads optional OCR text overrides', () => {
    expect(readReceiptParseJobBody(undefined)).toEqual({});
    expect(readReceiptParseJobBody({ text: ' Milk 1L ' })).toEqual({ text: ' Milk 1L ' });
    expect(() => readReceiptParseJobBody({ text: 1 })).toThrow(ApiRequestError);
  });

  it('promotes parsed output with the current receipt generation and review token', async () => {
    await expect(
      runReceiptParseJob(context, 'household-1', 'receipt-1', {
        text: 'Sackerl Mart\nDate 2026-06-21\nMilk 1L 1.49\nTOTAL EUR 1.49',
      }),
    ).resolves.toMatchObject({ provider: 'deterministic', receipt: { id: 'receipt-1' } });

    const promoteCall = mocks.promoteReceiptParse.mock.calls[0] as
      | [
          typeof context,
          {
            expectedActiveParseGenerationId: string | null;
            expectedReviewRevision: number;
            householdId: string;
            parsed: ParsedReceiptDocument;
            parserVersion: string;
            provider: string;
            receiptId: string;
          },
        ]
      | undefined;

    expect(promoteCall?.[0]).toBe(context);
    expect(promoteCall?.[1]).toMatchObject({
      expectedActiveParseGenerationId: 'generation-0',
      expectedReviewRevision: 7,
      householdId: 'household-1',
      parserVersion: 'deterministic-rules-v1',
      provider: 'deterministic',
      receiptId: 'receipt-1',
    });
    expect(promoteCall?.[1].parsed.currency).toBe('EUR');
    expect(promoteCall?.[1].parsed.items).toHaveLength(1);
    expect(mocks.markReceiptParseFailed).not.toHaveBeenCalled();
    expect(mocks.updateReceipt).not.toHaveBeenCalled();
  });

  it('marks parse failure conditionally so a concurrent success is not wiped', async () => {
    mocks.getReceipt.mockResolvedValue({
      ...receipt,
      imageUrl: 'https://example.test/receipt.png',
    });
    mocks.markReceiptParseFailed.mockRejectedValue(
      new ApiRequestError('Receipt review has changed.', 409),
    );

    await expect(runReceiptParseJob(context, 'household-1', 'receipt-1')).rejects.toMatchObject({
      message: 'OCR provider is not configured for this receipt.',
      status: 503,
    });

    expect(mocks.markReceiptParseFailed).toHaveBeenCalledWith(context, {
      expectedActiveParseGenerationId: 'generation-0',
      expectedReviewRevision: 7,
      householdId: 'household-1',
      receiptId: 'receipt-1',
    });
    expect(mocks.updateReceipt).not.toHaveBeenCalled();
  });
});
