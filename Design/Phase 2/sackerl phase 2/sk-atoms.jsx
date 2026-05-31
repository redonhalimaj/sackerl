// sackerl — shared icons + tiny atoms
// Simple stroked line icons only. No drawing of food/groceries.

const SK = {};

SK.Icon = ({ d, size = 20, stroke = 'currentColor', fill = 'none', sw = 1.6, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

// Stroked line icons
SK.icons = {
  chevronRight: 'M9 6l6 6-6 6',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronDown: 'M6 9l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  scan: <>
    <path d="M4 8V6a2 2 0 012-2h2M20 8V6a2 2 0 00-2-2h-2M4 16v2a2 2 0 002 2h2M20 16v2a2 2 0 01-2 2h-2"/>
    <path d="M3 12h18"/>
  </>,
  camera: <>
    <path d="M3 8a2 2 0 012-2h2l2-2h6l2 2h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
    <circle cx="12" cy="13" r="3.5"/>
  </>,
  bell: <>
    <path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8z"/>
    <path d="M10 21a2 2 0 004 0"/>
  </>,
  home: <><path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2v-9z"/></>,
  sparkle: <>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>
  </>,
  basket: <>
    <path d="M3 8h18l-2 11a2 2 0 01-2 2H7a2 2 0 01-2-2L3 8z"/>
    <path d="M8 8l4-5 4 5"/>
  </>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></>,
  settings: <>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/>
  </>,
  pdf: <>
    <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z"/>
    <path d="M14 3v5h5"/>
  </>,
  upload: <><path d="M12 3v12M7 8l5-5 5 5M5 21h14"/></>,
  check: 'M5 12l4 4 10-10',
  drop: <>
    <path d="M3 12c0-3 4-7 9-9 5 2 9 6 9 9a9 9 0 11-18 0z"/>
  </>,
  snowflake: <>
    <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/>
  </>,
  box: <>
    <path d="M3 7l9-4 9 4-9 4-9-4z"/>
    <path d="M3 7v10l9 4 9-4V7"/>
    <path d="M12 11v10"/>
  </>,
  flame: <>
    <path d="M12 3s5 4 5 9a5 5 0 11-10 0c0-3 2-4 2-6s3 0 3-3z"/>
  </>,
  cart: <>
    <circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/>
    <path d="M3 4h2l2 12h12l2-8H7"/>
  </>,
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  arrowUp: 'M12 5v14M6 11l6-6 6 6',
  list: 'M4 6h16M4 12h16M4 18h16',
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  dots: <><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>,
  filter: 'M4 5h16M7 12h10M10 19h4',
  star: 'M12 3l2.8 6 6.2.8-4.6 4.2 1.2 6.4L12 17l-5.6 3.4 1.2-6.4L3 9.8 9.2 9z',
  shield: <><path d="M12 3l8 3v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-3z"/><path d="M9 12l2 2 4-4"/></>,
  leaf: <>
    <path d="M20 4c-9 0-16 5-16 12 0 5 4 4 6 4s10-1 10-16z"/>
    <path d="M4 20c4-8 8-12 16-16"/>
  </>,
};

// Category meta — colored "tile" placeholders rather than drawn food
SK.categories = {
  dairy:    { label: 'Dairy', short: 'MK',  bg: '#EEF1F5', ink: '#3F4E60' },
  produce:  { label: 'Produce', short: 'PR', bg: '#EBF1E6', ink: '#3F5A3D' },
  meat:     { label: 'Meat & Fish', short: 'MT', bg: '#F2E4E5', ink: '#7E4145' },
  pantry:   { label: 'Pantry', short: 'PN', bg: '#F2EBDD', ink: '#7A5A2A' },
  canned:   { label: 'Canned', short: 'CN', bg: '#EEEAE0', ink: '#5A4A2A' },
  frozen:   { label: 'Frozen', short: 'FR', bg: '#E5EBEF', ink: '#3D5468' },
  bakery:   { label: 'Bakery', short: 'BK', bg: '#F4EADC', ink: '#75512A' },
  snacks:   { label: 'Snacks', short: 'SN', bg: '#F4ECDE', ink: '#7A5A2A' },
  drinks:   { label: 'Drinks', short: 'DR', bg: '#E5ECEE', ink: '#3F5360' },
  spices:   { label: 'Spices', short: 'SP', bg: '#F2E3D4', ink: '#7C4F26' },
};

// Stylized category tile — initials over tinted bg, very small subtle stripe
SK.Tile = ({ cat = 'pantry', size = 44 }) => {
  const c = SK.categories[cat] || SK.categories.pantry;
  return (
    <div className="sk-tile" style={{ width: size, height: size, background: c.bg, color: c.ink }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: Math.round(size * 0.27), fontWeight: 500, letterSpacing: 0.3 }}>
        {c.short}
      </span>
    </div>
  );
};

// Location glyph — abstract box with subtle hatching to suggest a "zone"
SK.Zone = ({ kind = 'fridge', size = 56 }) => {
  const map = {
    fridge:  { bg: '#E4ECEF', ink: '#3F5360', label: 'FR' },
    pantry:  { bg: '#F2EBDD', ink: '#7A5A2A', label: 'PA' },
    basement:{ bg: '#E8E7DF', ink: '#54514A', label: 'BS' },
    freezer: { bg: '#E0EAF0', ink: '#3D5468', label: 'FZ' },
    cabinet: { bg: '#F0E9DC', ink: '#6B5024', label: 'CB' },
  };
  const c = map[kind];
  return (
    <div style={{
      width: size, height: size, borderRadius: 14,
      background: c.bg, color: c.ink,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500,
      letterSpacing: 0.4, flexShrink: 0,
    }}>{c.label}</div>
  );
};

// ──────────────────────────────────────────────────────────────────
// Brand mark — abstracted paper bag (sackerl = "little bag" / Austrian).
// Geometric, monoline, optical-sized to sit beside the wordmark.
SK.Mark = ({ size = 20, color = 'var(--sage)' }) => (
  <svg width={size} height={size * 1.08} viewBox="0 0 24 26" fill="none"
    stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'inline-block', flexShrink: 0 }}>
    {/* handle */}
    <path d="M9 7c0-2.5 1.4-4 3-4s3 1.5 3 4" />
    {/* bag body — slightly trapezoidal */}
    <path d="M4.6 7.6h14.8l-1.2 14a2 2 0 0 1-2 1.9H7.8a2 2 0 0 1-2-1.9L4.6 7.6z"
      fill={color} fillOpacity="0.10" />
    {/* seam */}
    <path d="M12 11.5v7" strokeOpacity="0.55" />
  </svg>
);

