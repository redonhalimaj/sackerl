import {
  ReceiptPlacementApiError,
  type FinalizeReceiptPlacementResult,
  type ItemCategoryId,
  type ReceiptPlacement,
  type ReceiptPlacementAssignment,
  type ReceiptPlacementCommandBody,
  type ReceiptPlacementStatus,
  type ReceiptReview,
  type StorageZone,
} from '@sackerl/api-client';

/**
 * SCKRL-305 placement state machine. Pure (no React, no I/O) so every transition is unit tested.
 *
 * Idempotency contract (Council board docs/council/SCKRL-305.md):
 * - One idempotency key per placement attempt, frozen together with the exact command it was
 *   first sent with.
 * - While the outcome is unknown, edits are blocked and every retry re-sends the frozen command.
 * - A new key is minted only after a confirmed (definite) failure.
 */

export type PlacementLine = {
  readonly categoryId: ItemCategoryId | null;
  readonly name: string;
  readonly quantityLabel: string;
  readonly receiptItemId: string;
};

export type PlacementZone = {
  readonly id: string;
  readonly key: string;
  readonly label: string;
};

export type PlacementAttempt = {
  readonly command: ReceiptPlacementCommandBody;
};

export type PlacementErrorKind =
  | 'auth'
  | 'conflict'
  | 'empty'
  | 'keyReused'
  | 'other'
  | 'stale'
  | 'validation';

export type PlacementNotice = {
  readonly field?: string | undefined;
  readonly kind: PlacementErrorKind;
  readonly message: string;
  readonly receiptItemId?: string | undefined;
};

export type PlacementPhase =
  /** User is assigning lines. */
  | 'editing'
  /** Finalize request in flight. */
  | 'submitting'
  /** Status read in flight after an unknown outcome. */
  | 'checking'
  /** Outcome unknown: neither success nor failure may be claimed. Edits blocked. */
  | 'unknown'
  /** Confirmed placed by this attempt's key (placed / replayed). */
  | 'success'
  /** Receipt is placed, but not by this attempt (already_placed or another key). */
  | 'committed';

export type PlacementState = {
  readonly assignments: Readonly<Record<string, string>>;
  readonly attempt: PlacementAttempt | null;
  /** True after a status check reported the receipt still unplaced for the frozen attempt. */
  readonly checkedUnplaced: boolean;
  readonly lines: readonly PlacementLine[];
  readonly notice: PlacementNotice | null;
  readonly phase: PlacementPhase;
  readonly placement: ReceiptPlacement | null;
  readonly selectedLineId: string | null;
  readonly zones: readonly PlacementZone[];
};

export type PlacementReviewRef = {
  readonly expectedReviewRevision: number;
  readonly generationId: string;
};

const fridgeCategories: readonly ItemCategoryId[] = ['dairy', 'meat', 'produce'];
const pantryCategories: readonly ItemCategoryId[] = [
  'pantry',
  'canned',
  'bakery',
  'snacks',
  'spices',
  'drinks',
];

/**
 * Client-side default zone suggestion per category (v1, Chair-approved). The RPC only accepts
 * `{receiptItemId, zoneId}`, so suggestions have no server contract and the user always confirms.
 */
export function suggestZone(
  categoryId: ItemCategoryId | null,
  zones: readonly PlacementZone[],
): PlacementZone | null {
  const byKey = (...keys: readonly string[]) => {
    for (const key of keys) {
      const zone = zones.find((candidate) => candidate.key === key);
      if (zone) return zone;
    }
    return null;
  };
  let preferred: PlacementZone | null = null;
  if (categoryId === 'frozen') preferred = byKey('freezer', 'fridge');
  else if (categoryId && fridgeCategories.includes(categoryId)) preferred = byKey('fridge');
  else if (categoryId && pantryCategories.includes(categoryId))
    preferred = byKey('pantry', 'basement');
  return preferred ?? zones[0] ?? null;
}

