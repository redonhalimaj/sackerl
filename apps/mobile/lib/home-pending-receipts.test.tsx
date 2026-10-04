import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import * as React from 'react';
import { Pressable, Text } from 'react-native';
import type { Receipt, ReceiptReview } from '@sackerl/api-client';
import { receiptReview } from './receipt-review.fixtures';

const mocks = vi.hoisted(() => ({
  getHousehold: vi.fn(),
  listItems: vi.fn(),
  listZones: vi.fn(),
  listSuggestions: vi.fn(),
  listPendingReceiptReviews: vi.fn(),
  getReceiptReview: vi.fn(),
  push: vi.fn(),
  focused: true,
  session: { access_token: 'token', user: { id: 'owner', email: 'owner@test.invalid' } },
}));

vi.mock('expo-router', () => {
  return {
    useFocusEffect: (callback: () => void | (() => void)) =>
      React.useEffect(() => (mocks.focused ? callback() : undefined), [callback, mocks.focused]),
    useRouter: () => mocks,
  };
});
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  StyleSheet: { create: <T,>(styles: T) => styles },
  ActivityIndicator: 'ActivityIndicator',
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  Text: 'Text',
  View: 'View',
}));
vi.mock('./auth-session', () => ({ useAuthSession: () => ({ session: mocks.session }) }));
vi.mock('./items', () => ({ getMobileItemsClient: () => mocks }));
vi.mock('./profile', () => ({ getMobileProfileClient: () => mocks }));
vi.mock('./recipes', () => ({ getMobileRecipesClient: () => mocks }));
vi.mock('./receipts', () => ({ getMobileReceiptsClient: () => mocks }));
vi.mock('@sackerl/ui', () => ({
  categoryMeta: {},
  PaperBag: 'PaperBag',
  zoneMeta: Object.fromEntries(
    ['fridge', 'pantry', 'basement', 'freezer', 'cabinet'].map((key) => [
      key,
      { bg: '#fff', ink: '#000', label: key, short: key.slice(0, 2) },
    ]),
  ),
}));
vi.mock('react-native-svg', () => ({
  Circle: 'Circle',
  default: 'Svg',
  Path: 'Path',
}));

import HomeRoute from '../app/(tabs)/index';

const pendingReceipt: Receipt = {
  id: 'receipt-1',
  householdId: 'home',
  activeParseGenerationId: 'generation-1',
  reviewRevision: 3,
  reviewStatus: 'reviewed',
  status: 'parsed',
  storeName: 'Market',
  purchasedOn: null,
  totalCents: null,
  currency: 'EUR',
  imageUrl: 'sackerl://fixture',
  capturedAt: '2026-09-28',
  createdAt: '2026-09-28',
  updatedAt: '2026-09-28',
  parsedAt: '2026-09-28',
  reviewedAt: null,
  reviewedBy: null,
};

let screen: ReactTestRenderer | undefined;
type ActionProps = { accessibilityLabel?: string; disabled?: boolean; onPress: () => void };
function textContent(node: ReactTestInstance): string {
  return node.children
    .map((child) => (typeof child === 'string' ? child : textContent(child)))
    .join('');
}
const button = (label: string): ActionProps => {
  if (!screen) throw new Error('Home is not mounted');
  const result = screen.root.findAll(
    (node) =>
      node.type === Pressable &&
      ((node.props as ActionProps).accessibilityLabel === label ||
        textContent(node).includes(label)),
  )[0];
  if (!result) throw new Error(`Action missing: ${label}`);
  return result.props as ActionProps;
};
const hasText = (value: string) =>
  screen?.root.findAllByType(Text).some((node) => textContent(node).includes(value)) ?? false;
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
const pendingPage = (receipts: readonly Receipt[], page = 1, total = receipts.length) => ({
  receipts,
  pagination: { page, pageSize: 3, total },
});
const namedReceipt = (id: string, storeName: string): Receipt => ({
  ...pendingReceipt,
  id,
  storeName,
});
async function perform(callback: () => void) {
  await act(async () => {
    callback();
    await Promise.resolve();
    await Promise.resolve();
  });
}
async function press(label: string) {
  await perform(() => button(label).onPress());
}
async function focusHome(focused: boolean) {
  mocks.focused = focused;
  await perform(() => screen?.update(<HomeRoute />));
}

