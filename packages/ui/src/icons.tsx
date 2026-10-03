import type { JSX } from 'react';

type PathPrimitive = {
  readonly type: 'path';
  readonly d: string;
};

type CirclePrimitive = {
  readonly type: 'circle';
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
};

type RectPrimitive = {
  readonly type: 'rect';
  readonly height: number;
  readonly rx?: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
};

type IconPrimitive = PathPrimitive | CirclePrimitive | RectPrimitive;

export const iconDefinitions = {
  chevronRight: [{ type: 'path', d: 'M9 6l6 6-6 6' }],
  chevronLeft: [{ type: 'path', d: 'M15 6l-6 6 6 6' }],
  chevronDown: [{ type: 'path', d: 'M6 9l6 6 6-6' }],
  plus: [{ type: 'path', d: 'M12 5v14M5 12h14' }],
  close: [{ type: 'path', d: 'M6 6l12 12M18 6L6 18' }],
  scan: [
    {
      type: 'path',
      d: 'M4 8V6a2 2 0 012-2h2M20 8V6a2 2 0 00-2-2h-2M4 16v2a2 2 0 002 2h2M20 16v2a2 2 0 01-2 2h-2',
    },
    { type: 'path', d: 'M3 12h18' },
  ],
  camera: [
    {
      type: 'path',
      d: 'M3 8a2 2 0 012-2h2l2-2h6l2 2h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8z',
    },
    { type: 'circle', cx: 12, cy: 13, r: 3.5 },
  ],
  bell: [
    { type: 'path', d: 'M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8z' },
    { type: 'path', d: 'M10 21a2 2 0 004 0' },
  ],
  home: [
    {
      type: 'path',
      d: 'M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2v-9z',
    },
  ],
  sparkle: [
    {
      type: 'path',
      d: 'M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8',
    },
  ],
  basket: [
    { type: 'path', d: 'M3 8h18l-2 11a2 2 0 01-2 2H7a2 2 0 01-2-2L3 8z' },
    { type: 'path', d: 'M8 8l4-5 4 5' },
  ],
  clock: [
    { type: 'circle', cx: 12, cy: 12, r: 9 },
    { type: 'path', d: 'M12 7v5l3 2' },
  ],
  search: [
    { type: 'circle', cx: 11, cy: 11, r: 7 },
    { type: 'path', d: 'M20 20l-3.5-3.5' },
  ],
  settings: [
    { type: 'circle', cx: 12, cy: 12, r: 3 },
    {
      type: 'path',
      d: 'M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z',
    },
  ],
  pdf: [
    {
      type: 'path',
      d: 'M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z',
    },
    { type: 'path', d: 'M14 3v5h5' },
  ],
  upload: [{ type: 'path', d: 'M12 3v12M7 8l5-5 5 5M5 21h14' }],
  check: [{ type: 'path', d: 'M5 12l4 4 10-10' }],
  drop: [{ type: 'path', d: 'M3 12c0-3 4-7 9-9 5 2 9 6 9 9a9 9 0 11-18 0z' }],
  snowflake: [{ type: 'path', d: 'M12 2v20M2 12h20M5 5l14 14M19 5L5 19' }],
  box: [
    { type: 'path', d: 'M3 7l9-4 9 4-9 4-9-4z' },
    { type: 'path', d: 'M3 7v10l9 4 9-4V7' },
    { type: 'path', d: 'M12 11v10' },
  ],
  flame: [{ type: 'path', d: 'M12 3s5 4 5 9a5 5 0 11-10 0c0-3 2-4 2-6s3 0 3-3z' }],
  cart: [
    { type: 'circle', cx: 9, cy: 20, r: 1.5 },
    { type: 'circle', cx: 17, cy: 20, r: 1.5 },
    { type: 'path', d: 'M3 4h2l2 12h12l2-8H7' },
  ],
  arrowRight: [{ type: 'path', d: 'M5 12h14M13 6l6 6-6 6' }],
  arrowUp: [{ type: 'path', d: 'M12 5v14M6 11l6-6 6 6' }],
  list: [{ type: 'path', d: 'M4 6h16M4 12h16M4 18h16' }],
  grid: [
    { type: 'rect', x: 3, y: 3, width: 7, height: 7, rx: 1.5 },
    { type: 'rect', x: 14, y: 3, width: 7, height: 7, rx: 1.5 },
    { type: 'rect', x: 3, y: 14, width: 7, height: 7, rx: 1.5 },
    { type: 'rect', x: 14, y: 14, width: 7, height: 7, rx: 1.5 },
  ],
  dots: [
    { type: 'circle', cx: 5, cy: 12, r: 1.5 },
    { type: 'circle', cx: 12, cy: 12, r: 1.5 },
    { type: 'circle', cx: 19, cy: 12, r: 1.5 },
  ],
  filter: [{ type: 'path', d: 'M4 5h16M7 12h10M10 19h4' }],
  star: [
    {
      type: 'path',
      d: 'M12 3l2.8 6 6.2.8-4.6 4.2 1.2 6.4L12 17l-5.6 3.4 1.2-6.4L3 9.8 9.2 9z',
    },
  ],
  shield: [
    { type: 'path', d: 'M12 3l8 3v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-3z' },
    { type: 'path', d: 'M9 12l2 2 4-4' },
  ],
  leaf: [
    { type: 'path', d: 'M20 4c-9 0-16 5-16 12 0 5 4 4 6 4s10-1 10-16z' },
    { type: 'path', d: 'M4 20c4-8 8-12 16-16' },
  ],
} as const satisfies Record<string, readonly IconPrimitive[]>;

