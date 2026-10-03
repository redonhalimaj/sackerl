// sackerl — mobile screens part 2
// Storage detail · Expiring soon · Notifications · Suggestions · Premium

// ─────────────────────────────────────────────────────────────
// Storage Location Detail (Fridge)
// ─────────────────────────────────────────────────────────────
function ScreenLocation() {
  const items = [
    { name: 'Greek yogurt', cat: 'dairy', qty: '500 g', days: 1, urgent: true },
    { name: 'Spinach (fresh)', cat: 'produce', qty: '200 g', days: 2, urgent: true },
    { name: 'Chicken thighs', cat: 'meat', qty: '500 g', days: 2, urgent: true },
    { name: 'Milk 1.5%', cat: 'dairy', qty: '1 L', days: 6 },
    { name: 'Parmesan', cat: 'dairy', qty: '100 g', days: 21 },
    { name: 'Cucumber', cat: 'produce', qty: '1 pc', days: 5 },
    { name: 'Eggs', cat: 'dairy', qty: '6 pcs', days: 12 },
    { name: 'Carrots', cat: 'produce', qty: '500 g', days: 9 },
    { name: 'Butter', cat: 'dairy', qty: '250 g', days: 30 },
  ];
  return (
    <div className="sk-screen sk-app" data-screen-label="06 Storage detail">
      <div className="sk-safe-top" style={{ paddingTop: 60 }}>
        <div style={{ padding: '6px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SK.RoundBtn icon={SK.icons.chevronLeft} />
          <SK.RoundBtn icon={SK.icons.dots} />
        </div>
        <div style={{ padding: '8px 22px 0', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <SK.Zone kind="fridge" size={64} />
          <div>
            <div className="sk-h1" style={{ fontSize: 30 }}>Fridge</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 13, color: 'var(--mute)' }}>
              <span>23 items</span>
              <span>·</span>
              <span style={{ color: 'var(--amber)' }}>3 expire soon</span>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 20px 8px', display: 'flex', gap: 6, overflowX: 'auto' }}>
          <span className="sk-chip" style={{ background: 'var(--ink)', color: 'var(--bg)', height: 30 }}>
            All · 23
          </span>
          <span className="sk-chip" style={{ height: 30 }}>Dairy · 5</span>
          <span className="sk-chip" style={{ height: 30 }}>Produce · 8</span>
          <span className="sk-chip" style={{ height: 30 }}>Meat · 3</span>
        </div>
      </div>

      <div className="sk-scroll" style={{ padding: '6px 14px 100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 6px 8px' }}>
          <div className="sk-eyebrow">Use soon</div>
          <button style={{
            background: 'transparent', border: 'none', color: 'var(--mute)', fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 4, padding: 4,
          }}>
            <SK.Icon d={SK.icons.filter} size={12} sw={2} /> Sort: expiry
          </button>
        </div>
        <div className="sk-card-flat" style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden',
        }}>
          {items.filter(i => i.urgent).map((it, i, arr) => (
            <LocationRow key={i} it={it} isLast={i === arr.length - 1} />
          ))}
        </div>

        <div style={{ padding: '20px 6px 8px' }}>
          <div className="sk-eyebrow">Stocked</div>
        </div>
        <div className="sk-card-flat" style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden',
        }}>
          {items.filter(i => !i.urgent).map((it, i, arr) => (
            <LocationRow key={i} it={it} isLast={i === arr.length - 1} />
          ))}
        </div>
      </div>

      {/* floating add button */}
      <button style={{
        position: 'absolute', right: 18, bottom: 110,
        width: 56, height: 56, borderRadius: 28,
        background: 'var(--ink)', color: 'var(--bg)', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <SK.Icon d={SK.icons.plus} size={22} sw={2} />
      </button>

      <SK.TabBar active="stock" />
    </div>
  );
}

function LocationRow({ it, isLast }) {
  const days = it.days;
  const tag = days <= 1 ? 'tomorrow' : days <= 2 ? `${days} days` : days <= 7 ? `${days}d` : `${days}d`;
  const chipCls = days <= 2 ? 'sk-chip sk-chip-amber' : days <= 7 ? 'sk-chip' : 'sk-chip';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      borderBottom: isLast ? 'none' : '1px solid var(--hairline)',
    }}>
      <SK.Tile cat={it.cat} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{it.name}</div>
        <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
          {it.qty} · added 5 days ago
        </div>
      </div>
      <span className={chipCls} style={{ height: 26, fontSize: 11 }}>{tag}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Expiring Soon