// ──────────────────────────────────────────────────────────────────
// Animated paper-bag — the literal sackerl, with groceries dropping in.
// Geometric, monoline, in-system. Honours prefers-reduced-motion via CSS.
SK.PaperBag = ({ width = 280, height = 300, label = 'SACKERL', animated = true, items: itemsProp }) => {
  // Each item: dx (px from bag-mouth centre), shape, size, delay, slight tilt
  const items = itemsProp || [
    { dx: -38, kind: 'circle', size: 24, color: 'var(--sage)',      delay: 0.0, r0: '-6deg', r1: '2deg' },
    { dx: -12, kind: 'rect',   w: 16, h: 34, r: 3, color: 'var(--ink)',  delay: 1.0, r0: '8deg',  r1: '-2deg' },
    { dx: 14,  kind: 'rect',   w: 28, h: 18, r: 4, color: 'var(--amber)', delay: 2.0, r0: '-4deg', r1: '3deg' },
    { dx: 38,  kind: 'circle', size: 20, color: 'var(--sage-deep)',  delay: 3.0, r0: '4deg',  r1: '-3deg' },
  ];
  const duration = 4.4; // seconds — full cycle
  return (
    <div style={{
      width, height, position: 'relative',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      {/* Falling items — absolute, positioned over the bag opening */}
      {animated && items.map((it, i) => {
        const w = it.kind === 'circle' ? it.size : it.w;
        const h = it.kind === 'circle' ? it.size : it.h;
        return (
          <div key={i} className="sk-bag-item" style={{
            position: 'absolute', left: '50%', top: '34%',
            width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2,
            borderRadius: it.kind === 'circle' ? '50%' : (it.r || 3),
            background: it.color,
            boxShadow: '0 1.5px 0 rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.18)',
            animation: `sk-bag-drop ${duration}s ${it.delay}s infinite cubic-bezier(.55,.05,.7,.55)`,
            '--sk-x': it.dx + 'px',
            '--sk-r0': it.r0,
            '--sk-r1': it.r1,
          }} />
        );
      })}

      {/* Bag SVG */}
      <svg className="sk-bag-body"
        viewBox="0 0 220 240" width="80%" height="80%"
        style={{ animation: animated ? 'sk-bag-breathe 5.2s ease-in-out infinite' : undefined, transformOrigin: '50% 80%' }}>
        <defs>
          <linearGradient id="sk-kraft-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#DCB587" />
            <stop offset="0.55" stopColor="#C49862" />
            <stop offset="1" stopColor="#A57945" />
          </linearGradient>
          <linearGradient id="sk-kraft-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8E6638" />
            <stop offset="1" stopColor="#6E4D26" />
          </linearGradient>
          <pattern id="sk-kraft-fibers" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="transparent" />
            <circle cx="1" cy="1" r="0.3" fill="rgba(74,53,32,0.18)" />
            <circle cx="3" cy="2.6" r="0.25" fill="rgba(74,53,32,0.12)" />
          </pattern>
        </defs>

        {/* drop shadow on ground */}
        <ellipse cx="110" cy="232" rx="80" ry="5" fill="rgba(0,0,0,0.10)" />

        {/* handle — back */}
        <path d="M64 78 C64 38, 92 24, 110 24" stroke="#6E4D26" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        <path d="M156 78 C156 38, 128 24, 110 24" stroke="#6E4D26" strokeWidth="3.2" fill="none" strokeLinecap="round" />

        {/* back panel */}
        <path d="M30 70 L33 220 Q33 232 47 232 L173 232 Q187 232 187 220 L190 70 Z"
          fill="url(#sk-kraft-back)" />

        {/* front panel */}
        <path d="M30 70 L33 220 Q33 232 47 232 L173 232 Q187 232 187 220 L190 70 Z"
          fill="url(#sk-kraft-grad)" />
        {/* fibers overlay */}
        <path d="M30 70 L33 220 Q33 232 47 232 L173 232 Q187 232 187 220 L190 70 Z"
          fill="url(#sk-kraft-fibers)" opacity="0.6" />

        {/* opening — darker rim */}
        <ellipse cx="110" cy="70" rx="80" ry="8" fill="#5B3E1F" opacity="0.85" />
        <ellipse cx="110" cy="68" rx="78" ry="6" fill="#3D2A14" />

        {/* fold band */}
        <path d="M30 70 L190 70 L186 82 L34 82 Z" fill="rgba(74,53,32,0.18)" />

        {/* vertical creases */}
        <path d="M68 72 L70 230" stroke="rgba(74,53,32,0.28)" strokeWidth="0.7" />
        <path d="M152 72 L150 230" stroke="rgba(74,53,32,0.28)" strokeWidth="0.7" />
        <path d="M110 72 L110 230" stroke="rgba(74,53,32,0.18)" strokeWidth="0.5" />

        {/* hand-stamped label */}
        <g transform="translate(110 158) rotate(-2.4)">
          <rect x="-38" y="-22" width="76" height="44" fill="#FBF6EA" stroke="#6E4D26" strokeWidth="0.7" rx="1.5" />
          <text x="0" y="-4" textAnchor="middle"
            fontFamily="ui-monospace, SF Mono, Menlo, monospace"
            fontSize="9.5" fill="#3D2A14" letterSpacing="2">{label}</text>
          <line x1="-28" y1="2" x2="28" y2="2" stroke="#6E4D26" strokeWidth="0.5" />
          <text x="0" y="14" textAnchor="middle"
            fontFamily="ui-monospace, SF Mono, Menlo, monospace"
            fontSize="6" fill="#6E4D26" letterSpacing="1">EST · WIEN · 2026</text>
        </g>
      </svg>
    </div>
  );
};
SK.Logo = ({ size = 22, color = 'var(--ink)', markColor }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: size * 0.32,
    color, lineHeight: 1,
  }}>
    <SK.Mark size={size * 0.95} color={markColor || 'var(--sage-deep)'} />
    <span style={{
      fontFamily: 'var(--font-sans)',
      fontSize: size, fontWeight: 700,
      letterSpacing: -0.035 * size, fontFeatureSettings: '"ss01"',
      lineHeight: 1,
    }}>
      sackerl
    </span>
  </span>
);

