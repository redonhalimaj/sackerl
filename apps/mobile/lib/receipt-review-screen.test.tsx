import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Pressable, Text, Modal } from 'react-native';
import {
  ApiRequestError,
  type ReceiptReview,
  type SaveReceiptReviewInput,
  type AuthenticatedUserContext,
} from '@sackerl/api-client';
import { receiptReview, reviewItem } from './receipt-review.fixtures';

type Session = { access_token: string; user: { id: string; email: string } } | null;
const mocks = vi.hoisted(() => ({
  getHousehold: vi.fn(),
  getReceiptReview: vi.fn(),
  saveReceiptReview:
    vi.fn<
      (context: AuthenticatedUserContext, input: SaveReceiptReviewInput) => Promise<ReceiptReview>
    >(),
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  dispatch: vi.fn(),
  setOptions: vi.fn(),
  beforeRemove: null as
    | null
    | ((event: {
        readonly preventDefault: () => void;
        readonly data: { readonly action: unknown };
      }) => void),
  addListener: vi.fn(
    (
      _event: string,
      listener: (event: {
        readonly preventDefault: () => void;
        readonly data: { readonly action: unknown };
      }) => void,
    ) => {
      mocks.beforeRemove = listener;
      return vi.fn();
    },
  ),
  alert: vi.fn(),
  id: 'receipt-1',
  session: null as Session,
  authStatus: 'authenticated',
}));
vi.mock('./auth-session', () => ({
  useAuthSession: () => ({ session: mocks.session, status: mocks.authStatus }),
}));
vi.mock('./profile', () => ({ getMobileProfileClient: () => mocks }));
vi.mock('./receipts', () => ({ getMobileReceiptsClient: () => mocks }));
vi.mock('expo-router', () => ({
  useRouter: () => mocks,
  useNavigation: () => mocks,
  useLocalSearchParams: () => ({ id: mocks.id }),
}));
vi.mock('expo-router/react-navigation', () => ({
  usePreventRemove: (
    prevent: boolean,
    callback: (event: { data: { action: unknown } }) => void,
  ) => {
    mocks.beforeRemove = (event) => {
      if (!prevent) return;
      event.preventDefault();
      callback({ data: event.data });
    };
  },
}));
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
vi.mock('@sackerl/ui', () => ({
  categoryMeta: Object.fromEntries(
    [
      'dairy',
      'produce',
      'meat',
      'pantry',
      'canned',
      'frozen',
      'bakery',
      'snacks',
      'drinks',
      'spices',
    ].map((id) => [id, { bg: 'white', ink: 'black', short: id }]),
  ),
}));
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Alert: { alert: mocks.alert },
  StyleSheet: { create: <T,>(styles: T) => styles },
  ActivityIndicator: 'ActivityIndicator',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Modal: 'Modal',
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  Text: 'Text',
  TextInput: 'TextInput',
  View: 'View',
}));
import ReceiptReviewRoute from '../app/receipt-review/[id]';

let screen: ReactTestRenderer | undefined;
const text = () => JSON.stringify(screen?.toJSON());
const action = (label: string) => {
  if (!screen) throw new Error('Screen not mounted');
  const node = screen.root.findAll(
    (node) =>
      node.type === Pressable &&
      (node.props.accessibilityLabel === label ||
        node.findAllByType(Text).some((child) =>
          child.children
            .filter((value) => typeof value === 'string')
            .join('')
            .includes(label),
        )),
  )[0];
  if (!node) throw new Error(`Action missing: ${label}`);
  return node;
};
async function press(label: string) {
  await act(async () => {
    (action(label).props as { onPress: () => void }).onPress();
    await Promise.resolve();
  });
}
async function edit(label: string, value: string) {
  await act(() => {
    (
      screen?.root.findByProps({ accessibilityLabel: label }).props as {
        onChangeText: (value: string) => void;
      }
    ).onChangeText(value);
  });
}
async function render() {
  await act(() => {
    screen = create(<ReceiptReviewRoute />);
  });
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  mocks.session = { access_token: 'token', user: { id: 'owner', email: 'owner@test.invalid' } };
  mocks.authStatus = 'authenticated';
  mocks.id = 'receipt-1';
  mocks.getHousehold.mockReset().mockResolvedValue({ id: 'home' });
  mocks.getReceiptReview.mockReset().mockResolvedValue(receiptReview());
  mocks.saveReceiptReview.mockReset().mockResolvedValue(receiptReview());
  mocks.push.mockReset();
  mocks.replace.mockReset();
  mocks.back.mockReset();
  mocks.dispatch.mockReset();
  mocks.beforeRemove = null;
  mocks.alert.mockReset();
});
afterEach(async () => {
  if (screen) await act(() => screen?.unmount());
  screen = undefined;
  vi.unstubAllGlobals();
});

