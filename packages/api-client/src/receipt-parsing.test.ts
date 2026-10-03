import { describe, expect, it } from 'vitest';

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