export const iconAliases = {
  'arrow-right': 'arrowRight',
  'arrow-up': 'arrowUp',
  'chevron-down': 'chevronDown',
  'chevron-left': 'chevronLeft',
  'chevron-right': 'chevronRight',
} as const;

export type IconSourceName = keyof typeof iconDefinitions;
type IconAliasName = keyof typeof iconAliases;
export type IconName = IconSourceName | IconAliasName;

export const sourceIconNames = Object.keys(iconDefinitions) as IconSourceName[];
export const iconNames = [...sourceIconNames, ...Object.keys(iconAliases)] as IconName[];

export type IconProps = {
  readonly className?: string;
  readonly decorative?: boolean;
  readonly fill?: string;
  readonly name: IconName;
  readonly size?: number | string;
  readonly stroke?: string;
  readonly sw?: number;
  readonly title?: string;
};

export function resolveIconName(name: IconName): IconSourceName {
  if (name in iconAliases) {
    return iconAliases[name as IconAliasName];
  }

  return name as IconSourceName;
}

function renderPrimitive(primitive: IconPrimitive, index: number): JSX.Element {
  if (primitive.type === 'path') {
    return <path d={primitive.d} key={index} />;
  }

  if (primitive.type === 'circle') {
    return <circle cx={primitive.cx} cy={primitive.cy} key={index} r={primitive.r} />;
  }

  return (
    <rect
      height={primitive.height}
      key={index}
      rx={primitive.rx}
      width={primitive.width}
      x={primitive.x}
      y={primitive.y}
    />
  );
}

export function Icon({
  className,
  decorative,
  fill = 'none',
  name,
  size = 20,
  stroke = 'currentColor',
  sw = 1.6,
  title,
}: IconProps): JSX.Element {
  const resolvedName = resolveIconName(name);
  const isLabelled = Boolean(title && !decorative);

  return (
    <svg
      aria-hidden={isLabelled ? undefined : true}
      aria-label={isLabelled ? title : undefined}
      className={className}
      fill={fill}
      focusable={isLabelled ? undefined : false}
      height={size}
      role={isLabelled ? 'img' : undefined}
      stroke={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={sw}
      viewBox="0 0 24 24"
      width={size}
    >
      {isLabelled ? <title>{title}</title> : null}
      {iconDefinitions[resolvedName].map(renderPrimitive)}
    </svg>
  );
}
