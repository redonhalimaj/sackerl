import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { EffectCallback } from 'react';
import type { CreateReceiptInput, PromoteReceiptParseInput } from '@sackerl/api-client';

const mocks = vi.hoisted(() => ({
  getHousehold: vi.fn(),
  createReceipt: vi.fn(),
  listReceipts: vi.fn(),
  getReceiptReview: vi.fn(),
  promoteReceiptParse: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  session: null as { access_token: string; user: { id: string; email: string } } | null,
}));
vi.mock('./auth-session', () => ({ useAuthSession: () => ({ session: mocks.session }) }));
vi.mock('./profile', () => ({ getMobileProfileClient: () => mocks }));
vi.mock('./receipts', () => ({ getMobileReceiptsClient: () => mocks }));
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
  Rect: 'Rect',
}));
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Pressable: 'Pressable',
  Text: 'Text',
  View: 'View',
  StyleSheet: { create: <T,>(styles: T) => styles },
}));
vi.mock('expo-router', async () => {
  const { useEffect } = await import('react');
  return {
    useRouter: () => mocks,
    useFocusEffect: (effect: EffectCallback) => useEffect(effect, [effect]),
  };
});

import ScanRoute from '../app/(tabs)/scan';

let screen: ReactTestRenderer | undefined;
const receiptId = '30400000-0000-4000-8000-000000000001';

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('__DEV__', true);
  vi.stubEnv('EXPO_PUBLIC_APP_ENV', 'dev');
  mocks.session = {
    access_token: 'test-token',
    user: { id: 'owner', email: 'owner@example.test' },
  };
  mocks.getHousehold.mockReset().mockResolvedValue({ id: 'home' });
  mocks.createReceipt.mockReset().mockResolvedValue({ id: receiptId, status: 'uploaded' });
  mocks.push.mockReset();
  mocks.replace.mockReset();
  mocks.listReceipts.mockReset();
  mocks.getReceiptReview
    .mockReset()
    .mockResolvedValue({ receipt: { activeParseGenerationId: null, reviewRevision: 0 } });
  mocks.promoteReceiptParse.mockReset().mockResolvedValue({});
});
afterEach(async () => {
  if (screen) await act(() => screen?.unmount());
  screen = undefined;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function renderScan() {
  await act(() => {
    screen = create(<ScanRoute />);
  });
}
function action(label: string) {
  if (!screen) throw new Error('Scan not mounted');
  return screen.root.findByProps({ accessibilityLabel: label }).props as {
    onPress: () => void;
    disabled: boolean;
  };
}
async function capture(label = 'Capture receipt') {
  await act(async () => {
    action(label).onPress();
    await vi.advanceTimersByTimeAsync(220);
  });
}

describe('Scan entry into receipt review', () => {
  it.each([
    [false, 'dev'],
    [true, 'prod'],
    [true, 'staging'],
  ])('hides the sample for development=%s environment=%s', async (development, environment) => {
    vi.stubGlobal('__DEV__', development);
    vi.stubEnv('EXPO_PUBLIC_APP_ENV', environment);
    await renderScan();
    expect(screen?.root.findAllByProps({ accessibilityLabel: 'Load sample receipt' })).toHaveLength(
      0,
    );
    expect(mocks.createReceipt).not.toHaveBeenCalled();
  });

  it('loads synthetic unresolved parser rows and prevents simultaneous capture', async () => {
    await renderScan();
    const samplePress = action('Load sample receipt').onPress;
    const capturePress = action('Capture receipt').onPress;
    await act(() => {
      samplePress();
      samplePress();
      capturePress();
    });
    expect(mocks.createReceipt).toHaveBeenCalledTimes(1);
    expect(mocks.promoteReceiptParse).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'test-token' }),
      expect.objectContaining({
        receiptId,
        householdId: 'home',
        expectedReviewRevision: 0,
        expectedActiveParseGenerationId: null,
        provider: 'development-fixture',
      }),
    );
    const promotion = mocks.promoteReceiptParse.mock.calls[0]?.[1] as PromoteReceiptParseInput;
    expect(promotion.parsed.storeName).toBe('Sackerl QA sample (not a real purchase)');
    expect(promotion.parsed.items[2]).toMatchObject({
      inferredName: 'Bread',
      confidenceLevel: 'needs_review',
    });
    expect(mocks.push).toHaveBeenCalledWith({
      pathname: '/receipt-review/[id]',
      params: { id: receiptId },
    });
  });

  it('checks the environment again when an existing button handler is invoked', async () => {
    await renderScan();
    const press = action('Load sample receipt').onPress;
    vi.stubEnv('EXPO_PUBLIC_APP_ENV', 'prod');
    await act(() => press());
    expect(mocks.getHousehold).not.toHaveBeenCalled();
  });

  it('recovers a lost create response across pages without inserting another receipt', async () => {
    mocks.createReceipt.mockRejectedValueOnce(new Error('Lost response'));
    await renderScan();
    await act(() => action('Load sample receipt').onPress());
    expect(mocks.push).not.toHaveBeenCalled();
    const creation = mocks.createReceipt.mock.calls[0]?.[1] as CreateReceiptInput;
    const marker = creation.imageUrl;
    mocks.listReceipts
      .mockResolvedValueOnce({
        receipts: [{ id: 'other', imageUrl: 'other' }],
        pagination: { pageSize: 1, total: 2 },
      })
      .mockResolvedValueOnce({
        receipts: [{ id: receiptId, imageUrl: marker }],
        pagination: { pageSize: 1, total: 2 },
      });
    await act(() => action('Load sample receipt').onPress());
    expect(mocks.createReceipt).toHaveBeenCalledTimes(1);
    expect(mocks.listReceipts).toHaveBeenLastCalledWith(expect.anything(), {
      householdId: 'home',
      page: 2,
      pageSize: 100,
    });
    expect(mocks.push).toHaveBeenCalledTimes(1);
  });

  it('keeps uncertain creation pending after no-match or failed reconciliation', async () => {
    mocks.createReceipt.mockRejectedValueOnce(new Error('Lost response'));
    await renderScan();
    await act(() => action('Load sample receipt').onPress());
    mocks.listReceipts.mockRejectedValueOnce(new Error('Offline'));
    await act(() => action('Load sample receipt').onPress());
    mocks.listReceipts.mockResolvedValue({ receipts: [], pagination: { pageSize: 100, total: 0 } });
    await act(() => action('Load sample receipt').onPress());
    expect(JSON.stringify(screen?.toJSON())).toContain('still unconfirmed');
    expect(mocks.createReceipt).toHaveBeenCalledTimes(1);
    expect(mocks.promoteReceiptParse).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('recovers an already promoted generation after a lost promotion response', async () => {
    mocks.promoteReceiptParse.mockRejectedValueOnce(new Error('Lost response'));
    mocks.getReceiptReview
      .mockResolvedValueOnce({ receipt: { activeParseGenerationId: null, reviewRevision: 0 } })
      .mockResolvedValue({ receipt: { activeParseGenerationId: 'generation', reviewRevision: 2 } });
    await renderScan();
    await act(() => action('Load sample receipt').onPress());
    await act(() => action('Load sample receipt').onPress());
    expect(mocks.createReceipt).toHaveBeenCalledTimes(1);
    expect(mocks.promoteReceiptParse).toHaveBeenCalledTimes(1);
    expect(mocks.push).toHaveBeenCalledTimes(2);
  });

  it('retries failed promotion on the same receipt with a fresh snapshot', async () => {
    mocks.promoteReceiptParse.mockRejectedValueOnce(new Error('Parse unavailable'));
    await renderScan();
    await act(() => action('Load sample receipt').onPress());
    expect(mocks.push).not.toHaveBeenCalled();
    expect(JSON.stringify(screen?.toJSON())).toContain('Parse unavailable');
    await act(() => action('Load sample receipt').onPress());
    expect(mocks.createReceipt).toHaveBeenCalledTimes(1);
    expect(mocks.promoteReceiptParse).toHaveBeenCalledTimes(2);
    expect(mocks.push).toHaveBeenCalledTimes(1);
  });

  it('does not promote or navigate after the sample session changes during creation', async () => {
    let complete!: (receipt: { id: string }) => void;
    mocks.createReceipt.mockReturnValue(new Promise((resolve) => (complete = resolve)));
    await renderScan();
    await act(() => action('Load sample receipt').onPress());
    mocks.session = null;
    await act(() => screen?.update(<ScanRoute />));
    await act(() => complete({ id: receiptId }));
    expect(mocks.getReceiptReview).not.toHaveBeenCalled();
    expect(mocks.promoteReceiptParse).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('does not navigate when sample promotion finishes after unmount', async () => {
    let complete!: (result: object) => void;
    mocks.promoteReceiptParse.mockReturnValue(new Promise((resolve) => (complete = resolve)));
    await renderScan();
    await act(() => action('Load sample receipt').onPress());
    expect(mocks.promoteReceiptParse).toHaveBeenCalledTimes(1);
    await act(() => screen?.unmount());
    screen = undefined;
    await act(() => complete({}));
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('opens the persisted receipt ID without claiming a parsed receipt or real upload', async () => {
    await renderScan();
    expect(JSON.stringify(screen?.toJSON())).toContain('Capture is simulated.');
    await capture();
    expect(mocks.createReceipt).toHaveBeenCalledWith(
      { accessToken: 'test-token', user: mocks.session?.user },
      expect.objectContaining({ householdId: 'home', status: 'uploaded' }),
    );
    expect(mocks.push).toHaveBeenCalledTimes(1);
    expect(mocks.push).toHaveBeenCalledWith({
      pathname: '/receipt-review/[id]',
      params: { id: receiptId },
    });
  });

  it('prevents duplicate captures before rerender and disables imports while saving', async () => {
    let complete!: (receipt: { id: string }) => void;
    mocks.createReceipt.mockReturnValue(new Promise((resolve) => (complete = resolve)));
    await renderScan();
    const press = action('Capture receipt').onPress;
    await act(async () => {
      press();
      press();
      await vi.advanceTimersByTimeAsync(220);
    });
    expect(mocks.createReceipt).toHaveBeenCalledTimes(1);
    expect(action('Import receipt from gallery').disabled).toBe(true);
    expect(action('Import receipt PDF').disabled).toBe(true);
    expect(mocks.push).not.toHaveBeenCalled();
    await act(async () => {
      complete({ id: receiptId });
      await Promise.resolve();
    });
    expect(mocks.push).toHaveBeenCalledTimes(1);
  });

  it('keeps failed capture on Scan and allows a retry into review', async () => {
    mocks.createReceipt.mockRejectedValueOnce(new Error('Connection lost'));
    await renderScan();
    await capture('Import receipt from gallery');
    expect(JSON.stringify(screen?.toJSON())).toContain('Connection lost');
    expect(mocks.push).not.toHaveBeenCalled();
    expect(action('Capture receipt').disabled).toBe(false);
    await capture('Import receipt from gallery');
    expect(mocks.push).toHaveBeenCalledTimes(1);
  });

  it('does not navigate when a receipt response arrives after the session changes', async () => {
    let complete!: (receipt: { id: string }) => void;
    mocks.createReceipt.mockReturnValue(new Promise((resolve) => (complete = resolve)));
    await renderScan();
    await capture();
    mocks.session = null;
    await act(() => screen?.update(<ScanRoute />));
    await act(async () => {
      complete({ id: receiptId });
      await Promise.resolve();
    });
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('does not navigate after the capture screen unmounts', async () => {
    let complete!: (receipt: { id: string }) => void;
    mocks.createReceipt.mockReturnValue(new Promise((resolve) => (complete = resolve)));
    await renderScan();
    await capture();
    await act(() => screen?.unmount());
    screen = undefined;
    await act(async () => {
      complete({ id: receiptId });
      await Promise.resolve();
    });
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
