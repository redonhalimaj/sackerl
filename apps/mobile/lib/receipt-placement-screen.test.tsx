import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
  ReceiptPlacementApiError,
  type FinalizeReceiptPlacementInput,
  type ReceiptPlacement,
} from '@sackerl/api-client';

import { receiptReview, reviewItem } from './receipt-review.fixtures';

const mocks = vi.hoisted(() => ({
  getHousehold: vi.fn(),
  getReceiptReview: vi.fn(),
  getReceiptPlacement: vi.fn(),
  finalizeReceiptPlacement: vi.fn(),
  listZones: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  alert: vi.fn(),
  toast: vi.fn(),
  storage: new Map<string, string>(),
}));
vi.mock('./auth-session', () => ({
  useAuthSession: () => ({
    session: { access_token: 'token', user: { email: 'o@test.invalid', id: 'owner' } },
    status: 'ready',
  }),
}));
vi.mock('./profile', () => ({ getMobileProfileClient: () => mocks }));
vi.mock('./receipts', () => ({ getMobileReceiptsClient: () => mocks }));
vi.mock('./items', () => ({ getMobileItemsClient: () => mocks }));
vi.mock('./placement-toast', () => ({ showPlacementToast: mocks.toast }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: (key: string) => Promise.resolve(mocks.storage.get(key) ?? null),
    removeItem: (key: string) => Promise.resolve(void mocks.storage.delete(key)),
    setItem: (key: string, value: string) => Promise.resolve(void mocks.storage.set(key, value)),
  },
}));
vi.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'receipt-1' }),
  useRouter: () => mocks,
}));
vi.mock('expo-router/react-navigation', () => ({ usePreventRemove: () => undefined }));
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));
vi.mock('@sackerl/ui', () => ({ categoryMeta: {} }));
vi.mock('react-native', () => {
  class ValueXY {
    setValue() {}
    getTranslateTransform() {
      return [];
    }
  }
  return {
    ActivityIndicator: 'ActivityIndicator',
    Alert: { alert: mocks.alert },
    Animated: { spring: () => ({ start: () => undefined }), ValueXY, View: 'AnimatedView' },
    PanResponder: { create: () => ({ panHandlers: {} }) },
    Platform: { OS: 'ios' },
    Pressable: 'Pressable',
    ScrollView: 'ScrollView',
    StyleSheet: { create: <T,>(styles: T) => styles },
    Text: 'Text',
    View: 'View',
  };
});
import ReceiptPlacementRoute from '../app/receipt-placement/[id]';

