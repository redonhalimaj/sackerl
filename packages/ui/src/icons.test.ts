import { describe, expect, it } from 'vitest';

import { iconDefinitions, resolveIconName, sourceIconNames, type IconName } from './icons';

const requiredNames = [
  'scan',
  'camera',
  'bell',
  'home',
  'sparkle',
  'basket',
  'clock',
  'search',
  'settings',
  'pdf',
  'upload',
  'check',
  'drop',
  'snowflake',
  'box',
  'flame',
  'cart',
  'arrowRight',
  'arrowUp',
  'list',
  'grid',
  'dots',
  'filter',
  'star',
  'shield',
  'leaf',
  'plus',
  'close',
  'chevron-left',
  'chevron-right',
  'chevron-down',
] as const satisfies readonly IconName[];

describe('icons', () => {
  it('contains every SCKRL-005 required icon name', () => {
    for (const name of requiredNames) {
      expect(iconDefinitions[resolveIconName(name)]).toBeDefined();
    }
  });

  it('keeps source icon names stable', () => {
    expect(sourceIconNames).toContain('chevronLeft');
    expect(sourceIconNames).toContain('arrowRight');
    expect(resolveIconName('chevron-left')).toBe('chevronLeft');
  });
});