function quantityLabel(value: number | null, unit: string | null): string {
  if (value == null) return '';
  const amount = Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
  return unit && unit !== 'pcs' ? `${amount} ${unit}` : `${amount}×`;
}

export function placementLinesFromReview(review: ReceiptReview): readonly PlacementLine[] {
  return review.items
    .filter((item) => item.included)
    .map((item) => ({
      categoryId: item.effectiveCategoryId,
      name: item.effectiveName ?? item.inferredName ?? item.rawText ?? 'Item',
      quantityLabel: quantityLabel(item.effectiveQtyValue, item.effectiveQtyUnit),
      receiptItemId: item.id,
    }));
}

export function placementZonesFromStorage(zones: readonly StorageZone[]): readonly PlacementZone[] {
  return [...zones]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((zone) => ({ id: zone.id, key: zone.key, label: zone.label }));
}

/** The review the placement command must be bound to, or null if it is not placeable. */
export function placementReviewRef(review: ReceiptReview): PlacementReviewRef | null {
  const generationId = review.summary.generationId;
  if (!generationId || review.receipt.reviewRevision < 1 || !review.summary.canComplete) {
    return null;
  }
  return { expectedReviewRevision: review.receipt.reviewRevision, generationId };
}

export function initialPlacementState(
  lines: readonly PlacementLine[],
  zones: readonly PlacementZone[],
): PlacementState {
  return {
    assignments: {},
    attempt: null,
    checkedUnplaced: false,
    lines,
    notice: null,
    phase: 'editing',
    placement: null,
    selectedLineId: null,
    zones,
  };
}

export function isEditable(state: PlacementState): boolean {
  return state.phase === 'editing';
}

export function unplacedLines(state: PlacementState): readonly PlacementLine[] {
  return state.lines.filter((line) => !state.assignments[line.receiptItemId]);
}

export function linesInZone(state: PlacementState, zoneId: string): readonly PlacementLine[] {
  return state.lines.filter((line) => state.assignments[line.receiptItemId] === zoneId);
}

export function canSubmit(state: PlacementState): boolean {
  return state.phase === 'editing' && state.lines.length > 0 && unplacedLines(state).length === 0;
}

/** How many lines Auto-sort would place: only unassigned lines that have a suggestion. */
export function autoSortCount(state: PlacementState): number {
  return unplacedLines(state).filter((line) => suggestZone(line.categoryId, state.zones)).length;
}

export type PlacementAction =
  | { readonly type: 'select'; readonly receiptItemId: string | null }
  | { readonly type: 'assign'; readonly receiptItemId: string; readonly zoneId: string }
  | { readonly type: 'unassign'; readonly receiptItemId: string }
  | { readonly type: 'autoSort' }
  | {
      readonly type: 'submit';
      /** Fresh UUID; ignored when an unknown-outcome attempt is being retried. */
      readonly newKey: string;
      readonly review: PlacementReviewRef;
    }
  | { readonly type: 'submitSucceeded'; readonly result: FinalizeReceiptPlacementResult }
  | { readonly type: 'submitFailed'; readonly error: unknown }
  | { readonly type: 'checkStarted' }
  | { readonly type: 'statusChecked'; readonly status: ReceiptPlacementStatus }
  | { readonly type: 'statusFailed' }
  | { readonly type: 'restoreAttempt'; readonly attempt: PlacementAttempt }
  | { readonly type: 'showCommitted'; readonly placement: ReceiptPlacement };

/** Leaving a confirmed-failure notice behind starts a fresh attempt (new key on next submit). */
function edited(state: PlacementState, patch: Partial<PlacementState>): PlacementState {
  return { ...state, attempt: null, checkedUnplaced: false, notice: null, ...patch };
}

