type TokenRole = {
  readonly cssVariable: string;
  readonly value: string;
  readonly role: string;
  readonly oklch: string;
};

export const colors = {
  bg: '#FCFDFA',
  bgWarm: '#F4F7EE',
  card: '#FFFFFF',
  ink: '#1B2418',
  inkSoft: '#364232',
  mute: '#6E7A6A',
  muteSoft: '#A3AC9E',
  border: '#E8ECDF',
  borderSoft: '#F1F4EA',
  hairline: 'rgba(27, 36, 24, 0.08)',
  sage: '#4F9D3A',
  sageDeep: '#2F6A20',
  sageSoft: '#ECF6E5',
  sageTint: '#D4E9C6',
  amber: '#F2C014',
  amberDeep: '#B58A0C',
  amberSoft: '#FBF3CC',
  kraft: '#C8A06E',
  kraftDeep: '#8A6238',
  kraftSoft: '#F4E8D2',
  kraftInk: '#4A3520',
  berry: '#8AA53A',
  berrySoft: '#F1F4D8',
  sky: '#6B8E66',
  skySoft: '#E7EFDF',
} as const;

export const colorTokens = {
  bg: {
    cssVariable: '--bg',
    value: colors.bg,
    oklch: 'oklch(.99 .005 117)',
    role: 'Paper / app background',
  },
  bgWarm: {
    cssVariable: '--bg-warm',
    value: colors.bgWarm,
    oklch: 'oklch(.97 .015 117)',
    role: 'Warm surface, soft buttons',
  },
  card: {
    cssVariable: '--card',
    value: colors.card,
    oklch: 'oklch(1 0 0)',
    role: 'Card surface',
  },
  ink: {
    cssVariable: '--ink',
    value: colors.ink,
    oklch: 'oklch(.21 .015 134)',
    role: 'Body text, secondary CTA',
  },
  inkSoft: {
    cssVariable: '--ink-soft',
    value: colors.inkSoft,
    oklch: 'oklch(0.363 0.031 137.9)',
    role: 'Subdued body text',
  },
  mute: {
    cssVariable: '--mute',
    value: colors.mute,
    oklch: 'oklch(0.565 0.028 137.9)',
    role: 'Captions, metadata',
  },
  muteSoft: {
    cssVariable: '--mute-soft',
    value: colors.muteSoft,
    oklch: 'oklch(0.733 0.022 134.1)',
    role: 'Disabled labels',
  },
  border: {
    cssVariable: '--border',
    value: colors.border,
    oklch: 'oklch(.93 .015 122)',
    role: 'Hairlines, card edges',
  },
  borderSoft: {
    cssVariable: '--border-soft',
    value: colors.borderSoft,
    oklch: 'oklch(0.962 0.014 120.3)',
    role: 'Inner row dividers',
  },
  hairline: {
    cssVariable: '--hairline',
    value: colors.hairline,
    oklch: 'oklch(.21 .015 134 / .08)',
    role: 'Translucent rule on tinted backgrounds',
  },
  sage: {
    cssVariable: '--sage',
    value: colors.sage,
    oklch: 'oklch(.66 .17 138)',
    role: 'Brand mark, info chips',
  },
  sageDeep: {
    cssVariable: '--sage-deep',
    value: colors.sageDeep,
    oklch: 'oklch(.49 .14 138)',
    role: 'From-your-stock headline tint',
  },
  sageSoft: {
    cssVariable: '--sage-soft',
    value: colors.sageSoft,
    oklch: 'oklch(0.961 0.025 132.1)',
    role: 'Sage chip background',
  },
  sageTint: {
    cssVariable: '--sage-tint',
    value: colors.sageTint,
    oklch: 'oklch(0.909 0.052 132.8)',
    role: 'Sage card backgrounds',
  },
  amber: {
    cssVariable: '--amber',
    value: colors.amber,
    oklch: 'oklch(.81 .17 91)',
    role: 'Primary CTA, Scan FAB',
  },
  amberDeep: {
    cssVariable: '--amber-deep',
    value: colors.amberDeep,
    oklch: 'oklch(.64 .13 86)',
    role: 'Primary hover, expiry dot',
  },
  amberSoft: {
    cssVariable: '--amber-soft',
    value: colors.amberSoft,
    oklch: 'oklch(0.961 0.051 97.7)',
    role: 'Warning chip background',
  },
  kraft: {
    cssVariable: '--kraft',
    value: colors.kraft,
    oklch: 'oklch(0.731 0.081 72.2)',
    role: 'Paper-bag accent surface',
  },
  kraftDeep: {
    cssVariable: '--kraft-deep',
    value: colors.kraftDeep,
    oklch: 'oklch(0.529 0.078 66.1)',
    role: 'Kraft borders, stamp ink',
  },
  kraftSoft: {
    cssVariable: '--kraft-soft',
    value: colors.kraftSoft,
    oklch: 'oklch(0.935 0.032 82.8)',
    role: 'Kraft card body',
  },
  kraftInk: {
    cssVariable: '--kraft-ink',
    value: colors.kraftInk,
    oklch: 'oklch(0.347 0.045 65.4)',
    role: 'Type on kraft',
  },
  berry: {
    cssVariable: '--berry',
    value: colors.berry,
    oklch: 'oklch(0.680 0.136 122.2)',
    role: 'Muted olive-leaf tertiary accent',
  },
  berrySoft: {
    cssVariable: '--berry-soft',
    value: colors.berrySoft,
    oklch: 'oklch(0.958 0.037 112.1)',
    role: 'Muted olive-leaf tertiary surface',
  },
  sky: {
    cssVariable: '--sky',
    value: colors.sky,
    oklch: 'oklch(0.609 0.071 141.5)',
    role: 'Soft sage tertiary accent',
  },
  skySoft: {
    cssVariable: '--sky-soft',
    value: colors.skySoft,
    oklch: 'oklch(0.942 0.023 128.7)',
    role: 'Soft sage tertiary surface',
  },
} as const satisfies Record<string, TokenRole>;

