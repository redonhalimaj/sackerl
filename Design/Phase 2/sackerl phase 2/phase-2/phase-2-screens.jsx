// sackerl — Phase 2 mobile frames + state variants
// Each function returns the *final* mobile frame at 402×874 unless a state is named.
// All components use Phase 1 atoms from sk-atoms.jsx — no new colours, no new fonts.

const P2 = {};

// ─────────────────────────────────────────────────────────────
// shared chrome bits
// ─────────────────────────────────────────────────────────────
P2.StatusBar = () => (
  <div style={{
    height: 54, padding: '14px 22px 0',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
    color: 'var(--ink)', flexShrink: 0,
  }}>
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>9:41</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 18, height: 11, border: '1.4px solid var(--ink)', borderRadius: 2, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 1, top: 1, bottom: 1, width: 12, background: 'var(--ink)', borderRadius: 1 }} />
      </span>
    </div>
  </div>
);

P2.OfflineBanner = () => (
  <div style={{
    padding: '8px 20px', background: 'var(--ink)', color: 'var(--bg)',
    display: 'flex', alignItems: 'center', gap: 8,
    fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 0.12, textTransform: 'uppercase',
  }}>
    <span className="sk-dot" style={{ background: 'var(--amber)', width: 6, height: 6 }} />
    Offline · stock loaded from last sync
  </div>
);

P2.SkeletonRow = ({ h = 14, w = '60%' }) => (
  <div style={{
    height: h, width: w, background: 'var(--border-soft)', borderRadius: 4,
    animation: 'p2-shimmer 1.4s ease-in-out infinite',
  }} />
);

