import { describe, expect, it } from 'vitest';

import { readSaveReceiptReviewBody } from './receipt-review-payload';

const line = {
  categoryId: 'dairy',
  id: 'line-1',
  included: true,
  name: 'Milk',
  qtyUnit: 'l',
  qtyValue: 1,
  reviewState: 'reviewed',
};
const body = { expectedReviewRevision: 2, generationId: 'generation-1', lines: [line] };

describe('receipt review request boundary', () => {
  it('keeps editable values and conflict tokens while ignoring caller-owned provenance', () => {
    expect(
      readSaveReceiptReviewBody({
        ...body,
        householdId: 'forged-household',
        receiptId: 'forged-receipt',
        lines: [{ ...line, rawText: 'forged', reviewedBy: 'forged-user', confidence: 1 }],
      }),
    ).toEqual(body);
  });

  it('accepts explicit manual lines and preserves an unresolved review state', () => {
    const { id: _id, ...manual } = line;
    const input = {
      ...body,
      lines: [{ ...manual, clientLineId: 'draft-1', reviewState: 'unresolved' }],
    };
    expect(readSaveReceiptReviewBody(input)).toEqual(input);
  });

  it.each([
    { date: null, state: 'unknown' },
    { date: null, state: 'no_date' },
    { date: '2024-02-29', state: 'dated' },
  ])('preserves an explicit expiry choice while omitted expiry stays absent', (expiry) => {
    const input = { ...body, lines: [{ ...line, expiry }] };
    expect(readSaveReceiptReviewBody(input)).toEqual(input);
    expect(readSaveReceiptReviewBody(body).lines[0]).not.toHaveProperty('expiry');
  });

  it.each([
    { expiry: null },
    { expiry: [] },
    { expiry: { state: 'unknown' } },
    { expiry: { date: '2026-04-31', state: 'dated' } },
    { expiry: { date: '2026-09-30', state: 'no_date' } },
    { expiry: { date: null, state: 'no_date', changedBy: 'forged-user' } },
    { expiry: { date: '2026-09-30', state: 'dated', source: 'printed' } },
    { expiryChangedBy: 'forged-user' },
    { expiryChangedAt: '2026-09-01T00:00:00Z' },
    { expiry_changed_by: 'forged-user' },
    { expiry_changed_at: '2026-09-01T00:00:00Z' },
  ])('rejects invalid expiry or caller-owned expiry attribution', (invalid) => {
    expect(() =>
      readSaveReceiptReviewBody({ ...body, lines: [{ ...line, ...invalid }] }),
    ).toThrow();
  });

  it.each([null, [], { ...body, lines: {} }, { ...body, expectedReviewRevision: '2' }])(
    'rejects malformed request structure',
    (input) => {
      expect(() => readSaveReceiptReviewBody(input)).toThrow();
    },
  );

  it.each([
    { ...line, clientLineId: 'ambiguous-id' },
    { ...line, id: undefined },
    { ...line, included: 'true' },
    { ...line, qtyValue: '1' },
    { ...line, name: undefined },
    { ...line, included: false, name: undefined },
  ])('rejects ambiguous identity or incomplete editable fields', (input) => {
    expect(() => readSaveReceiptReviewBody({ ...body, lines: [input] })).toThrow();
  });
});
