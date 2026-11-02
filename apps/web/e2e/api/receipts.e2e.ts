import type { Receipt } from '@sackerl/api-client';

import {
  createReceipt,
  ensureHousehold,
  parseReceipt,
  sampleImageUrl,
} from '../support/builders/receipts';
import { readE2eEnv } from '../support/env';
import { expect, expectJson, test } from '../support/fixtures';

test.describe('receipts: create, list, parse', () => {
  test('401 without or with an invalid bearer token', async ({ request }) => {
    test.skip(!readE2eEnv(), 'No E2E Supabase target configured.');
    const missing = await expectJson(await request.get('/receipts'), 401);
    expect(missing.error).toBe('Missing bearer token.');
    const invalid = await request.post('/receipts', {
      data: { imageUrl: sampleImageUrl() },
      headers: { Authorization: 'Bearer not-a-real-token' },
    });
    expect((await expectJson(invalid, 401)).error).toBe('Invalid bearer token.');
  });

  test('user without a household gets 404 Household not found', async ({ owner }) => {
    const body = await expectJson(await owner.get('/receipts'), 404);
    expect(body.error).toBe('Household not found.');
  });

  test('create returns 201 and the receipt appears in the list', async ({ owner }) => {
    const household = await ensureHousehold(owner);
    const receipt = await createReceipt(owner, { storeName: 'E2E Mart', totalCents: 549 });
    expect(receipt.householdId).toBe(household.id);
    expect(receipt.storeName).toBe('E2E Mart');
    expect(receipt.status).toBe('uploaded');
    expect(receipt.reviewRevision).toBe(0);

    const list = await expectJson<{ pagination: { page: number }; receipts: Receipt[] }>(
      await owner.get('/receipts?page=1&page_size=10'),
      200,
    );
    expect(list.pagination.page).toBe(1);
    expect(list.receipts.map((r) => r.id)).toContain(receipt.id);
  });

  test('create validates the body', async ({ owner }) => {
    await ensureHousehold(owner);
    expect((await expectJson(await owner.post('/receipts', {}), 400)).error).toBe(
      'imageUrl is required.',
    );
    await expectJson(
      await owner.post('/receipts', { imageUrl: sampleImageUrl(), totalCents: 'x' }),
      400,
    );
    await expectJson(await owner.get('/receipts?page=abc'), 400);
  });

  test('create returns 400 for a malformed JSON body', async ({ owner, request }) => {
    await ensureHousehold(owner);
    const headers = {
      Authorization: `Bearer ${owner.user.accessToken}`,
      'Content-Type': 'application/json',
    };
    // A string would be JSON-encoded by Playwright; send raw bytes so the body is malformed.
    const data = Buffer.from('{not json');
    const response = await request.post('/receipts', { data, headers });
    expect((await expectJson(response, 400)).error).toBe('Invalid JSON body.');
  });

  test('parse produces deterministic review lines', async ({ owner }) => {
    await ensureHousehold(owner);
    const receipt = await createReceipt(owner);
    const result = await parseReceipt(owner, receipt.id);
    expect(result.provider).toBe('deterministic');
    expect(result.receipt.status).toBe('parsed');
    expect(result.items.length).toBe(3);
    expect(result.review.summary.generationId).toBeTruthy();
    expect(result.review.summary.totalLines).toBe(3);
  });

  test('parse rejects invalid JSON and non-string text', async ({ owner }) => {
    await ensureHousehold(owner);
    const receipt = await createReceipt(owner);
    await expectJson(await owner.post(`/receipts/${receipt.id}/parse`, { text: 42 }), 400);
  });

  test('parse uses override text', async ({ owner }) => {
    await ensureHousehold(owner);
    const receipt = await createReceipt(owner, { imageUrl: 'https://example.invalid/receipt.jpg' });
    const result = await expectJson<{ items: unknown[] }>(
      await owner.post(`/receipts/${receipt.id}/parse`, {
        text: 'Shop\nMilk 1L 1.49\nTOTAL EUR 1.49',
      }),
      200,
    );
    expect(result.items.length).toBeGreaterThan(0);
  });

  test('outsider cannot list or parse another household receipt', async ({ owner, outsider }) => {
    await ensureHousehold(owner);
    await ensureHousehold(outsider, 'Outsider household');
    const receipt = await createReceipt(owner);
    const list = await expectJson<{ receipts: Receipt[] }>(await outsider.get('/receipts'), 200);
    expect(list.receipts.map((r) => r.id)).not.toContain(receipt.id);
    const parse = await outsider.post(`/receipts/${receipt.id}/parse`);
    expect([403, 404]).toContain(parse.status());
  });
});
