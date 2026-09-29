import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { EffectCallback } from 'react';

const mocks = vi.hoisted(() => ({
  getHousehold: vi.fn(),
  createReceipt: vi.fn(),
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
  mocks.session = {
    access_token: 'test-token',
    user: { id: 'owner', email: 'owner@example.test' },
  };
  mocks.getHousehold.mockReset().mockResolvedValue({ id: 'home' });
  mocks.createReceipt.mockReset().mockResolvedValue({ id: receiptId, status: 'uploaded' });
  mocks.push.mockReset();
  mocks.replace.mockReset();
});
afterEach(async () => {
  if (screen) await act(() => screen?.unmount());
  screen = undefined;
  vi.useRealTimers();
  vi.unstubAllGlobals();
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
