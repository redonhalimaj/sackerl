import {
  ReceiptPlacementApiError,
  type FinalizeReceiptPlacementResult,
  type ReceiptPlacement,
} from '@sackerl/api-client';
import { describe, expect, it } from 'vitest';

import {
  attemptMatchesReview,
  autoSortCount,
  canSubmit,
  classifyPlacementError,
  initialPlacementState,
  parsePersistedAttempt,
  placementLinesFromReview,
  placementReducer,
  placementReviewRef,
  suggestZone,
  unplacedLines,
  type PlacementAction,
  type PlacementLine,
  type PlacementState,
  type PlacementZone,
} from './receipt-placement';
import { receiptReview, reviewItem } from './receipt-review.fixtures';

const zones: readonly PlacementZone[] = [
  { id: 'z-fridge', key: 'fridge', label: 'Fridge' },
  { id: 'z-pantry', key: 'pantry', label: 'Pantry' },
  { id: 'z-freezer', key: 'freezer', label: 'Freezer' },
  { id: 'z-basement', key: 'basement', label: 'Basement' },
];
const lines: readonly PlacementLine[] = [
  { categoryId: 'dairy', name: 'Milk', quantityLabel: '1 l', receiptItemId: 'l-milk' },
  { categoryId: 'frozen', name: 'Spinach', quantityLabel: '1×', receiptItemId: 'l-spinach' },
  { categoryId: 'bakery', name: 'Bread', quantityLabel: '1×', receiptItemId: 'l-bread' },
];
const review = { expectedReviewRevision: 7, generationId: 'gen-1' };
const KEY_1 = '11111111-1111-4111-8111-111111111111';
const KEY_2 = '22222222-2222-4222-8222-222222222222';

function run(state: PlacementState, ...actions: PlacementAction[]): PlacementState {
  return actions.reduce(placementReducer, state);
}

function placement(patch: Partial<ReceiptPlacement> = {}): ReceiptPlacement {
  return {
    addedOn: '2026-11-03',
    generationId: 'gen-1',
    householdId: 'home',
    idempotencyKey: KEY_1,
    items: [],
    placedAt: '2026-11-03T10:00:00Z',
    placedBy: 'owner',
    placementId: 'p-1',
    purchasedOn: null,
    receiptId: 'receipt-1',
    reviewRevision: 7,
    ...patch,
  };
}

const sorted = () => run(initialPlacementState(lines, zones), { type: 'autoSort' });
const unknownError = () => new ReceiptPlacementApiError('unknown', 0, { outcomeUnknown: true });

describe('suggestZone', () => {
  it('maps categories to default zones', () => {
    expect(suggestZone('dairy', zones)?.key).toBe('fridge');
    expect(suggestZone('frozen', zones)?.key).toBe('freezer');
    expect(suggestZone('bakery', zones)?.key).toBe('pantry');
  });

  it('falls back by zone kind, then first zone, then null', () => {
    const noFreezer = zones.filter((zone) => zone.key !== 'freezer');
    expect(suggestZone('frozen', noFreezer)?.key).toBe('fridge');
    const basementOnly = zones.filter((zone) => zone.key === 'basement');
    expect(suggestZone('canned', basementOnly)?.key).toBe('basement');
    expect(suggestZone('dairy', basementOnly)?.key).toBe('basement');
    expect(suggestZone(null, [])).toBeNull();
  });
});

describe('review mapping', () => {
  it('uses only included lines and requires a complete saved review', () => {
    const data = receiptReview([reviewItem({ id: 'a' }), reviewItem({ id: 'b', included: false })]);
    expect(placementLinesFromReview(data).map((line) => line.receiptItemId)).toEqual(['a']);
    expect(placementReviewRef(data)).toBeNull();
    const complete = { ...data, summary: { ...data.summary, canComplete: true } };
    expect(placementReviewRef(complete)).toEqual({
      expectedReviewRevision: 7,
      generationId: 'generation-1',
    });
    const unsaved = { ...complete, receipt: { ...complete.receipt, reviewRevision: 0 } };
    expect(placementReviewRef(unsaved)).toBeNull();
  });
});