export const space = {
  0: 0,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  4.5: 18,
  5: 20,
  5.5: 22,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const shadow = {
  sm: '0 1px 2px rgba(26,29,26,.04), 0 1px 3px rgba(26,29,26,.03)',
  md: '0 2px 6px rgba(26,29,26,.04), 0 8px 24px rgba(26,29,26,.05)',
  lg: '0 6px 20px rgba(26,29,26,.06), 0 20px 50px rgba(26,29,26,.08)',
} as const;

export const font = {
  sans: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif",
  serif: "'New York', ui-serif, 'Iowan Old Style', Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, 'SF Mono', 'Menlo', 'Monaco', monospace",
} as const;

export const nativeFont = {
  ios: {
    sans: 'SF Pro Display',
    serif: 'New York',
    mono: 'SF Mono',
  },
  android: {
    sans: 'Inter',
    serif: 'serif',
    mono: 'monospace',
  },
  fallback: {
    sans: 'System',
    serif: 'serif',
    mono: 'monospace',
  },
} as const;

export const typography = {
  display: {
    fontFamily: font.sans,
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 0.95,
  },
  headline: {
    fontFamily: font.sans,
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 1.05,
  },
  title: {
    fontFamily: font.sans,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 1.15,
  },
  body: {
    fontFamily: font.sans,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 1.45,
  },
  caption: {
    fontFamily: font.sans,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 1.4,
  },
  eyebrow: {
    fontFamily: font.mono,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 1.4,
    textTransform: 'uppercase',
  },
  meta: {
    fontFamily: font.mono,
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 1.4,
    textTransform: 'uppercase',
  },
  serifAccent: {
    fontFamily: font.serif,
    fontSize: 22,
    fontStyle: 'italic',
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 1.15,
  },
} as const;

function createNativeTypography(platform: keyof typeof nativeFont) {
  const family = nativeFont[platform];

  return {
    display: {
      fontFamily: family.sans,
      fontSize: typography.display.fontSize,
      fontWeight: typography.display.fontWeight,
      letterSpacing: 0,
      lineHeight: Math.round(typography.display.fontSize * typography.display.lineHeight),
    },
    headline: {
      fontFamily: family.sans,
      fontSize: typography.headline.fontSize,
      fontWeight: typography.headline.fontWeight,
      letterSpacing: 0,
      lineHeight: Math.round(typography.headline.fontSize * typography.headline.lineHeight),
    },
    title: {
      fontFamily: family.sans,
      fontSize: typography.title.fontSize,
      fontWeight: typography.title.fontWeight,
      letterSpacing: 0,
      lineHeight: Math.round(typography.title.fontSize * typography.title.lineHeight),
    },
    body: {
      fontFamily: family.sans,
      fontSize: typography.body.fontSize,
      fontWeight: typography.body.fontWeight,
      letterSpacing: 0,
      lineHeight: Math.round(typography.body.fontSize * typography.body.lineHeight),
    },
    caption: {
      fontFamily: family.sans,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      letterSpacing: 0,
      lineHeight: Math.round(typography.caption.fontSize * typography.caption.lineHeight),
    },
    eyebrow: {
      fontFamily: family.mono,
      fontSize: typography.eyebrow.fontSize,
      fontWeight: typography.eyebrow.fontWeight,
      letterSpacing: 0,
      lineHeight: Math.round(typography.eyebrow.fontSize * typography.eyebrow.lineHeight),
      textTransform: typography.eyebrow.textTransform,
    },
    meta: {
      fontFamily: family.mono,
      fontSize: typography.meta.fontSize,
      fontWeight: typography.meta.fontWeight,
      letterSpacing: 0,
      lineHeight: Math.round(typography.meta.fontSize * typography.meta.lineHeight),
      textTransform: typography.meta.textTransform,
    },
    serifAccent: {
      fontFamily: family.serif,
      fontSize: typography.serifAccent.fontSize,
      fontStyle: typography.serifAccent.fontStyle,
      fontWeight: typography.serifAccent.fontWeight,
      letterSpacing: 0,
      lineHeight: Math.round(typography.serifAccent.fontSize * typography.serifAccent.lineHeight),
    },
  } as const;
}

export const nativeTypography = {
  ios: createNativeTypography('ios'),
  android: createNativeTypography('android'),
  fallback: createNativeTypography('fallback'),
} as const;

export const cssVariables = {
  '--bg': colors.bg,
  '--bg-warm': colors.bgWarm,
  '--card': colors.card,
  '--ink': colors.ink,
  '--ink-soft': colors.inkSoft,
  '--mute': colors.mute,
  '--mute-soft': colors.muteSoft,
  '--border': colors.border,
  '--border-soft': colors.borderSoft,
  '--hairline': colors.hairline,
  '--sage': colors.sage,
  '--sage-deep': colors.sageDeep,
  '--sage-soft': colors.sageSoft,
  '--sage-tint': colors.sageTint,
  '--amber': colors.amber,
  '--amber-deep': colors.amberDeep,
  '--amber-soft': colors.amberSoft,
  '--kraft': colors.kraft,
  '--kraft-deep': colors.kraftDeep,
  '--kraft-soft': colors.kraftSoft,
  '--kraft-ink': colors.kraftInk,
  '--berry': colors.berry,
  '--berry-soft': colors.berrySoft,
  '--sky': colors.sky,
  '--sky-soft': colors.skySoft,
  '--r-sm': `${radius.sm}px`,
  '--r-md': `${radius.md}px`,
  '--r-lg': `${radius.lg}px`,
  '--r-xl': `${radius.xl}px`,
  '--shadow-sm': shadow.sm,
  '--shadow-md': shadow.md,
  '--shadow-lg': shadow.lg,
  '--font-sans': font.sans,
  '--font-serif': font.serif,
  '--font-mono': font.mono,
  '--type-display-size': `${typography.display.fontSize}px`,
  '--type-display-line': typography.display.lineHeight.toString(),
  '--type-display-weight': typography.display.fontWeight,
  '--type-headline-size': `${typography.headline.fontSize}px`,
  '--type-headline-line': typography.headline.lineHeight.toString(),
  '--type-headline-weight': typography.headline.fontWeight,
  '--type-title-size': `${typography.title.fontSize}px`,
  '--type-title-line': typography.title.lineHeight.toString(),
  '--type-title-weight': typography.title.fontWeight,
  '--type-body-size': `${typography.body.fontSize}px`,
  '--type-body-line': typography.body.lineHeight.toString(),
  '--type-body-weight': typography.body.fontWeight,
  '--type-caption-size': `${typography.caption.fontSize}px`,
  '--type-caption-line': typography.caption.lineHeight.toString(),
  '--type-caption-weight': typography.caption.fontWeight,
  '--type-eyebrow-size': `${typography.eyebrow.fontSize}px`,
  '--type-eyebrow-line': typography.eyebrow.lineHeight.toString(),
  '--type-eyebrow-weight': typography.eyebrow.fontWeight,
  '--type-meta-size': `${typography.meta.fontSize}px`,
  '--type-meta-line': typography.meta.lineHeight.toString(),
  '--type-meta-weight': typography.meta.fontWeight,
} as const;

export const cssVarsStylesheet = `:root {
  --bg: ${colors.bg};
  --bg-warm: ${colors.bgWarm};
  --card: ${colors.card};
  --ink: ${colors.ink};
  --ink-soft: ${colors.inkSoft};
  --mute: ${colors.mute};
  --mute-soft: ${colors.muteSoft};
  --border: ${colors.border};
  --border-soft: ${colors.borderSoft};
  --hairline: ${colors.hairline};
  --sage: ${colors.sage};
  --sage-deep: ${colors.sageDeep};
  --sage-soft: ${colors.sageSoft};
  --sage-tint: ${colors.sageTint};
  --amber: ${colors.amber};
  --amber-deep: ${colors.amberDeep};
  --amber-soft: ${colors.amberSoft};
  --kraft: ${colors.kraft};
  --kraft-deep: ${colors.kraftDeep};
  --kraft-soft: ${colors.kraftSoft};
  --kraft-ink: ${colors.kraftInk};
  --berry: ${colors.berry};
  --berry-soft: ${colors.berrySoft};
  --sky: ${colors.sky};
  --sky-soft: ${colors.skySoft};
  --r-sm: ${radius.sm}px;
  --r-md: ${radius.md}px;
  --r-lg: ${radius.lg}px;
  --r-xl: ${radius.xl}px;
  --shadow-sm: ${shadow.sm};
  --shadow-md: ${shadow.md};
  --shadow-lg: ${shadow.lg};
  --font-sans: ${font.sans};
  --font-serif: ${font.serif};
  --font-mono: ${font.mono};
  --type-display-size: ${typography.display.fontSize}px;
  --type-display-line: ${typography.display.lineHeight};
  --type-display-weight: ${typography.display.fontWeight};
  --type-headline-size: ${typography.headline.fontSize}px;
  --type-headline-line: ${typography.headline.lineHeight};
  --type-headline-weight: ${typography.headline.fontWeight};
  --type-title-size: ${typography.title.fontSize}px;
  --type-title-line: ${typography.title.lineHeight};
  --type-title-weight: ${typography.title.fontWeight};
  --type-body-size: ${typography.body.fontSize}px;
  --type-body-line: ${typography.body.lineHeight};
  --type-body-weight: ${typography.body.fontWeight};
  --type-caption-size: ${typography.caption.fontSize}px;
  --type-caption-line: ${typography.caption.lineHeight};
  --type-caption-weight: ${typography.caption.fontWeight};
  --type-eyebrow-size: ${typography.eyebrow.fontSize}px;
  --type-eyebrow-line: ${typography.eyebrow.lineHeight};
  --type-eyebrow-weight: ${typography.eyebrow.fontWeight};
  --type-meta-size: ${typography.meta.fontSize}px;
  --type-meta-line: ${typography.meta.lineHeight};
  --type-meta-weight: ${typography.meta.fontWeight};
}`;

export const tokens = {
  colors,
  colorTokens,
  space,
  radius,
  shadow,
  font,
  nativeFont,
  typography,
  nativeTypography,
  cssVariables,
  cssVarsStylesheet,
} as const;

export type ColorName = keyof typeof colors;
export type SpaceName = keyof typeof space;
export type RadiusName = keyof typeof radius;
export type ShadowName = keyof typeof shadow;
export type FontName = keyof typeof font;
export type TypographyName = keyof typeof typography;
