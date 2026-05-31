export type PaperBagItemKind = 'circle' | 'rect';

export type PaperBagItem = {
  readonly color: string;
  readonly delay?: number | undefined;
  readonly dx: number;
  readonly height?: number | undefined;
  readonly kind: PaperBagItemKind;
  readonly radius?: number | undefined;
  readonly r0?: string | undefined;
  readonly r1?: string | undefined;
  readonly size?: number | undefined;
  readonly tilt?: number | undefined;
  readonly width?: number | undefined;
};

export type PaperBagProps = {
  readonly animated?: boolean | undefined;
  readonly height?: number | undefined;
  readonly items?: readonly PaperBagItem[] | undefined;
  readonly label?: string | undefined;
  readonly width?: number | undefined;
};

export const paperBagDefaults = {
  animationDuration: 4.4,
  height: 300,
  label: 'SACKERL',
  width: 280,
} as const;

export const defaultPaperBagItems = [
  {
    color: 'var(--sage)',
    delay: 0,
    dx: -38,
    kind: 'circle',
    r0: '-6deg',
    r1: '2deg',
    size: 24,
  },
  {
    color: 'var(--ink)',
    delay: 1,
    dx: -12,
    height: 34,
    kind: 'rect',
    r0: '8deg',
    r1: '-2deg',
    radius: 3,
    width: 16,
  },
  {
    color: 'var(--amber)',
    delay: 2,
    dx: 14,
    height: 18,
    kind: 'rect',
    r0: '-4deg',
    r1: '3deg',
    radius: 4,
    width: 28,
  },
  {
    color: 'var(--sage-deep)',
    delay: 3,
    dx: 38,
    kind: 'circle',
    r0: '4deg',
    r1: '-3deg',
    size: 20,
  },
] as const satisfies readonly PaperBagItem[];

export type ResolvedPaperBagItem = {
  readonly color: string;
  readonly delay: number;
  readonly dx: number;
  readonly height: number;
  readonly kind: PaperBagItemKind;
  readonly radius: number | string;
  readonly r0: string;
  readonly r1: string;
  readonly width: number;
};

function degreeFromTilt(tilt: number | undefined, fallback: string): string {
  return tilt === undefined ? fallback : `${tilt}deg`;
}

export function resolvePaperBagItem(item: PaperBagItem): ResolvedPaperBagItem {
  const width = item.kind === 'circle' ? (item.size ?? 20) : (item.width ?? item.size ?? 20);
  const height = item.kind === 'circle' ? (item.size ?? 20) : (item.height ?? item.size ?? width);
  const fallbackTilt = item.tilt ?? 0;

  return {
    color: item.color,
    delay: item.delay ?? 0,
    dx: item.dx,
    height,
    kind: item.kind,
    radius: item.kind === 'circle' ? '50%' : (item.radius ?? 3),
    r0: item.r0 ?? degreeFromTilt(fallbackTilt * -1, '0deg'),
    r1: item.r1 ?? degreeFromTilt(fallbackTilt, '0deg'),
    width,
  };
}

export function resolveNativePaperBagColor(color: string): string {
  if (color === 'var(--sage)') {
    return '#4F9D3A';
  }

  if (color === 'var(--ink)') {
    return '#1B2418';
  }

  if (color === 'var(--amber)') {
    return '#F2C014';
  }

  if (color === 'var(--sage-deep)') {
    return '#2F6A20';
  }

  return color;
}
