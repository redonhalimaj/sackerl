import type { CSSProperties, JSX } from 'react';

import { markViewBox, wordmarkTracking, type LogoProps, type MarkProps } from './logo-data';

export { markViewBox, wordmarkTracking, type LogoProps, type MarkProps } from './logo-data';

type LogoStyle = CSSProperties & Record<`--${string}`, string | number>;

export function Mark({ color = 'var(--sage-deep)', size = 20 }: MarkProps): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size * 1.08}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      style={{ display: 'inline-block', flexShrink: 0 }}
      viewBox={markViewBox}
      width={size}
    >
      <path d="M9 7c0-2.5 1.4-4 3-4s3 1.5 3 4" />
      <path
        d="M4.6 7.6h14.8l-1.2 14a2 2 0 0 1-2 1.9H7.8a2 2 0 0 1-2-1.9L4.6 7.6z"
        fill={color}
        fillOpacity="0.10"
      />
      <path d="M12 11.5v7" strokeOpacity="0.55" />
    </svg>
  );
}

export function Logo({ color = 'var(--ink)', markColor, size = 22 }: LogoProps): JSX.Element {
  const logoStyle: LogoStyle = {
    '--sk-logo-color': color,
    '--sk-logo-gap': `${size * 0.32}px`,
    '--sk-logo-size': `${size}px`,
    '--sk-logo-tracking': `${wordmarkTracking * size}px`,
  };

  return (
    <span aria-label="sackerl" className="sk-logo" role="img" style={logoStyle}>
      <Mark color={markColor ?? 'var(--sage-deep)'} size={size * 0.95} />
      <span className="sk-logo__wordmark">sackerl</span>
    </span>
  );
}