export function buildPlacementCommand(
  state: PlacementState,
  review: PlacementReviewRef,
  idempotencyKey: string,
): ReceiptPlacementCommandBody | { readonly missing: string } {
  const assignments = [];
  for (const line of state.lines) {
    const zoneId = state.assignments[line.receiptItemId];
    if (!zoneId) return { missing: line.receiptItemId };
    assignments.push({ receiptItemId: line.receiptItemId, zoneId });
  }
  return {
    assignments,
    expectedReviewRevision: review.expectedReviewRevision,
    generationId: review.generationId,
    idempotencyKey,
  };
}

export function classifyPlacementError(error: unknown): PlacementNotice | 'unknown' | 'placed' {
  if (!(error instanceof ReceiptPlacementApiError)) return 'unknown';
  if (error.outcomeUnknown) return 'unknown';
  const base = { field: error.field, receiptItemId: error.receiptItemId };
  switch (error.code) {
    case 'INVALID_PLACEMENT_LINE':
    case 'INVALID_PLACEMENT_INPUT':
      return {
        ...base,
        kind: 'validation',
        message: 'One item could not be placed. Check the highlighted item and try again.',
      };
    case 'INVALID_PLACEMENT_ZONE':
      return {
        ...base,
        kind: 'validation',
        message: 'That storage place is no longer available. Pick another place for this item.',
      };
    case 'STALE_RECEIPT_REVIEW':
    case 'RECEIPT_NOT_REVIEWED':
    case 'PLACEMENT_LINE_SET_MISMATCH':
    case 'RECEIPT_LINEAGE_REQUIRED':
      return {
        ...base,
        kind: 'stale',
        message:
          'This receipt review changed. Go back to the review to check it, then place again.',
      };
    case 'RECEIPT_ALREADY_PLACED':
      return 'placed';
    case 'PLACEMENT_CONFLICT':
      return {
        ...base,
        kind: 'conflict',
        message: 'Nothing was added because something else changed at the same time. Try again.',
      };
    case 'PLACEMENT_KEY_REUSED':
      return {
        ...base,
        kind: 'keyReused',
        message: 'Nothing was added. Please try again.',
      };
    case 'EMPTY_RECEIPT_PLACEMENT':
      return { ...base, kind: 'empty', message: 'This receipt has no items to place.' };
    case 'AUTH_REQUIRED':
    case 'HOUSEHOLD_ACCESS_REQUIRED':
      return { ...base, kind: 'auth', message: 'Please sign in again to add these items.' };
    default:
      return { ...base, kind: 'other', message: 'Nothing was added. Please try again.' };
  }
}