// ─────────────────────────────────────────────────────────────
// 1 · Welcome / Onboarding
// ─────────────────────────────────────────────────────────────
P2.Welcome = ({ lang = 'en' }) => {
  const t = lang === 'de' ? {
    eyebrow: 'Ein leiser Vorrats-Helfer',
    h1a: 'Wisse, was', h1b: 'zu Hause ist.', h1c: 'Verschwende weniger.',
    body: 'Scanne den Kassenzettel, lege Lebensmittel in deine Küche und bekomme einen leisen Hinweis, bevor etwas abläuft.',
    cta: 'Loslegen',
    alt: 'Ich habe schon ein Konto',
  } : {
    eyebrow: 'A friendly pantry assistant',
    h1a: "Know what's", h1b: 'at home.', h1c: 'Waste less.',
    body: 'Scan a receipt, drop your groceries into your real kitchen, and get a quiet nudge before food expires.',
    cta: 'Get started',
    alt: 'I already have an account',
  };
  return (
    <div className="sk-screen sk-app" data-screen-label="01 Welcome">
      <P2.StatusBar />
      <div className="sk-scroll" style={{ paddingTop: 8 }}>
        <div style={{ padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 24 }}>
          <SK.Logo size={20} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--mute)', letterSpacing: 0.06 }}>EN · DE · FR · IT</span>
        </div>
        <div style={{ padding: '56px 28px 0' }}>
          <div className="sk-eyebrow" style={{ marginBottom: 18 }}>{t.eyebrow}</div>
          <div className="sk-serif" style={{ fontSize: 52, lineHeight: 0.98, letterSpacing: -0.02, color: 'var(--ink)' }}>
            {t.h1a}<br />{t.h1b}<br />
            <span style={{ fontStyle: 'italic', color: 'var(--sage-deep)' }}>{t.h1c}</span>
          </div>
          <div style={{ marginTop: 22, color: 'var(--ink-soft)', fontSize: 16, lineHeight: 1.45, maxWidth: 310 }}>
            {t.body}
          </div>
        </div>
        <div style={{ padding: '36px 28px 0', display: 'flex', justifyContent: 'center' }}>
          <SK.PaperBag width={240} height={260} />
        </div>
      </div>
      <div style={{ padding: '16px 24px 38px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="sk-btn sk-btn-primary" style={{ width: '100%' }} aria-label={t.cta}>
          {t.cta}<SK.Icon d={SK.icons.arrowRight} size={18} sw={1.8} />
        </button>
        <button style={{ background: 'transparent', border: 'none', fontSize: 14, color: 'var(--mute)', padding: '10px' }}>
          {t.alt}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 2 · Household setup
//   Step 1 — name the household
//   Step 2 — storage zones (final = this one)
// ─────────────────────────────────────────────────────────────
P2.Household = ({ state = 'final', lang = 'en' }) => {
  const t = lang === 'de' ? {
    step: 'Schritt 2 von 3', back: 'Zurück',
    title: 'Wo lagerst du?', titleEm: 'Essen',
    subtitle: 'Wähle alles, wo du nach Zutaten schauen würdest. Du kannst das später ändern.',
    cont: 'Weiter', skip: 'Überspringen', addCustom: 'Eigener Ort',
    pick: 'Wähle mindestens einen.',
    zones: { fridge: 'Kühlschrank', pantry: 'Vorrat', basement: 'Keller', freezer: 'Gefrierfach', cabinet: 'Schrank' },
    hints: { fridge: 'z.B. Milch, Gemüse', pantry: 'z.B. Nudeln, Konserven', basement: 'Vorrat & Getränke', freezer: 'TK-Ware', cabinet: 'Trockenes', custom: 'Bad, Garage …' },
  } : {
    step: 'Step 2 of 3', back: 'Back',
    title: 'Where do you store', titleEm: 'food?',
    subtitle: "Tap every place you'd open looking for ingredients. You can change this later.",
    cont: 'Continue', skip: 'Skip', addCustom: 'Custom place',
    pick: 'Pick at least one.',
    zones: { fridge: 'Fridge', pantry: 'Pantry', basement: 'Basement', freezer: 'Freezer', cabinet: 'Cabinet' },
    hints: { fridge: 'cold drinks, dairy', pantry: 'pasta, cans', basement: 'bulk, drinks', freezer: 'long-term', cabinet: 'dry goods', custom: 'bath, garage …' },
  };
  const all = [
    { kind: 'fridge',   sel: true  },
    { kind: 'pantry',   sel: true  },
    { kind: 'basement', sel: true  },
    { kind: 'freezer',  sel: true  },
    { kind: 'cabinet',  sel: false },
  ];
  const noneSelected = state === 'empty';
  return (
    <div className="sk-screen sk-app" data-screen-label={`02 Household · ${state}`}>
      <P2.StatusBar />
      <div style={{ padding: '4px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44 }}>
        <SK.RoundBtn icon={SK.icons.chevronLeft} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 0.18, color: 'var(--mute)', textTransform: 'uppercase' }}>
          {t.step}
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div className="sk-scroll" style={{ padding: '6px 18px 0' }}>
        <div style={{ padding: '12px 4px 4px' }}>
          <div className="sk-h1" style={{ fontSize: 30, lineHeight: 1.06 }}>
            {t.title} <span className="sk-serif" style={{ fontStyle: 'italic', fontWeight: 400 }}>{t.titleEm}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.45, maxWidth: 320 }}>
            {t.subtitle}
          </div>
        </div>

        {/* progress dots */}
        <div style={{ display: 'flex', gap: 6, marginTop: 16, padding: '0 4px' }}>
          {[1,2,3].map(n => (
            <span key={n} style={{
              height: 3, flex: 1, borderRadius: 2,
              background: n <= 2 ? 'var(--ink)' : 'var(--border)',
            }} />
          ))}
        </div>

        <div style={{
          marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}>
          {all.map((z) => {
            const selected = noneSelected ? false : z.sel;
            return (
              <button key={z.kind} aria-pressed={selected ? 'true' : 'false'} aria-label={t.zones[z.kind]} style={{
                position: 'relative', background: 'var(--card)',
                border: selected ? '2px solid var(--ink)' : '1px solid var(--border)',
                borderRadius: 18, padding: '16px 14px 14px', textAlign: 'left',
                color: 'var(--ink)', height: 132,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <SK.Zone kind={z.kind} size={48} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{t.zones[z.kind]}</div>
                  <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>{t.hints[z.kind]}</div>
                </div>
                {selected && (
                  <span aria-hidden style={{
                    position: 'absolute', top: 10, right: 10,
                    width: 22, height: 22, borderRadius: 11,
                    background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 0 1.5px var(--ink)',
                  }}>
                    <SK.Icon d={SK.icons.check} size={12} sw={2.2} stroke="var(--ink)" />
                  </span>
                )}
              </button>
            );
          })}
          <button style={{
            background: 'var(--bg-warm)', border: '1px dashed var(--border)',
            borderRadius: 18, padding: '16px 14px 14px', textAlign: 'left',
            color: 'var(--ink-soft)', height: 132,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }} aria-label={t.addCustom}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, background: 'var(--card)',
              border: '1px dashed var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SK.Icon d={SK.icons.plus} size={18} stroke="var(--mute)" sw={1.7} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{t.addCustom}</div>
              <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>{t.hints.custom}</div>
            </div>
          </button>
        </div>

        {noneSelected && (
          <div role="alert" style={{
            marginTop: 14, fontSize: 13, color: 'var(--amber-deep)', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span className="sk-dot" style={{ background: 'var(--amber-deep)', width: 6, height: 6 }} />
            {t.pick}
          </div>
        )}
      </div>

      <div style={{ padding: '12px 18px 30px', background: 'linear-gradient(180deg, transparent, var(--bg) 30%)' }}>
        <button className="sk-btn sk-btn-primary" style={{ width: '100%', opacity: noneSelected ? 0.45 : 1 }} disabled={noneSelected}>
          {t.cont} <SK.Icon d={SK.icons.arrowRight} size={18} sw={1.8} />
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 3 · Home Dashboard
// ─────────────────────────────────────────────────────────────
P2.Dashboard = ({ state = 'final', lang = 'en' }) => {
  const t = lang === 'de' ? {
    eyebrow: 'DIENSTAG, 17. MAI', hello: 'Hallo,',
    bagStamp: 'dein sackerl', bagTitle: '85 Dinge', bagSub: 'zu Hause',
    bagBody: ['Genug für ', '5 Abende', '. Spar dir Mittwoch.'],
    fresh: 'frisch', pantry: 'vorrat',
    expHead: '3 laufen bald ab', see: 'Alle',
    storage: 'LAGER', items: 'Dinge',
    fromStock: 'AUS DEINEM VORRAT',
    sugTitle: ['Du hast alles für ', 'Spinat-Pasta', ' heute Abend.'],
    sugCta: 'Rezept zeigen',
    emptyTitle: 'Dein Sackerl ist leer.', emptySub: 'Scanne deinen ersten Kassenzettel.', emptyCta: 'Kassenzettel scannen',
    noExp: 'Diese Woche läuft nichts ab — sehr gut.',
  } : {
    eyebrow: 'TUESDAY, 17 MAY', hello: 'Hello,',
    bagStamp: 'dein sackerl', bagTitle: '85 things', bagSub: 'at home',
    bagBody: ['Enough for ', '5 dinners', '. Skip the shop on Wednesday.'],
    fresh: 'fresh', pantry: 'pantry',
    expHead: '3 items expiring soon', see: 'See all',
    storage: 'STORAGE', items: 'items',
    fromStock: 'FROM YOUR STOCK',
    sugTitle: ['You have what you need for ', 'spinach pasta', ' tonight.'],
    sugCta: 'Show recipe',
    emptyTitle: 'Your sackerl is empty.', emptySub: 'Scan your first receipt.', emptyCta: 'Scan receipt',
    noExp: 'Nothing expiring this week — well done.',
  };
  const expiring = [
    { name: lang === 'de' ? 'Griechischer Joghurt' : 'Greek yogurt', cat: 'dairy', days: 1, loc: lang === 'de' ? 'Kühlschrank' : 'Fridge' },
    { name: lang === 'de' ? 'Spinat' : 'Spinach', cat: 'produce', days: 2, loc: lang === 'de' ? 'Kühlschrank' : 'Fridge' },
    { name: lang === 'de' ? 'Hühnerschenkel' : 'Chicken thighs', cat: 'meat', days: 2, loc: lang === 'de' ? 'Kühlschrank' : 'Fridge' },
  ];
  const zones = [
    { id: 'fridge', label: lang === 'de' ? 'Kühlschrank' : 'Fridge', kind: 'fridge', count: 23, expSoon: 3 },
    { id: 'pantry', label: lang === 'de' ? 'Vorrat' : 'Pantry', kind: 'pantry', count: 41, expSoon: 0 },
    { id: 'basement', label: lang === 'de' ? 'Keller' : 'Basement', kind: 'basement', count: 12, expSoon: 0 },
    { id: 'freezer', label: lang === 'de' ? 'Gefrierfach' : 'Freezer', kind: 'freezer', count: 9, expSoon: 0 },
  ];

  return (
    <div className="sk-screen sk-app" data-screen-label={`03 Dashboard · ${state}`}>
      <P2.StatusBar />
      {state === 'offline' && <P2.OfflineBanner />}

      <div className="sk-scroll" style={{ paddingTop: 4 }}>
        <div style={{ padding: '6px 22px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="sk-eyebrow">{t.eyebrow}</div>
            <div className="sk-serif" style={{ fontSize: 30, marginTop: 4, letterSpacing: -0.02 }}>
              {t.hello} <span style={{ fontStyle: 'italic' }}>Lena</span>
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

        {/* hero */}
        <div style={{ padding: '0 18px 18px' }}>
          <div className="sk-kraft" style={{
            position: 'relative', borderRadius: 22,
            border: '1px solid rgba(74,53,32,0.18)',
            padding: '14px 18px 0', overflow: 'hidden',
            display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: 8,
            minHeight: 178,
          }}>
            <div style={{
              position: 'absolute', top: 12, right: 14,
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 0.18,
              color: 'var(--kraft-deep)', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 18, height: 1, background: 'var(--kraft-deep)' }} />
              {t.bagStamp}
            </div>
            <div style={{ paddingTop: 30 }}>
              {state === 'loading' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 16 }}>
                  <P2.SkeletonRow h={28} w="70%" />
                  <P2.SkeletonRow h={28} w="55%" />
                  <P2.SkeletonRow h={12} w="80%" />
                </div>
              ) : state === 'empty' ? (
                <div style={{ paddingBottom: 16 }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 22, letterSpacing: -0.6, lineHeight: 1.1, color: 'var(--kraft-ink)' }}>
                    {t.emptyTitle}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, color: 'var(--kraft-ink)', opacity: 0.78 }}>
                    {t.emptySub}
                  </div>
                  <button style={{
                    marginTop: 12, background: 'var(--amber)', color: 'var(--ink)',
                    border: 'none', height: 38, padding: '0 16px', borderRadius: 999,
                    fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 0 0 1.5px var(--ink)',
                  }}>
                    {t.emptyCta} <SK.Icon d={SK.icons.scan} size={14} sw={1.8} />
                  </button>
                </div>
              ) : (
                <>
                  <div style={{
                    fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 28,
                    letterSpacing: -0.9, lineHeight: 1, color: 'var(--kraft-ink)',
                  }}>
                    {t.bagTitle}<br />{t.bagSub}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--kraft-ink)', opacity: 0.78, lineHeight: 1.45, maxWidth: 180 }}>
                    {t.bagBody[0]}<span style={{ fontWeight: 600 }}>{t.bagBody[1]}</span>{t.bagBody[2]}
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', gap: 6, marginBottom: 14 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.18,
                      padding: '4px 8px', textTransform: 'uppercase',
                      background: 'rgba(255,255,255,0.55)', color: 'var(--kraft-ink)',
                      borderRadius: 2, border: '0.5px solid rgba(74,53,32,0.25)',
                    }}>{t.fresh} · 18</span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.18,
                      padding: '4px 8px', textTransform: 'uppercase',
                      background: 'rgba(255,255,255,0.55)', color: 'var(--kraft-ink)',
                      borderRadius: 2, border: '0.5px solid rgba(74,53,32,0.25)',
                    }}>{t.pantry} · 41</span>
                  </div>
                </>
              )}
            </div>
            <div style={{ width: 160, height: 178, alignSelf: 'end' }}>
              <SK.PaperBag width={160} height={178} animated={state !== 'loading'} />
            </div>
          </div>
        </div>

        {/* expiring */}
        {state !== 'empty' && (
          <div style={{ padding: '0 18px' }}>
            {state === 'no-expiring' ? (
              <div style={{
                background: 'var(--sage-soft)', borderRadius: 22, padding: '18px 18px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, background: 'var(--card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <SK.Icon d={SK.icons.leaf} size={20} stroke="var(--sage-deep)" sw={1.5} />
                </div>
                <div style={{ flex: 1, fontSize: 14, color: 'var(--sage-deep)', lineHeight: 1.4 }}>
                  {t.noExp}
                </div>
              </div>
            ) : (
              <div className="sk-card-flat" style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAF7 100%)',
                border: '1px solid var(--border)', padding: '18px 18px 8px', borderRadius: 22,
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="sk-dot" style={{ background: 'var(--amber)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{t.expHead}</span>
                  </div>
                  <button style={{ background: 'transparent', border: 'none', fontSize: 12, color: 'var(--mute)', padding: 4 }}>
                    {t.see} <SK.Icon d={SK.icons.chevronRight} size={12} sw={2} style={{ verticalAlign: 'middle' }} />
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
                      <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 1 }}>{lang === 'de' ? 'im ' : 'in '}{it.loc}</div>
                    </div>
                    <span className="sk-chip sk-chip-amber">
                      {it.days === 1 ? (lang === 'de' ? 'morgen' : 'tomorrow') : `${it.days} ${lang === 'de' ? 'Tage' : 'days'}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* storage */}
        <div style={{ padding: '28px 22px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="sk-eyebrow">{t.storage}</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--mute)' }}>{state === 'empty' ? '0' : '85'} {t.items}</span>
        </div>
        <div style={{ padding: '0 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {zones.map(z => (
            <div key={z.id} className="sk-card-flat" style={{
              border: '1px solid var(--border)', padding: 16, borderRadius: 18,
              opacity: state === 'empty' ? 0.5 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <SK.Zone kind={z.kind} size={42} />
                {z.expSoon > 0 && state !== 'empty' && (
                  <span style={{ fontSize: 11, color: 'var(--amber-deep)', fontWeight: 500 }}>
                    {z.expSoon} {lang === 'de' ? 'bald' : 'soon'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{z.label}</div>
              <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>
                {state === 'empty' ? (lang === 'de' ? 'leer' : 'empty') : `${z.count} ${t.items}`}
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 110 }} />
      </div>
      <SK.TabBar active="home" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 4 · Scan entry — sheet with 3 import paths
// ─────────────────────────────────────────────────────────────
P2.ScanEntry = ({ state = 'final', lang = 'en' }) => {
  const t = lang === 'de' ? {
    title: 'Vorrat aktualisieren',
    sub: 'Wähle, wie du deinen Einkauf hinzufügen möchtest.',
    cam: 'Foto vom Zettel', camHint: 'Kamera ausrichten und auslösen',
    pdf: 'Digitaler Zettel', pdfHint: 'PDF, Screenshot oder E-Mail-Anhang',
    manual: 'Manuell hinzufügen', manualHint: 'Ohne Zettel — direkt eingeben',
    perm: 'Kamerazugriff erforderlich',
    permBody: 'Sackerl braucht die Kamera, um Kassenzettel zu lesen. Du bestimmst, was gespeichert wird.',
    permCta: 'Einstellungen öffnen',
    permAlt: 'Stattdessen Foto hochladen',
    errTitle: 'Hochladen unterbrochen.',
    errBody: 'Wir konnten den Zettel nicht senden. Internet prüfen und erneut versuchen.',
    errCta: 'Erneut versuchen', errAlt: 'Trotzdem speichern (offline)',
  } : {
    title: 'Update your stock',
    sub: 'Pick how you want to add your shopping.',
    cam: 'Photo of receipt', camHint: 'Aim camera, hold steady',
    pdf: 'Digital receipt', pdfHint: 'PDF, screenshot, email attachment',
    manual: 'Add by hand', manualHint: 'No receipt — type it in',
    perm: 'Camera access needed',
    permBody: "Sackerl needs the camera to read receipts. You decide what gets saved.",
    permCta: 'Open Settings',
    permAlt: 'Upload a photo instead',
    errTitle: "Upload didn't finish.",
    errBody: "We couldn't send your receipt. Check your connection and try again.",
    errCta: 'Try again', errAlt: 'Save offline for now',
  };

  return (
    <div className="sk-screen sk-app" data-screen-label={`04 Scan entry · ${state}`}>
      <P2.StatusBar />
      <div style={{ padding: '4px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44 }}>
        <SK.RoundBtn icon={SK.icons.close} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 0.18, color: 'var(--mute)', textTransform: 'uppercase' }}>
          {state === 'permission-denied' ? (lang === 'de' ? '· erlaubnis ·' : '· permission ·') : (lang === 'de' ? '· import ·' : '· import ·')}
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div className="sk-scroll" style={{ padding: '6px 22px 0' }}>
        {state === 'permission-denied' ? (
          <div style={{ paddingTop: 28 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18, background: 'var(--amber-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 0 0 1px rgba(181,138,12,0.18)',
            }}>
              <SK.Icon d={SK.icons.camera} size={26} stroke="#6E5108" sw={1.6} />
            </div>
            <div className="sk-h1" style={{ fontSize: 26, marginTop: 18, lineHeight: 1.1 }}>{t.perm}</div>
            <div style={{ marginTop: 10, fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.5, maxWidth: 320 }}>
              {t.permBody}
            </div>
          </div>
        ) : state === 'error' ? (
          <div style={{ paddingTop: 28 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18, background: 'var(--ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="sk-dot" style={{ background: 'var(--amber)', width: 12, height: 12 }} />
            </div>
            <div className="sk-h1" style={{ fontSize: 26, marginTop: 18, lineHeight: 1.1 }}>{t.errTitle}</div>
            <div style={{ marginTop: 10, fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.5, maxWidth: 320 }}>
              {t.errBody}
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: '14px 0 4px' }}>
              <div className="sk-h1" style={{ fontSize: 28, lineHeight: 1.1 }}>{t.title}</div>
              <div style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>{t.sub}</div>
            </div>
            <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: SK.icons.camera, t: t.cam, h: t.camHint, primary: true },
                { icon: SK.icons.pdf, t: t.pdf, h: t.pdfHint },
                { icon: SK.icons.plus, t: t.manual, h: t.manualHint },
              ].map((opt, i) => (
                <button key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 18, padding: '16px 14px', textAlign: 'left',
                  color: 'var(--ink)', boxShadow: opt.primary ? 'var(--shadow-sm)' : 'none',
                  minHeight: 72,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: opt.primary ? 'var(--amber-soft)' : 'var(--bg-warm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: opt.primary ? 'inset 0 0 0 1px rgba(181,138,12,0.18)' : 'none',
                  }}>
                    <SK.Icon d={opt.icon} size={20} stroke={opt.primary ? '#6E5108' : 'var(--ink)'} sw={1.7} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{opt.t}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 2 }}>{opt.h}</div>
                  </div>
                  <SK.Icon d={SK.icons.chevronRight} size={16} stroke="var(--mute)" sw={1.7} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '12px 18px 30px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {state === 'permission-denied' && (
          <>
            <button className="sk-btn sk-btn-primary" style={{ width: '100%' }}>{t.permCta}</button>
            <button className="sk-btn sk-btn-ghost" style={{ width: '100%' }}>{t.permAlt}</button>
          </>
        )}
        {state === 'error' && (
          <>
            <button className="sk-btn sk-btn-primary" style={{ width: '100%' }}>{t.errCta}</button>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--mute)', fontSize: 13, padding: 10 }}>{t.errAlt}</button>
          </>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 5 · Review & correction
// ─────────────────────────────────────────────────────────────
P2.Review = ({ state = 'final', lang = 'en' }) => {
  const t = lang === 'de' ? {
    step: 'Schritt 2 von 3',
    title: 'Prüfe', titleEm: '8 Posten',
    sub: 'Von Grocery Markt · 17.05.2026 · €25,12',
    confident: 'sicher', check: 'prüfen',
    cont: 'Weiter zur Einlagerung', addMissing: 'Posten hinzufügen',
    skelTitle: 'Zettel wird gelesen …',
    skelBody: 'Wir gleichen Produkte ab. Das dauert ein paar Sekunden.',
    failTitle: 'Konnten den Zettel nicht lesen.',
    failBody: 'Vielleicht zu unscharf, oder ein ungewohntes Format. Du kannst die Posten per Hand eintragen.',
    failCta: 'Manuell hinzufügen', failAlt: 'Erneut scannen',
    raw: { milk: 'MILCH 1.5%', yog: 'JOGHURT GR.', spi: 'SPINAT TK', pen: 'NUDELN PENNE', gar: 'KNOBLAUCH', par: 'PARMESAN 100G', chi: 'HUHN BIO 500G', bre: 'BROT' },
    name: { milk: 'Milch 1.5%', yog: 'Griech. Joghurt', spi: 'TK-Spinat', pen: 'Penne', gar: 'Knoblauch', par: 'Parmesan', chi: 'Hühnerschenkel', bre: 'Brot' },
  } : {
    step: 'Step 2 of 3',
    title: 'Review', titleEm: '8 items',
    sub: 'From Grocery Markt · 17.05.2026 · €25.12',
    confident: 'confident', check: 'check',
    cont: 'Continue to placement', addMissing: 'Add missing item',
    skelTitle: 'Reading your receipt …',
    skelBody: 'We\'re matching products against our list. A few seconds.',
    failTitle: "We couldn't read this one.",
    failBody: "Might be a tricky angle or an unusual format. You can add items by hand.",
    failCta: 'Add manually', failAlt: 'Try scanning again',
    raw: { milk: 'MILCH 1.5%', yog: 'JOGHURT GR.', spi: 'SPINAT TK', pen: 'NUDELN PENNE', gar: 'KNOBLAUCH', par: 'PARMESAN 100G', chi: 'HUHN BIO 500G', bre: 'BROT' },
    name: { milk: 'Milk 1.5%', yog: 'Greek yogurt', spi: 'Frozen spinach', pen: 'Penne pasta', gar: 'Garlic', par: 'Parmesan', chi: 'Chicken thighs', bre: 'Bread' },
  };

  const items = [
    { key: 'milk', qty: '1 L', cat: 'dairy', conf: 'high' },
    { key: 'yog', qty: '500 g', cat: 'dairy', conf: 'high' },
    { key: 'spi', qty: '450 g', cat: 'frozen', conf: 'high' },
    { key: 'pen', qty: '500 g', cat: 'pantry', conf: 'high' },
    { key: 'gar', qty: '1 ' + (lang === 'de' ? 'Stk.' : 'pc'), cat: 'produce', conf: 'med' },
    { key: 'par', qty: '100 g', cat: 'dairy', conf: 'high' },
    { key: 'chi', qty: '500 g', cat: 'meat', conf: 'high' },
    { key: 'bre', qty: '1 ' + (lang === 'de' ? 'Laib' : 'loaf'), cat: 'bakery', conf: 'low' },
  ];

  return (
    <div className="sk-screen sk-app" data-screen-label={`05 Review · ${state}`}>
      <P2.StatusBar />
      <div style={{ padding: '4px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44 }}>
        <SK.RoundBtn icon={SK.icons.chevronLeft} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 0.18, color: 'var(--mute)', textTransform: 'uppercase' }}>
          {t.step}
        </div>
        <SK.RoundBtn icon={SK.icons.dots} />
      </div>

      {state === 'loading' ? (
        <div style={{ padding: '40px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="sk-h1" style={{ fontSize: 26 }}>{t.skelTitle}</div>
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--mute)', maxWidth: 280 }}>{t.skelBody}</div>
          <div className="sk-card-flat" style={{
            marginTop: 24, border: '1px solid var(--border)', borderRadius: 18, padding: 12,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--border-soft)', animation: 'p2-shimmer 1.4s ease-in-out infinite' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <P2.SkeletonRow h={12} w={`${60 + (i % 3) * 10}%`} />
                  <P2.SkeletonRow h={9} w="40%" />
                </div>
                <P2.SkeletonRow h={11} w="38px" />
              </div>
            ))}
          </div>
        </div>
      ) : state === 'fail' ? (
        <div style={{ padding: '60px 24px', flex: 1 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: 'var(--bg-warm)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SK.Icon d={SK.icons.scan} size={26} stroke="var(--ink-soft)" sw={1.6} />
          </div>
          <div className="sk-h1" style={{ fontSize: 26, marginTop: 18, lineHeight: 1.1 }}>{t.failTitle}</div>
          <div style={{ marginTop: 10, fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{t.failBody}</div>
          <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="sk-btn sk-btn-primary" style={{ width: '100%' }}>{t.failCta}</button>
            <button className="sk-btn sk-btn-ghost" style={{ width: '100%' }}>{t.failAlt}</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ padding: '14px 22px 4px' }}>
            <div className="sk-h1" style={{ fontSize: 28 }}>
              {t.title} <span className="sk-serif" style={{ fontStyle: 'italic', fontWeight: 400 }}>{t.titleEm}</span>
            </div>
            <div style={{ fontSize: 14, color: 'var(--mute)', marginTop: 6 }}>{t.sub}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, padding: '14px 20px 8px' }}>
            <span className="sk-chip sk-chip-sage" style={{ height: 30 }}>
              <SK.Icon d={SK.icons.check} size={12} sw={2.2} stroke="var(--sage-deep)" /> 7 {t.confident}
            </span>
            <span className="sk-chip sk-chip-amber" style={{ height: 30 }}>
              1 {t.check}
            </span>
          </div>
          <div className="sk-scroll" style={{ padding: '6px 14px 110px' }}>
            <div className="sk-card-flat" style={{ border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
              {items.map((it, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  borderBottom: i < items.length - 1 ? '1px solid var(--hairline)' : 'none',
                  background: it.conf === 'low' ? 'rgba(185, 113, 56, 0.04)' : 'transparent',
                }}>
                  <SK.Tile cat={it.cat} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 500 }}>{t.name[it.key]}</span>
                      {it.conf === 'low' && (
                        <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--amber-deep)' }}>· {t.check}</span>
                      )}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--mute-soft)', marginTop: 2 }}>
                      {t.raw[it.key]}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>{it.qty}</span>
                    <button aria-label={lang === 'de' ? 'Bearbeiten' : 'Edit'} style={{
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
              <SK.Icon d={SK.icons.plus} size={16} /> {t.addMissing}
            </button>
          </div>
          <div style={{ padding: '12px 18px 30px', background: 'linear-gradient(180deg, transparent, var(--bg) 40%)' }}>
            <button className="sk-btn sk-btn-primary" style={{ width: '100%' }}>
              {t.cont} <SK.Icon d={SK.icons.arrowRight} size={18} sw={1.8} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 6 · Placement — drag + tap alternative
// ─────────────────────────────────────────────────────────────
P2.Placement = ({ state = 'drag', lang = 'en' }) => {
  const t = lang === 'de' ? {
    step: 'Schritt 3 von 3', auto: 'Auto-Sortierung',
    title: 'Wohin', titleEm: 'damit?',
    sub: 'Tippe einen Posten an, dann den Lagerort.',
    subDrag: 'Ziehe jeden Posten an seinen Lagerort.',
    toPlace: 'EINZULAGERN', done: 'fertig',
    drop: 'hier ablegen', release: 'hier loslassen', placed: 'eingelagert',
    save: 'Speichern & Hinweise einrichten',
    zones: { fridge: 'Kühlschrank', pantry: 'Vorrat', basement: 'Keller', freezer: 'Gefrierfach' },
  } : {
    step: 'Step 3 of 3', auto: 'Auto-sort',
    title: 'Where does it', titleEm: 'go?',
    sub: 'Tap an item, then tap its storage spot.',
    subDrag: 'Drag each item into its storage spot.',
    toPlace: 'TO PLACE', done: 'done',
    drop: 'drop items here', release: 'release here', placed: 'placed',
    save: 'Save & set reminders',
    zones: { fridge: 'Fridge', pantry: 'Pantry', basement: 'Basement', freezer: 'Freezer' },
  };

  const isTap = state === 'tap';
  const dockItems = [
    { name: lang === 'de' ? 'Brot' : 'Bread', cat: 'bakery', selected: isTap },
    { name: lang === 'de' ? 'Knoblauch' : 'Garlic', cat: 'produce' },
    { name: lang === 'de' ? 'Penne' : 'Penne', cat: 'pantry' },
  ];

  return (
    <div className="sk-screen sk-app" data-screen-label={`06 Placement · ${state}`}>
      <P2.StatusBar />
      <div style={{ padding: '4px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44 }}>
        <SK.RoundBtn icon={SK.icons.chevronLeft} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 0.18, color: 'var(--mute)', textTransform: 'uppercase' }}>
          {t.step}
        </div>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--mute)', fontSize: 13, padding: 6 }}>
          {t.auto}
        </button>
      </div>
      <div style={{ padding: '12px 22px 0' }}>
        <div className="sk-h1" style={{ fontSize: 26 }}>
          {t.title} <span className="sk-serif" style={{ fontStyle: 'italic', fontWeight: 400 }}>{t.titleEm}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--mute)', marginTop: 4 }}>
          {isTap ? t.sub : t.subDrag}
        </div>
      </div>

      <div style={{ padding: '18px 16px 8px' }}>
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
          padding: '12px', position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="sk-eyebrow">{t.toPlace} · 3</div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--mute-soft)' }}>5 / 8 {t.done}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {dockItems.map((it, i) => (
              <div key={i} className="sk-grocery-chip" style={{
                outline: it.selected ? '2px solid var(--ink)' : 'none',
                boxShadow: it.selected ? '0 6px 20px rgba(27,36,24,0.18)' : 'var(--shadow-sm)',
                transform: it.selected ? 'translateY(-2px)' : 'none',
              }}>
                <SK.Tile cat={it.cat} size={26} />
                <span>{it.name}</span>
                {it.selected && (
                  <span aria-hidden style={{
                    marginLeft: 4, width: 18, height: 18, borderRadius: 9,
                    background: 'var(--ink)', color: 'var(--bg)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <SK.Icon d={SK.icons.check} size={11} sw={2.4} stroke="var(--bg)" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sk-scroll" style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Zone kind="fridge" name={t.zones.fridge} count={4} drop={t.drop} placed={t.placed}
          items={[{ name: lang==='de'?'Milch':'Milk', cat: 'dairy' }, { name: lang==='de'?'Joghurt':'Yogurt', cat: 'dairy' }, { name: 'Parmesan', cat: 'dairy' }, { name: lang==='de'?'Huhn':'Chicken', cat: 'meat' }]} />
        <div style={{ position: 'relative' }}>
          <Zone kind="freezer" name={t.zones.freezer} count={1} drop={t.drop} placed={t.placed} active release={t.release}
            items={[{ name: lang==='de'?'Spinat':'Spinach', cat: 'frozen' }]} ghost={!isTap} />
          {!isTap && (
            <div style={{
              position: 'absolute', left: 26, top: 28,
              transform: 'rotate(-3deg) scale(1.05)',
              boxShadow: '0 14px 32px rgba(26,29,26,0.18), 0 0 0 1.5px var(--sage)',
              background: 'var(--card)', borderRadius: 14,
              padding: '10px 14px 10px 10px',
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 14, fontWeight: 500, pointerEvents: 'none',
            }}>
              <SK.Tile cat="frozen" size={26} />
              <span>{lang==='de'?'Spinat':'Spinach'}</span>
            </div>
          )}
          {isTap && (
            <div style={{
              position: 'absolute', right: 16, top: 14,
              background: 'var(--ink)', color: 'var(--bg)',
              padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
              boxShadow: '0 6px 16px rgba(27,36,24,0.24)',
            }}>
              {lang==='de'?'Hier ablegen':'Place here'}
            </div>
          )}
        </div>
        <Zone kind="pantry" name={t.zones.pantry} count={0} drop={t.drop} placed={t.placed} items={[]} highlight={isTap} />
        <Zone kind="basement" name={t.zones.basement} count={0} drop={t.drop} placed={t.placed} items={[]} highlight={isTap} />
      </div>

      <div style={{ padding: '6px 18px 30px' }}>
        <button className="sk-btn sk-btn-primary" style={{ width: '100%' }}>
          {t.save} <SK.Icon d={SK.icons.arrowRight} size={18} sw={1.8} />
        </button>
      </div>
    </div>
  );
};

function Zone({ kind, name, count, items = [], active, ghost, drop, release, placed, highlight }) {
  return (
    <div className="sk-zone" data-active={active ? 'true' : 'false'} style={{
      padding: 12,
      borderColor: highlight ? 'var(--ink)' : undefined,
      borderStyle: highlight ? 'dashed' : undefined,
      borderWidth: highlight ? 2 : undefined,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: items.length ? 10 : 0 }}>
        <SK.Zone kind={kind} size={42} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--mute)', fontFamily: 'var(--font-mono)', letterSpacing: 0.02 }}>
            {count === 0 ? drop : `${count} ${placed}`}
          </div>
        </div>
        {active && (
          <span className="sk-chip sk-chip-sage" style={{ height: 24, fontSize: 11 }}>
            {release}
          </span>
        )}
      </div>
      {items.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {items.map((it, i) => (
            <div key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 10px 6px 6px', background: 'var(--bg)',
              border: '1px solid var(--border-soft)', borderRadius: 12,
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

// ─────────────────────────────────────────────────────────────
// 7 · Expiry confirmation
// ─────────────────────────────────────────────────────────────
P2.Expiry = ({ state = 'final', lang = 'en' }) => {
  const t = lang === 'de' ? {
    step: 'Letzter Schritt',
    title: 'Wann läuft', titleEm: 'es ab?',
    sub: 'Geschätzt aus Kategorie — du kannst sicher anpassen.',
    estimated: 'geschätzt', confirmed: 'bestätigt',
    today: 'Heute', tomorrow: 'Morgen',
    days: (n) => `in ${n} Tagen`, weeks: (n) => `in ${n} Wochen`,
    save: 'Hinweise speichern', skip: 'Ohne Hinweise speichern',
    confirmAll: 'Alle bestätigen',
    nudge: 'Nudge mich',
    nudge1: '3 Tage vorher', nudge2: 'Am Tag', nudge3: 'Nie',
  } : {
    step: 'Last step',
    title: 'When does it', titleEm: 'expire?',
    sub: "Estimated from category — you can tighten any.",
    estimated: 'estimated', confirmed: 'confirmed',
    today: 'Today', tomorrow: 'Tomorrow',
    days: (n) => `in ${n} days`, weeks: (n) => `in ${n} weeks`,
    save: 'Save reminders', skip: 'Save without reminders',
    confirmAll: 'Confirm all',
    nudge: 'Nudge me',
    nudge1: '3 days before', nudge2: 'On the day', nudge3: 'Never',
  };

  const items = [
    { key: lang==='de'?'Milch 1.5%':'Milk 1.5%',     cat: 'dairy',   d: 5,  unit: 'd', status: 'estimated' },
    { key: lang==='de'?'Griech. Joghurt':'Greek yogurt', cat: 'dairy', d: 1, unit: 'd', status: 'estimated', focus: state === 'focus' },
    { key: lang==='de'?'TK-Spinat':'Frozen spinach',  cat: 'frozen', d: 6, unit: 'm', status: 'confirmed' },
    { key: lang==='de'?'Penne':'Penne pasta',   cat: 'pantry',  d: 2,  unit: 'y', status: 'confirmed' },
    { key: lang==='de'?'Knoblauch':'Garlic',          cat: 'produce', d: 14, unit: 'd', status: 'estimated' },
    { key: 'Parmesan',                cat: 'dairy',   d: 60, unit: 'd', status: 'estimated' },
    { key: lang==='de'?'Hühnerschenkel':'Chicken thighs', cat: 'meat', d: 2, unit: 'd', status: 'estimated' },
    { key: lang==='de'?'Brot':'Bread', cat: 'bakery', d: 3, unit: 'd', status: 'estimated' },
  ];

  const unitText = (n, u) => {
    if (u === 'd') {
      if (n === 0) return t.today;
      if (n === 1) return t.tomorrow;
      if (n < 14) return t.days(n);
      return t.weeks(Math.round(n / 7));
    }
    if (u === 'm') return lang==='de' ? `in ${n} Mon.` : `in ${n} months`;
    if (u === 'y') return lang==='de' ? `in ${n} Jahren` : `in ${n} years`;
    return '';
  };

  return (
    <div className="sk-screen sk-app" data-screen-label={`07 Expiry · ${state}`}>
      <P2.StatusBar />
      <div style={{ padding: '4px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44 }}>
        <SK.RoundBtn icon={SK.icons.chevronLeft} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 0.18, color: 'var(--mute)', textTransform: 'uppercase' }}>
          {t.step}
        </div>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--sage-deep)', fontSize: 13, padding: 6, fontWeight: 500 }}>
          {t.confirmAll}
        </button>
      </div>
      <div style={{ padding: '12px 22px 4px' }}>
        <div className="sk-h1" style={{ fontSize: 26 }}>
          {t.title} <span className="sk-serif" style={{ fontStyle: 'italic', fontWeight: 400 }}>{t.titleEm}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--mute)', marginTop: 4 }}>{t.sub}</div>
      </div>

      <div className="sk-scroll" style={{ padding: '14px 16px 110px' }}>
        <div className="sk-card-flat" style={{ border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
          {items.map((it, i) => (
            <div key={i}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderBottom: i < items.length - 1 ? '1px solid var(--hairline)' : 'none',
                background: it.focus ? 'var(--amber-soft)' : 'transparent',
              }}>
                <SK.Tile cat={it.cat} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{it.key}</div>
                  <div style={{ fontSize: 11, color: it.status === 'confirmed' ? 'var(--sage-deep)' : 'var(--mute)', fontFamily: 'var(--font-mono)', letterSpacing: 0.04, textTransform: 'uppercase', marginTop: 2 }}>
                    {it.status === 'confirmed' ? t.confirmed : t.estimated}
                  </div>
                </div>
                <button aria-label={lang==='de'?'Datum ändern':'Change date'} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: it.status === 'confirmed' ? 'var(--sage-soft)' : 'var(--bg-warm)',
                  color: it.status === 'confirmed' ? 'var(--sage-deep)' : 'var(--ink-soft)',
                  border: 'none', height: 30, padding: '0 10px 0 12px', borderRadius: 999,
                  fontSize: 12, fontWeight: 500, fontVariantNumeric: 'tabular-nums',
                }}>
                  {unitText(it.d, it.unit)}
                  <SK.Icon d={SK.icons.chevronDown} size={12} sw={2} />
                </button>
              </div>

              {/* focus state — inline picker on yogurt */}
              {it.focus && (
                <div style={{
                  padding: '12px 14px 16px', background: 'var(--amber-soft)',
                  borderBottom: i < items.length - 1 ? '1px solid rgba(181,138,12,0.18)' : 'none',
                }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {[
                      [t.today, 0], [t.tomorrow, 1], [lang==='de'?'2 Tage':'2 days', 2], [lang==='de'?'5 Tage':'5 days', 5], [lang==='de'?'1 Woche':'1 week', 7], [lang==='de'?'2 Wochen':'2 weeks', 14],
                    ].map(([lbl, val]) => (
                      <button key={lbl} style={{
                        height: 32, padding: '0 12px', borderRadius: 999, border: 'none',
                        fontSize: 12, fontWeight: 500,
                        background: val === 1 ? 'var(--ink)' : 'var(--card)',
                        color: val === 1 ? 'var(--bg)' : 'var(--ink-soft)',
                        boxShadow: val === 1 ? 'none' : 'inset 0 0 0 1px var(--border)',
                      }}>{lbl}</button>
                    ))}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.16, color: '#6E5108', textTransform: 'uppercase', marginBottom: 6 }}>
                    {t.nudge}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{
                      flex: 1, height: 36, borderRadius: 12, border: 'none',
                      background: 'var(--ink)', color: 'var(--bg)', fontSize: 12, fontWeight: 500,
                    }}>{t.nudge1}</button>
                    <button style={{
                      flex: 1, height: 36, borderRadius: 12, border: '1px solid var(--border)',
                      background: 'var(--card)', color: 'var(--ink-soft)', fontSize: 12, fontWeight: 500,
                    }}>{t.nudge2}</button>
                    <button style={{
                      flex: 1, height: 36, borderRadius: 12, border: '1px solid var(--border)',
                      background: 'var(--card)', color: 'var(--mute)', fontSize: 12, fontWeight: 500,
                    }}>{t.nudge3}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 18px 30px', display: 'flex', flexDirection: 'column', gap: 6,
        background: 'linear-gradient(180deg, transparent, var(--bg) 40%)' }}>
        <button className="sk-btn sk-btn-primary" style={{ width: '100%' }}>
          {t.save} <SK.Icon d={SK.icons.check} size={18} sw={2} />
        </button>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--mute)', fontSize: 13, padding: 8 }}>
          {t.skip}
        </button>
      </div>
    </div>
  );
};

Object.assign(window, { P2 });