describe('Receipt review route', () => {
  it('shows loading, then explicit unresolved review with placement disabled', async () => {
    const pending = deferred<ReceiptReview>();
    mocks.getReceiptReview.mockReturnValue(pending.promise);
    await render();
    expect(text()).toContain('Loading receipt review');
    await act(async () => {
      pending.resolve(receiptReview());
      await pending.promise;
    });
    expect(text()).toContain('Save review draft');
    expect(text()).toContain('MILCH 1L');
    expect(action('Continue to placement').props.disabled).toBe(true);
    expect(mocks.getReceiptReview).toHaveBeenCalledTimes(1);
  });

  it('edits a date, requires review again, saves it, then exits to Home only from the saved snapshot', async () => {
    const saved = receiptReview([reviewItem({ expiry: { date: '2026-10-01', state: 'dated' } })]);
    mocks.saveReceiptReview.mockResolvedValue(saved);
    await render();
    await press('Edit Milk');
    expect(action('Unknown').props.accessibilityState).toMatchObject({ checked: true });
    await press('Has a date');
    await edit('Optional expiry date, year month day', '2026-10-01');
    await press('Mark reviewed');
    await press('Save review');
    expect(mocks.saveReceiptReview.mock.calls[0]?.[1].lines[0]?.expiry).toEqual({
      date: '2026-10-01',
      state: 'dated',
    });
    expect(action('Done for now')).toBeTruthy();
    await press('Done for now');
    expect(mocks.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('keeps expiry draft and blocks Done for now after an uncertain save', async () => {
    mocks.saveReceiptReview.mockRejectedValue(new Error('Offline'));
    await render();
    await press('Edit Milk');
    await press('No expiry date');
    await press('Mark reviewed');
    await press('Save review');
    expect(text()).toContain('Your edits are still here');
    expect(text()).toContain('No expiry date');
    expect(text()).not.toContain('Done for now');
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('redispatches the original supported navigation action after explicit discard', async () => {
    await render();
    await press('Edit Milk');
    await edit('Receipt item name', 'Unsaved name');
    const preventDefault = vi.fn();
    const actionToken = { type: 'GO_BACK' };
    mocks.beforeRemove?.({ preventDefault, data: { action: actionToken } });
    expect(preventDefault).toHaveBeenCalledOnce();
    const alertActions = mocks.alert.mock.calls[0]?.[2] as {
      readonly text: string;
      readonly onPress?: () => void;
    }[];
    await act(() => alertActions.find((item) => item.text === 'Discard changes')?.onPress?.());
    expect(mocks.dispatch).toHaveBeenCalledWith(actionToken);
  });

  it('blocks clean saved exit while saving and after a revision conflict', async () => {
    const saved = receiptReview();
    const persisted = { ...saved, receipt: { ...saved.receipt, reviewRevision: 3 } };
    mocks.getReceiptReview.mockResolvedValue(persisted);
    const pending = deferred<ReceiptReview>();
    mocks.saveReceiptReview.mockReturnValue(pending.promise);
    await render();
    expect(action('Done for now')).toBeTruthy();
    await press('Save review draft');
    expect(text()).not.toContain('Done for now');
    const preventDefault = vi.fn();
    mocks.beforeRemove?.({ preventDefault, data: { action: { type: 'GO_BACK' } } });
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(mocks.alert).toHaveBeenLastCalledWith(
      'Saving review',
      'Please wait for the save result before leaving.',
    );
    await act(async () => {
      pending.resolve(persisted);
      await pending.promise;
    });
    expect(action('Done for now')).toBeTruthy();
    mocks.saveReceiptReview.mockRejectedValue(new ApiRequestError('Conflict', 409));
    await press('Save review draft');
    expect(text()).not.toContain('Done for now');
    expect(text()).toContain('Reload');
  });

  it('preserves unsaved expiry after a same-account token refresh', async () => {
    await render();
    await press('Edit Milk');
    await press('Has a date');
    await edit('Optional expiry date, year month day', '2026-12-31');
    mocks.session = {
      access_token: 'refreshed',
      user: { id: 'owner', email: 'owner@test.invalid' },
    };
    await act(() => screen?.update(<ReceiptReviewRoute />));
    expect(
      screen?.root.findByProps({ accessibilityLabel: 'Optional expiry date, year month day' }).props
        .value,
    ).toBe('2026-12-31');
    expect(mocks.getReceiptReview).toHaveBeenCalledTimes(1);
    await press('Mark reviewed');
    await press('Save review');
    expect(mocks.saveReceiptReview.mock.calls[0]?.[0].accessToken).toBe('refreshed');
    expect(mocks.saveReceiptReview.mock.calls[0]?.[1].lines[0]?.expiry).toEqual({
      state: 'dated',
      date: '2026-12-31',
    });
  });

  it('keeps an uncertain save draft when the session refreshes in flight', async () => {
    const pending = deferred<ReceiptReview>();
    mocks.saveReceiptReview.mockReturnValue(pending.promise);
    await render();
    await press('Edit Milk');
    await press('No expiry date');
    await press('Mark reviewed');
    await press('Save review');
    mocks.session = {
      access_token: 'refreshed',
      user: { id: 'owner', email: 'owner@test.invalid' },
    };
    await act(() => screen?.update(<ReceiptReviewRoute />));
    expect(text()).toContain('session refreshed during the save');
    expect(text()).not.toContain('Done for now');
    await act(async () => {
      pending.resolve(receiptReview());
      await pending.promise;
    });
    expect(text()).toContain('No expiry date');
    expect(text()).not.toContain('Review saved. Items are not in stock yet.');
  });

  it('ignores a stale discard prompt after switching receipts', async () => {
    await render();
    await press('Edit Milk');
    await edit('Receipt item name', 'Unsaved name');
    mocks.beforeRemove?.({ preventDefault: vi.fn(), data: { action: { type: 'GO_BACK' } } });
    const actions = mocks.alert.mock.calls[0]?.[2] as { text: string; onPress?: () => void }[];
    mocks.id = 'receipt-2';
    await act(() => screen?.update(<ReceiptReviewRoute />));
    await act(() => actions.find((item) => item.text === 'Discard changes')?.onPress?.());
    expect(mocks.dispatch).not.toHaveBeenCalled();
  });

  it('restores the preserved draft when token refresh interrupts an explicit reload', async () => {
    await render();
    await press('Edit Milk');
    await press('Has a date');
    await edit('Optional expiry date, year month day', '2026-12-31');
    const pending = deferred<ReceiptReview>();
    mocks.getReceiptReview.mockReturnValue(pending.promise);
    await press('Reload receipt review');
    const actions = mocks.alert.mock.calls[0]?.[2] as { text: string; onPress?: () => void }[];
    await act(() => actions.find((item) => item.text === 'Reload')?.onPress?.());
    expect(text()).toContain('Loading receipt review');
    mocks.session = {
      access_token: 'refreshed',
      user: { id: 'owner', email: 'owner@test.invalid' },
    };
    await act(() => screen?.update(<ReceiptReviewRoute />));
    expect(text()).not.toContain('Loading receipt review');
    expect(
      screen?.root.findByProps({ accessibilityLabel: 'Optional expiry date, year month day' }).props
        .value,
    ).toBe('2026-12-31');
    await act(async () => {
      pending.resolve(receiptReview());
      await pending.promise;
    });
    expect(
      screen?.root.findByProps({ accessibilityLabel: 'Optional expiry date, year month day' }).props
        .value,
    ).toBe('2026-12-31');
  });

  it('does not fetch while signed out and retries a load failure', async () => {
    mocks.session = null;
    await render();
    expect(text()).toContain('Sign in');
    expect(mocks.getReceiptReview).not.toHaveBeenCalled();
    mocks.session = { access_token: 'token', user: { id: 'owner', email: 'owner@test.invalid' } };
    mocks.getReceiptReview.mockRejectedValueOnce(new Error('Offline'));
    await act(() => screen?.update(<ReceiptReviewRoute />));
    expect(text()).toContain('Offline');
    await press('Retry loading review');
    expect(text()).toContain('Milk');
  });

  it.each(['uploaded', 'failed'] as const)(
    'offers refresh and manual groceries with no generation (%s)',
    async (status) => {
      const review = receiptReview([]);
      mocks.getReceiptReview.mockResolvedValue({
        ...review,
        receipt: { ...review.receipt, activeParseGenerationId: null, status },
      });
      await render();
      await press('Refresh review');
      await press('Add groceries by hand');
      expect(mocks.push).toHaveBeenCalledWith('/add-item');
      expect(mocks.saveReceiptReview).not.toHaveBeenCalled();
      expect(text()).not.toContain('Continue to placement');
    },
  );

  it('adds into an empty generation without reloading and preserves the client ID on retry', async () => {
    mocks.getReceiptReview.mockResolvedValue(receiptReview([]));
    mocks.saveReceiptReview.mockRejectedValue(new Error('Offline'));
    await render();
    await press('Add missing item');
    await edit('Receipt item name', 'Beans');
    await edit('Receipt item quantity', '2');
    await press('Unit pcs');
    await press('Category Pantry');
    await press('Close');
    await press('Save review draft');
    await press('Save review draft');
    expect(mocks.getReceiptReview).toHaveBeenCalledTimes(1);
    expect(mocks.saveReceiptReview).toHaveBeenCalledTimes(2);
    const payload = mocks.saveReceiptReview.mock.calls[0]?.[1];
    expect(payload?.lines[0]).toMatchObject({
      name: 'Beans',
      qtyValue: 2,
      qtyUnit: 'pcs',
      categoryId: 'pantry',
      reviewState: 'unresolved',
    });
    expect(payload?.lines[0]?.clientLineId).toBeTruthy();
    expect(mocks.saveReceiptReview.mock.calls[1]?.[1]).toEqual(payload);
  });

  it('keeps corrected edits after a conflict and only replaces them after explicit reload', async () => {
    mocks.saveReceiptReview.mockRejectedValue(new ApiRequestError('Conflict', 409));
    await render();
    await press('Edit Milk');
    await edit('Receipt item name', 'Oat milk');
    await press('Close');
    await press('Mark Oat milk reviewed');
    await press('Save review');
    expect(text()).toContain('Your edits are still here');
    expect(text()).toContain('Oat milk');
    await press('Reload latest review');
    expect(mocks.getReceiptReview).toHaveBeenCalledTimes(1);
    const buttons = mocks.alert.mock.calls[0]?.[2] as { text: string; onPress?: () => void }[];
    await act(async () => {
      buttons.find((button) => button.text === 'Reload')?.onPress?.();
      await Promise.resolve();
    });
    expect(text()).not.toContain('Oat milk');
    expect(mocks.getReceiptReview).toHaveBeenCalledTimes(2);
  });

  it('saves all-excluded rows and adopts the returned revision for a second save', async () => {
    const saved = receiptReview([reviewItem({ included: false, reviewState: 'reviewed' })]);
    mocks.saveReceiptReview.mockResolvedValue({
      ...saved,
      receipt: { ...saved.receipt, reviewRevision: 8 },
    });
    await render();
    await press('Exclude Milk');
    expect(text()).toContain('No items to place');
    await press('Save review');
    expect(mocks.saveReceiptReview.mock.calls[0]?.[1]).toMatchObject({
      generationId: 'generation-1',
      expectedReviewRevision: 7,
      lines: [{ id: 'line-1', included: false }],
    });
    await press('Save review');
    expect(mocks.saveReceiptReview.mock.calls[1]?.[1]?.expectedReviewRevision).toBe(8);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('opens validation errors for excluded incomplete rows without sending a save', async () => {
    mocks.getReceiptReview.mockResolvedValue(
      receiptReview([reviewItem({ effectiveQtyValue: null })]),
    );
    await render();
    await press('Exclude Milk');
    await press('Save review');
    expect(text()).toContain('Excluded lines still need valid details');
    expect(screen?.root.findByType(Modal).props.visible).toBe(true);
    expect(mocks.saveReceiptReview).not.toHaveBeenCalled();
  });

  it('guards duplicate saves and edits/reload while a save is pending', async () => {
    const pending = deferred<ReceiptReview>();
    mocks.saveReceiptReview.mockReturnValue(pending.promise);
    await render();
    const save = (action('Save review draft').props as { onPress: () => void }).onPress;
    await act(async () => {
      save();
      save();
      await Promise.resolve();
    });
    expect(mocks.saveReceiptReview).toHaveBeenCalledTimes(1);
    expect(action('Exclude Milk').props.disabled).toBe(true);
    await press('Reload receipt review');
    expect(mocks.alert).not.toHaveBeenCalled();
    await act(async () => {
      pending.resolve(receiptReview());
      await pending.promise;
    });
    expect(text()).toContain('Review saved');
  });

  it('does not issue a save after sign-out during household lookup', async () => {
    await render();
    const pending = deferred<{ id: string }>();
    mocks.getHousehold.mockReturnValue(pending.promise);
    await press('Save review draft');
    mocks.session = null;
    await act(() => screen?.update(<ReceiptReviewRoute />));
    await act(async () => {
      pending.resolve({ id: 'home' });
      await pending.promise;
    });
    expect(mocks.saveReceiptReview).not.toHaveBeenCalled();
    expect(text()).not.toContain('Milk');
  });

  it('ignores a late save response after navigating to another receipt', async () => {
    const pending = deferred<ReceiptReview>();
    mocks.saveReceiptReview.mockReturnValue(pending.promise);
    await render();
    await press('Save review draft');
    const next = receiptReview([reviewItem({ effectiveName: 'New receipt' })]);
    mocks.id = 'receipt-2';
    mocks.getReceiptReview.mockResolvedValue({
      ...next,
      receipt: { ...next.receipt, id: 'receipt-2' },
    });
    await act(() => screen?.update(<ReceiptReviewRoute />));
    await act(async () => {
      pending.resolve(receiptReview());
      await pending.promise;
    });
    expect(text()).toContain('New receipt');
    expect(text()).not.toContain('Review saved');
  });

  it('preserves the visible draft when an explicitly requested reload fails', async () => {
    await render();
    await press('Edit Milk');
    await edit('Receipt item name', 'Keep this correction');
    await press('Close');
    mocks.getReceiptReview.mockRejectedValueOnce(new Error('Reload offline'));
    await press('Reload receipt review');
    const buttons = mocks.alert.mock.calls[0]?.[2] as { text: string; onPress?: () => void }[];
    await act(async () => {
      buttons.find((button) => button.text === 'Reload')?.onPress?.();
      await Promise.resolve();
    });
    expect(text()).toContain('Reload offline');
    expect(text()).toContain('Keep this correction');
    expect(action('Save review draft')).toBeTruthy();
  });

  it('discards a late load after sign-out and does not continue lookup after unmount', async () => {
    const pending = deferred<ReceiptReview>();
    mocks.getReceiptReview.mockReturnValueOnce(pending.promise);
    await render();
    mocks.session = null;
    await act(() => screen?.update(<ReceiptReviewRoute />));
    await act(async () => {
      pending.resolve(receiptReview());
      await pending.promise;
    });
    expect(text()).toContain('Sign in');
    expect(text()).not.toContain('Milk');
    const household = deferred<{ id: string }>();
    mocks.getHousehold.mockReturnValue(household.promise);
    mocks.session = {
      access_token: 'new-token',
      user: { id: 'owner', email: 'owner@test.invalid' },
    };
    await act(() => screen?.update(<ReceiptReviewRoute />));
    await act(() => screen?.unmount());
    screen = undefined;
    await act(async () => {
      household.resolve({ id: 'home' });
      await household.promise;
    });
    expect(mocks.getReceiptReview).toHaveBeenCalledTimes(1);
  });
});
