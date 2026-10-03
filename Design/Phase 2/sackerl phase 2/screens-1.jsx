// sackerl — mobile screens part 1
// Onboarding · Dashboard · Scan · Review · Drag-and-drop placement

// ─────────────────────────────────────────────────────────────
// Onboarding
// ─────────────────────────────────────────────────────────────
function ScreenOnboarding() {
  return (
    <div className="sk-screen sk-app" data-screen-label="01 Onboarding">
      <div className="sk-scroll sk-safe-top" style={{ paddingTop: 72 }}>
        <div style={{ padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SK.Logo size={20} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--mute)', letterSpacing: 0.06 }}>EN · DE · FR</span>
        </div>

        <div style={{ padding: '64px 28px 0' }}>
          <div className="sk-eyebrow" style={{ marginBottom: 18 }}>A friendly pantry assistant</div>
          <div className="sk-serif" style={{ fontSize: 52, lineHeight: 0.98, letterSpacing: -0.02 }}>
            Know what's<br/>at home.<br/>
            <span style={{ fontStyle: 'italic', color: 'var(--sage-deep)' }}>Waste less.</span>
          </div>
          <div style={{ marginTop: 22, color: 'var(--ink-soft)', fontSize: 16, lineHeight: 1.45, maxWidth: 310 }}>
            Scan a receipt, drop your groceries into your real kitchen, and get a quiet nudge before food expires.
          </div>
        </div>

        {/* small visual block — stylized "rooms" preview */}
        <div style={{ padding: '40px 28px 0' }}>
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 22,
            padding: 20, position: 'relative', overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <SK.Zone kind="fridge" size={62} />
              <SK.Zone kind="pantry" size={62} />
              <SK.Zone kind="basement" size={62} />
              <SK.Zone kind="freezer" size={62} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--mute)', fontFamily: 'var(--font-mono)', letterSpacing: 0.04, textTransform: 'uppercase' }}>
              Fridge · Pantry · Basement · Freezer
            </div>
            <div style={{
              position: 'absolute', right: -30, top: -30,
              width: 140, height: 140, borderRadius: '50%',
              background: 'var(--sage-soft)', opacity: 0.6,
            }} />
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 24px 38px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="sk-btn sk-btn-primary" style={{ width: '100%' }}>
          Get started
          <SK.Icon d={SK.icons.arrowRight} size={18} sw={1.8} />
        </button>
        <button style={{ background: 'transparent', border: 'none', fontSize: 14, color: 'var(--mute)', padding: '10px' }}>
          I already have an account
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Home Dashboard
// ─────────────────────────────────────────────────────────────
function ScreenDashboard() {
  const expiring = [
    { name: 'Greek yogurt', cat: 'dairy', days: 1, loc: 'Fridge' },
    { name: 'Spinach', cat: 'produce', days: 2, loc: 'Fridge' },
    { name: 'Chicken thighs', cat: 'meat', days: 2, loc: 'Fridge' },
  ];
  const zones = [
    { id: 'fridge', label: 'Fridge', kind: 'fridge', count: 23, expSoon: 3 },
    { id: 'pantry', label: 'Pantry', kind: 'pantry', count: 41, expSoon: 0 },
    { id: 'basement', label: 'Basement', kind: 'basement', count: 12, expSoon: 0 },
    { id: 'freezer', label: 'Freezer', kind: 'freezer', count: 9, expSoon: 0 },
  ];
  return (
    <div className="sk-screen sk-app" data-screen-label="02 Home Dashboard">
      <div className="sk-scroll sk-safe-top" style={{ paddingTop: 60 }}>
        {/* greeting */}
        <div style={{ padding: '6px 22px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="sk-eyebrow">Tuesday, 17 May</div>
            <div className="sk-serif" style={{ fontSize: 30, marginTop: 4, letterSpacing: -0.02 }}>
              Hello, <span style={{ fontStyle: 'italic' }}>Lena</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <SK.RoundBtn icon={SK.icons.search} />
            <div style={{ position: 'relative' }}>
              <SK.RoundBtn icon={SK.icons.bell} />
              <span style={{
                position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%',
                background: 'var(--amber)', border: '2px solid var(--bg)',
              }} />
            </div>
          </div>
        </div>

        {/* Your sackerl — animated paper-bag hero */}
        <div style={{ padding: '0 18px 22px' }}>
          <div className="sk-kraft" style={{
            position: 'relative', borderRadius: 22,
            border: '1px solid rgba(74,53,32,0.18)',
            padding: '14px 18px 0', overflow: 'hidden',
            display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: 8,
            minHeight: 178,
          }}>
            {/* corner stamp */}
            <div style={{
              position: 'absolute', top: 12, right: 14,
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 0.18,
              color: 'var(--kraft-deep)', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 18, height: 1, background: 'var(--kraft-deep)' }} />
              dein sackerl
            </div>
            <div style={{ paddingTop: 30 }}>
              <div style={{
                fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 28,
                letterSpacing: -0.9, lineHeight: 1, color: 'var(--kraft-ink)',
              }}>
                85 things<br/>at home
              </div>
              <div style={{
                marginTop: 10, fontSize: 12.5, color: 'var(--kraft-ink)',
                opacity: 0.78, lineHeight: 1.45, maxWidth: 180,
              }}>
                Enough for <span style={{ fontWeight: 600 }}>5 dinners</span>. Skip the shop on Wednesday.
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 6, marginBottom: 14 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.18,
                  padding: '4px 8px', textTransform: 'uppercase',
                  background: 'rgba(255,255,255,0.55)', color: 'var(--kraft-ink)',
                  borderRadius: 2, border: '0.5px solid rgba(74,53,32,0.25)',
                }}>fresh · 18</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.18,
                  padding: '4px 8px', textTransform: 'uppercase',
                  background: 'rgba(255,255,255,0.55)', color: 'var(--kraft-ink)',
                  borderRadius: 2, border: '0.5px solid rgba(74,53,32,0.25)',
                }}>pantry · 41</span>
              </div>
            </div>
            <div style={{ width: 160, height: 178, alignSelf: 'end' }}>
              <SK.PaperBag width={160} height={178} />
            </div>
          </div>
        </div>

        {/* Expiring soon hero */}
        <div style={{ padding: '0 18px' }}>
          <div className="sk-card-flat" style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAF7 100%)',
            border: '1px solid var(--border)',
            padding: '18px 18px 8px', borderRadius: 22,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="sk-dot" style={{ background: 'var(--amber)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>3 items expiring soon</span>
              </div>
              <button style={{ background: 'transparent', border: 'none', fontSize: 12, color: 'var(--mute)', padding: 4 }}>
                See all <SK.Icon d={SK.icons.chevronRight} size={12} sw={2} style={{ verticalAlign: 'middle' }} />
              </button>
            </div>
            {expiring.map((it, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                borderTop: i ? '1px solid var(--hairline)' : 'none',
              }}>
                <SK.Tile cat={it.cat} size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{it.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 1 }}>in {it.loc}</div>
                </div>
                <span className="sk-chip sk-chip-amber">
                  {it.days === 1 ? 'tomorrow' : `${it.days} days`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Storage grid */}
        <div style={{ padding: '28px 22px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="sk-eyebrow">Storage</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--mute)' }}>85 items</span>
        </div>
        <div style={{ padding: '0 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {zones.map(z => (
            <div key={z.id} className="sk-card-flat" style={{
              border: '1px solid var(--border)', padding: 16, borderRadius: 18,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <SK.Zone kind={z.kind} size={42} />
                {z.expSoon > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 500 }}>
                    {z.expSoon} soon
                  </span>
                )}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{z.label}</div>
              <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>{z.count} items</div>
            </div>
          ))}
        </div>

        {/* Suggestion preview */}
        <div style={{ padding: '24px 18px 100px' }}>
          <div style={{
            background: 'var(--sage-soft)', borderRadius: 22, padding: 18,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <SK.Icon d={SK.icons.sparkle} size={14} stroke="var(--sage-deep)" sw={1.7} />
              <span className="sk-eyebrow" style={{ color: 'var(--sage-deep)' }}>From your stock</span>
            </div>
            <div className="sk-serif" style={{ fontSize: 24, color: 'var(--sage-deep)', lineHeight: 1.15, maxWidth: 260 }}>
              You have what you need for <span style={{ fontStyle: 'italic' }}>spinach pasta</span> tonight.
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="sk-chip" style={{ background: '#fff', color: 'var(--sage-deep)' }}>Pasta</span>
              <span className="sk-chip" style={{ background: '#fff', color: 'var(--sage-deep)' }}>Spinach</span>
              <span className="sk-chip" style={{ background: '#fff', color: 'var(--sage-deep)' }}>Garlic</span>
              <span className="sk-chip" style={{ background: '#fff', color: 'var(--sage-deep)' }}>Parmesan</span>
            </div>
            <button style={{
              marginTop: 18, background: 'var(--ink)', color: '#fff', border: 'none',
              padding: '10px 18px', borderRadius: 999, fontSize: 14, fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              See recipe <SK.Icon d={SK.icons.arrowRight} size={14} sw={2} />
            </button>
          </div>
        </div>
      </div>
      <SK.TabBar active="home" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Receipt Scan
// ─────────────────────────────────────────────────────────────
function ScreenScan() {
  return (
    <div className="sk-screen sk-app" data-screen-label="03 Receipt Scan"
      style={{ background: '#15171A' }}>
      {/* dark scan viewport */}
      <div className="sk-safe-top" style={{ paddingTop: 60, padding: '60px 20px 0', color: '#fff', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button style={{
            width: 36, height: 36, borderRadius: 18,
            background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            backdropFilter: 'blur(20px)',
          }}>
            <SK.Icon d={SK.icons.close} size={18} sw={1.8} />
          </button>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>Scan receipt</div>
          <button style={{
            background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
            height: 36, padding: '0 14px', borderRadius: 18, fontSize: 13, fontWeight: 500,
          }}>
            Tips
          </button>
        </div>
      </div>

      {/* "camera viewport" — dim photo placeholder with corner brackets */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* faux receipt seen through viewport */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center top, #2A2D32 0%, #15171A 70%)',
        }} />
        <div style={{
          position: 'absolute', left: '50%', top: '52%', transform: 'translate(-50%, -50%) rotate(-3deg)',
          width: 220, height: 360,
          background: 'linear-gradient(180deg, #F2EFE8 0%, #E8E4DA 100%)',
          borderRadius: 4, boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 60px rgba(255,255,255,0.04)',
          padding: 16, fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3a3a36', letterSpacing: 0.04,
          lineHeight: 1.5,
        }}>
          <div style={{ textAlign: 'center', fontWeight: 600, fontSize: 11, marginBottom: 6 }}>GROCERY MARKT</div>
          <div style={{ textAlign: 'center', fontSize: 8, color: '#666', marginBottom: 10 }}>17.05.2026 · 18:42 · #4172</div>
          <div style={{ borderTop: '1px dashed #999', borderBottom: '1px dashed #999', padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              ['MILCH 1.5%', '1.49'],
              ['JOGHURT GR.', '2.29'],
              ['SPINAT TK', '3.79'],
              ['NUDELN PENNE', '1.19'],
              ['KNOBLAUCH', '0.89'],
              ['PARMESAN 100G', '4.49'],
              ['HUHN BIO 500G', '7.99'],
              ['BROT', '2.99'],
            ].map(([n, p]) => (
              <div key={n} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{n}</span><span>{p}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontWeight: 600 }}>
            <span>SUMME</span><span>25.12 €</span>
          </div>
        </div>

        {/* corner brackets */}
        {[
          ['top: 18%; left: 18%', '0 0 6px 0', '4px 0 0 4px'],
          ['top: 18%; right: 18%', '0 0 0 6px', '0 4px 4px 0'],
          ['bottom: 22%; left: 18%', '0 6px 0 0', '4px 0 0 4px'],
          ['bottom: 22%; right: 18%', '6px 0 0 0', '0 4px 4px 0'],
        ].map(([pos, b, r], i) => {
          const style = {};
          pos.split(';').forEach(p => { const [k, v] = p.split(':').map(s => s.trim()); style[k] = v; });
          return (
            <div key={i} style={{
              position: 'absolute', ...style,
              width: 28, height: 28,
              border: '2.5px solid #fff',
              borderRadius: r,
              borderTopColor: b.split(' ')[0] === '0' ? 'transparent' : '#fff',
              borderRightColor: b.split(' ')[1] === '0' ? 'transparent' : '#fff',
              borderBottomColor: b.split(' ')[2] === '0' ? 'transparent' : '#fff',
              borderLeftColor: b.split(' ')[3] === '0' ? 'transparent' : '#fff',
            }} />
          );
        })}

        {/* hint text */}
        <div style={{
          position: 'absolute', bottom: 28, left: 0, right: 0, textAlign: 'center',
          color: 'rgba(255,255,255,0.7)', fontSize: 13,
        }}>
          Align receipt inside frame · hold steady
        </div>
      </div>

      {/* shutter + actions */}
      <div style={{
        padding: '22px 24px 38px',
        background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 60%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.85)',
            fontSize: 11, padding: 4,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SK.Icon d={SK.icons.pdf} size={18} stroke="#fff" sw={1.7} />
            </div>
            PDF
          </button>

          <button style={{
            width: 78, height: 78, borderRadius: '50%',
            border: '4px solid #fff', background: 'transparent', padding: 4,
          }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#fff' }} />
          </button>

          <button style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.85)',
            fontSize: 11, padding: 4,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SK.Icon d={SK.icons.upload} size={18} stroke="#fff" sw={1.7} />
            </div>
            Upload
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button style={{
            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)',
            fontSize: 13, padding: 6, textDecoration: 'underline', textUnderlineOffset: 3,
          }}>
            Add manually instead
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Receipt Review
// ─────────────────────────────────────────────────────────────
function ScreenReview() {
  const items = [
    { name: 'Milk 1.5%', raw: 'MILCH 1.5%', qty: '1 L', cat: 'dairy', conf: 'high' },
    { name: 'Greek yogurt', raw: 'JOGHURT GR.', qty: '500 g', cat: 'dairy', conf: 'high' },
    { name: 'Frozen spinach', raw: 'SPINAT TK', qty: '450 g', cat: 'frozen', conf: 'high' },
    { name: 'Penne pasta', raw: 'NUDELN PENNE', qty: '500 g', cat: 'pantry', conf: 'high' },
    { name: 'Garlic', raw: 'KNOBLAUCH', qty: '1 bulb', cat: 'produce', conf: 'med' },
    { name: 'Parmesan', raw: 'PARMESAN 100G', qty: '100 g', cat: 'dairy', conf: 'high' },
    { name: 'Chicken thighs', raw: 'HUHN BIO 500G', qty: '500 g', cat: 'meat', conf: 'high' },
    { name: 'Bread', raw: 'BROT', qty: '1 loaf', cat: 'bakery', conf: 'low' },
  ];
  return (
    <div className="sk-screen sk-app" data-screen-label="04 Receipt Review">
      <div className="sk-safe-top" style={{ paddingTop: 60 }}>
        <div style={{ padding: '6px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SK.RoundBtn icon={SK.icons.chevronLeft} />
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--mute)' }}>Step 2 of 3</div>
          <SK.RoundBtn icon={SK.icons.dots} />
        </div>
        <div style={{ padding: '14px 22px 4px' }}>
          <div className="sk-h1" style={{ fontSize: 28 }}>
            Review <span className="sk-serif" style={{ fontStyle: 'italic', fontWeight: 400 }}>8 items</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--mute)', marginTop: 6 }}>
            From Grocery Markt · 17.05.2026 · €25.12
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '14px 20px 8px', overflowX: 'auto' }}>
          <span className="sk-chip sk-chip-sage" style={{ height: 30 }}>
            <SK.Icon d={SK.icons.check} size={12} sw={2.2} stroke="var(--sage-deep)" /> 7 confident
          </span>
          <span className="sk-chip sk-chip-amber" style={{ height: 30 }}>
            1 needs review
          </span>
        </div>
      </div>

      <div className="sk-scroll" style={{ padding: '6px 14px 110px' }}>
        <div className="sk-card-flat" style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden',
        }}>
          {items.map((it, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              borderBottom: i < items.length - 1 ? '1px solid var(--hairline)' : 'none',
              background: it.conf === 'low' ? 'rgba(185, 113, 56, 0.04)' : 'transparent',
            }}>
              <SK.Tile cat={it.cat} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{it.name}</span>
                  {it.conf === 'low' && (
                    <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--amber)' }}>· check</span>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--mute-soft)', marginTop: 2, letterSpacing: 0.02 }}>
                  {it.raw}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>{it.qty}</span>
                <button style={{
                  width: 28, height: 28, borderRadius: 14, background: 'var(--bg-warm)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, color: 'var(--mute)',
                }}>
                  <SK.Icon d={SK.icons.chevronRight} size={14} sw={2} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button style={{
          marginTop: 12, width: '100%',
          background: 'transparent', border: '1px dashed var(--border)', borderRadius: 16,
          padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          color: 'var(--mute)', fontSize: 14,
        }}>
          <SK.Icon d={SK.icons.plus} size={16} /> Add missing item
        </button>
      </div>

      <div style={{
        padding: '12px 18px 38px',
        background: 'linear-gradient(180deg, transparent, var(--bg) 40%)',
      }}>
        <button className="sk-btn sk-btn-primary" style={{ width: '100%' }}>
          Continue to placement
          <SK.Icon d={SK.icons.arrowRight} size={18} sw={1.8} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Drag-and-drop placement (hero interaction)
// ─────────────────────────────────────────────────────────────
function ScreenPlacement() {
  // dock items (still unplaced)
  const dockItems = [
    { name: 'Bread', cat: 'bakery' },
    { name: 'Garlic', cat: 'produce' },
    { name: 'Penne', cat: 'pantry' },
  ];

  return (
    <div className="sk-screen sk-app" data-screen-label="05 Drag & drop">
      <div className="sk-safe-top" style={{ paddingTop: 60 }}>
        <div style={{ padding: '6px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SK.RoundBtn icon={SK.icons.chevronLeft} />
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--mute)' }}>Step 3 of 3</div>
          <button style={{
            background: 'transparent', border: 'none', color: 'var(--mute)', fontSize: 13, padding: 6,
          }}>
            Auto-sort
          </button>
        </div>
        <div style={{ padding: '12px 22px 0' }}>
          <div className="sk-h1" style={{ fontSize: 26 }}>
            Where does it <span className="sk-serif" style={{ fontStyle: 'italic', fontWeight: 400 }}>go?</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--mute)', marginTop: 4 }}>
            Drag each item into its storage spot.
          </div>
        </div>
      </div>

      {/* dock (remaining items) */}
      <div style={{ padding: '18px 16px 8px' }}>
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
          padding: '12px 12px 12px', position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="sk-eyebrow">To place · 3</div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--mute-soft)' }}>5 / 8 done</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {dockItems.map((it, i) => (
              <div key={i} className="sk-grocery-chip">
                <SK.Tile cat={it.cat} size={26} />
                <span>{it.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* zones */}
      <div className="sk-scroll" style={{ padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <DropZone kind="fridge" name="Fridge" count={4} items={[
          { name: 'Milk', cat: 'dairy' }, { name: 'Yogurt', cat: 'dairy' },
          { name: 'Parmesan', cat: 'dairy' }, { name: 'Chicken', cat: 'meat' },
        ]} />
        {/* active drop zone with item floating over it */}
        <div style={{ position: 'relative' }}>
          <DropZone kind="freezer" name="Freezer" count={1} active items={[
            { name: 'Spinach', cat: 'frozen' },
          ]} ghost />
          {/* floating ghost chip mid-drag */}
          <div style={{
            position: 'absolute', left: 26, top: 28,
            transform: 'rotate(-3deg) scale(1.05)',
            boxShadow: '0 14px 32px rgba(26,29,26,0.18), 0 0 0 1.5px var(--sage)',
            background: 'var(--card)', borderRadius: 14,
            padding: '10px 14px 10px 10px',
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 14, fontWeight: 500,
            pointerEvents: 'none',
          }}>
            <SK.Tile cat="frozen" size={26} />
            <span>Spinach</span>
          </div>
        </div>
        <DropZone kind="pantry" name="Pantry" count={0} items={[]} />
        <DropZone kind="basement" name="Basement" count={0} items={[]} />
      </div>

      <div style={{ padding: '6px 18px 38px' }}>
        <button className="sk-btn sk-btn-primary" style={{ width: '100%' }}>
          Save & set reminders <SK.Icon d={SK.icons.arrowRight} size={18} sw={1.8} />
        </button>
      </div>
    </div>
  );
}

function DropZone({ kind, name, count, items = [], active, ghost }) {
  return (
    <div className="sk-zone" data-active={active ? 'true' : 'false'} style={{
      padding: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: items.length ? 10 : 0 }}>
        <SK.Zone kind={kind} size={42} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--mute)', fontFamily: 'var(--font-mono)', letterSpacing: 0.02 }}>
            {count === 0 ? 'drop items here' : `${count} placed`}
          </div>
        </div>
        {active && (
          <span className="sk-chip sk-chip-sage" style={{ height: 24, fontSize: 11 }}>
            release here
          </span>
        )}
      </div>
      {items.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {items.map((it, i) => (
            <div key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 10px 6px 6px',
              background: 'var(--bg)',
              border: '1px solid var(--border-soft)',
              borderRadius: 12,
              fontSize: 12, fontWeight: 500, color: 'var(--ink-soft)',
              opacity: ghost && i === items.length - 1 ? 0.4 : 1,
            }}>
              <SK.Tile cat={it.cat} size={20} />
              {it.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ScreenOnboarding, ScreenDashboard, ScreenScan, ScreenReview, ScreenPlacement });
