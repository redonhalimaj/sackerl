import { ReceiptPlacementApiError } from '@sackerl/api-client';
import { describe, expect, it } from 'vitest';

import {
  readReceiptPlacementCommandBody,
  readReceiptPlacementPageParams,
  readReceiptPlacementStatusQuery,
} from './receipt-placement-payload';

const ids = {
  key: 'aaaaaaaa-1111-4111-8111-111111111111',
  generation: 'bbbbbbbb-2222-4222-8222-222222222222',
  line: 'cccccccc-3333-4333-8333-333333333333',
  zone: 'dddddddd-4444-4444-8444-444444444444',
};

describe('receipt placement payloads', () => {
  it('canonicalizes UUIDs and accepts an empty structurally valid assignment list', () => {
    expect(
      readReceiptPlacementCommandBody({
        assignments: [],
        expectedReviewRevision: 0,
        generationId: ids.generation.toUpperCase(),
        idempotencyKey: ids.key.toUpperCase(),
      }),
    ).toEqual({
      assignments: [],
      expectedReviewRevision: 0,
      generationId: ids.generation,
      idempotencyKey: ids.key,
    });
  });

  it('rejects extra fields, duplicate lines, invalid revision and over-limit assignments', () => {
    const base = {
      assignments: [{ receiptItemId: ids.line, zoneId: ids.zone }],
      expectedReviewRevision: 1,
      generationId: ids.generation,
      idempotencyKey: ids.key,
    };
    for (const value of [
      { ...base, householdId: 'forged' },
      { ...base, assignments: [base.assignments[0], base.assignments[0]] },
      { ...base, expectedReviewRevision: -1 },
      {
        ...base,
        assignments: Array.from({ length: 151 }, (_, i) => ({
          receiptItemId: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
          zoneId: ids.zone,
        })),
      },
    ]) {
      expect(() => readReceiptPlacementCommandBody(value)).toThrow(ReceiptPlacementApiError);
    }
  });

  it('allows only one optional status key and strict positive list pagination', () => {
    expect(
      readReceiptPlacementStatusQuery(new URL('https://local.test/?idempotency_key=' + ids.key)),
    ).toBe(ids.key);
    expect(
      readReceiptPlacementPageParams(new URL('https://local.test/?page=2&page_size=100')),
    ).toEqual({ page: 2, pageSize: 100 });
    for (const url of [
      'https://local.test/?page=0',
      'https://local.test/?page_size=101',
      'https://local.test/?page=1&page=2',
      'https://local.test/?other=x',
    ]) {
      expect(() => readReceiptPlacementPageParams(new URL(url))).toThrow(ReceiptPlacementApiError);
    }
    expect(() =>
      readReceiptPlacementStatusQuery(new URL('https://local.test/?key=' + ids.key)),
    ).toThrow(ReceiptPlacementApiError);
  });
});