beforeEach(() => {
  mocks.focused = true;
  mocks.session = { access_token: 'token', user: { id: 'owner', email: 'owner@test.invalid' } };
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  mocks.getHousehold.mockReset().mockResolvedValue({ id: 'home', zones: [] });
  mocks.listItems.mockReset().mockResolvedValue({ items: [], pagination: { total: 0 } });
  mocks.listZones.mockReset().mockResolvedValue([]);
  mocks.listSuggestions.mockReset().mockResolvedValue({ suggestions: [] });
  mocks.listPendingReceiptReviews.mockReset().mockResolvedValue({
    receipts: [pendingReceipt],
    pagination: { page: 1, pageSize: 3, total: 1 },
  });
  mocks.getReceiptReview.mockReset().mockResolvedValue(receiptReview());
  mocks.push.mockReset();
});
afterEach(async () => {
  if (screen) await perform(() => screen?.unmount());
  screen = undefined;
  vi.unstubAllGlobals();
});

async function renderHome() {
  await act(async () => {
    screen = create(<HomeRoute />);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('Home pending receipt review resume', () => {
  it('loads a bounded authenticated pending result and revalidates its same receipt before opening', async () => {
    await renderHome();
    expect(mocks.listPendingReceiptReviews).toHaveBeenCalledWith(
      expect.objectContaining({ user: { id: 'owner', email: 'owner@test.invalid' } }),
      { householdId: 'home', pageSize: 3 },
    );
    await act(async () => {
      button('Resume Market review').onPress();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mocks.getReceiptReview).toHaveBeenCalledWith(expect.anything(), {
      householdId: 'home',
      receiptId: 'receipt-1',
    });
    expect(mocks.push).toHaveBeenCalledWith({
      pathname: '/receipt-review/[id]',
      params: { id: 'receipt-1' },
    });
  });

  it('does not reopen a receipt whose canonical review is no longer pending', async () => {
    const noLongerPending: ReceiptReview = {
      ...receiptReview(),
      receipt: { ...receiptReview().receipt, activeParseGenerationId: null, reviewRevision: 0 },
    };
    mocks.getReceiptReview.mockResolvedValue(noLongerPending);
    await renderHome();
    await act(async () => {
      button('Resume Market review').onPress();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('drops a pending entry when the current household no longer matches', async () => {
    mocks.getHousehold
      .mockResolvedValueOnce({ id: 'home', zones: [] })
      .mockResolvedValueOnce({ id: 'other-household', zones: [] });
    await renderHome();
    await act(async () => {
      button('Resume Market review').onPress();
      await Promise.resolve();
    });
    expect(mocks.getReceiptReview).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('keeps entries after a failed canonical read and exposes a saved-review retry', async () => {
    mocks.getReceiptReview.mockRejectedValueOnce(new Error('temporary'));
    await renderHome();
    await press('Resume Market review');
    expect(hasText('temporarily unavailable')).toBe(true);
    expect(button('Resume Market review').disabled).toBe(false);
    await press('Retry saved reviews');
    expect(mocks.listPendingReceiptReviews).toHaveBeenCalledTimes(2);
    expect(hasText('temporarily unavailable')).toBe(false);
    expect(button('Resume Market review').disabled).toBe(false);
  });

  it('keeps existing entries when a same-account refocus refresh fails', async () => {
    await renderHome();
    mocks.listPendingReceiptReviews.mockRejectedValueOnce(new Error('temporary'));
    await focusHome(false);
    await focusHome(true);
    expect(hasText('Market')).toBe(true);
    expect(hasText('temporarily unavailable')).toBe(true);
    await press('Retry saved reviews');
    expect(hasText('temporarily unavailable')).toBe(false);
  });

  it('recovers an initial query failure through Retry saved reviews', async () => {
    mocks.listPendingReceiptReviews.mockRejectedValueOnce(new Error('temporary'));
    await renderHome();
    expect(hasText('temporarily unavailable')).toBe(true);
    await press('Retry saved reviews');
    expect(hasText('Market')).toBe(true);
    expect(mocks.listPendingReceiptReviews).toHaveBeenCalledTimes(2);
  });

  it('offers saved-review retry when the initial household lookup fails', async () => {
    mocks.getHousehold.mockRejectedValueOnce(new Error('temporary'));
    await renderHome();
    expect(mocks.listPendingReceiptReviews).not.toHaveBeenCalled();
    await press('Retry saved reviews');
    expect(button('Resume Market review').disabled).toBe(false);
  });

  it('prevents simultaneous resume requests before React commits disabled state', async () => {
    const canonical = deferred<ReceiptReview>();
    mocks.getReceiptReview.mockReturnValueOnce(canonical.promise);
    await renderHome();
    const onPress = button('Resume Market review').onPress;
    await perform(() => {
      onPress();
      onPress();
    });
    expect(mocks.getReceiptReview).toHaveBeenCalledTimes(1);
    expect(button('Resume Market review').disabled).toBe(true);
    await perform(() => canonical.resolve(receiptReview()));
    expect(mocks.push).toHaveBeenCalledTimes(1);
  });

  it('pages from the displayed household and deduplicates rows within and across pages', async () => {
    mocks.listPendingReceiptReviews
      .mockResolvedValueOnce(pendingPage([pendingReceipt], 1, 4))
      .mockResolvedValueOnce(
        pendingPage(
          [
            pendingReceipt,
            namedReceipt('receipt-2', 'Second'),
            namedReceipt('receipt-2', 'Second'),
          ],
          2,
          2,
        ),
      );
    await renderHome();
    const onPress = button('Show more saved reviews').onPress;
    await perform(() => {
      onPress();
      onPress();
    });
    expect(mocks.listPendingReceiptReviews).toHaveBeenCalledTimes(2);
    expect(mocks.listPendingReceiptReviews).toHaveBeenLastCalledWith(expect.anything(), {
      householdId: 'home',
      page: 2,
      pageSize: 3,
    });
    expect(
      screen?.root.findAllByProps({ accessibilityLabel: 'Resume Second review' }),
    ).toHaveLength(1);
  });

  it('keeps existing entries after paging failure and retries page one explicitly', async () => {
    mocks.listPendingReceiptReviews
      .mockResolvedValueOnce(pendingPage([pendingReceipt], 1, 4))
      .mockRejectedValueOnce(new Error('temporary'));
    await renderHome();
    await press('Show more saved reviews');
    expect(hasText('temporarily unavailable')).toBe(true);
    expect(button('Resume Market review').disabled).toBe(false);
    await press('Retry saved reviews');
    expect(mocks.listPendingReceiptReviews).toHaveBeenLastCalledWith(expect.anything(), {
      householdId: 'home',
      pageSize: 3,
    });
  });

  it('does not append another household to an existing saved-review page', async () => {
    mocks.listPendingReceiptReviews.mockResolvedValueOnce(pendingPage([pendingReceipt], 1, 4));
    await renderHome();
    mocks.getHousehold.mockResolvedValueOnce({ id: 'other-household', zones: [] });
    await press('Show more saved reviews');
    expect(mocks.listPendingReceiptReviews).toHaveBeenCalledTimes(1);
    expect(hasText('Market')).toBe(false);
    expect(hasText('temporarily unavailable')).toBe(true);
  });

  it.each(['resolve', 'reject'] as const)(
    'ignores an old resume %s after blur/refocus without unlocking the new resume',
    async (settlement) => {
      const oldRequest = deferred<ReceiptReview>();
      const newRequest = deferred<ReceiptReview>();
      mocks.getReceiptReview
        .mockReturnValueOnce(oldRequest.promise)
        .mockReturnValueOnce(newRequest.promise);
      await renderHome();
      await press('Resume Market review');
      await focusHome(false);
      await focusHome(true);
      await press('Resume Market review');
      await perform(() => {
        if (settlement === 'resolve') oldRequest.resolve(receiptReview());
        else oldRequest.reject(new Error('stale failure'));
      });
      expect(mocks.push).not.toHaveBeenCalled();
      expect(hasText('temporarily unavailable')).toBe(false);
      expect(button('Resume Market review').disabled).toBe(true);
      await perform(() => newRequest.resolve(receiptReview()));
      expect(mocks.push).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['resolve', 'reject'] as const)(
    'ignores an old page %s after blur/refocus without unlocking newer paging',
    async (settlement) => {
      const oldPage = deferred<ReturnType<typeof pendingPage>>();
      const newPage = deferred<ReturnType<typeof pendingPage>>();
      mocks.listPendingReceiptReviews
        .mockResolvedValueOnce(pendingPage([pendingReceipt], 1, 9))
        .mockReturnValueOnce(oldPage.promise)
        .mockResolvedValueOnce(pendingPage([pendingReceipt], 1, 9))
        .mockReturnValueOnce(newPage.promise);
      await renderHome();
      await press('Show more saved reviews');
      await focusHome(false);
      await focusHome(true);
      await press('Show more saved reviews');
      await perform(() => {
        if (settlement === 'resolve')
          oldPage.resolve(pendingPage([namedReceipt('old', 'Stale')], 2, 9));
        else oldPage.reject(new Error('stale failure'));
      });
      expect(hasText('Stale')).toBe(false);
      expect(hasText('temporarily unavailable')).toBe(false);
      expect(button('Show more saved reviews').disabled).toBe(true);
      await perform(() => newPage.resolve(pendingPage([namedReceipt('new', 'Current')], 2, 2)));
      expect(hasText('Current')).toBe(true);
      expect(hasText('Stale')).toBe(false);
    },
  );

  it('ignores an old query failure while a new focus refresh is still loading', async () => {
    const oldQuery = deferred<ReturnType<typeof pendingPage>>();
    const newQuery = deferred<ReturnType<typeof pendingPage>>();
    mocks.listPendingReceiptReviews
      .mockReturnValueOnce(oldQuery.promise)
      .mockReturnValueOnce(newQuery.promise);
    await renderHome();
    await focusHome(false);
    await focusHome(true);
    await perform(() => oldQuery.reject(new Error('stale failure')));
    expect(hasText('temporarily unavailable')).toBe(false);
    expect(hasText('Loading saved reviews')).toBe(true);
    await perform(() => newQuery.resolve(pendingPage([pendingReceipt])));
    expect(button('Resume Market review').disabled).toBe(false);
  });

  it.each(['account', 'token'] as const)(
    'ignores stale resume failure after an auth %s change',
    async (change) => {
      const oldRequest = deferred<ReceiptReview>();
      mocks.getReceiptReview.mockReturnValueOnce(oldRequest.promise);
      await renderHome();
      await press('Resume Market review');
      mocks.session = {
        access_token: 'new-token',
        user: { id: change === 'account' ? 'new-owner' : 'owner', email: 'owner@test.invalid' },
      };
      mocks.listPendingReceiptReviews.mockResolvedValue(
        pendingPage([namedReceipt('receipt-2', 'Current account')]),
      );
      await perform(() => screen?.update(<HomeRoute />));
      await perform(() => oldRequest.reject(new Error('stale failure')));
      expect(mocks.push).not.toHaveBeenCalled();
      expect(hasText('temporarily unavailable')).toBe(false);
      expect(hasText('Market')).toBe(false);
      expect(button('Resume Current account review').disabled).toBe(false);
    },
  );

  it('checks auth and focus again after household lookup before requesting a canonical review', async () => {
    const household = deferred<{ id: string; zones: readonly string[] }>();
    await renderHome();
    mocks.getHousehold.mockReturnValueOnce(household.promise);
    await press('Resume Market review');
    await focusHome(false);
    await perform(() => household.resolve({ id: 'home', zones: [] }));
    expect(mocks.getReceiptReview).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