describe('placement reducer: suggest, override, auto-sort', () => {
  it('starts with nothing placed and submit disabled', () => {
    const state = initialPlacementState(lines, zones);
    expect(unplacedLines(state)).toHaveLength(3);
    expect(canSubmit(state)).toBe(false);
    expect(autoSortCount(state)).toBe(3);
  });

  it('tap path: select then assign, and toggling select clears it', () => {
    let state = run(initialPlacementState(lines, zones), {
      receiptItemId: 'l-milk',
      type: 'select',
    });
    expect(state.selectedLineId).toBe('l-milk');
    state = run(state, { receiptItemId: 'l-milk', type: 'assign', zoneId: 'z-pantry' });
    expect(state.assignments['l-milk']).toBe('z-pantry');
    expect(state.selectedLineId).toBeNull();
    state = run(
      state,
      { receiptItemId: 'l-bread', type: 'select' },
      {
        receiptItemId: 'l-bread',
        type: 'select',
      },
    );
    expect(state.selectedLineId).toBeNull();
  });

  it('auto-sort fills only unplaced lines and never overwrites a user override', () => {
    const state = run(
      initialPlacementState(lines, zones),
      { receiptItemId: 'l-milk', type: 'assign', zoneId: 'z-basement' },
      { type: 'autoSort' },
    );
    expect(state.assignments).toEqual({
      'l-bread': 'z-pantry',
      'l-milk': 'z-basement',
      'l-spinach': 'z-freezer',
    });
    expect(canSubmit(state)).toBe(true);
    expect(autoSortCount(state)).toBe(0);
  });

  it('rejects unknown zones and lines; unassign returns a line to the dock', () => {
    let state = run(initialPlacementState(lines, zones), {
      receiptItemId: 'l-milk',
      type: 'assign',
      zoneId: 'nope',
    });
    expect(state.assignments).toEqual({});
    state = run(state, { receiptItemId: 'ghost', type: 'assign', zoneId: 'z-fridge' });
    expect(state.assignments).toEqual({});
    state = run(sorted(), { receiptItemId: 'l-milk', type: 'unassign' });
    expect(unplacedLines(state).map((line) => line.receiptItemId)).toEqual(['l-milk']);
  });
});

describe('placement reducer: submit and idempotency', () => {
  it('builds the exact command for the active included lines', () => {
    const state = run(sorted(), { newKey: KEY_1, review, type: 'submit' });
    expect(state.phase).toBe('submitting');
    expect(state.attempt?.command).toEqual({
      assignments: [
        { receiptItemId: 'l-milk', zoneId: 'z-fridge' },
        { receiptItemId: 'l-spinach', zoneId: 'z-freezer' },
        { receiptItemId: 'l-bread', zoneId: 'z-pantry' },
      ],
      expectedReviewRevision: 7,
      generationId: 'gen-1',
      idempotencyKey: KEY_1,
    });
  });

  it('does not submit until every line has a place', () => {
    const state = run(initialPlacementState(lines, zones), {
      newKey: KEY_1,
      review,
      type: 'submit',
    });
    expect(state.phase).toBe('editing');
    expect(state.attempt).toBeNull();
  });

  it('outcomeUnknown blocks edits and retry reuses the same key and byte-identical command', () => {
    const submitted = run(sorted(), { newKey: KEY_1, review, type: 'submit' });
    const frozen = JSON.stringify(submitted.attempt?.command);
    let state = run(submitted, { error: unknownError(), type: 'submitFailed' });
    expect(state.phase).toBe('unknown');
    expect(state.notice).toBeNull();
    // Edits are blocked while the outcome is unknown.
    state = run(
      state,
      { receiptItemId: 'l-milk', type: 'assign', zoneId: 'z-pantry' },
      { type: 'autoSort' },
      { receiptItemId: 'l-milk', type: 'unassign' },
    );
    expect(state.assignments['l-milk']).toBe('z-fridge');
    state = run(state, { newKey: KEY_2, review, type: 'submit' });
    expect(state.phase).toBe('submitting');
    expect(JSON.stringify(state.attempt?.command)).toBe(frozen);
    expect(state.attempt?.command.idempotencyKey).toBe(KEY_1);
  });

  it('treats non-API errors as unknown, never as failure', () => {
    const state = run(
      sorted(),
      { newKey: KEY_1, review, type: 'submit' },
      { error: new TypeError('network'), type: 'submitFailed' },
    );
    expect(state.phase).toBe('unknown');
    expect(state.attempt?.command.idempotencyKey).toBe(KEY_1);
  });

  it('a confirmed failure keeps the user state and mints a new key next time', () => {
    let state = run(
      sorted(),
      { newKey: KEY_1, review, type: 'submit' },
      {
        error: new ReceiptPlacementApiError('bad zone', 422, {
          code: 'INVALID_PLACEMENT_ZONE',
          field: 'zoneId',
          receiptItemId: 'l-bread',
        }),
        type: 'submitFailed',
      },
    );
    expect(state.phase).toBe('editing');
    expect(state.attempt).toBeNull();
    expect(state.notice).toMatchObject({
      field: 'zoneId',
      kind: 'validation',
      receiptItemId: 'l-bread',
    });
    expect(state.assignments['l-bread']).toBe('z-pantry');
    state = run(
      state,
      { receiptItemId: 'l-bread', type: 'assign', zoneId: 'z-basement' },
      { newKey: KEY_2, review, type: 'submit' },
    );
    expect(state.attempt?.command.idempotencyKey).toBe(KEY_2);
  });

  it('PLACEMENT_CONFLICT is a definite failure, not unknown', () => {
    const state = run(
      sorted(),
      { newKey: KEY_1, review, type: 'submit' },
      {
        error: new ReceiptPlacementApiError('conflict', 409, { code: 'PLACEMENT_CONFLICT' }),
        type: 'submitFailed',
      },
    );
    expect(state.phase).toBe('editing');
    expect(state.notice?.kind).toBe('conflict');
    expect(state.attempt).toBeNull();
  });

  it('placed / replayed succeed; already_placed opens the committed result', () => {
    const submitted = run(sorted(), { newKey: KEY_1, review, type: 'submit' });
    const result = (outcome: FinalizeReceiptPlacementResult['outcome']) => ({
      outcome,
      placement: placement(),
    });
    expect(run(submitted, { result: result('placed'), type: 'submitSucceeded' }).phase).toBe(
      'success',
    );
    expect(run(submitted, { result: result('replayed'), type: 'submitSucceeded' }).phase).toBe(
      'success',
    );
    expect(
      run(submitted, { result: result('already_placed'), type: 'submitSucceeded' }).phase,
    ).toBe('committed');
    const raced = run(submitted, {
      error: new ReceiptPlacementApiError('placed', 409, { code: 'RECEIPT_ALREADY_PLACED' }),
      type: 'submitFailed',
    });
    expect(raced.phase).toBe('committed');
  });

  it('stale review errors route to reconciliation', () => {
    for (const code of [
      'STALE_RECEIPT_REVIEW',
      'RECEIPT_NOT_REVIEWED',
      'PLACEMENT_LINE_SET_MISMATCH',
    ] as const) {
      const notice = classifyPlacementError(new ReceiptPlacementApiError(code, 409, { code }));
      expect(notice).toMatchObject({ kind: 'stale' });
    }
  });
});

