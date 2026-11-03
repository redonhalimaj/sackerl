import type { ReceiptReview } from '@sackerl/api-client';

import {
  createReceipt,
  ensureHousehold,
  parseReceipt,
  reviewedSaveBody,
  saveReview,
} from '../support/builders/receipts';
import { readE2eEnv } from '../support/env';
import { expect, expectJson, test } from '../support/fixtures';

test.describe('receipt review: GET/PUT /receipts/[id]/items', () => {
  test('401 without bearer token', async ({ request }) => {
    test.skip(!readE2eEnv(), 'No E2E Supabase target configured.');
    const id = '00000000-0000-4000-8000-000000000000';
    await expectJson(await request.get(`/receipts/${id}/items`), 401);
    await expectJson(await request.put(`/receipts/${id}/items`, { data: {} }), 401);
  });

  test('get returns review with items mirror', async ({ owner }) => {
    await ensureHousehold(owner);
    const receipt = await createReceipt(owner);
    await parseReceipt(owner, receipt.id);
    const body = await expectJson<{ items: unknown[]; review: ReceiptReview }>(
      await owner.get(`/receipts/${receipt.id}/items`),
      200,
    );
    expect(body.items).toEqual(body.review.items);
    expect(body.review.summary.receiptId).toBe(receipt.id);
  });

  test('save with corrections marks lines reviewed and bumps revision', async ({ owner }) => {
    await ensureHousehold(owner);
    const receipt = await createReceipt(owner);
    const { review } = await parseReceipt(owner, receipt.id);
    const saved = await saveReview(
      owner,
      receipt.id,
      reviewedSaveBody(review, (line, i) =>
        i === 0 ? { ...line, name: 'Corrected milk', qtyValue: 2 } : line,
      ),
    );
    expect(saved.receipt.reviewRevision).toBeGreaterThan(review.receipt.reviewRevision);
    expect(saved.summary.unresolvedCount).toBe(0);
    expect(saved.summary.canComplete).toBe(true);
    const first = saved.items.find((item) => item.id === review.items[0]!.id);
    expect(first?.effectiveName).toBe('Corrected milk');
    expect(first?.effectiveQtyValue).toBe(2);
  });

  test('stale expectedReviewRevision returns 409', async ({ owner }) => {
    await ensureHousehold(owner);
    const receipt = await createReceipt(owner);
    const { review } = await parseReceipt(owner, receipt.id);
    const body = reviewedSaveBody(review);
    await saveReview(owner, receipt.id, body);
    await expectJson(await owner.put(`/receipts/${receipt.id}/items`, body), 409);
  });

  test('invalid bodies return 400', async ({ owner }) => {
    await ensureHousehold(owner);
    const receipt = await createReceipt(owner);
    const { review } = await parseReceipt(owner, receipt.id);
    const base = reviewedSaveBody(review);
    await expectJson(
      await owner.put(`/receipts/${receipt.id}/items`, { ...base, lines: 'x' }),
      400,
    );
    const attribution = reviewedSaveBody(review, (line) => ({ ...line, expiryChangedBy: 'me' }));
    expect(
      (await expectJson(await owner.put(`/receipts/${receipt.id}/items`, attribution), 400)).error,
    ).toBe('Receipt expiry attribution is server-owned.');
    const both = reviewedSaveBody(review, (line) => ({ ...line, clientLineId: 'c1' }));
    await expectJson(await owner.put(`/receipts/${receipt.id}/items`, both), 400);
  });

  test('save returns 400 for a malformed JSON body', async ({ owner, request }) => {
    await ensureHousehold(owner);
    const receipt = await createReceipt(owner);
    const headers = {
      Authorization: `Bearer ${owner.user.accessToken}`,
      'Content-Type': 'application/json',
    };
    // A string would be JSON-encoded by Playwright; send raw bytes so the body is malformed.
    const data = Buffer.from('{not json');
    const response = await request.put(`/receipts/${receipt.id}/items`, { data, headers });
    expect((await expectJson(response, 400)).error).toBe('Invalid JSON body.');
  });

  test('outsider cannot read or save another household review', async ({ owner, outsider }) => {
    await ensureHousehold(owner);
    await ensureHousehold(outsider, 'Outsider household');
    const receipt = await createReceipt(owner);
    const { review } = await parseReceipt(owner, receipt.id);
    expect([403, 404]).toContain((await outsider.get(`/receipts/${receipt.id}/items`)).status());
    const put = await outsider.put(`/receipts/${receipt.id}/items`, reviewedSaveBody(review));
    expect([403, 404, 409]).toContain(put.status());
  });
});