// ─────────────────────────────────────────────────────────────
function ScreenExpiring() {
  const today = [
    { name: 'Greek yogurt', cat: 'dairy', loc: 'Fridge', qty: '500 g', pct: 92 },
  ];
  const week = [
    { name: 'Spinach', cat: 'produce', loc: 'Fridge', qty: '200 g', pct: 70, days: 2 },
    { name: 'Chicken thighs', cat: 'meat', loc: 'Fridge', qty: '500 g', pct: 65, days: 2 },
    { name: 'Cucumber', cat: 'produce', loc: 'Fridge', qty: '1 pc', pct: 40, days: 5 },
    { name: 'Milk', cat: 'dairy', loc: 'Fridge', qty: '1 L', pct: 30, days: 6 },
  ];
  return (
    <div className="sk-screen sk-app" data-screen-label="07 Expiring soon">
      <div className="sk-safe-top" style={{ paddingTop: 60 }}>
        <SK.TopBar
          leading={<SK.RoundBtn icon={SK.icons.chevronLeft} />}
          trailing={<SK.RoundBtn icon={SK.icons.filter} />}
        />
        <div style={{ padding: '8px 22px 0' }}>
          <div className="sk-h1" style={{ fontSize: 32 }}>
            <span className="sk-serif" style={{ fontStyle: 'italic', fontWeight: 400 }}>Use</span> soon
          </div>
          <div style={{ fontSize: 14, color: 'var(--mute)', marginTop: 4 }}>
            5 items want your attention this week.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '18px 20px 4px' }}>
          <span className="sk-chip" style={{ background: 'var(--ink)', color: 'var(--bg)', height: 32 }}>Today · 1</span>
          <span className="sk-chip" style={{ height: 32 }}>This week · 4</span>
          <span className="sk-chip" style={{ height: 32 }}>Later · 12</span>
        </div>
      </div>

      <div className="sk-scroll" style={{ padding: '8px 14px 100px' }}>
        {/* today — feature card */}
        {today.map((it, i) => (
          <div key={i} style={{
            background: 'linear-gradient(180deg, #FBF1E0 0%, #F7EBD9 100%)',
            border: '1px solid #EDDFC1',
            borderRadius: 22, padding: 18, marginBottom: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span className="sk-dot" style={{ background: 'var(--amber)' }} />
              <span className="sk-eyebrow" style={{ color: 'var(--amber)' }}>Use today</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <SK.Tile cat={it.cat} size={56} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 19, fontWeight: 600 }}>{it.name}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>
                  {it.qty} · in {it.loc}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button style={{
                flex: 1, height: 42, borderRadius: 12, border: 'none',
                background: 'var(--ink)', color: 'var(--bg)', fontSize: 14, fontWeight: 500,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <SK.Icon d={SK.icons.sparkle} size={14} sw={1.7} /> Use in recipe
              </button>
              <button style={{
                height: 42, padding: '0 16px', borderRadius: 12, border: '1px solid #DCC7A0',
                background: 'transparent', color: 'var(--amber)', fontSize: 14, fontWeight: 500,
              }}>
                Snooze
              </button>
            </div>
          </div>
        ))}

        <div style={{ padding: '8px 6px 8px' }}>
          <div className="sk-eyebrow">This week</div>
        </div>
        <div className="sk-card-flat" style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden',
        }}>
          {week.map((it, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              borderBottom: i < week.length - 1 ? '1px solid var(--hairline)' : 'none',
            }}>
              <SK.Tile cat={it.cat} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{it.name}</div>
                <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 1 }}>
                  {it.qty} · {it.loc}
                </div>
                {/* progress bar */}
                <div style={{
                  marginTop: 8, height: 4, background: 'var(--bg-warm)', borderRadius: 4, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${it.pct}%`,
                    background: it.pct > 60 ? 'var(--amber)' : 'var(--sage)',
                    borderRadius: 4,
                  }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 60 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{it.days}d</div>
                <div style={{ fontSize: 10, color: 'var(--mute-soft)', fontFamily: 'var(--font-mono)' }}>left</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <SK.TabBar active="expiring" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Notification Settings
// ─────────────────────────────────────────────────────────────
function ScreenNotifs() {
  return (
    <div className="sk-screen sk-app" data-screen-label="08 Notifications">
      <div className="sk-safe-top" style={{ paddingTop: 60 }}>
        <SK.TopBar leading={<SK.RoundBtn icon={SK.icons.chevronLeft} />} />
        <div style={{ padding: '8px 22px 0' }}>
          <div className="sk-h1" style={{ fontSize: 28 }}>
            <span className="sk-serif" style={{ fontStyle: 'italic', fontWeight: 400 }}>Gentle</span> reminders
          </div>
          <div style={{ fontSize: 13, color: 'var(--mute)', marginTop: 6, lineHeight: 1.45, maxWidth: 320 }}>
            You choose when to be nudged. Quiet by default.
          </div>
        </div>
      </div>

      <div className="sk-scroll" style={{ padding: '20px 18px 60px' }}>
        {/* master */}
        <div className="sk-card-flat" style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 18, padding: 16, marginBottom: 18,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14, background: 'var(--sage-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SK.Icon d={SK.icons.bell} size={20} stroke="var(--sage-deep)" sw={1.6} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Push reminders</div>
            <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 1 }}>Daily summary at 6 PM</div>
          </div>
          <Toggle on />
        </div>

        <Section title="Remind me before">
          <div style={{ padding: '8px 4px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>
              <span>1d</span><span>2d</span><span style={{ color: 'var(--ink)', fontWeight: 600 }}>3d</span><span>5d</span><span>7d</span>
            </div>
            <div style={{ marginTop: 8, height: 4, background: 'var(--bg-warm)', borderRadius: 4, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '50%', background: 'var(--ink)', borderRadius: 4 }} />
              <div style={{
                position: 'absolute', left: 'calc(50% - 10px)', top: -8,
                width: 20, height: 20, borderRadius: 10, background: 'var(--ink)',
                border: '3px solid var(--bg)', boxShadow: 'var(--shadow-sm)',
              }} />
            </div>
          </div>
        </Section>

        <Section title="By category">
          {[
            { cat: 'dairy', label: 'Dairy', sub: 'Often expires fast', on: true },
            { cat: 'meat', label: 'Meat & fish', sub: '2 days before', on: true },
            { cat: 'produce', label: 'Fresh produce', sub: '1 day before', on: true },
            { cat: 'bakery', label: 'Bread & bakery', sub: 'Off', on: false },
            { cat: 'pantry', label: 'Pantry & grains', sub: 'Off', on: false },
            { cat: 'frozen', label: 'Frozen', sub: 'Monthly check', on: true },
          ].map((r, i, arr) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--hairline)' : 'none',
            }}>
              <SK.Tile cat={r.cat} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{r.label}</div>
                <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 1 }}>{r.sub}</div>
              </div>
              <Toggle on={r.on} />
            </div>
          ))}
        </Section>

        <Section title="Types of nudges">
          {[
            { label: 'Expiring soon', sub: 'Items 1–3 days away', on: true },
            { label: 'You may already have this', sub: 'Right before shopping', on: true },
            { label: 'Weekly stock summary', sub: 'Sunday morning', on: true },
            { label: 'Recipe suggestions', sub: 'Premium feature', on: false, locked: true },
          ].map((r, i, arr) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--hairline)' : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {r.label}
                  {r.locked && <span style={{
                    fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.08,
                    background: 'var(--sage-soft)', color: 'var(--sage-deep)', padding: '2px 6px', borderRadius: 4,
                  }}>Premium</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 1 }}>{r.sub}</div>
              </div>
              <Toggle on={r.on} disabled={r.locked} />
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div className="sk-eyebrow" style={{ padding: '0 6px 10px' }}>{title}</div>
      <div className="sk-card-flat" style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}

function Toggle({ on, disabled }) {
  return (
    <div style={{
      width: 46, height: 28, borderRadius: 14,
      background: disabled ? 'var(--bg-warm)' : (on ? 'var(--sage)' : 'var(--border)'),
      position: 'relative', flexShrink: 0,
      opacity: disabled ? 0.5 : 1,
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 22, height: 22, borderRadius: 11, background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        transition: 'left .15s',
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Suggestion Box
// ─────────────────────────────────────────────────────────────
function ScreenSuggestions() {
  return (
    <div className="sk-screen sk-app" data-screen-label="09 Suggestions">
      <div className="sk-safe-top" style={{ paddingTop: 60 }}>
        <SK.TopBar
          leading={<SK.RoundBtn icon={SK.icons.chevronLeft} />}
          trailing={
            <span className="sk-chip sk-chip-sage" style={{ height: 32 }}>
              <SK.Icon d={SK.icons.sparkle} size={12} sw={1.7} stroke="var(--sage-deep)" /> Premium
            </span>
          }
        />
        <div style={{ padding: '8px 22px 4px' }}>
          <div className="sk-h1" style={{ fontSize: 30 }}>
            <span className="sk-serif" style={{ fontStyle: 'italic', fontWeight: 400 }}>Ideas</span><br/>from your stock
          </div>
        </div>
      </div>

      <div className="sk-scroll" style={{ padding: '20px 18px 60px' }}>
        {/* recipe hero — uses 3 expiring items */}
        <div style={{
          background: 'var(--ink)', color: '#F6F4EE',
          borderRadius: 22, overflow: 'hidden', marginBottom: 14,
        }}>
          <div className="sk-placeholder" style={{
            height: 140, background:
              'repeating-linear-gradient(135deg, #2a2d28 0px, #2a2d28 10px, #232622 10px, #232622 11px)',
            position: 'relative',
          }}>
            <span style={{
              position: 'absolute', top: 12, left: 12,
              fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.35)',
              letterSpacing: 0.1, textTransform: 'uppercase',
            }}>[ recipe photo ]</span>
            <span className="sk-chip sk-chip-amber" style={{
              position: 'absolute', top: 12, right: 12, height: 26, fontSize: 11,
            }}>
              Uses 3 expiring
            </span>
          </div>
          <div style={{ padding: 18 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: 0.08, textTransform: 'uppercase', color: 'rgba(246,244,238,0.5)' }}>
              25 min · easy
            </div>
            <div className="sk-serif" style={{ fontSize: 26, marginTop: 6, lineHeight: 1.1 }}>
              Spinach & yogurt pasta
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
              {['Penne', 'Spinach', 'Yogurt', 'Garlic', 'Parmesan'].map(t => (
                <span key={t} style={{
                  fontSize: 11, padding: '5px 10px', borderRadius: 999,
                  background: 'rgba(246,244,238,0.1)', color: '#F6F4EE',
                }}>{t}</span>
              ))}
              <span style={{
                fontSize: 11, padding: '5px 10px', borderRadius: 999,
                background: 'transparent', border: '1px solid rgba(246,244,238,0.2)', color: 'rgba(246,244,238,0.6)',
              }}>+ olive oil*</span>
            </div>
          </div>
        </div>

        {/* second recipe */}
        <div className="sk-card-flat" style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18,
          padding: 14, display: 'flex', gap: 12, marginBottom: 24,
        }}>
          <div className="sk-placeholder" style={{
            width: 84, height: 84, borderRadius: 14, flexShrink: 0,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--mute-soft)', fontFamily: 'var(--font-mono)', letterSpacing: 0.05 }}>
              35 MIN · WEEKNIGHT
            </div>
            <div className="sk-serif" style={{ fontSize: 20, marginTop: 2 }}>
              One-pan chicken & potatoes
            </div>
            <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 6 }}>
              Uses chicken (2 days), carrots, garlic
            </div>
          </div>
        </div>

        {/* Buying advice */}
        <div className="sk-eyebrow" style={{ padding: '0 6px 10px' }}>Buy smarter</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Insight
            tone="sage"
            badge="Already have it"
            title="You still have 500 g of pasta."
            sub="Skip buying more this week."
          />
          <Insight
            tone="sky"
            badge="Pattern"
            title="You usually buy 4 apples but eat 2."
            sub="Try 2 next time to reduce waste."
          />
          <Insight
            tone="berry"
            badge="Often wasted"
            title="Lettuce is thrown out 3 of 5 times."
            sub="Consider a smaller pack or pre-cut greens."
          />
        </div>

        {/* premium nudge */}
        <div style={{
          marginTop: 24, padding: 18, borderRadius: 18,
          background: 'var(--bg-warm)',
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <SK.Icon d={SK.icons.sparkle} size={14} sw={1.7} />
            <span className="sk-eyebrow">More with Premium</span>
          </div>
          <div className="sk-serif" style={{ fontSize: 20, lineHeight: 1.15 }}>
            Personalised recipes from <span style={{ fontStyle: 'italic' }}>your</span> shelf, every day.
          </div>
          <button style={{
            marginTop: 14, background: 'var(--ink)', color: 'var(--bg)',
            border: 'none', padding: '10px 18px', borderRadius: 999, fontSize: 14, fontWeight: 500,
          }}>
            Try premium · €2.99/mo
          </button>
        </div>
      </div>
    </div>
  );
}

function Insight({ tone = 'sage', badge, title, sub }) {
  const toneMap = {
    sage:  { bg: 'var(--sage-soft)',  ink: 'var(--sage-deep)' },
    sky:   { bg: 'var(--sky-soft)',   ink: 'var(--sky)' },
    berry: { bg: 'var(--berry-soft)', ink: 'var(--berry)' },
  };
  const t = toneMap[tone];
  return (
    <div className="sk-card-flat" style={{
      border: '1px solid var(--border)', borderRadius: 16, padding: 14,
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <div style={{
        width: 6, alignSelf: 'stretch', borderRadius: 4,
        background: t.ink, opacity: 0.5,
      }} />
      <div style={{ flex: 1 }}>
        <span style={{
          fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: 0.08, textTransform: 'uppercase',
          background: t.bg, color: t.ink, padding: '3px 7px', borderRadius: 4,
        }}>{badge}</span>
        <div style={{ fontSize: 14, fontWeight: 500, marginTop: 6, lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 3 }}>{sub}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Premium / Paywall
// ─────────────────────────────────────────────────────────────
function ScreenPremium() {
  const features = [
    { title: 'AI recipes from your shelf', sub: 'Tonight\'s menu based on what\'s about to expire.' },
    { title: 'Buying behaviour insights', sub: 'Spot what you waste and tune your shopping.' },
    { title: 'Smart shopping list', sub: 'We watch your stock and build the list with you.' },
    { title: 'Advanced receipt parsing', sub: 'Better accuracy across stores and languages.' },
    { title: 'Household sharing', sub: 'Same stock, every phone in the home.' },
  ];
  return (
    <div className="sk-screen sk-app" data-screen-label="10 Premium" style={{
      background: 'linear-gradient(180deg, #FAFAF7 0%, #EEF2EA 100%)',
    }}>
      <div className="sk-safe-top" style={{ paddingTop: 60 }}>
        <div style={{ padding: '6px 20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{
            width: 32, height: 32, borderRadius: 16, background: 'rgba(0,0,0,0.04)',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            color: 'var(--mute)',
          }}>
            <SK.Icon d={SK.icons.close} size={16} sw={1.8} />
          </button>
        </div>
      </div>

      <div className="sk-scroll" style={{ padding: '8px 24px 0' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 18,
          background: 'var(--sage)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 18, boxShadow: '0 6px 20px rgba(94, 124, 90, 0.35)',
        }}>
          <SK.Icon d={SK.icons.leaf} size={26} stroke="#fff" sw={1.6} />
        </div>

        <div className="sk-serif" style={{ fontSize: 44, lineHeight: 1.02, letterSpacing: -0.02 }}>
          More from <span style={{ fontStyle: 'italic' }}>sackerl</span>.
        </div>
        <div style={{ marginTop: 14, fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.5, maxWidth: 320 }}>
          A small monthly fee unlocks the smarter parts. The free version stays free, forever.
        </div>

        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {features.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '14px 0',
              borderBottom: i < features.length - 1 ? '1px solid var(--hairline)' : 'none',
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 12, marginTop: 2,
                background: 'var(--sage-soft)', color: 'var(--sage-deep)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <SK.Icon d={SK.icons.check} size={14} sw={2.2} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'var(--mute)', marginTop: 2, lineHeight: 1.4 }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 24px 38px' }}>
        {/* plan picker */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <PlanCard active label="Monthly" price="€2.99" sub="cancel anytime" />
          <PlanCard label="Yearly" price="€24" sub="2 months free" badge="Save 33%" />
        </div>

        <button className="sk-btn sk-btn-sage" style={{ width: '100%', height: 54 }}>
          Start 7-day free trial
        </button>
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--mute)' }}>
          Cancel anytime · No charge until day 7
        </div>
      </div>
    </div>
  );
}

function PlanCard({ active, label, price, sub, badge }) {
  return (
    <div style={{
      flex: 1, padding: 14, borderRadius: 16,
      background: 'var(--card)',
      border: active ? '2px solid var(--sage-deep)' : '1px solid var(--border)',
      position: 'relative',
    }}>
      {badge && (
        <span style={{
          position: 'absolute', top: -8, right: 10,
          fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.06,
          background: 'var(--amber)', color: '#fff', padding: '3px 8px', borderRadius: 4,
        }}>{badge}</span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 18, height: 18, borderRadius: 9,
          border: active ? '5px solid var(--sage-deep)' : '1.5px solid var(--border)',
          background: '#fff',
        }} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, marginTop: 10, fontVariantNumeric: 'tabular-nums' }}>
        {price}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--mute)' }}>/mo</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

Object.assign(window, {
  ScreenLocation, ScreenExpiring, ScreenNotifs, ScreenSuggestions, ScreenPremium,
});