let screen: ReactTestRenderer | undefined;
const text = () => JSON.stringify(screen?.toJSON());
const byId = (testID: string) => screen!.root.findByProps({ testID });
async function tap(testID: string) {
  await act(async () => {
    (byId(testID).props as { onPress: () => void }).onPress();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}
async function render() {
  await act(async () => {
    screen = create(<ReceiptPlacementRoute />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

const zones = [
  {
    createdAt: '',
    householdId: 'home',
    id: 'z-fridge',
    key: 'fridge',
    label: 'Fridge',
    sortOrder: 1,
  },
  {
    createdAt: '',
    householdId: 'home',
    id: 'z-pantry',
    key: 'pantry',
    label: 'Pantry',
    sortOrder: 2,
  },
];
function savedReview() {
  const review = receiptReview([
    reviewItem({ id: 'l-milk', reviewState: 'reviewed' }),
    reviewItem({
      effectiveCategoryId: 'bakery',
      effectiveName: 'Bread',
      id: 'l-bread',
      reviewState: 'reviewed',
    }),
    reviewItem({ id: 'l-skip', included: false }),
  ]);
  return { ...review, summary: { ...review.summary, canComplete: true } };
}
function placement(key: string, patch: Partial<ReceiptPlacement> = {}): ReceiptPlacement {
  return {
    addedOn: '2026-11-03',
    generationId: 'generation-1',
    householdId: 'home',
    idempotencyKey: key,
    items: [
      { name: 'Milk', zoneId: 'z-fridge' },
      { name: 'Bread', zoneId: 'z-pantry' },
    ] as unknown as ReceiptPlacement['items'],
    placedAt: '2026-11-03T10:00:00Z',
    placedBy: 'owner',
    placementId: 'p-1',
    purchasedOn: null,
    receiptId: 'receipt-1',
    reviewRevision: 7,
    ...patch,
  };
}
const unplaced = { keyMatches: null, placement: null, receiptId: 'receipt-1', state: 'unplaced' };
const lastFinalize = (index: number) =>
  mocks.finalizeReceiptPlacement.mock.calls[index]?.[1] as FinalizeReceiptPlacementInput;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  mocks.storage.clear();
  mocks.getHousehold.mockReset().mockResolvedValue({ id: 'home' });
  mocks.getReceiptReview.mockReset().mockResolvedValue(savedReview());
  mocks.listZones.mockReset().mockResolvedValue(zones);
  mocks.getReceiptPlacement.mockReset().mockResolvedValue(unplaced);
  mocks.finalizeReceiptPlacement.mockReset();
  mocks.replace.mockReset();
  mocks.back.mockReset();
  mocks.toast.mockReset();
});
afterEach(async () => {
  if (screen) await act(() => screen?.unmount());
  screen = undefined;
  vi.unstubAllGlobals();
});

describe('Receipt placement route', () => {
  it('tap-only path places every included line and navigates only after success', async () => {
    mocks.finalizeReceiptPlacement.mockImplementation(
      (_context: unknown, input: FinalizeReceiptPlacementInput) =>
        Promise.resolve({ outcome: 'placed', placement: placement(input.idempotencyKey) }),
    );
    await render();
    expect(text()).toContain('Where does it go?');
    expect(text()).not.toContain('l-skip');
    expect(byId('receipt-placement.submit').props.disabled).toBe(true);

    await tap('receipt-placement.chip.0');
    await tap('receipt-placement.zone.fridge');
    await tap('receipt-placement.chip.1');
    await tap('receipt-placement.accept-suggestion');
    expect(byId('receipt-placement.progress').props.children).toEqual([2, ' / ', 2, ' done']);
    expect(mocks.replace).not.toHaveBeenCalled();

    await tap('receipt-placement.submit');
    const input = lastFinalize(0);
    expect(input.assignments).toEqual([
      { receiptItemId: 'l-milk', zoneId: 'z-fridge' },
      { receiptItemId: 'l-bread', zoneId: 'z-pantry' },
    ]);
    expect(input).toMatchObject({
      expectedReviewRevision: 7,
      generationId: 'generation-1',
      householdId: 'home',
      receiptId: 'receipt-1',
    });
    expect(mocks.replace).toHaveBeenCalledWith('/(tabs)');
    expect(mocks.toast).toHaveBeenCalledWith('2 items added to your stock');
    expect(String(mocks.toast.mock.calls[0]?.[0])).not.toMatch(/remind/i);
    expect(mocks.storage.size).toBe(0);
  });

  it('auto-sort fills suggestions; outcomeUnknown retries with the same key and command', async () => {
    mocks.finalizeReceiptPlacement
      .mockRejectedValueOnce(new ReceiptPlacementApiError('?', 0, { outcomeUnknown: true }))
      .mockImplementation((_context: unknown, input: FinalizeReceiptPlacementInput) =>
        Promise.resolve({ outcome: 'replayed', placement: placement(input.idempotencyKey) }),
      );
    await render();
    await tap('receipt-placement.auto-sort');
    await tap('receipt-placement.submit');

    expect(byId('receipt-placement.outcome-unknown')).toBeTruthy();
    expect(text()).not.toContain('added to your stock');
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.storage.size).toBe(1);

    await tap('receipt-placement.retry');
    expect(mocks.finalizeReceiptPlacement).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(lastFinalize(1))).toBe(JSON.stringify(lastFinalize(0)));
    expect(mocks.replace).toHaveBeenCalledWith('/(tabs)');
    expect(mocks.storage.size).toBe(0);
  });

  it('check status after unknown: placed with matching key is success', async () => {
    mocks.finalizeReceiptPlacement.mockRejectedValue(
      new ReceiptPlacementApiError('?', 503, { outcomeUnknown: true }),
    );
    await render();
    await tap('receipt-placement.auto-sort');
    await tap('receipt-placement.submit');
    const key = lastFinalize(0).idempotencyKey;
    mocks.getReceiptPlacement.mockResolvedValue({
      keyMatches: true,
      placement: placement(key),
      receiptId: 'receipt-1',
      state: 'placed',
    });
    await tap('receipt-placement.check-status');
    expect(mocks.getReceiptPlacement).toHaveBeenLastCalledWith(expect.anything(), {
      householdId: 'home',
      idempotencyKey: key,
      receiptId: 'receipt-1',
    });
    expect(mocks.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('a validation error keeps assignments and highlights the item', async () => {
    mocks.finalizeReceiptPlacement.mockRejectedValue(
      new ReceiptPlacementApiError('bad', 422, {
        code: 'INVALID_PLACEMENT_ZONE',
        field: 'zoneId',
        receiptItemId: 'l-bread',
      }),
    );
    await render();
    await tap('receipt-placement.auto-sort');
    await tap('receipt-placement.submit');
    expect(text()).toContain('no longer available');
    expect(byId('receipt-placement.placed.1')).toBeTruthy();
    expect(byId('receipt-placement.submit').props.disabled).toBe(false);
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.storage.size).toBe(0);
  });

  it('a stale review offers reconciliation', async () => {
    mocks.finalizeReceiptPlacement.mockRejectedValue(
      new ReceiptPlacementApiError('stale', 409, { code: 'STALE_RECEIPT_REVIEW' }),
    );
    await render();
    await tap('receipt-placement.auto-sort');
    await tap('receipt-placement.submit');
    await tap('receipt-placement.back-to-review');
    expect(mocks.replace).toHaveBeenCalledWith({
      params: { id: 'receipt-1' },
      pathname: '/receipt-review/[id]',
    });
  });

  it('an already placed receipt opens the committed result', async () => {
    mocks.getReceiptPlacement.mockResolvedValue({
      keyMatches: null,
      placement: placement('33333333-3333-4333-8333-333333333333'),
      receiptId: 'receipt-1',
      state: 'placed',
    });
    await render();
    expect(byId('receipt-placement.committed')).toBeTruthy();
    expect(text()).toContain('Already in your stock');
    await tap('receipt-placement.go-home');
    expect(mocks.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('restores a pending unknown attempt after an app restart', async () => {
    const command = {
      assignments: [
        { receiptItemId: 'l-milk', zoneId: 'z-fridge' },
        { receiptItemId: 'l-bread', zoneId: 'z-pantry' },
      ],
      expectedReviewRevision: 7,
      generationId: 'generation-1',
      idempotencyKey: '44444444-4444-4444-8444-444444444444',
    };
    mocks.storage.set(
      'sackerl.receipt-placement.pending.owner.receipt-1',
      JSON.stringify({ command }),
    );
    mocks.finalizeReceiptPlacement.mockImplementation(
      (_context: unknown, input: FinalizeReceiptPlacementInput) =>
        Promise.resolve({ outcome: 'replayed', placement: placement(input.idempotencyKey) }),
    );
    await render();
    expect(byId('receipt-placement.outcome-unknown')).toBeTruthy();
    await tap('receipt-placement.retry');
    expect(lastFinalize(0).idempotencyKey).toBe(command.idempotencyKey);
    expect(lastFinalize(0).assignments).toEqual(command.assignments);
  });

  it('an incomplete review is not placeable', async () => {
    mocks.getReceiptReview.mockResolvedValue(receiptReview());
    await render();
    expect(text()).toContain('Finish the review first');
    expect(mocks.finalizeReceiptPlacement).not.toHaveBeenCalled();
  });
});
