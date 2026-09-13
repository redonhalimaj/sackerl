import { describe, expect, it } from 'vitest';

import { normalizeZoneParam, parseQuantity } from './add-item-form';

describe('mobile add-item form behavior', () => {
  it('accepts localized positive quantities', () => {
    expect(parseQuantity(' 1,5 ')).toBe(1.5);
    expect(parseQuantity('2')).toBe(2);
  });

  it('rejects empty, zero, negative, and non-numeric quantities', () => {
    expect(parseQuantity('')).toBeNull();
    expect(parseQuantity('0')).toBeNull();
    expect(parseQuantity('-1')).toBeNull();
    expect(parseQuantity('many')).toBeNull();
  });

  it('normalizes a valid route zone and ignores unsafe values', () => {
    expect(normalizeZoneParam(['  Cellar-2 '])).toBe('cellar-2');
    expect(normalizeZoneParam('fridge')).toBe('fridge');
    expect(normalizeZoneParam('bad zone')).toBeUndefined();
    expect(normalizeZoneParam(undefined)).toBeUndefined();
  });
});
