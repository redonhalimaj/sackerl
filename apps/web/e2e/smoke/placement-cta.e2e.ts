import type { ListUnplacedReceiptReviewsResult } from '@sackerl/api-client';

import {
  createReceipt,
  ensureHousehold,
  listZones,
  parseReceipt,
  placementCommand,
  reviewedSaveBody,
  saveReview,
} from '../support/builders/receipts';
import { expect, expectJson, test } from '../support/fixtures';
import { requirePlacementSchema } from '../support/schema';

/**
 * Web has no placement UI. Mobile (apps/mobile/app/receipt-review/[id].tsx, "Continue to
 * placement") keeps the CTA disabled and tells users to save their review first. This checks the
 * API contract that disabled state depends on: an unsaved review (reviewRevision 0) is neither
 * listed as pending placement nor placeable, and a saved review becomes eligible.
 * Skips without a backend, like every fixture-based spec.
 */
test('placement eligibility matches the save-review-first CTA gate', async ({ owner }) => {
  await requirePlacementSchema();
  const household = await ensureHousehold(owner);
  const [zone] = await listZones(owner, household.id);
  const receipt = await createReceipt(owner);
  const { review } = await parseReceipt(owner, receipt.id);

  expect(review.receipt.reviewRevision).toBe(0);
  expect(review.summary.includedCount).toBe(review.items.filter((i) => i.included).length);

  const pendingBefore = await expectJson<ListUnplacedReceiptReviewsResult>(
    await owner.get('/receipts/pending-placement'),
    200,
  );
  expect(pendingBefore.receipts.map((r) => r.id)).not.toContain(receipt.id);

  const unsaved = await expectJson(
    await owner.post(`/receipts/${receipt.id}/placement`, placementCommand(review, zone!.id)),
    422,
  );
  expect(unsaved.code).toBe('RECEIPT_NOT_REVIEWED');

  const saved = await saveReview(owner, receipt.id, reviewedSaveBody(review));
  expect(saved.summary.canComplete).toBe(true);
  const pendingAfter = await expectJson<ListUnplacedReceiptReviewsResult>(
    await owner.get('/receipts/pending-placement'),
    200,
  );
  expect(pendingAfter.receipts.map((r) => r.id)).toContain(receipt.id);
});
