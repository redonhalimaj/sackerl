import { describe, expect, it } from 'vitest';

import { colorTokens, cssVariables, nativeTypography, typography } from './index';

describe('design tokens', () => {
  it('maps every color token to a CSS variable export', () => {
    for (const token of Object.values(colorTokens)) {
      expect(cssVariables[token.cssVariable]).toBe(token.value);
      expect(token.oklch).toMatch(/^oklch\(/);
    }
  });

  it('defines the SCKRL-003 app text scale with stable tracking', () => {
    expect(typography.display).toMatchObject({ fontSize: 56, fontWeight: '700' });
    expect(typography.headline).toMatchObject({ fontSize: 32, fontWeight: '600' });
    expect(typography.title).toMatchObject({ fontSize: 22, fontWeight: '600' });
    expect(typography.body).toMatchObject({ fontSize: 16, fontWeight: '500' });
    expect(typography.caption).toMatchObject({ fontSize: 13, fontWeight: '500' });

    for (const style of Object.values(typography)) {
      expect(style.letterSpacing).toBe(0);
    }
  });

  it('provides native typography variants for iOS and Android', () => {
    expect(nativeTypography.ios.body.fontFamily).toBe('SF Pro Display');
    expect(nativeTypography.android.body.fontFamily).toBe('Inter');
  });
});
