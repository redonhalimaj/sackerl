import {
  itemCategories,
  itemQuantityUnits,
  type ItemCategoryId,
  type ItemQuantityUnit,
  type ReceiptItem,
  type ReceiptItemReviewState,
  type ReceiptLineExpiry,
  type ReceiptReview,
  type SaveReceiptReviewInput,
} from '@sackerl/api-client';

export type ReceiptReviewDraftLine = {
  readonly categoryId: ItemCategoryId | null;
  readonly clientLineId: string | null;
  readonly confidence: number | null;
  readonly confidenceLevel: ReceiptItem['confidenceLevel'];
  readonly expiryDateInput: string;
  readonly expiryState: ReceiptLineExpiry['state'];
  readonly id: string | null;
  readonly included: boolean;
  readonly name: string;
  readonly qtyUnit: ItemQuantityUnit | null;
  readonly qtyValueText: string;
  readonly rawText: string | null;
  readonly reviewState: ReceiptItemReviewState;
  readonly source: ReceiptItem['source'];
};

export type ReceiptReviewDraftError = {
  readonly field: 'categoryId' | 'expiry' | 'name' | 'qtyUnit' | 'qtyValue';
  readonly lineKey: string;
  readonly message: string;
};

export type ReceiptReviewDraftValidation = {
  readonly errors: readonly ReceiptReviewDraftError[];
  readonly valid: boolean;
};

export function lineKey(line: Pick<ReceiptReviewDraftLine, 'clientLineId' | 'id'>): string {
  return line.id ?? line.clientLineId ?? '';
}

function quantityText(value: number | null): string {
  return value == null ? '' : String(value);
}

export function createReceiptReviewDraft(review: ReceiptReview): ReceiptReviewDraftLine[] {
  return review.items.map((item) => ({
    categoryId: item.effectiveCategoryId,
    clientLineId: item.clientLineId,
    confidence: item.confidence,
    confidenceLevel: item.confidenceLevel,
    expiryDateInput: item.expiry.date ?? '',
    expiryState: item.expiry.state,
    id: item.id,
    included: item.included,
    name: item.effectiveName ?? '',
    qtyUnit: item.effectiveQtyUnit,
    qtyValueText: quantityText(item.effectiveQtyValue),
    rawText: item.rawText,
    reviewState: item.reviewState,
    source: item.source,
  }));
}

export function createManualReceiptReviewLine(clientLineId: string): ReceiptReviewDraftLine {
  return {
    categoryId: null,
    clientLineId,
    confidence: null,
    confidenceLevel: null,
    expiryDateInput: '',
    expiryState: 'unknown',
    id: null,
    included: true,
    name: '',
    qtyUnit: null,
    qtyValueText: '',
    rawText: null,
    reviewState: 'unresolved',
    source: 'manual',
  };
}