describe('status check after unknown outcome', () => {
  const unknown = () =>
    run(
      sorted(),
      { newKey: KEY_1, review, type: 'submit' },
      { error: unknownError(), type: 'submitFailed' },
      { type: 'checkStarted' },
    );

  it('placed with a matching key is success', () => {
    const state = run(unknown(), {
      status: { keyMatches: true, placement: placement(), receiptId: 'receipt-1', state: 'placed' },
      type: 'statusChecked',
    });
    expect(state.phase).toBe('success');
  });

  it('placed by another key opens the committed result', () => {
    const state = run(unknown(), {
      status: {
        keyMatches: false,
        placement: placement({ idempotencyKey: KEY_2 }),
        receiptId: 'receipt-1',
        state: 'placed',
      },
      type: 'statusChecked',
    });
    expect(state.phase).toBe('committed');
  });

  it('unplaced keeps the frozen attempt for a same-key retry', () => {
    const state = run(unknown(), {
      status: { keyMatches: null, placement: null, receiptId: 'receipt-1', state: 'unplaced' },
      type: 'statusChecked',
    });
    expect(state.phase).toBe('unknown');
    expect(state.checkedUnplaced).toBe(true);
    expect(state.attempt?.command.idempotencyKey).toBe(KEY_1);
  });

  it('a failed status read stays unknown', () => {
    expect(run(unknown(), { type: 'statusFailed' }).phase).toBe('unknown');
  });
});

describe('persisted attempt', () => {
  it('round-trips and only restores against the same review', () => {
    const submitted = run(sorted(), { newKey: KEY_1, review, type: 'submit' });
    const raw = JSON.stringify(submitted.attempt);
    const restored = parsePersistedAttempt(raw);
    expect(restored).toEqual(submitted.attempt);
    expect(attemptMatchesReview(restored!, review)).toBe(true);
    expect(attemptMatchesReview(restored!, { ...review, expectedReviewRevision: 8 })).toBe(false);
    const state = run(initialPlacementState(lines, zones), {
      attempt: restored!,
      type: 'restoreAttempt',
    });
    expect(state.phase).toBe('unknown');
    expect(state.assignments['l-spinach']).toBe('z-freezer');
  });

  it('rejects malformed storage', () => {
    expect(parsePersistedAttempt(null)).toBeNull();
    expect(parsePersistedAttempt('{nope')).toBeNull();
    expect(parsePersistedAttempt('{"command":{"idempotencyKey":1}}')).toBeNull();
    expect(
      parsePersistedAttempt(
        '{"command":{"idempotencyKey":"k","generationId":"g","expectedReviewRevision":1,"assignments":[{"receiptItemId":1}]}}',
      ),
    ).toBeNull();
  });
});
