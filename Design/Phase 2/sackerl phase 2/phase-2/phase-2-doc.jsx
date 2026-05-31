// sackerl — Phase 2 handoff document
// Editorial layout: cover, 8 screen sections, appendix.

// ─── tiny reusable atoms for the doc itself ──────────────────
const P2D = {};

P2D.PhoneFrame = ({ children, scale = 0.78, label }) => (
  <div style={{
    position: 'relative',
    width: 402 * scale, height: 874 * scale,
    flexShrink: 0,
  }}>
    <div style={{
      position: 'absolute', inset: 0, transform: `scale(${scale})`, transformOrigin: 'top left',
      width: 402, height: 874,
    }}>
      <IOSDevice width={402} height={874}>
        {children}
      </IOSDevice>
    </div>
    {label && (
      <div style={{
        position: 'absolute', bottom: -22, left: 0,
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.18,
        color: 'var(--mute)', textTransform: 'uppercase',
      }}>{label}</div>
    )}
  </div>
);

P2D.MiniFrame = ({ children, scale = 0.34, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
    <div style={{
      position: 'relative', width: 402 * scale, height: 874 * scale,
      borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border)',
    }}>
      <div style={{
        position: 'absolute', inset: 0, transform: `scale(${scale})`, transformOrigin: 'top left',
        width: 402, height: 874,
      }}>
        {children}
      </div>
    </div>
    {label && (
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.18,
        color: 'var(--mute)', textTransform: 'uppercase',
      }}>{label}</div>
    )}
  </div>
);

P2D.Eyebrow = ({ children, mark = true }) => (
  <div className="sk-eyebrow" style={{ display: 'flex', alignItems: 'center' }}>
    {mark && <span className="sk-mark" />}{children}
  </div>
);

P2D.SectionHead = ({ n, title, ticket }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: '1fr auto',
    alignItems: 'flex-end', padding: '0 0 18px',
    borderBottom: '1px solid var(--border)', marginBottom: 28,
  }}>
    <div>
      <div className="sk-eyebrow">P2 · {n}</div>
      <div style={{
        fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 44,
        letterSpacing: -0.03 * 44, lineHeight: 1.02, marginTop: 6,
      }}>{title}</div>
    </div>
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.2,
      color: 'var(--mute)', textTransform: 'uppercase', textAlign: 'right',
    }}>
      <div>Ticket · {ticket}</div>
      <div style={{ marginTop: 2 }}>Mobile · 402 × 874</div>
    </div>
  </div>
);

P2D.SpecKey = ({ k, v }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12,
    paddingBottom: 8, paddingTop: 8,
    borderBottom: '1px dotted var(--border)',
    fontSize: 12.5, lineHeight: 1.5,
  }}>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.16, color: 'var(--mute)', textTransform: 'uppercase' }}>{k}</span>
    <span style={{ color: 'var(--ink-soft)' }}>{v}</span>
  </div>
);

P2D.SpecPanel = ({ title, n, children }) => (
  <div style={{
    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18,
    padding: '20px 22px',
  }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
      <div className="sk-eyebrow">{title}</div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: 0.18, color: 'var(--mute-soft)', textTransform: 'uppercase' }}>{n}</span>
    </div>
    {children}
  </div>
);

