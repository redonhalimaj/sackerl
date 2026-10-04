import { describe, expect, it } from 'vitest';

import {
  buildAddExpiryDeclaration,
  buildEditExpiryIntent,
  buildEditItemMutation,
  estimateExpiryForHousehold,
  isValidGregorianDate,
  normalizeZoneParam,
  parseQuantity,
} from './add-item-form';

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

  it('accepts only real Gregorian dates', () => {
    expect(isValidGregorianDate('2024-02-29')).toBe(true);
    expect(isValidGregorianDate('2025-02-29')).toBe(false);
    expect(isValidGregorianDate('2026-04-31')).toBe(false);
    expect(isValidGregorianDate('2026-4-01')).toBe(false);
  });

  it('uses the household calendar day for expiry estimates', () => {
    const now = new Date('2026-09-16T23:30:00.000Z');

    expect(
      estimateExpiryForHousehold({
        categoryId: 'produce',
        now,
        timeZone: 'Europe/Vienna',
        zoneKey: 'fridge',
      }),
    ).toBe('2026-09-23');
  });

  it('declares untouched add dates as unconfirmed estimates', () => {
    expect(buildAddExpiryDeclaration({ expiryInput: '2026-09-22', expiryTouched: false })).toEqual({
      expiresOn: '2026-09-22',
      expiry: {
        confirm: false,
        estimatorVersion: 'category-zone-v1',
        printedMarking: 'unknown',
        source: 'estimated',
      },
    });
  });

  it('declares a typed date as user confirmed even when it equals the estimate', () => {
    expect(buildAddExpiryDeclaration({ expiryInput: '2026-09-22', expiryTouched: true })).toEqual({
      expiresOn: '2026-09-22',
      expiry: {
        confirm: true,
        printedMarking: 'unknown',
        source: 'user',
      },
    });
  });

  it('falls back to an estimate when Add is submitted with a blank date', () => {
    expect(
      buildAddExpiryDeclaration({
        expiryInput: '   ',
        expiryTouched: true,
        fallbackExpiry: '2026-09-22',
      }),
    ).toEqual({
      expiresOn: '2026-09-22',
      expiry: {
        confirm: false,
        estimatorVersion: 'category-zone-v1',
        printedMarking: 'unknown',
        source: 'estimated',
      },
    });
  });

  it('keeps untouched Edit expiry out of the mutation', () => {
    expect(
      buildEditExpiryIntent({
        expectedFactId: 'fact-1',
        expiryInput: '2026-09-22',
        expiryTouched: false,
      }),
    ).toEqual({ kind: 'unchanged' });
  });

  it('guards edited and cleared Edit expiry with the loaded fact id, including null', () => {
    expect(
      buildEditExpiryIntent({
        expectedFactId: null,
        expiryInput: '2026-09-22',
        expiryTouched: true,
      }),
    ).toEqual({
      expiresOn: '2026-09-22',
      expiry: {
        confirm: true,
        expectedFactId: null,
        printedMarking: 'unknown',
        source: 'user',
      },
      kind: 'set',
    });
    expect(
      buildEditExpiryIntent({ expectedFactId: null, expiryInput: '', expiryTouched: true }),
    ).toEqual({ expectedFactId: null, kind: 'clear' });
  });

  it('builds one atomic clear mutation with metadata changes and a null guard', () => {
    expect(
      buildEditItemMutation({
        categoryId: 'produce',
        expiryInput: '',
        expiryTouched: true,
        name: 'Cucumber',
        qtyUnit: 'pcs',
        qtyValue: 2,
        selectedItem: { expiryProvenance: { factId: null } },
        zoneId: 'zone-1',
      }),
    ).toEqual({
      changes: {
        categoryId: 'produce',
        name: 'Cucumber',
        qtyUnit: 'pcs',
        qtyValue: 2,
        zoneId: 'zone-1',
      },
      expectedFactId: null,
      kind: 'clear',
    });
  });

  it('omits expiry from an unchanged edit and includes it for a typed equal date', () => {
    const selectedItem = { expiryProvenance: { factId: 'fact-1' } };
    const unchanged = buildEditItemMutation({
      categoryId: 'produce',
      expiryInput: '2026-09-22',
      expiryTouched: false,
      name: 'Cucumber',
      qtyUnit: 'pcs',
      qtyValue: 1,
      selectedItem,
      zoneId: 'zone-1',
    });
    const typed = buildEditItemMutation({
      categoryId: 'produce',
      expiryInput: '2026-09-22',
      expiryTouched: true,
      name: 'Cucumber',
      qtyUnit: 'pcs',
      qtyValue: 1,
      selectedItem,
      zoneId: 'zone-1',
    });

    expect(unchanged).toEqual({
      changes: {
        categoryId: 'produce',
        name: 'Cucumber',
        qtyUnit: 'pcs',
        qtyValue: 1,
        zoneId: 'zone-1',
      },
      kind: 'update',
    });
    expect(typed).toEqual({
      changes: {
        categoryId: 'produce',
        expiry: {
          confirm: true,
          expectedFactId: 'fact-1',
          printedMarking: 'unknown',
          source: 'user',
        },
        expiresOn: '2026-09-22',
        name: 'Cucumber',
        qtyUnit: 'pcs',
        qtyValue: 1,
        zoneId: 'zone-1',
      },
      kind: 'update',
    });
  });
});
