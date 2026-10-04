import { describe, expect, it } from 'vitest';
import { receiptReview, reviewItem } from './receipt-review.fixtures';
import {
  buildSaveReceiptReviewInput,
  createManualReceiptReviewLine,
  createReceiptReviewDraft,
  includedLineCount,
  normaliseReceiptExpiryDate,
  formatReceiptExpiryDate,
  reviewNeedsAttention,
  setDraftLineIncluded,
  setDraftLineReviewState,
  updateDraftLine,
  updateDraftLineExpiry,
  validateReceiptReviewDraft,
} from './receipt-review';

const snapshot = {
  householdId: 'home',
  receiptId: 'receipt-1',
  generationId: 'generation-1',
  expectedReviewRevision: 7,
};

describe('receipt review draft contract', () => {
  it('defaults expiry to unknown, validates Gregorian date-only values, and formats without TZ shift', () => {
    const draft = createReceiptReviewDraft(receiptReview());
    expect(draft[0]).toMatchObject({ expiryState: 'unknown', expiryDateInput: '' });
    expect(normaliseReceiptExpiryDate('2024-02-29')).toBe('2024-02-29');
    expect(normaliseReceiptExpiryDate('2023-02-29')).toBeNull();
    expect(normaliseReceiptExpiryDate('2024-04-31')).toBeNull();
    expect(normaliseReceiptExpiryDate('2024-2-09')).toBeNull();
    expect(formatReceiptExpiryDate('2024-02-29', 'en-GB')).toBe('29 February 2024');
  });

  it('serializes each expiry state and requires a real date for dated', () => {
    const base = createReceiptReviewDraft(receiptReview());
    const dated = updateDraftLineExpiry(base, 'line-1', 'dated', '2026-10-01');
    expect(dated[0]?.reviewState).toBe('unresolved');
    expect(buildSaveReceiptReviewInput({ ...snapshot, draft: dated }).lines[0]?.expiry).toEqual({
      date: '2026-10-01',
      state: 'dated',
    });
    expect(
      buildSaveReceiptReviewInput({
        ...snapshot,
        draft: updateDraftLineExpiry(base, 'line-1', 'no_date'),
      }).lines[0]?.expiry,
    ).toEqual({ date: null, state: 'no_date' });
    expect(() =>
      buildSaveReceiptReviewInput({
        ...snapshot,
        draft: updateDraftLineExpiry(base, 'line-1', 'dated', '2026-02-30'),
      }),
    ).toThrow('real date');
  });

  it('does not reset review state for an unchanged expiry or expiry changes on excluded lines', () => {
    const reviewed = createReceiptReviewDraft(
      receiptReview([reviewItem({ reviewState: 'reviewed', included: false })]),
    );
    expect(updateDraftLineExpiry(reviewed, 'line-1', 'unknown')[0]?.reviewState).toBe('reviewed');
    expect(updateDraftLineExpiry(reviewed, 'line-1', 'dated', '2026-10-01')[0]?.reviewState).toBe(
      'reviewed',
    );
  });

  it('uses effective values without approving confident parser output or mutating evidence', () => {
    const review = receiptReview();
    const draft = createReceiptReviewDraft(review);
    expect(draft[0]?.name).toBe('Milk');
    expect(reviewNeedsAttention(draft)).toBe(true);
    const edited = updateDraftLine(draft, 'line-1', { name: 'Oat milk' });
    expect(review.items[0]?.inferredName).toBe('MILCH');
    expect(edited[0]?.confidence).toBe(0.99);
    expect(reviewNeedsAttention(setDraftLineReviewState(edited, 'line-1', 'reviewed'))).toBe(false);
  });

  it('sends every persisted row by ID including saved manual and excluded rows', () => {
    const draft = createReceiptReviewDraft(
      receiptReview([
        reviewItem(),
        reviewItem({
          id: 'saved-manual',
          source: 'manual',
          clientLineId: 'client-1',
          included: false,
        }),
      ]),
    );
    const payload = buildSaveReceiptReviewInput({ ...snapshot, draft });
    expect(payload).toMatchObject(snapshot);
    expect(payload.lines.map((line) => line.id)).toEqual(['line-1', 'saved-manual']);
    expect(payload.lines[1]).toMatchObject({ included: false });
    expect(payload.lines[1]).not.toHaveProperty('clientLineId');
  });

  it('preserves new manual IDs across retries and accepts a decimal comma', () => {
    const draft = [
      {
        ...createManualReceiptReviewLine('stable-client-1'),
        name: 'Beans',
        qtyValueText: '1,5',
        qtyUnit: 'kg' as const,
        categoryId: 'pantry' as const,
      },
    ];
    const first = buildSaveReceiptReviewInput({ ...snapshot, draft });
    expect(first.lines[0]).toMatchObject({
      clientLineId: 'stable-client-1',
      qtyValue: 1.5,
      reviewState: 'unresolved',
    });
    expect(buildSaveReceiptReviewInput({ ...snapshot, draft })).toEqual(first);
  });

  it('retains excluded incomplete rows and rejects them without inventing data', () => {
    const draft = setDraftLineIncluded(
      [createManualReceiptReviewLine('missing')],
      'missing',
      false,
    );
    expect(draft).toHaveLength(1);
    expect(validateReceiptReviewDraft(draft).errors).toHaveLength(4);
    expect(() => buildSaveReceiptReviewInput({ ...snapshot, draft })).toThrow();
  });

  it('allows an all-excluded valid review without claiming anything to place', () => {
    const draft = setDraftLineIncluded(createReceiptReviewDraft(receiptReview()), 'line-1', false);
    expect(reviewNeedsAttention(draft)).toBe(false);
    expect(includedLineCount(draft)).toBe(0);
    expect(buildSaveReceiptReviewInput({ ...snapshot, draft }).lines).toHaveLength(1);
    expect(reviewNeedsAttention(setDraftLineIncluded(draft, 'line-1', true))).toBe(true);
  });

  it('requires re-review after correction and rejects zero/invalid quantities and empty reviews', () => {
    const approved = createReceiptReviewDraft(
      receiptReview([reviewItem({ reviewState: 'reviewed' })]),
    );
    for (const qtyValueText of ['0', '-1', 'Infinity', '1e3', '']) {
      const draft = updateDraftLine(approved, 'line-1', { qtyValueText });
      expect(reviewNeedsAttention(draft)).toBe(true);
      expect(validateReceiptReviewDraft(draft).valid).toBe(false);
    }
    expect(() => buildSaveReceiptReviewInput({ ...snapshot, draft: [] })).toThrow('at least one');
  });
});