// Status bar style padding helper baked into iOS frame already; this is for
// inline screen content
SK.StatusSpacer = () => <div style={{ height: 54 }} />;

// Bottom tab bar — used on top-level screens
SK.TabBar = ({ active = 'home' }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: SK.icons.home },
    { id: 'stock', label: 'Stock', icon: SK.icons.grid },
    { id: 'scan', label: 'Scan', icon: SK.icons.scan, primary: true },
    { id: 'expiring', label: 'Expiring', icon: SK.icons.clock },
    { id: 'me', label: 'Settings', icon: SK.icons.settings },
  ];
  return (
    <div className="sk-tabbar" style={{ position: 'relative', zIndex: 5 }}>
      {tabs.map(t => t.primary ? (
        <button key={t.id} className="sk-tab" data-active={active === t.id}
          style={{ marginTop: -24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 28,
            background: 'var(--amber)', color: 'var(--ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.55) inset,' +
              '0 -1px 0 rgba(0,0,0,0.08) inset,' +
              '0 0 0 1.5px rgba(27,36,24,0.95),' +
              '0 10px 24px rgba(242,192,20,0.36)',
          }}>
            <SK.Icon d={t.icon} size={22} sw={2} />
          </div>
          <span style={{ marginTop: 2 }}>{t.label}</span>
        </button>
      ) : (
        <button key={t.id} className="sk-tab" data-active={active === t.id}>
          <SK.Icon d={t.icon} size={22} sw={1.6} />
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
};

// Top bar — generic with title + leading + trailing
SK.TopBar = ({ title, leading, trailing, subtitle, large }) => (
  <div style={{ padding: '8px 20px 12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 36 }}>
      <div>{leading}</div>
      <div>{trailing}</div>
    </div>
    {title && (
      large
        ? <div style={{ paddingTop: 12 }}>
            <div className="sk-h1">{title}</div>
            {subtitle && <div style={{ color: 'var(--mute)', fontSize: 14, marginTop: 6 }}>{subtitle}</div>}
          </div>
        : <div style={{ paddingTop: 4, textAlign: 'center', fontSize: 16, fontWeight: 600 }}>{title}</div>
    )}
  </div>
);

// Round icon button (for top bar)
SK.RoundBtn = ({ icon, dark }) => (
  <button style={{
    width: 36, height: 36, borderRadius: 18,
    background: dark ? 'var(--ink)' : 'var(--card)',
    color: dark ? 'var(--bg)' : 'var(--ink)',
    border: dark ? 'none' : '1px solid var(--border)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
  }}>
    <SK.Icon d={icon} size={18} sw={1.7} />
  </button>
);

Object.assign(window, { SK });
