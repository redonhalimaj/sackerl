import { randomUUID } from 'node:crypto';

import type {
  FinalizeReceiptPlacementResult,
  ListUnplacedReceiptReviewsResult,
  ReceiptPlacementStatus,
} from '@sackerl/api-client';
import type { APIResponse } from '@playwright/test';

import {
  buildReviewedReceipt,
  createReceipt,
  ensureHousehold,
  listZones,
  parseReceipt,
  placementCommand,
  reviewedSaveBody,
  saveReview,
} from '../support/builders/receipts';
import { readE2eEnv } from '../support/env';
import { expect, expectJson, test } from '../support/fixtures';

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

/** lib/receipt-placement.ts withNoStore wraps every placement response, including errors. */
function expectNoStore(response: APIResponse): void {
  expect(response.headers()['cache-control']).toBe('no-store');
}

async function placementJson<T = Record<string, unknown>>(response: APIResponse, status: number) {
  expectNoStore(response);
  return expectJson<T>(response, status);
}

test.describe('placement auth and household gates', () => {
  test('401 AUTH_REQUIRED for missing and invalid bearer tokens', async ({ request }) => {
    test.skip(!readE2eEnv(), 'No E2E Supabase target configured.');
    const paths = [`/receipts/${UNKNOWN_ID}/placement`, '/receipts/pending-placement'];
    for (const path of paths) {
      const missing = await placementJson(await request.get(path), 401);
      expect(missing.code).toBe('AUTH_REQUIRED');
      const invalid = await placementJson(
        await request.get(path, { headers: { Authorization: 'Bearer invalid-token' } }),
        401,
      );
      expect(invalid.code).toBe('AUTH_REQUIRED');
    }
    const post = await placementJson(
      await request.post(`/receipts/${UNKNOWN_ID}/placement`, { data: {} }),
      401,
    );
    expect(post.code).toBe('AUTH_REQUIRED');
  });

  test('user without a household gets 403 HOUSEHOLD_ACCESS_REQUIRED', async ({ owner }) => {
    // placementHouseholdResponse maps getRequestHousehold's 404 to 403.
    for (const response of [
      await owner.get(`/receipts/${UNKNOWN_ID}/placement`),
      await owner.post(`/receipts/${UNKNOWN_ID}/placement`, {}),
      await owner.get('/receipts/pending-placement'),
    ]) {
      const body = await placementJson(response, 403);
      expect(body.code).toBe('HOUSEHOLD_ACCESS_REQUIRED');
    }
  });

  test('outsider gets RECEIPT_NOT_FOUND for another household receipt', async ({
    owner,
    outsider,
  }) => {
    const { review, zones } = await buildReviewedReceipt(owner);
    await ensureHousehold(outsider, 'Outsider household');
    const receiptId = review.receipt.id;
    const get = await placementJson(await outsider.get(`/receipts/${receiptId}/placement`), 404);
    expect(get.code).toBe('RECEIPT_NOT_FOUND');
    const post = await placementJson(
      await outsider.post(
        `/receipts/${receiptId}/placement`,
        placementCommand(review, zones[0]!.id),
      ),
      404,
    );
    expect(post.code).toBe('RECEIPT_NOT_FOUND');
  });
});

