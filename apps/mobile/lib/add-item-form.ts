import {
  calendarDateInTimeZone,
  categoryZoneEstimatorVersion,
  estimateExpiryDate,
  type ItemCategoryId,
  type ExpiryDeclarationInput,
  type ItemQuantityUnit,
  type StockItem,
  type UpdateStockItemInput,
} from '@sackerl/api-client';

export function firstParamValue(value: string | readonly string[] | undefined): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  return value?.[0];
}

export function normalizeZoneParam(
  value: string | readonly string[] | undefined,
): string | undefined {
  const zone = firstParamValue(value)?.trim().toLowerCase();

  return zone && /^[a-z][a-z0-9-]{1,31}$/.test(zone) ? zone : undefined;
}

export function parseQuantity(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** Strict YYYY-MM-DD validation using the proleptic Gregorian calendar. */
export function isValidGregorianDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [yearValue, monthValue, dayValue] = value.split('-').map(Number);
  const year = yearValue ?? Number.NaN;
  const month = monthValue ?? Number.NaN;
  const day = dayValue ?? Number.NaN;
  const date = new Date(Date.UTC(2000, (month ?? 0) - 1, day ?? 0));
  date.setUTCFullYear(year ?? 0);

  return (
    Number.isFinite(year) &&
    Number.isFinite(month) &&
    Number.isFinite(day) &&
    year >= 1 &&
    year <= 9999 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === (month ?? 0) - 1 &&
    date.getUTCDate() === day
  );
}

export function estimateExpiryForHousehold(input: {
  readonly categoryId: ItemCategoryId;
  readonly timeZone: string;
  readonly zoneKey: string;
  readonly now?: Date;
}): string {
  return estimateExpiryDate({
    baseDate: calendarDateInTimeZone(input.now ?? new Date(), input.timeZone),
    categoryId: input.categoryId,
    zoneKey: input.zoneKey,
  });
}

export function buildAddExpiryDeclaration(input: {
  readonly fallbackExpiry?: string | null | undefined;
  readonly expiryInput: string;
  readonly expiryTouched: boolean;
}): { readonly expiresOn: string | null; readonly expiry?: ExpiryDeclarationInput } {
  const value = input.expiryInput.trim();
  const estimatedValue = value || input.fallbackExpiry?.trim() || '';

  if (!input.expiryTouched || !value) {
    return estimatedValue
      ? {
          expiresOn: estimatedValue,
          expiry: {
            confirm: false,
            estimatorVersion: categoryZoneEstimatorVersion,
            printedMarking: 'unknown',
            source: 'estimated',
          },
        }
      : { expiresOn: null };
  }

  return {
    expiresOn: value || null,
    expiry: {
      confirm: true,
      printedMarking: 'unknown',
      source: 'user',
    },
  };
}

export type EditExpiryIntent =
  | { readonly kind: 'unchanged' }
  | { readonly expiry: ExpiryDeclarationInput; readonly expiresOn: string; readonly kind: 'set' }
  | { readonly expectedFactId: string | null; readonly kind: 'clear' };

export function buildEditExpiryIntent(input: {
  readonly expectedFactId: string | null;
  readonly expiryInput: string;
  readonly expiryTouched: boolean;
}): EditExpiryIntent {
  const value = input.expiryInput.trim();

  if (!input.expiryTouched) {
    return { kind: 'unchanged' };
  }

  if (!value) {
    return { expectedFactId: input.expectedFactId, kind: 'clear' };
  }

  return {
    expiry: {
      confirm: true,
      expectedFactId: input.expectedFactId,
      printedMarking: 'unknown',
      source: 'user',
    },
    expiresOn: value,
    kind: 'set',
  };
}

type EditItemChanges = Pick<
  UpdateStockItemInput,
  'categoryId' | 'name' | 'qtyUnit' | 'qtyValue' | 'zoneId'
>;

export type EditItemMutation =
  | {
      readonly changes: EditItemChanges;
      readonly expectedFactId: string | null;
      readonly kind: 'clear';
    }
  | {
      readonly changes: EditItemChanges &
        Partial<Pick<UpdateStockItemInput, 'expiresOn' | 'expiry'>>;
      readonly kind: 'update';
    };

export function buildEditItemMutation(input: {
  readonly categoryId: ItemCategoryId;
  readonly expiryInput: string;
  readonly expiryTouched: boolean;
  readonly name: string;
  readonly qtyUnit: ItemQuantityUnit;
  readonly qtyValue: number;
  readonly selectedItem: {
    readonly expiryProvenance: Pick<StockItem['expiryProvenance'], 'factId'>;
  };
  readonly zoneId: string;
}): EditItemMutation {
  const changes: EditItemChanges = {
    categoryId: input.categoryId,
    name: input.name,
    qtyUnit: input.qtyUnit,
    qtyValue: input.qtyValue,
    zoneId: input.zoneId,
  };
  const expiry = buildEditExpiryIntent({
    expectedFactId: input.selectedItem.expiryProvenance.factId,
    expiryInput: input.expiryInput,
    expiryTouched: input.expiryTouched,
  });

  if (expiry.kind === 'clear') {
    return { changes, expectedFactId: expiry.expectedFactId, kind: 'clear' };
  }

  return {
    changes:
      expiry.kind === 'set'
        ? { ...changes, expiresOn: expiry.expiresOn, expiry: expiry.expiry }
        : changes,
    kind: 'update',
  };
}