P2D.CopyTable = ({ rows }) => (
  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
    <thead>
      <tr style={{ textAlign: 'left', color: 'var(--mute)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.16, textTransform: 'uppercase' }}>
        <th style={{ padding: '6px 8px 6px 0', width: 110, borderBottom: '1px solid var(--border)' }}>Key</th>
        <th style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>EN</th>
        <th style={{ padding: '6px 0 6px 8px', borderBottom: '1px solid var(--border)' }}>DE</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((r, i) => (
        <tr key={i} style={{ verticalAlign: 'top' }}>
          <td style={{ padding: '8px 8px 8px 0', borderBottom: '1px dotted var(--border)', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--mute)', letterSpacing: 0.04 }}>{r[0]}</td>
          <td style={{ padding: '8px', borderBottom: '1px dotted var(--border)', color: 'var(--ink)' }}>{r[1]}</td>
          <td style={{ padding: '8px 0 8px 8px', borderBottom: '1px dotted var(--border)', color: 'var(--ink-soft)' }}>{r[2]}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

P2D.Bullet = ({ children }) => (
  <li style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--ink-soft)', textWrap: 'pretty' }}>{children}</li>
);

P2D.Tag = ({ children, tone = 'default' }) => {
  const tones = {
    default: { bg: 'var(--bg-warm)', fg: 'var(--ink-soft)' },
    new: { bg: 'var(--sage-soft)', fg: 'var(--sage-deep)' },
    changed: { bg: 'var(--amber-soft)', fg: '#6E5108' },
    p0: { bg: 'var(--ink)', fg: 'var(--bg)' },
    p1: { bg: 'var(--bg-warm)', fg: 'var(--ink)' },
    p2: { bg: 'transparent', fg: 'var(--mute)' },
  };
  const c = tones[tone] || tones.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 8px', borderRadius: 4,
      background: c.bg, color: c.fg, fontFamily: 'var(--font-mono)', fontSize: 10,
      letterSpacing: 0.14, textTransform: 'uppercase',
      border: tone === 'p2' ? '1px solid var(--border)' : 'none',
    }}>{children}</span>
  );
};

// ─────────────────────────────────────────────────────────────
// PAGE LAYOUT for a single screen section
// ─────────────────────────────────────────────────────────────
P2D.Section = ({
  n, title, ticket, lede, frame, states = [],
  anatomy = [], copy = [], a11y = [], motion = [], data = [], components = [], tokens = [],
  priority = 'P0',
  hierarchy = null,
}) => (
  <section style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
    <P2D.SectionHead n={n} title={title} ticket={ticket} />

    {/* lede */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'flex-start', marginBottom: 24 }}>
      <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5, color: 'var(--ink)', textWrap: 'pretty', maxWidth: 640 }}>
        {lede}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <P2D.Tag tone={priority.toLowerCase()}>Priority · {priority}</P2D.Tag>
        </div>
        {hierarchy && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--mute)', letterSpacing: 0.14, textAlign: 'right' }}>
            {hierarchy}
          </div>
        )}
      </div>
    </div>

    {/* hero frame + anatomy column */}
    <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 36, alignItems: 'flex-start' }}>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
        <P2D.PhoneFrame scale={0.82} label="FINAL · LIGHT · 402 × 874">
          {frame}
        </P2D.PhoneFrame>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <P2D.SpecPanel title="Anatomy & sizing" n="01">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 18 }}>
            {anatomy.map((r, i) => <P2D.SpecKey key={i} k={r[0]} v={r[1]} />)}
          </div>
        </P2D.SpecPanel>

        <P2D.SpecPanel title="Reusable components" n="02">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {components.map((c, i) => (
              <span key={i} style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, padding: '5px 9px',
                background: c.new ? 'var(--sage-soft)' : 'var(--bg-warm)',
                color: c.new ? 'var(--sage-deep)' : 'var(--ink-soft)',
                borderRadius: 6,
              }}>{c.name}{c.new ? ' · new' : ''}</span>
            ))}
          </div>
        </P2D.SpecPanel>
      </div>
    </div>

    {/* states strip */}
    {states.length > 0 && (
      <div style={{ marginTop: 36 }}>
        <P2D.Eyebrow>States · {states.length}</P2D.Eyebrow>
        <div style={{
          marginTop: 14, display: 'flex', gap: 18, overflowX: 'auto', paddingBottom: 30,
        }}>
          {states.map((s, i) => (
            <P2D.MiniFrame key={i} label={s.label}>
              {s.frame}
            </P2D.MiniFrame>
          ))}
        </div>
      </div>
    )}

    {/* spec grid below */}
    <div style={{
      marginTop: 32, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18,
    }}>
      <P2D.SpecPanel title="Copy · EN / DE" n="03">
        <P2D.CopyTable rows={copy} />
      </P2D.SpecPanel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <P2D.SpecPanel title="Accessibility" n="04">
          <ul style={{ margin: 0, paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {a11y.map((b, i) => <P2D.Bullet key={i}>{b}</P2D.Bullet>)}
          </ul>
        </P2D.SpecPanel>

        {motion.length > 0 && (
          <P2D.SpecPanel title="Motion" n="05">
            <ul style={{ margin: 0, paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {motion.map((b, i) => <P2D.Bullet key={i}>{b}</P2D.Bullet>)}
            </ul>
          </P2D.SpecPanel>
        )}
      </div>
    </div>

    <div style={{
      marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18,
    }}>
      <P2D.SpecPanel title="Data assumptions" n="06">
        <ul style={{ margin: 0, paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.map((b, i) => <P2D.Bullet key={i}>{b}</P2D.Bullet>)}
        </ul>
      </P2D.SpecPanel>
      <P2D.SpecPanel title="New or changed tokens" n="07">
        {tokens.length === 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--mute)' }}>None — uses Phase 1 tokens as-is.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {tokens.map((b, i) => <P2D.Bullet key={i}>{b}</P2D.Bullet>)}
          </ul>
        )}
      </P2D.SpecPanel>
    </div>
  </section>
);

Object.assign(window, { P2D });
