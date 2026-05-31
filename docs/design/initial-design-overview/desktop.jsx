// sackerl — Desktop / web companion (dashboard view)

function DesktopDashboard() {
  return (
    <div className="sk-app" data-screen-label="Desktop Dashboard" style={{
      width: '100%', height: '100%', display: 'flex', overflow: 'hidden',
      background: 'var(--bg)',
    }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: 'var(--bg)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '24px 22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SK.Logo size={22} />
          <span style={{
            fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--mute)',
            background: 'var(--bg-warm)', padding: '3px 6px', borderRadius: 4,
          }}>v0.1</span>
        </div>

        <div style={{ padding: '0 12px' }}>
          {[
            { label: 'Home', icon: SK.icons.home, active: true },
            { label: 'Stock', icon: SK.icons.grid, sub: '85' },
            { label: 'Expiring soon', icon: SK.icons.clock, sub: '5', badge: 'amber' },
            { label: 'Receipts', icon: SK.icons.basket, sub: '12' },
            { label: 'Suggestions', icon: SK.icons.sparkle },
            { label: 'Shopping list', icon: SK.icons.list },
          ].map((n, i) => (
            <button key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%', padding: '10px 12px', borderRadius: 10,
              background: n.active ? 'var(--card)' : 'transparent',
              border: 'none',
              color: n.active ? 'var(--ink)' : 'var(--ink-soft)',
              fontSize: 14, fontWeight: n.active ? 500 : 400,
              boxShadow: n.active ? 'var(--shadow-sm)' : 'none',
              marginBottom: 2,
            }}>
              <SK.Icon d={n.icon} size={18} sw={1.6} stroke={n.active ? 'var(--ink)' : 'var(--mute)'} />
              <span style={{ flex: 1, textAlign: 'left' }}>{n.label}</span>
              {n.sub && (
                <span style={{
                  fontSize: 11, color: n.badge === 'amber' ? 'var(--amber)' : 'var(--mute)',
                  fontFamily: 'var(--font-mono)',
                }}>{n.sub}</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: '24px 22px 12px' }}>
          <div className="sk-eyebrow">Storage</div>
        </div>
        <div style={{ padding: '0 12px' }}>
          {[
            { kind: 'fridge', name: 'Fridge', count: 23, expSoon: 3 },
            { kind: 'pantry', name: 'Pantry', count: 41 },
            { kind: 'basement', name: 'Basement', count: 12 },
            { kind: 'freezer', name: 'Freezer', count: 9 },
          ].map((s, i) => (
            <button key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '8px 10px', borderRadius: 10,
              background: 'transparent', border: 'none',
              fontSize: 13, color: 'var(--ink-soft)', marginBottom: 2,
            }}>
              <SK.Zone kind={s.kind} size={28} />
              <span style={{ flex: 1, textAlign: 'left' }}>{s.name}</span>
              <span style={{ fontSize: 11, color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>
                {s.count}
              </span>
              {s.expSoon && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)' }} />
              )}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Premium nudge */}
        <div style={{
          margin: 16, padding: 14, borderRadius: 14,
          background: 'var(--sage-soft)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <SK.Icon d={SK.icons.sparkle} size={12} stroke="var(--sage-deep)" sw={1.7} />
            <span style={{
              fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.08,
              color: 'var(--sage-deep)', fontWeight: 500,
            }}>Premium</span>
          </div>
          <div className="sk-serif" style={{ fontSize: 16, color: 'var(--sage-deep)', lineHeight: 1.2 }}>
            Smarter recipes from your shelf.
          </div>
          <button style={{
            marginTop: 10, background: 'var(--sage-deep)', color: '#fff',
            border: 'none', padding: '7px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500,
          }}>
            Try free
          </button>
        </div>

        {/* user */}
        <div style={{
          padding: '14px 18px', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 15,
            background: 'var(--berry-soft)', color: 'var(--berry)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
          }}>LN</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Lena</div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          height: 64, padding: '0 32px', display: 'flex', alignItems: 'center', gap: 16,
          borderBottom: '1px solid var(--border)', background: 'var(--bg)',
        }}>
          <div style={{
            flex: 1, maxWidth: 480, display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 14px', background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 10, fontSize: 13, color: 'var(--mute)',
          }}>
            <SK.Icon d={SK.icons.search} size={16} sw={1.6} stroke="var(--mute)" />
            <span>Search anything in your kitchen…</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--mute-soft)' }}>⌘ K</span>
          </div>
          <div style={{ flex: 1 }} />
          <button className="sk-btn sk-btn-ghost" style={{ height: 38, fontSize: 13, padding: '0 14px' }}>
            <SK.Icon d={SK.icons.plus} size={14} sw={2} /> Add item
          </button>
          <button className="sk-btn sk-btn-primary" style={{ height: 38, fontSize: 13, padding: '0 16px' }}>
            <SK.Icon d={SK.icons.scan} size={14} sw={1.7} /> Scan receipt
          </button>
        </div>

        {/* Scrollable content */}
        <div className="sk-scroll" style={{ padding: '28px 32px 32px' }}>
          {/* hero — split: greeting + animated paper bag */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24,
            marginBottom: 24, alignItems: 'stretch',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div className="sk-eyebrow">Tuesday, 17 May</div>
              <div className="sk-serif" style={{ fontSize: 40, marginTop: 6, letterSpacing: -0.02, lineHeight: 1.05 }}>
                Hello, <span style={{ fontStyle: 'italic' }}>Lena.</span>{' '}
                <span style={{ color: 'var(--mute-soft)' }}>You have 5 things to use this week.</span>
              </div>
            </div>
            <div className="sk-kraft" style={{
              position: 'relative', borderRadius: 18,
              border: '1px solid rgba(74,53,32,0.18)',
              padding: '14px 18px 0', overflow: 'hidden',
              display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end',
              minHeight: 200,
            }}>
              <div style={{
                position: 'absolute', top: 12, left: 18,
                fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: 0.18,
                color: 'var(--kraft-deep)', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ width: 18, height: 1, background: 'var(--kraft-deep)' }} />
                dein sackerl · live
              </div>
              <div style={{ paddingTop: 38, paddingBottom: 14 }}>
                <div style={{
                  fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 30,
                  letterSpacing: -1, lineHeight: 0.98, color: 'var(--kraft-ink)',
                }}>
                  85<br/>at home
                </div>
                <div style={{
                  marginTop: 10, fontSize: 12, color: 'var(--kraft-ink)',
                  opacity: 0.78, lineHeight: 1.45, maxWidth: 140,
                }}>
                  Was im Sackerl ist —<br/>genug für 5 Abende.
                </div>
              </div>
              <div style={{ width: 170, height: 188, alignSelf: 'end' }}>
                <SK.PaperBag width={170} height={188} />
              </div>
            </div>
          </div>

          {/* Stat row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
            <Stat label="In stock" value="85" sub="items across 4 places" />
            <Stat label="Expiring this week" value="5" tone="amber" sub="1 today, 4 within 7 days" />
            <Stat label="Saved this month" value="€34" tone="sage" sub="vs. last month" />
            <Stat label="Food waste avoided" value="2.1 kg" tone="sage" sub="32% better than May avg" />
          </div>

          {/* Two-column */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
            {/* Left: Expiring soon table */}
            <div className="sk-card-flat" style={{
              background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18,
              padding: '6px 4px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 8px' }}>
                <div>
                  <div className="sk-eyebrow">Use soon</div>
                  <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>Expiring this week</div>
                </div>
                <button style={{
                  background: 'transparent', border: '1px solid var(--border)', borderRadius: 8,
                  padding: '6px 10px', fontSize: 12, color: 'var(--ink-soft)',
                }}>
                  See all 5 <SK.Icon d={SK.icons.chevronRight} size={12} sw={2} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ color: 'var(--mute)', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.06 }}>
                    <th style={{ textAlign: 'left', padding: '8px 18px', fontWeight: 500 }}>Item</th>
                    <th style={{ textAlign: 'left', padding: '8px 8px', fontWeight: 500 }}>Location</th>
                    <th style={{ textAlign: 'left', padding: '8px 8px', fontWeight: 500 }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '8px 18px', fontWeight: 500 }}>Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Greek yogurt', cat: 'dairy', loc: 'Fridge', qty: '500 g', days: 1, tone: 'amber' },
                    { name: 'Spinach', cat: 'produce', loc: 'Fridge', qty: '200 g', days: 2, tone: 'amber' },
                    { name: 'Chicken thighs', cat: 'meat', loc: 'Fridge', qty: '500 g', days: 2, tone: 'amber' },
                    { name: 'Cucumber', cat: 'produce', loc: 'Fridge', qty: '1 pc', days: 5 },
                    { name: 'Milk 1.5%', cat: 'dairy', loc: 'Fridge', qty: '1 L', days: 6 },
                  ].map((r, i, arr) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--hairline)' }}>
                      <td style={{ padding: '10px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <SK.Tile cat={r.cat} size={32} />
                          <span style={{ fontWeight: 500 }}>{r.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', color: 'var(--mute)' }}>{r.loc}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--mute)', fontVariantNumeric: 'tabular-nums' }}>{r.qty}</td>
                      <td style={{ padding: '10px 18px', textAlign: 'right' }}>
                        <span className={r.tone === 'amber' ? 'sk-chip sk-chip-amber' : 'sk-chip'} style={{ height: 24, fontSize: 11 }}>
                          {r.days === 1 ? 'tomorrow' : `${r.days} days`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right: Today's suggestion */}
            <div>
              <div style={{
                background: 'var(--ink)', color: '#F6F4EE', borderRadius: 18,
                padding: 22, marginBottom: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SK.Icon d={SK.icons.sparkle} size={12} stroke="rgba(246,244,238,0.6)" sw={1.7} />
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: 0.08, textTransform: 'uppercase', color: 'rgba(246,244,238,0.6)' }}>
                    Tonight's idea
                  </span>
                </div>
                <div className="sk-serif" style={{ fontSize: 26, marginTop: 8, lineHeight: 1.1 }}>
                  Spinach & yogurt <span style={{ fontStyle: 'italic' }}>pasta</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(246,244,238,0.6)', marginTop: 6 }}>
                  25 min · uses 3 things expiring this week
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
                  {['Penne', 'Spinach', 'Yogurt', 'Garlic', 'Parmesan'].map(t => (
                    <span key={t} style={{
                      fontSize: 11, padding: '5px 10px', borderRadius: 999,
                      background: 'rgba(246,244,238,0.1)', color: '#F6F4EE',
                    }}>{t}</span>
                  ))}
                </div>
              </div>

              <Insight tone="sage" badge="Already have it"
                title="You still have 500 g of pasta."
                sub="Skip buying more this week." />
              <div style={{ height: 8 }} />
              <Insight tone="sky" badge="Pattern"
                title="You usually buy 4 apples but eat 2."
                sub="Try 2 next time to reduce waste." />
            </div>
          </div>

          {/* Recently scanned */}
          <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div className="sk-eyebrow">Recent activity</div>
                <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>Last receipts</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { store: 'Grocery Markt', date: '17 May', items: 8, total: '€25.12' },
                { store: 'Local market', date: '15 May', items: 4, total: '€11.40' },
                { store: 'Bio Hofladen', date: '12 May', items: 6, total: '€18.90' },
              ].map((r, i) => (
                <div key={i} className="sk-card-flat" style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  padding: 16, borderRadius: 14,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: 'var(--bg-warm)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mute)',
                    }}>
                      <SK.Icon d={SK.icons.basket} size={18} sw={1.6} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{r.store}</div>
                      <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 1 }}>{r.date} · {r.items} items</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                      {r.total}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, sub, tone }) {
  const toneInk = tone === 'amber' ? 'var(--amber)' : tone === 'sage' ? 'var(--sage-deep)' : 'var(--ink)';
  return (
    <div className="sk-card-flat" style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      padding: 16, borderRadius: 14,
    }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: 0.06 }}>
        {label}
      </div>
      <div style={{
        fontSize: 32, fontWeight: 600, color: toneInk, marginTop: 8, letterSpacing: -0.02,
        fontFamily: 'var(--font-serif)', lineHeight: 1, fontStyle: tone ? 'italic' : 'normal',
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 6 }}>{sub}</div>
    </div>
  );
}

Object.assign(window, { DesktopDashboard });