test.describe('placement input validation', () => {
  test('invalid uuid, empty and malformed bodies, bad queries return 400', async ({
    owner,
    request,
  }) => {
    await ensureHousehold(owner);
    expect((await placementJson(await owner.get('/receipts/not-a-uuid/placement'), 400)).code).toBe(
      'INVALID_PLACEMENT_INPUT',
    );
    expect(
      (await placementJson(await owner.post('/receipts/not-a-uuid/placement', {}), 400)).code,
    ).toBe('INVALID_PLACEMENT_INPUT');

    // Empty body: readJsonBody -> ApiRequestError 400 -> mapped code INVALID_PLACEMENT_INPUT.
    const empty = await placementJson(await owner.post(`/receipts/${UNKNOWN_ID}/placement`), 400);
    expect(empty.error).toBe('JSON object body is required.');
    expect(empty.code).toBe('INVALID_PLACEMENT_INPUT');

    const invalidJson = await request.post(`/receipts/${UNKNOWN_ID}/placement`, {
      data: '{not json',
      headers: {
        Authorization: `Bearer ${owner.user.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    expect((await placementJson(invalidJson, 400)).error).toBe('Invalid JSON body.');

    const extraField = await owner.post(`/receipts/${UNKNOWN_ID}/placement`, {
      assignments: [],
      expectedReviewRevision: 1,
      extra: true,
      generationId: randomUUID(),
      idempotencyKey: randomUUID(),
    });
    expect((await placementJson(extraField, 400)).code).toBe('INVALID_PLACEMENT_INPUT');

    await placementJson(
      await owner.get(`/receipts/${UNKNOWN_ID}/placement?idempotency_key=nope`),
      400,
    );
    await placementJson(await owner.get(`/receipts/${UNKNOWN_ID}/placement?foo=1`), 400);
    await placementJson(await owner.get('/receipts/pending-placement?page=0'), 400);
    await placementJson(await owner.get('/receipts/pending-placement?page_size=101'), 400);
    await placementJson(await owner.get('/receipts/pending-placement?bogus=1'), 400);
  });

  test('unknown receipt returns 404 RECEIPT_NOT_FOUND', async ({ owner }) => {
    await ensureHousehold(owner);
    const body = await placementJson(await owner.get(`/receipts/${UNKNOWN_ID}/placement`), 404);
    expect(body.code).toBe('RECEIPT_NOT_FOUND');
  });
});

test.describe('placement command lifecycle', () => {
  test('place, replay, normalized replay, conflicting key, already placed', async ({ owner }) => {
    const { review, zones } = await buildReviewedReceipt(owner);
    const receiptId = review.receipt.id;

    const before = await placementJson<ReceiptPlacementStatus>(
      await owner.get(`/receipts/${receiptId}/placement`),
      200,
    );
    expect(before).toEqual({ keyMatches: null, placement: null, receiptId, state: 'unplaced' });

    const command = placementCommand(review, zones[0]!.id);
    const placed = await placementJson<FinalizeReceiptPlacementResult>(
      await owner.post(`/receipts/${receiptId}/placement`, command),
      200,
    );
    expect(placed.outcome).toBe('placed');
    expect(placed.placement.receiptId).toBe(receiptId);
    expect(placed.placement.idempotencyKey).toBe(command.idempotencyKey);
    expect(placed.placement.items).toHaveLength(command.assignments.length);

    const replay = await placementJson<FinalizeReceiptPlacementResult>(
      await owner.post(`/receipts/${receiptId}/placement`, command),
      200,
    );
    expect(replay.outcome).toBe('replayed');
    expect(replay.placement).toEqual(placed.placement);

    // Normalized replay: uppercase UUIDs and reversed assignment order are the same command.
    const normalized = {
      assignments: [...command.assignments].reverse().map((a) => ({
        receiptItemId: a.receiptItemId.toUpperCase(),
        zoneId: a.zoneId.toUpperCase(),
      })),
      expectedReviewRevision: command.expectedReviewRevision,
      generationId: command.generationId.toUpperCase(),
      idempotencyKey: command.idempotencyKey.toUpperCase(),
    };
    const normalizedReplay = await placementJson<FinalizeReceiptPlacementResult>(
      await owner.post(`/receipts/${receiptId}/placement`, normalized),
      200,
    );
    expect(normalizedReplay.outcome).toBe('replayed');

    // Same key, different input -> PLACEMENT_KEY_REUSED 409.
    if (zones.length > 1) {
      const conflicting = await placementJson(
        await owner.post(
          `/receipts/${receiptId}/placement`,
          placementCommand(review, zones[1]!.id, command.idempotencyKey),
        ),
        409,
      );
      expect(conflicting.code).toBe('PLACEMENT_KEY_REUSED');
    }

    // Different key on an already placed receipt -> already_placed with the original placement.
    const again = await placementJson<FinalizeReceiptPlacementResult>(
      await owner.post(`/receipts/${receiptId}/placement`, placementCommand(review, zones[0]!.id)),
      200,
    );
    expect(again.outcome).toBe('already_placed');
    expect(again.placement.placementId).toBe(placed.placement.placementId);

    const status = await placementJson<ReceiptPlacementStatus>(
      await owner.get(`/receipts/${receiptId}/placement?idempotency_key=${command.idempotencyKey}`),
      200,
    );
    expect(status.state).toBe('placed');
    expect(status.keyMatches).toBe(true);
    const otherKey = await placementJson<ReceiptPlacementStatus>(
      await owner.get(`/receipts/${receiptId}/placement?idempotency_key=${randomUUID()}`),
      200,
    );
    expect(otherKey.keyMatches).toBe(false);
  });

  test('stale review revision returns 409 STALE_RECEIPT_REVIEW', async ({ owner }) => {
    const { review, zones } = await buildReviewedReceipt(owner);
    const command = {
      ...placementCommand(review, zones[0]!.id),
      expectedReviewRevision: review.receipt.reviewRevision + 1,
    };
    const body = await placementJson(
      await owner.post(`/receipts/${review.receipt.id}/placement`, command),
      409,
    );
    expect(body.code).toBe('STALE_RECEIPT_REVIEW');
  });

  test('assignment set mismatch returns 422', async ({ owner }) => {
    const { review, zones } = await buildReviewedReceipt(owner);
    const command = placementCommand(review, zones[0]!.id);
    const body = await placementJson(
      await owner.post(`/receipts/${review.receipt.id}/placement`, {
        ...command,
        assignments: [
          ...command.assignments.slice(1),
          { receiptItemId: randomUUID(), zoneId: zones[0]!.id },
        ],
      }),
      422,
    );
    expect(body.code).toBe('PLACEMENT_LINE_SET_MISMATCH');
  });

  test('unreviewed line returns 422 RECEIPT_NOT_REVIEWED', async ({ owner }) => {
    await ensureHousehold(owner);
    const receipt = await createReceipt(owner);
    const { review } = await parseReceipt(owner, receipt.id);
    // Save with the first line still unresolved.
    const saved = await saveReview(
      owner,
      receipt.id,
      reviewedSaveBody(review, (line, i) =>
        i === 0 ? { ...line, reviewState: 'unresolved' } : line,
      ),
    );
    const [zone] = await listZones(owner, saved.receipt.householdId);
    const body = await placementJson(
      await owner.post(`/receipts/${receipt.id}/placement`, placementCommand(saved, zone!.id)),
      422,
    );
    expect(body.code).toBe('RECEIPT_NOT_REVIEWED');
  });

  test('foreign zone returns 422 INVALID_PLACEMENT_ZONE', async ({ owner, outsider }) => {
    const { review } = await buildReviewedReceipt(owner);
    const other = await buildReviewedReceipt(outsider);
    const body = await placementJson(
      await owner.post(
        `/receipts/${review.receipt.id}/placement`,
        placementCommand(review, other.zones[0]!.id),
      ),
      422,
    );
    expect(body.code).toBe('INVALID_PLACEMENT_ZONE');
  });
});

test.describe('pending placement list', () => {
  test('paginates and drops a receipt once placed', async ({ owner }) => {
    const first = await buildReviewedReceipt(owner);
    const second = await buildReviewedReceipt(owner);

    const all = await placementJson<ListUnplacedReceiptReviewsResult>(
      await owner.get('/receipts/pending-placement'),
      200,
    );
    expect(all.pagination).toEqual({ page: 1, pageSize: 25, total: 2 });
    expect(all.receipts.map((r) => r.id).sort()).toEqual(
      [first.review.receipt.id, second.review.receipt.id].sort(),
    );

    const page1 = await placementJson<ListUnplacedReceiptReviewsResult>(
      await owner.get('/receipts/pending-placement?page=1&page_size=1'),
      200,
    );
    const page2 = await placementJson<ListUnplacedReceiptReviewsResult>(
      await owner.get('/receipts/pending-placement?page=2&page_size=1'),
      200,
    );
    expect(page1.receipts).toHaveLength(1);
    expect(page2.receipts).toHaveLength(1);
    expect(page1.receipts[0]!.id).not.toBe(page2.receipts[0]!.id);

    await placementJson(
      await owner.post(
        `/receipts/${first.review.receipt.id}/placement`,
        placementCommand(first.review, first.zones[0]!.id),
      ),
      200,
    );
    const after = await placementJson<ListUnplacedReceiptReviewsResult>(
      await owner.get('/receipts/pending-placement'),
      200,
    );
    expect(after.pagination.total).toBe(1);
    expect(after.receipts.map((r) => r.id)).toEqual([second.review.receipt.id]);
  });
});
