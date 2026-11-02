import { randomUUID } from 'node:crypto';

import type {
  Household,
  Receipt,
  ReceiptReview,
  ReceiptPlacementCommandBody,
} from '@sackerl/api-client';

import { requireE2eEnv } from '../env';
import { expect, expectJson, type ApiClient } from '../fixtures';

/**
 * Receipt / placement builders for API E2E specs. Grounded in:
 * - app/household/route.ts PATCH (creates a household with default zones via ensureHousehold;
 *   zones are seeded by the sync_household_zones trigger, default fridge/pantry/basement/freezer)
 * - app/receipts/route.ts POST (imageUrl required)
 * - lib/receipt-parsing.ts deterministic provider (sackerl://receipt/* -> 3 sample lines)
 * - lib/receipt-review-payload.ts (PUT /receipts/[id]/items body)
 */

/** Deterministic parser image URL; the provider only accepts the sackerl://receipt/ prefix. */
export function sampleImageUrl(): string {
  return `sackerl://receipt/e2e-${randomUUID()}`;
}

export async function ensureHousehold(
  client: ApiClient,
  name = 'E2E household',
): Promise<Household> {
  const body = await expectJson<{ household: Household }>(
    await client.patch('/household', { name }),
    200,
  );
  return body.household;
}

export type StorageZoneRow = { readonly id: string; readonly key: string };

/** No web route exposes zones; read them via PostgREST with the user's own token (RLS-scoped). */
export async function listZones(client: ApiClient, householdId: string): Promise<StorageZoneRow[]> {
  const env = requireE2eEnv();
  const response = await fetch(
    `${env.supabaseUrl}/rest/v1/zones?select=id,key&household_id=eq.${householdId}&order=sort_order`,
    { headers: { apikey: env.anonKey, Authorization: `Bearer ${client.user.accessToken}` } },
  );
  expect(response.status, 'zones lookup').toBe(200);
  const rows = (await response.json()) as StorageZoneRow[];
  expect(rows.length, 'household should have seeded zones').toBeGreaterThan(0);
  return rows;
}

export async function createReceipt(
  client: ApiClient,
  overrides: Record<string, unknown> = {},
): Promise<Receipt> {
  const body = await expectJson<{ receipt: Receipt }>(
    await client.post('/receipts', { imageUrl: sampleImageUrl(), ...overrides }),
    201,
  );
  return body.receipt;
}

export type ParseResult = {
  readonly items: ReceiptReview['items'];
  readonly provider: string;
  readonly receipt: Receipt;
  readonly review: ReceiptReview;
};

export async function parseReceipt(client: ApiClient, receiptId: string): Promise<ParseResult> {
  return expectJson<ParseResult>(await client.post(`/receipts/${receiptId}/parse`), 200);
}

/** Builds a PUT /receipts/[id]/items body that marks every line reviewed with its effective values. */
export function reviewedSaveBody(
  review: ReceiptReview,
  mutate: (line: Record<string, unknown>, index: number) => Record<string, unknown> = (l) => l,
): Record<string, unknown> {
  return {
    expectedReviewRevision: review.receipt.reviewRevision,
    generationId: review.summary.generationId,
    lines: review.items.map((item, index) =>
      mutate(
        {
          categoryId: item.effectiveCategoryId ?? 'pantry',
          id: item.id,
          included: item.included,
          name: item.effectiveName ?? item.rawText ?? `Line ${index + 1}`,
          qtyUnit: item.effectiveQtyUnit ?? 'pcs',
          qtyValue: item.effectiveQtyValue ?? 1,
          reviewState: 'reviewed',
        },
        index,
      ),
    ),
  };
}

export async function saveReview(
  client: ApiClient,
  receiptId: string,
  body: Record<string, unknown>,
): Promise<ReceiptReview> {
  const result = await expectJson<{ review: ReceiptReview }>(
    await client.put(`/receipts/${receiptId}/items`, body),
    200,
  );
  return result.review;
}

/** Household + receipt parsed and fully reviewed, ready for placement. */
export async function buildReviewedReceipt(client: ApiClient): Promise<{
  household: Household;
  review: ReceiptReview;
  zones: StorageZoneRow[];
}> {
  const household = await ensureHousehold(client);
  const zones = await listZones(client, household.id);
  const receipt = await createReceipt(client);
  const parsed = await parseReceipt(client, receipt.id);
  const review = await saveReview(client, receipt.id, reviewedSaveBody(parsed.review));
  return { household, review, zones };
}

export function placementCommand(
  review: ReceiptReview,
  zoneId: string,
  idempotencyKey: string = randomUUID(),
): ReceiptPlacementCommandBody {
  return {
    assignments: review.items
      .filter((item) => item.included)
      .map((item) => ({ receiptItemId: item.id, zoneId })),
    expectedReviewRevision: review.receipt.reviewRevision,
    generationId: review.summary.generationId as string,
    idempotencyKey,
  };
}
