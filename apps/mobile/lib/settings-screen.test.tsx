import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { EffectCallback } from 'react';

const mocks = vi.hoisted(() => ({
  getHousehold: vi.fn(),
  updateHouseholdCalendar: vi.fn(),
  session: { access_token: 'test-token', user: { id: 'owner', email: 'test@example.test' } },
}));
vi.mock('./auth-session', () => ({
  useAuthSession: () => ({ session: mocks.session, signOut: vi.fn() }),
}));
vi.mock('./profile', () => ({ getMobileProfileClient: () => mocks }));
vi.mock('@sackerl/ui', () => ({ Logo: () => null }));
vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Platform: { OS: 'ios' },
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  Text: 'Text',
  TextInput: 'TextInput',
  View: 'View',
  StyleSheet: { create: <T,>(styles: T) => styles },
}));
vi.mock('expo-router', async () => {
  const { useEffect } = await import('react');
  return { useFocusEffect: (effect: EffectCallback) => useEffect(effect, [effect]) };
});

import SettingsRoute from '../app/(tabs)/settings';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let screen: ReactTestRenderer;
const household = { id: 'home', role: 'owner', calendarTimeZone: 'Europe/Vienna' };

beforeEach(() => {
  mocks.getHousehold.mockReset().mockResolvedValue(household);
  mocks.updateHouseholdCalendar.mockReset();
});
afterEach(async () => {
  if (screen) await act(() => screen.unmount());
});

async function renderSettings() {
  await interact(() => {
    screen = create(<SettingsRoute />);
  });
}
async function interact(action: () => void) {
  await act(async () => {
    action();
    await Promise.resolve();
  });
}
function button(label: string) {
  const found = screen.root
    .findAll((node) => String(node.type) === 'Pressable')
    .find((node) =>
      node
        .findAll((child) => String(child.type) === 'Text')
        .some((child) => child.children.includes(label)),
    );
  if (!found) throw new Error(`Button not found: ${label}`);
  return found;
}

function typeZone(value: string) {
  const props = screen.root.findByProps({ accessibilityLabel: 'Household time zone' }).props as {
    onChangeText: (value: string) => void;
  };
  props.onChangeText(value);
}

function press(label: string) {
  const props = button(label).props as { onPress: () => void };
  props.onPress();
}

describe('household calendar Settings', () => {
  it('lets the owner save a zone and displays the persisted result', async () => {
    mocks.updateHouseholdCalendar.mockResolvedValue({
      ...household,
      calendarTimeZone: 'Europe/London',
    });
    await renderSettings();
    await interact(() => typeZone('Europe/London'));
    await interact(() => press('Save calendar'));
    expect(mocks.updateHouseholdCalendar).toHaveBeenCalledWith(
      { accessToken: 'test-token', user: mocks.session.user },
      { calendarTimeZone: 'Europe/London' },
    );
    expect(screen.root.findByProps({ accessibilityLabel: 'Household time zone' }).props.value).toBe(
      'Europe/London',
    );
    expect(JSON.stringify(screen.toJSON())).toContain('Household calendar saved.');
  });

  it('makes the household calendar read-only for a member', async () => {
    mocks.getHousehold.mockResolvedValue({ ...household, role: 'member' });
    await renderSettings();
    expect(
      screen.root.findByProps({ accessibilityLabel: 'Household time zone' }).props.editable,
    ).toBe(false);
    expect(() => button('Save calendar')).toThrow('Button not found');
    expect(mocks.updateHouseholdCalendar).not.toHaveBeenCalled();
  });

  it('retains an invalid draft and reports save failure without success copy', async () => {
    mocks.updateHouseholdCalendar.mockRejectedValue(
      new Error('Calendar time zone must be a valid IANA time zone.'),
    );
    await renderSettings();
    await interact(() => typeZone('Not/AZone'));
    await interact(() => press('Save calendar'));
    expect(screen.root.findByProps({ accessibilityLabel: 'Household time zone' }).props.value).toBe(
      'Not/AZone',
    );
    expect(JSON.stringify(screen.toJSON())).toContain(
      'Calendar time zone must be a valid IANA time zone.',
    );
    expect(JSON.stringify(screen.toJSON())).not.toContain('Household calendar saved.');
  });

  it('recovers from a failed household load through Retry', async () => {
    mocks.getHousehold.mockRejectedValueOnce(new Error('Connection lost'));
    await renderSettings();
    expect(JSON.stringify(screen.toJSON())).toContain('Connection lost');
    await interact(() => press('Retry loading settings'));
    expect(screen.root.findByProps({ accessibilityLabel: 'Household time zone' }).props.value).toBe(
      'Europe/Vienna',
    );
  });
});