export function placementReducer(state: PlacementState, action: PlacementAction): PlacementState {
  switch (action.type) {
    case 'select':
      if (!isEditable(state)) return state;
      return {
        ...state,
        selectedLineId: state.selectedLineId === action.receiptItemId ? null : action.receiptItemId,
      };
    case 'assign': {
      if (!isEditable(state)) return state;
      if (!state.zones.some((zone) => zone.id === action.zoneId)) return state;
      if (!state.lines.some((line) => line.receiptItemId === action.receiptItemId)) return state;
      return edited(state, {
        assignments: { ...state.assignments, [action.receiptItemId]: action.zoneId },
        selectedLineId: null,
      });
    }
    case 'unassign': {
      if (!isEditable(state)) return state;
      const { [action.receiptItemId]: _removed, ...assignments } = state.assignments;
      return edited(state, { assignments, selectedLineId: null });
    }
    case 'autoSort': {
      if (!isEditable(state)) return state;
      const assignments: Record<string, string> = { ...state.assignments };
      for (const line of unplacedLines(state)) {
        const zone = suggestZone(line.categoryId, state.zones);
        if (zone) assignments[line.receiptItemId] = zone.id;
      }
      return edited(state, { assignments, selectedLineId: null });
    }
    case 'submit': {
      if (state.phase === 'unknown' && state.attempt) {
        // Retry: byte-identical frozen command, same key.
        return { ...state, notice: null, phase: 'submitting' };
      }
      if (!canSubmit(state)) return state;
      const command = buildPlacementCommand(state, action.review, action.newKey);
      if ('missing' in command) {
        return {
          ...state,
          notice: {
            kind: 'validation',
            message: 'Choose a storage place for every item.',
            receiptItemId: command.missing,
          },
        };
      }
      return {
        ...state,
        attempt: { command },
        checkedUnplaced: false,
        notice: null,
        phase: 'submitting',
        selectedLineId: null,
      };
    }
    case 'submitSucceeded':
      return {
        ...state,
        notice: null,
        phase: action.result.outcome === 'already_placed' ? 'committed' : 'success',
        placement: action.result.placement,
      };
    case 'submitFailed': {
      const classified = classifyPlacementError(action.error);
      if (classified === 'unknown') {
        return { ...state, checkedUnplaced: false, notice: null, phase: 'unknown' };
      }
      if (classified === 'placed') {
        // Definitely placed, but not by this attempt; the screen loads the committed result.
        return { ...state, notice: null, phase: 'committed' };
      }
      // Confirmed failure: nothing was written. Drop the attempt so the next submit mints a key.
      return { ...state, attempt: null, notice: classified, phase: 'editing' };
    }
    case 'checkStarted':
      if (state.phase !== 'unknown' || !state.attempt) return state;
      return { ...state, phase: 'checking' };
    case 'statusChecked': {
      if (state.phase !== 'checking') return state;
      const { status } = action;
      if (status.state === 'placed' && status.placement) {
        return {
          ...state,
          phase: status.keyMatches ? 'success' : 'committed',
          placement: status.placement,
        };
      }
      return { ...state, checkedUnplaced: true, phase: 'unknown' };
    }
    case 'statusFailed':
      if (state.phase !== 'checking') return state;
      return { ...state, phase: 'unknown' };
    case 'restoreAttempt':
      if (state.phase !== 'editing') return state;
      return {
        ...state,
        assignments: Object.fromEntries(
          action.attempt.command.assignments.map((a) => [a.receiptItemId, a.zoneId]),
        ),
        attempt: action.attempt,
        checkedUnplaced: false,
        notice: null,
        phase: 'unknown',
      };
    case 'showCommitted':
      return { ...state, notice: null, phase: 'committed', placement: action.placement };
  }
}

/** A persisted attempt is only reusable against the same review it was built from. */
export function attemptMatchesReview(
  attempt: PlacementAttempt,
  review: PlacementReviewRef,
): boolean {
  return (
    attempt.command.generationId === review.generationId &&
    attempt.command.expectedReviewRevision === review.expectedReviewRevision
  );
}

export function parsePersistedAttempt(raw: string | null): PlacementAttempt | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    const command = (value as { command?: Record<string, unknown> } | null)?.command;
    if (
      !command ||
      typeof command.idempotencyKey !== 'string' ||
      typeof command.generationId !== 'string' ||
      typeof command.expectedReviewRevision !== 'number' ||
      !Array.isArray(command.assignments)
    ) {
      return null;
    }
    const assignments: ReceiptPlacementAssignment[] = [];
    for (const entry of command.assignments as unknown[]) {
      const candidate = entry as { receiptItemId?: unknown; zoneId?: unknown } | null;
      if (typeof candidate?.receiptItemId !== 'string' || typeof candidate.zoneId !== 'string') {
        return null;
      }
      assignments.push({ receiptItemId: candidate.receiptItemId, zoneId: candidate.zoneId });
    }
    return {
      command: {
        assignments,
        expectedReviewRevision: command.expectedReviewRevision,
        generationId: command.generationId,
        idempotencyKey: command.idempotencyKey,
      },
    };
  } catch {
    return null;
  }
}

export function pendingAttemptStorageKey(userId: string, receiptId: string): string {
  return `sackerl.receipt-placement.pending.${userId}.${receiptId}`;
}

export function placedCountCopy(count: number): string {
  return count === 1 ? '1 item added to your stock' : `${count} items added to your stock`;
}
