import { describe, expect, it } from 'vitest';

import {
  buttonSizeSpecs,
  buttonSizes,
  buttonVariants,
  cardVariants,
  categoryMeta,
  chipVariants,
  defaultPaperBagItems,
  kraftTexture,
  markViewBox,
  paperBagDefaults,
  resolveNativePaperBagColor,
  resolvePaperBagItem,
  roundIconButtonVariants,
  tileCategories,
  wordmarkTracking,
  zoneKinds,
  zoneMeta,
} from './index';

describe('primitives', () => {
  it('exports SCKRL-004 button and chip variants', () => {
    expect(buttonVariants).toEqual(['primary', 'ink', 'ghost', 'soft']);
    expect(buttonSizes).toEqual(['lg', 'md']);
    expect(buttonSizeSpecs.lg.height).toBe(52);
    expect(buttonSizeSpecs.md.height).toBe(38);
    expect(chipVariants).toEqual(['default', 'sage', 'amber', 'ghost']);
  });

  it('exports card variants and kraft texture values', () => {
    expect(cardVariants).toEqual(['default', 'flat', 'kraft']);
    expect(kraftTexture.backgroundColor).toBe('var(--kraft-soft)');
    expect(kraftTexture.backgroundImage).toContain('radial-gradient(circle at 25% 30%');
    expect(kraftTexture.backgroundSize).toBe('8px 8px, 11px 11px, 6px 6px, 14px 14px');
  });

  it('keeps category tile metadata aligned with the design overview', () => {
    expect(tileCategories).toHaveLength(10);
    expect(categoryMeta.dairy.short).toBe('MK');
    expect(categoryMeta.produce.short).toBe('PR');
    expect(categoryMeta.spices.ink).toBe('#7C4F26');
  });

  it('keeps storage zone metadata aligned with the design overview', () => {
    expect(zoneKinds).toEqual(['fridge', 'pantry', 'basement', 'freezer', 'cabinet']);
    expect(zoneMeta.fridge.short).toBe('FR');
    expect(zoneMeta.basement.short).toBe('BS');
    expect(roundIconButtonVariants).toEqual(['default', 'dark']);
  });

  it('exports the SCKRL-006 paper bag defaults', () => {
    expect(paperBagDefaults).toMatchObject({ animationDuration: 4.4, height: 300, width: 280 });
    expect(defaultPaperBagItems).toHaveLength(4);
    expect(resolvePaperBagItem(defaultPaperBagItems[1])).toMatchObject({
      dx: -12,
      height: 34,
      kind: 'rect',
      width: 16,
    });
    expect(resolveNativePaperBagColor('var(--amber)')).toBe('#F2C014');
  });

  it('exports the Sackerl brand mark constants', () => {
    expect(markViewBox).toBe('0 0 24 26');
    expect(wordmarkTracking).toBe(0);
  });
});
