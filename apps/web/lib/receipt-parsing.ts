import {
  ApiRequestError,
  parseReceiptText,
  type AuthenticatedUserContext,
  type ParsedReceiptDocument,
  type Receipt,
  type ReceiptItem,
} from '@sackerl/api-client';

import { getWebReceiptsClient } from './receipts';

export type ReceiptParseJobInput = {
  readonly text?: string | undefined;
};

export type ReceiptParseJobResult = {
  readonly items: readonly ReceiptItem[];
  readonly provider: string;
  readonly receipt: Receipt;
};

type ReceiptTextProviderInput = {
  readonly receipt: Receipt;
  readonly text?: string | undefined;
};

type ReceiptTextProvider = {
  readonly id: string;
  readonly extractText: (input: ReceiptTextProviderInput) => Promise<string>;
};

type JsonRecord = Record<string, unknown>;

const deterministicSampleText = `Sackerl Mart
Date 2026-06-21
Milk 1L 1.49
Bananas 1 kg 2.20
Bread 1.80
TOTAL EUR 5.49`;

const deterministicProvider: ReceiptTextProvider = {
  extractText(input) {
    const overrideText = normaliseOverrideText(input.text);

    if (overrideText) {
      return Promise.resolve(overrideText);
    }

    if (input.receipt.imageUrl.startsWith('sackerl://receipt/')) {
      return Promise.resolve(deterministicSampleText);
    }

    throw new ApiRequestError('OCR provider is not configured for this receipt.', 503);
  },
  id: 'deterministic',
};

export function readReceiptParseJobBody(body: unknown): ReceiptParseJobInput {
  if (body == null) {
    return {};
  }

  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiRequestError('JSON object body is required.', 400);
  }

  const record = body as JsonRecord;
  const text = record.text;

  if (text === undefined) {
    return {};
  }

  if (typeof text !== 'string') {
    throw new ApiRequestError('text must be a string.', 400);
  }

  return { text };
}

export async function runReceiptParseJob(
  context: AuthenticatedUserContext,
  householdId: string,
  receiptId: string,
  input: ReceiptParseJobInput = {},
): Promise<ReceiptParseJobResult> {
  const client = getWebReceiptsClient();
  const provider = resolveReceiptTextProvider();
  let receipt: Receipt | undefined;

  try {
    receipt = await client.getReceipt(context, { householdId, id: receiptId });
    await client.updateReceipt(context, {
      householdId,
      id: receiptId,
      parsedAt: null,
      status: 'parsing',
    });

    const text = await provider.extractText({ receipt, text: input.text });
    const parsed = parseReceiptText(text);

    assertParsedItems(parsed);

    const items = await client.replaceReceiptItems(context, {
      householdId,
      items: parsed.items,
      receiptId,
    });
    const parsedAt = new Date().toISOString();
    const parsedReceipt = await client.updateReceipt(context, {
      currency: parsed.currency,
      householdId,
      id: receiptId,
      parsedAt,
      purchasedOn: parsed.purchasedOn,
      status: 'parsed',
      storeName: parsed.storeName,
      totalCents: parsed.totalCents,
    });

    return {
      items,
      provider: provider.id,
      receipt: parsedReceipt,
    };
  } catch (error) {
    if (receipt) {
      await markReceiptFailed(context, householdId, receiptId);
    }

    throw error;
  }
}

async function markReceiptFailed(
  context: AuthenticatedUserContext,
  householdId: string,
  receiptId: string,
): Promise<void> {
  try {
    await getWebReceiptsClient().updateReceipt(context, {
      householdId,
      id: receiptId,
      parsedAt: null,
      status: 'failed',
    });
  } catch {
    // Preserve the original parse error for the route response.
  }
}

function resolveReceiptTextProvider(): ReceiptTextProvider {
  const provider = (process.env.OCR_PROVIDER ?? 'deterministic').trim().toLowerCase();

  if (!provider || provider === 'deterministic' || provider === 'mock') {
    return deterministicProvider;
  }

  if (provider === 'mindee' || provider === 'google-vision' || provider === 'vision') {
    throw new ApiRequestError(`OCR provider "${provider}" is not wired yet.`, 501);
  }

  throw new ApiRequestError(`Unsupported OCR provider "${provider}".`, 400);
}

function normaliseOverrideText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const text = value.trim();

  if (!text) {
    throw new ApiRequestError('text cannot be empty.', 400);
  }

  if (text.length > 20000) {
    throw new ApiRequestError('text must be 20000 characters or less.', 400);
  }

  return text;
}

function assertParsedItems(parsed: ParsedReceiptDocument): void {
  if (parsed.items.length < 1) {
    throw new ApiRequestError('No receipt line items could be parsed.', 422);
  }
}
