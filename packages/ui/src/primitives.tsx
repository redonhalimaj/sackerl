import type { JSX } from 'react';

import { Icon, type IconName } from './icons';

type PrimitiveChild =
  | JSX.Element
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly PrimitiveChild[];

type ButtonClickHandler = JSX.IntrinsicElements['button']['onClick'];
type ButtonType = NonNullable<JSX.IntrinsicElements['button']['type']>;
type UiStyle = NonNullable<JSX.IntrinsicElements['div']['style']>;
type CssVariableStyle = UiStyle & Record<`--${string}`, string | number>;

export const buttonVariants = ['primary', 'ink', 'ghost', 'soft'] as const;
export const buttonSizes = ['lg', 'md'] as const;

export const buttonSizeSpecs = {
  lg: { height: 52, paddingX: 22 },
  md: { height: 38, paddingX: 16 },
} as const;

export type ButtonVariant = (typeof buttonVariants)[number];
export type ButtonSize = (typeof buttonSizes)[number];

export type ButtonProps = {
  readonly 'aria-label'?: string | undefined;
  readonly children?: PrimitiveChild;
  readonly className?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly leadingIcon?: IconName | undefined;
  readonly onClick?: ButtonClickHandler | undefined;
  readonly size?: ButtonSize | undefined;
  readonly trailingIcon?: IconName | undefined;
  readonly type?: ButtonType | undefined;
  readonly variant?: ButtonVariant | undefined;
};

export const chipVariants = ['default', 'sage', 'amber', 'ghost'] as const;

export type ChipVariant = (typeof chipVariants)[number];

export type ChipProps = {
  readonly children?: PrimitiveChild;
  readonly className?: string | undefined;
  readonly count?: number | string | undefined;
  readonly variant?: ChipVariant | undefined;
};

export const cardVariants = ['default', 'flat', 'kraft'] as const;

export type CardVariant = (typeof cardVariants)[number];

export type CardProps = {
  readonly children?: PrimitiveChild;
  readonly className?: string | undefined;
};

export const kraftTexture = {
  backgroundColor: 'var(--kraft-soft)',
  backgroundImage:
    'radial-gradient(circle at 25% 30%, rgba(74,53,32,0.05) 0.5px, transparent 1px), radial-gradient(circle at 75% 70%, rgba(74,53,32,0.06) 0.5px, transparent 1px), radial-gradient(circle at 50% 15%, rgba(74,53,32,0.04) 0.5px, transparent 1px), linear-gradient(115deg, rgba(74,53,32,0.025) 0 1px, transparent 1px 14px)',
  backgroundSize: '8px 8px, 11px 11px, 6px 6px, 14px 14px',
} as const;

export type EyebrowProps = {
  readonly children?: PrimitiveChild;
  readonly className?: string | undefined;
  readonly withMark?: boolean | undefined;
};

export const avatarSizes = ['md', 'lg'] as const;

export type AvatarSize = (typeof avatarSizes)[number];

export type AvatarProps = {
  readonly className?: string | undefined;
  readonly label: string;
  readonly name: string;
  readonly size?: AvatarSize | undefined;
};

export const roundIconButtonVariants = ['default', 'dark'] as const;

export type RoundIconButtonVariant = (typeof roundIconButtonVariants)[number];

export type RoundIconButtonProps = {
  readonly className?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly icon: IconName;
  readonly label: string;
  readonly onClick?: ButtonClickHandler | undefined;
  readonly type?: ButtonType | undefined;
  readonly variant?: RoundIconButtonVariant | undefined;
};

export const categoryMeta = {
  dairy: { bg: '#EEF1F5', ink: '#3F4E60', label: 'Dairy', short: 'MK' },
  produce: { bg: '#EBF1E6', ink: '#3F5A3D', label: 'Produce', short: 'PR' },
  meat: { bg: '#F2E4E5', ink: '#7E4145', label: 'Meat & Fish', short: 'MT' },
  pantry: { bg: '#F2EBDD', ink: '#7A5A2A', label: 'Pantry', short: 'PN' },
  canned: { bg: '#EEEAE0', ink: '#5A4A2A', label: 'Canned', short: 'CN' },
  frozen: { bg: '#E5EBEF', ink: '#3D5468', label: 'Frozen', short: 'FR' },
  bakery: { bg: '#F4EADC', ink: '#75512A', label: 'Bakery', short: 'BK' },
  snacks: { bg: '#F4ECDE', ink: '#7A5A2A', label: 'Snacks', short: 'SN' },
  drinks: { bg: '#E5ECEE', ink: '#3F5360', label: 'Drinks', short: 'DR' },
  spices: { bg: '#F2E3D4', ink: '#7C4F26', label: 'Spices', short: 'SP' },
} as const;

export type TileCategory = keyof typeof categoryMeta;

export const tileCategories = Object.keys(categoryMeta) as TileCategory[];

export type TileProps = {
  readonly category?: TileCategory | undefined;
  readonly className?: string | undefined;
  readonly size?: number | undefined;
};

