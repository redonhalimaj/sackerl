import type {
  AuthenticatedUserContext,
  ParsedReceiptDocument,
  ParsedReceiptLineItem,
  SackerlReceiptsClient,
} from '@sackerl/api-client';

export type SampleReceiptAttempt = {
  readonly userId: string;
  readonly householdId: string;
  readonly imageUrl: string;
  createAttempted: boolean;
  receiptId: string | null;
};

const sample: ParsedReceiptDocument = {
  currency: 'EUR',
  purchasedOn: null,
  storeName: 'Sackerl QA sample (not a real purchase)',
  totalCents: 549,
  items: (
    [
      {
        inferredName: 'Milk',
        categoryId: 'dairy',
        qtyUnit: 'l',
        confidence: 0.95,
        confidenceLevel: 'high',
        lineTotalCents: 149,
      },
      {
        inferredName: 'Bananas',
        categoryId: 'produce',
        qtyUnit: 'kg',
        confidence: 0.75,
        confidenceLevel: 'mid',
        lineTotalCents: 220,
      },
      {
        inferredName: 'Bread',
        categoryId: 'bakery',
        qtyUnit: 'pcs',
        confidence: 0.4,
        confidenceLevel: 'needs_review',
        lineTotalCents: 180,
      },
    ] satisfies Pick<
      ParsedReceiptLineItem,
      | 'inferredName'
      | 'categoryId'
      | 'qtyUnit'
      | 'confidence'
      | 'confidenceLevel'
      | 'lineTotalCents'
    >[]
  ).map((row) => ({
    ...row,
    qtyValue: 1,
    rawText: `SAMPLE: ${row.inferredName}`,
    discountCents: null,
    taxCents: null,
    unitPriceCents: row.lineTotalCents,
  })),
};

export function createSampleReceiptAttempt(
  userId: string,
  householdId: string,
): SampleReceiptAttempt {
  return {
    userId,
    householdId,
    imageUrl: `sackerl://receipt/development-sample/${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createAttempted: false,
    receiptId: null,
  };
}

/** Reuse the same attempt after errors. A lost create response must never cause another insert. */
export async function loadSampleReceipt(
  client: Pick<
    SackerlReceiptsClient,
    'createReceipt' | 'listReceipts' | 'getReceiptReview' | 'promoteReceiptParse'
  >,
  context: AuthenticatedUserContext,
  attempt: SampleReceiptAttempt,
  isCurrent: () => boolean,
): Promise<string | null> {
  if (!isCurrent()) return null;
  if (context.user.id !== attempt.userId) throw new Error('Sample belongs to another session.');
  const { householdId } = attempt;
  if (!attempt.receiptId && !attempt.createAttempted) {
    attempt.createAttempted = true;
    try {
      const receipt = await client.createReceipt(context, {
        householdId,
        imageUrl: attempt.imageUrl,
        storeName: sample.storeName,
        totalCents: sample.totalCents,
        currency: sample.currency,
        status: 'uploaded',
      });
      // Retain the ID for recovery even if this request lost focus while saving.
      attempt.receiptId = receipt.id;
    } catch {
      if (!isCurrent()) return null;
      throw new Error(
        'Could not confirm sample creation. Tap Load sample receipt again to recover it.',
      );
    }
  }
  if (!isCurrent()) return null;
  if (!attempt.receiptId) {
    for (let page = 1; ; page += 1) {
      const result = await client.listReceipts(context, { householdId, page, pageSize: 100 });
      if (!isCurrent()) return null;
      const existing = result.receipts.find((receipt) => receipt.imageUrl === attempt.imageUrl);
      if (existing) {
        attempt.receiptId = existing.id;
        break;
      }
      if (
        result.receipts.length < result.pagination.pageSize ||
        (result.pagination.total !== null &&
          page * result.pagination.pageSize >= result.pagination.total)
      ) {
        throw new Error(
          'Sample creation is still unconfirmed. Retry to look again; no second sample will be created.',
        );
      }
    }
  }
  const receiptId = attempt.receiptId;
  const review = await client.getReceiptReview(context, { householdId, receiptId });
  if (!isCurrent()) return null;
  if (!review.receipt.activeParseGenerationId) {
    try {
      await client.promoteReceiptParse(context, {
        householdId,
        receiptId,
        expectedActiveParseGenerationId: null,
        expectedReviewRevision: review.receipt.reviewRevision,
        parsed: sample,
        parserVersion: 'development-fixture-v1',
        provider: 'development-fixture',
      });
    } catch (error) {
      if (!isCurrent()) return null;
      // A lost response or conflict may mean promotion already succeeded. Preserve its edits.
      const recovered = await client.getReceiptReview(context, { householdId, receiptId });
      if (!isCurrent()) return null;
      if (!recovered.receipt.activeParseGenerationId) throw error;
    }
  }
  return isCurrent() ? receiptId : null;
}