export function createManualClientLineId(): string {
  return `manual-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function validCategory(value: ItemCategoryId | null): value is ItemCategoryId {
  return itemCategories.some((category) => category.id === value);
}

function validUnit(value: ItemQuantityUnit | null): value is ItemQuantityUnit {
  return itemQuantityUnits.includes(value as ItemQuantityUnit);
}

function quantityValue(value: string): number | null {
  const normalised = value.trim().replace(',', '.');
  if (!normalised || !/^\d+(?:\.\d+)?$/.test(normalised)) {
    return null;
  }

  const parsed = Number(normalised);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** Validates a date-only Gregorian value without timezone or timestamp conversion. */
export function normaliseReceiptExpiryDate(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  return day <= (daysInMonth ?? 0) ? value.trim() : null;
}

export function formatReceiptExpiryDate(value: string, locale: string): string {
  const isoDate = normaliseReceiptExpiryDate(value);
  if (!isoDate) return value;
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(0);
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCFullYear(year ?? 0, (month ?? 1) - 1, day ?? 1);
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(date);
}

export function validateReceiptReviewDraft(
  lines: readonly ReceiptReviewDraftLine[],
): ReceiptReviewDraftValidation {
  const errors: ReceiptReviewDraftError[] = [];

  for (const line of lines) {
    const key = lineKey(line);
    if (!line.name.trim()) {
      errors.push({ field: 'name', lineKey: key, message: 'Add a name.' });
    }
    if (quantityValue(line.qtyValueText) == null) {
      errors.push({
        field: 'qtyValue',
        lineKey: key,
        message: 'Enter a quantity greater than zero.',
      });
    }
    if (!validUnit(line.qtyUnit)) {
      errors.push({ field: 'qtyUnit', lineKey: key, message: 'Choose a unit.' });
    }
    if (!validCategory(line.categoryId)) {
      errors.push({ field: 'categoryId', lineKey: key, message: 'Choose a category.' });
    }
    if (line.expiryState === 'dated' && !normaliseReceiptExpiryDate(line.expiryDateInput)) {
      errors.push({
        field: 'expiry',
        lineKey: key,
        message: 'Enter a real date in YYYY-MM-DD format.',
      });
    }
  }

  return { errors, valid: errors.length === 0 };
}

export function buildSaveReceiptReviewInput(options: {
  readonly draft: readonly ReceiptReviewDraftLine[];
  readonly householdId: string;
  readonly receiptId: string;
  readonly generationId: string;
  readonly expectedReviewRevision: number;
}): SaveReceiptReviewInput {
  const validation = validateReceiptReviewDraft(options.draft);
  if (!validation.valid) {
    throw new Error(validation.errors[0]?.message ?? 'Complete every receipt line before saving.');
  }
  if (options.draft.length < 1) {
    throw new Error('Add at least one item before saving the receipt review.');
  }

  if (options.draft.length > 150) {
    throw new Error('A receipt review can contain at most 150 items.');
  }

  return {
    expectedReviewRevision: options.expectedReviewRevision,
    generationId: options.generationId,
    householdId: options.householdId,
    lines: options.draft.map((line) => {
      const value = quantityValue(line.qtyValueText);
      if (value == null || !line.qtyUnit || !line.categoryId) {
        throw new Error('Complete every receipt line before saving.');
      }

      return line.id
        ? {
            categoryId: line.categoryId,
            expiry: expiryForDraftLine(line),
            id: line.id,
            included: line.included,
            name: line.name.trim(),
            qtyUnit: line.qtyUnit,
            qtyValue: value,
            reviewState: line.reviewState,
          }
        : {
            categoryId: line.categoryId,
            expiry: expiryForDraftLine(line),
            clientLineId: line.clientLineId ?? lineKey(line),
            included: line.included,
            name: line.name.trim(),
            qtyUnit: line.qtyUnit,
            qtyValue: value,
            reviewState: line.reviewState,
          };
    }),
    receiptId: options.receiptId,
  };
}

function expiryForDraftLine(line: ReceiptReviewDraftLine): ReceiptLineExpiry {
  if (line.expiryState !== 'dated') {
    return { date: null, state: line.expiryState };
  }
  const date = normaliseReceiptExpiryDate(line.expiryDateInput);
  if (!date) throw new Error('Enter a real date in YYYY-MM-DD format.');
  return { date, state: 'dated' };
}

export function updateDraftLine(
  lines: readonly ReceiptReviewDraftLine[],
  key: string,
  patch: Partial<Pick<ReceiptReviewDraftLine, 'categoryId' | 'name' | 'qtyUnit' | 'qtyValueText'>>,
): ReceiptReviewDraftLine[] {
  return lines.map((line) =>
    lineKey(line) === key ? { ...line, ...patch, reviewState: 'unresolved' } : line,
  );
}

export function updateDraftLineExpiry(
  lines: readonly ReceiptReviewDraftLine[],
  key: string,
  state: ReceiptLineExpiry['state'],
  dateInput?: string,
): ReceiptReviewDraftLine[] {
  return lines.map((line) => {
    if (lineKey(line) !== key) return line;
    const nextDate = state === 'dated' ? (dateInput ?? line.expiryDateInput) : '';
    const changed = line.expiryState !== state || line.expiryDateInput !== nextDate;
    return {
      ...line,
      expiryDateInput: nextDate,
      expiryState: state,
      ...(changed && line.included ? { reviewState: 'unresolved' as const } : {}),
    };
  });
}

export function setDraftLineReviewState(
  lines: readonly ReceiptReviewDraftLine[],
  key: string,
  reviewState: ReceiptItemReviewState,
): ReceiptReviewDraftLine[] {
  return lines.map((line) => (lineKey(line) === key ? { ...line, reviewState } : line));
}

export function setDraftLineIncluded(
  lines: readonly ReceiptReviewDraftLine[],
  key: string,
  included: boolean,
): ReceiptReviewDraftLine[] {
  return lines.map((line) =>
    lineKey(line) === key
      ? { ...line, included, reviewState: included ? 'unresolved' : 'reviewed' }
      : line,
  );
}

export function reviewNeedsAttention(lines: readonly ReceiptReviewDraftLine[]): boolean {
  return lines.some((line) => line.included && line.reviewState !== 'reviewed');
}

export function includedLineCount(lines: readonly ReceiptReviewDraftLine[]): number {
  return lines.filter((line) => line.included).length;
}
