import { describe, expect, it } from 'vitest';

import { aliasSeedSize, matchReceiptAlias, normalizeReceiptToken } from './receipt-aliases';
import { confidenceLevelForScore, parseReceiptText } from './receipt-parsing';

describe('receipt parsing', () => {
  it('classifies confidence thresholds for review flows', () => {
    expect(confidenceLevelForScore(0.85)).toBe('high');
    expect(confidenceLevelForScore(0.65)).toBe('mid');
    expect(confidenceLevelForScore(0.64)).toBe('needs_review');
  });

  it('parses English receipt metadata and line items', () => {
    const result = parseReceiptText(`Sackerl Mart
Date 2026-06-21
Milk 1L 1.49
Bananas 1 kg 2.20
TOTAL EUR 3.69`);

    expect(result).toMatchObject({
      currency: 'EUR',
      purchasedOn: '2026-06-21',
      storeName: 'Sackerl Mart',
      totalCents: 369,
    });
    expect(result.items).toMatchObject([
      {
        categoryId: 'dairy',
        confidenceLevel: 'high',
        inferredName: 'Milk',
        qtyUnit: 'l',
        qtyValue: 1,
      },
      {
        categoryId: 'produce',
        confidenceLevel: 'high',
        inferredName: 'Bananas',
        qtyUnit: 'kg',
        qtyValue: 1,
      },
    ]);
  });

  it('parses German receipt labels and grocery terms', () => {
    const result = parseReceiptText(`Billa Plus
Datum 21.06.2026
Milch 1L 1,49
Bananen 1 kg 2,20
Summe EUR 3,69`);

    expect(result.purchasedOn).toBe('2026-06-21');
    expect(result.totalCents).toBe(369);
    expect(result.items).toMatchObject([
      { categoryId: 'dairy', inferredName: 'Milk' },
      { categoryId: 'produce', inferredName: 'Bananas' },
    ]);
  });

  it('parses French receipt labels and grocery terms', () => {
    const result = parseReceiptText(`Carrefour City
Date 21/06/2026
Lait 1L 1,49
Pommes 1 kg 2,20
SOMME EUR 3,69`);

    expect(result.purchasedOn).toBe('2026-06-21');
    expect(result.totalCents).toBe(369);
    expect(result.items).toMatchObject([
      { categoryId: 'dairy', inferredName: 'Milk' },
      { categoryId: 'produce', inferredName: 'Apples' },
    ]);
  });

  it('parses Italian receipt labels and grocery terms', () => {
    const result = parseReceiptText(`Coop Italia
Data 21-06-2026
Latte 1L 1,49
Pomodori 1 kg 2,20
TOTALE EUR 3,69`);

    expect(result.purchasedOn).toBe('2026-06-21');
    expect(result.totalCents).toBe(369);
    expect(result.items).toMatchObject([
      { categoryId: 'dairy', inferredName: 'Milk' },
      { categoryId: 'produce', inferredName: 'Tomatoes' },
    ]);
  });
});

describe('SCKRL-921 Austrian receipt alias spike (synthetic fixtures)', () => {
  it.each([
    ['Milsani Vollm. 3,5% 1L 1,19 A', 'vollmilch', 'hofer'],
    ['CLEVER H-MILCH 1L 0,99', 'haltbarmilch', 'billa'],
    ['Ja! Natürlich Bergkäse 200g 3,49', 'bergkaese', 'billa'],
    ['S-BUDGET SEMMEL 6 STK 1,29', 'semmel', 'spar'],
    ['Milbona Joghu Natur 500g 0,89', 'joghurt natur', 'lidl'],
    ['Paradeiser Rispen 0,512 kg 2,04', 'paradeiser rispen', null],
    ['Süßkartoffel 1,99', 'suesskartoffel', null],
  ] as const)('normalizes %s', (raw, norm, chain) => {
    expect(normalizeReceiptToken(raw)).toMatchObject({ chainHint: chain, norm });
  });

  it.each([
    // brand-only / exact
    ['ALMDUDLER 1,5L 1,79', 'drinks', 'exact'],
    ['MANNER SCHNITTEN 2,49', 'snacks', 'exact'],
    // abbreviation
    ['CLEVER VOLLM 1L 1,09', 'dairy', 'exact'],
    ['KAISERSE 0,25', 'bakery', 'exact'],
    // weight line
    ['Faschiertes gem. 0,486 kg 4,37', 'meat', 'token'],
    // alias hit inside longer line
    ['Bergkaese gerieben 150g 2,99', 'dairy', 'token'],
    // fuzzy OCR noise
    ['Erdaepfl festk. 2kg 2,49', 'produce', 'fuzzy'],
  ] as const)('matches %s', (raw, categoryId, method) => {
    expect(matchReceiptAlias(raw)).toMatchObject({ categoryId, method });
  });

  it.each([['PFAND 0,25'], ['RABATT -0,50'], ['XQZ 4711 9,99']] as const)(
    'misses non-product or unknown line %s',
    (raw) => {
      expect(matchReceiptAlias(raw).method).toBe('none');
    },
  );

  it('ships a seed of roughly 300 normalized aliases', () => {
    expect(aliasSeedSize()).toBeGreaterThanOrEqual(280);
  });
});