export const zoneMeta = {
  fridge: { bg: '#E4ECEF', ink: '#3F5360', label: 'Fridge', short: 'FR' },
  pantry: { bg: '#F2EBDD', ink: '#7A5A2A', label: 'Pantry', short: 'PA' },
  basement: { bg: '#E8E7DF', ink: '#54514A', label: 'Basement', short: 'BS' },
  freezer: { bg: '#E0EAF0', ink: '#3D5468', label: 'Freezer', short: 'FZ' },
  cabinet: { bg: '#F0E9DC', ink: '#6B5024', label: 'Cabinet', short: 'CB' },
} as const;

export type ZoneKind = keyof typeof zoneMeta;

export const zoneKinds = Object.keys(zoneMeta) as ZoneKind[];

export type ZoneProps = {
  readonly className?: string | undefined;
  readonly kind?: ZoneKind | undefined;
  readonly size?: number | undefined;
};

export type ListRowProps = {
  readonly action?: PrimitiveChild;
  readonly category?: TileCategory | undefined;
  readonly className?: string | undefined;
  readonly leading?: PrimitiveChild;
  readonly meta?: PrimitiveChild;
  readonly title: PrimitiveChild;
  readonly zone?: ZoneKind | undefined;
};

function classNames(...names: readonly (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function Button({
  'aria-label': ariaLabel,
  children,
  className,
  disabled,
  leadingIcon,
  onClick,
  size = 'lg',
  trailingIcon,
  type = 'button',
  variant = 'primary',
}: ButtonProps): JSX.Element {
  const iconSize = size === 'lg' ? 18 : 16;

  return (
    <button
      aria-label={ariaLabel}
      className={classNames('sk-button', `sk-button--${variant}`, `sk-button--${size}`, className)}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {leadingIcon ? <Icon decorative name={leadingIcon} size={iconSize} /> : null}
      {children ? <span className="sk-button__label">{children}</span> : null}
      {trailingIcon ? <Icon decorative name={trailingIcon} size={iconSize} /> : null}
    </button>
  );
}

export function Chip({ children, className, count, variant = 'default' }: ChipProps): JSX.Element {
  return (
    <span className={classNames('sk-chip', `sk-chip--${variant}`, className)}>
      {children ? <span className="sk-chip__label">{children}</span> : null}
      {count === undefined ? null : <span className="sk-chip__count">{count}</span>}
    </span>
  );
}

export function Card({ children, className }: CardProps): JSX.Element {
  return <section className={classNames('sk-card', className)}>{children}</section>;
}

export function CardFlat({ children, className }: CardProps): JSX.Element {
  return <section className={classNames('sk-card-flat', className)}>{children}</section>;
}

export function CardKraft({ children, className }: CardProps): JSX.Element {
  return (
    <section className={classNames('sk-card', 'sk-card--kraft', className)}>{children}</section>
  );
}

export function Eyebrow({ children, className, withMark }: EyebrowProps): JSX.Element {
  return (
    <span className={classNames('sk-eyebrow', className)}>
      {withMark ? <span aria-hidden="true" className="sk-mark" /> : null}
      {children}
    </span>
  );
}

export function Avatar({ className, label, name, size = 'md' }: AvatarProps): JSX.Element {
  return (
    <span
      aria-label={label}
      className={classNames('sk-avatar', `sk-avatar--${size}`, className)}
      role="img"
      title={name}
    >
      {initialsFor(name)}
    </span>
  );
}

export function RoundIconButton({
  className,
  disabled,
  icon,
  label,
  onClick,
  type = 'button',
  variant = 'default',
}: RoundIconButtonProps): JSX.Element {
  return (
    <button
      aria-label={label}
      className={classNames('sk-round-button', `sk-round-button--${variant}`, className)}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type={type}
    >
      <Icon decorative name={icon} size={18} sw={1.7} />
    </button>
  );
}

export function Tile({ category = 'pantry', className, size = 44 }: TileProps): JSX.Element {
  const meta = categoryMeta[category];
  const style: CssVariableStyle = {
    '--sk-tile-bg': meta.bg,
    '--sk-tile-ink': meta.ink,
    '--sk-tile-size': `${size}px`,
  };

  return (
    <span
      aria-label={meta.label}
      className={classNames('sk-tile', className)}
      role="img"
      style={style}
      title={meta.label}
    >
      {meta.short}
    </span>
  );
}

export function Zone({ className, kind = 'fridge', size = 56 }: ZoneProps): JSX.Element {
  const meta = zoneMeta[kind];
  const style: CssVariableStyle = {
    '--sk-zone-bg': meta.bg,
    '--sk-zone-ink': meta.ink,
    '--sk-zone-size': `${size}px`,
  };

  return (
    <span
      aria-label={meta.label}
      className={classNames('sk-zone-glyph', className)}
      role="img"
      style={style}
      title={meta.label}
    >
      {meta.short}
    </span>
  );
}

export function ListRow({
  action,
  category,
  className,
  leading,
  meta,
  title,
  zone,
}: ListRowProps): JSX.Element {
  const rowLeading = leading ?? (zone ? <Zone kind={zone} /> : <Tile category={category} />);

  return (
    <div className={classNames('sk-list-row', className)}>
      <div className="sk-list-row__leading">{rowLeading}</div>
      <div className="sk-list-row__body">
        <div className="sk-list-row__title">{title}</div>
        {meta ? <div className="sk-list-row__meta">{meta}</div> : null}
      </div>
      {action ? <div className="sk-list-row__action">{action}</div> : null}
    </div>
  );
}
