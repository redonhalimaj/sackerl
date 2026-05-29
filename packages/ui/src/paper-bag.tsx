import { useId, type CSSProperties, type JSX } from 'react';

import {
  defaultPaperBagItems,
  paperBagDefaults,
  resolvePaperBagItem,
  type PaperBagProps,
} from './paper-bag-data';

type PaperBagStyle = CSSProperties & Record<`--${string}`, string | number>;

function svgId(idPrefix: string, id: string): string {
  return `${idPrefix}-${id}`;
}

export function PaperBag({
  animated = true,
  height = paperBagDefaults.height,
  items = defaultPaperBagItems,
  label = paperBagDefaults.label,
  width = paperBagDefaults.width,
}: PaperBagProps): JSX.Element {
  const idPrefix = `sk-paper-bag-${useId().replace(/:/g, '')}`;
  const gradId = svgId(idPrefix, 'kraft-grad');
  const backId = svgId(idPrefix, 'kraft-back');
  const fibersId = svgId(idPrefix, 'kraft-fibers');

  return (
    <div className="sk-paper-bag" style={{ height, width }}>
      {items.map((item, index) => {
        const resolvedItem = resolvePaperBagItem(item);
        const itemStyle: PaperBagStyle = {
          '--sk-delay': `${resolvedItem.delay}s`,
          '--sk-r0': resolvedItem.r0,
          '--sk-r1': resolvedItem.r1,
          '--sk-x': `${resolvedItem.dx}px`,
          background: resolvedItem.color,
          borderRadius: resolvedItem.radius,
          height: resolvedItem.height,
          marginLeft: resolvedItem.width / -2,
          marginTop: resolvedItem.height / -2,
          width: resolvedItem.width,
        };

        return (
          <div
            aria-hidden="true"
            className="sk-paper-bag__item sk-bag-item"
            data-animated={animated}
            key={`${resolvedItem.dx}-${index}`}
            style={itemStyle}
          />
        );
      })}

      <svg
        aria-hidden="true"
        className="sk-paper-bag__body sk-bag-body"
        data-animated={animated}
        height="80%"
        viewBox="0 0 220 240"
        width="80%"
      >
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#DCB587" />
            <stop offset="0.55" stopColor="#C49862" />
            <stop offset="1" stopColor="#A57945" />
          </linearGradient>
          <linearGradient id={backId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#8E6638" />
            <stop offset="1" stopColor="#6E4D26" />
          </linearGradient>
          <pattern height="4" id={fibersId} patternUnits="userSpaceOnUse" width="4" x="0" y="0">
            <rect fill="transparent" height="4" width="4" />
            <circle cx="1" cy="1" fill="rgba(74,53,32,0.18)" r="0.3" />
            <circle cx="3" cy="2.6" fill="rgba(74,53,32,0.12)" r="0.25" />
          </pattern>
        </defs>

        <ellipse cx="110" cy="232" fill="rgba(0,0,0,0.10)" rx="80" ry="5" />
        <path
          d="M64 78 C64 38, 92 24, 110 24"
          fill="none"
          stroke="#6E4D26"
          strokeLinecap="round"
          strokeWidth="3.2"
        />
        <path
          d="M156 78 C156 38, 128 24, 110 24"
          fill="none"
          stroke="#6E4D26"
          strokeLinecap="round"
          strokeWidth="3.2"
        />
        <path
          d="M30 70 L33 220 Q33 232 47 232 L173 232 Q187 232 187 220 L190 70 Z"
          fill={`url(#${backId})`}
        />
        <path
          d="M30 70 L33 220 Q33 232 47 232 L173 232 Q187 232 187 220 L190 70 Z"
          fill={`url(#${gradId})`}
        />
        <path
          d="M30 70 L33 220 Q33 232 47 232 L173 232 Q187 232 187 220 L190 70 Z"
          fill={`url(#${fibersId})`}
          opacity="0.6"
        />
        <ellipse cx="110" cy="70" fill="#5B3E1F" opacity="0.85" rx="80" ry="8" />
        <ellipse cx="110" cy="68" fill="#3D2A14" rx="78" ry="6" />
        <path d="M30 70 L190 70 L186 82 L34 82 Z" fill="rgba(74,53,32,0.18)" />
        <path d="M68 72 L70 230" stroke="rgba(74,53,32,0.28)" strokeWidth="0.7" />
        <path d="M152 72 L150 230" stroke="rgba(74,53,32,0.28)" strokeWidth="0.7" />
        <path d="M110 72 L110 230" stroke="rgba(74,53,32,0.18)" strokeWidth="0.5" />

        <g transform="translate(110 158) rotate(-2.4)">
          <rect
            fill="#FBF6EA"
            height="44"
            rx="1.5"
            stroke="#6E4D26"
            strokeWidth="0.7"
            width="76"
            x="-38"
            y="-22"
          />
          <text
            fill="#3D2A14"
            fontFamily="ui-monospace, SF Mono, Menlo, monospace"
            fontSize="9.5"
            letterSpacing="0"
            textAnchor="middle"
            x="0"
            y="-4"
          >
            {label}
          </text>
          <line stroke="#6E4D26" strokeWidth="0.5" x1="-28" x2="28" y1="2" y2="2" />
          <text
            fill="#6E4D26"
            fontFamily="ui-monospace, SF Mono, Menlo, monospace"
            fontSize="6"
            letterSpacing="0"
            textAnchor="middle"
            x="0"
            y="14"
          >
            EST · WIEN · 2026
          </text>
        </g>
      </svg>
    </div>
  );
}
