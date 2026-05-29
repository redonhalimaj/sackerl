// sackerl — Design canvas app composition

function Phone({ children }) {
  return (
    <div style={{
      width: 460, height: 920, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'transparent',
    }}>
      <IOSDevice width={402} height={874}>
        {children}
      </IOSDevice>
    </div>
  );
}

function App() {
  return (
    <DesignCanvas>
      <DCSection id="intro" title="sackerl" subtitle="Grocery stock assistant — mobile-first hi-fi exploration">
        <DCArtboard id="cover" label="Concept" width={520} height={920}
          style={{ background: 'transparent', boxShadow: 'none' }}>
          <CoverNote />
        </DCArtboard>
        <DCArtboard id="system" label="Design system" width={520} height={920}
          style={{ background: 'var(--bg)', boxShadow: 'none', border: '1px solid var(--border)' }}>
          <SystemNote />
        </DCArtboard>
      </DCSection>

      <DCSection id="onboarding-flow" title="Onboarding & home" subtitle="First impression and daily landing">
        <DCArtboard id="onboarding" label="Onboarding" width={460} height={920} style={{ background: 'transparent', boxShadow: 'none' }}>
          <Phone><ScreenOnboarding /></Phone>
        </DCArtboard>
        <DCArtboard id="dashboard" label="Home dashboard" width={460} height={920} style={{ background: 'transparent', boxShadow: 'none' }}>
          <Phone><ScreenDashboard /></Phone>
        </DCArtboard>
      </DCSection>

      <DCSection id="receipt-flow" title="Receipt → stock" subtitle="The core flow: scan, review, place">
        <DCArtboard id="scan" label="Scan receipt" width={460} height={920} style={{ background: 'transparent', boxShadow: 'none' }}>
          <Phone><ScreenScan /></Phone>
        </DCArtboard>
        <DCArtboard id="review" label="Review items" width={460} height={920} style={{ background: 'transparent', boxShadow: 'none' }}>
          <Phone><ScreenReview /></Phone>
        </DCArtboard>
        <DCArtboard id="placement" label="Drag & drop placement" width={460} height={920} style={{ background: 'transparent', boxShadow: 'none' }}>
          <Phone><ScreenPlacement /></Phone>
        </DCArtboard>
      </DCSection>

      <DCSection id="stock-flow" title="Stock & expiry" subtitle="Living with your kitchen">
        <DCArtboard id="location" label="Storage detail" width={460} height={920} style={{ background: 'transparent', boxShadow: 'none' }}>
          <Phone><ScreenLocation /></Phone>
        </DCArtboard>
        <DCArtboard id="expiring" label="Expiring soon" width={460} height={920} style={{ background: 'transparent', boxShadow: 'none' }}>
          <Phone><ScreenExpiring /></Phone>
        </DCArtboard>
        <DCArtboard id="notifs" label="Notifications" width={460} height={920} style={{ background: 'transparent', boxShadow: 'none' }}>
          <Phone><ScreenNotifs /></Phone>
        </DCArtboard>
      </DCSection>

      <DCSection id="value-flow" title="Suggestions & premium" subtitle="The smarter half — gently upsold">
        <DCArtboard id="suggestions" label="Suggestion box" width={460} height={920} style={{ background: 'transparent', boxShadow: 'none' }}>
          <Phone><ScreenSuggestions /></Phone>
        </DCArtboard>
        <DCArtboard id="premium" label="Premium paywall" width={460} height={920} style={{ background: 'transparent', boxShadow: 'none' }}>
          <Phone><ScreenPremium /></Phone>
        </DCArtboard>
      </DCSection>

      <DCSection id="desktop" title="Web companion" subtitle="Same brain, larger canvas. For shopping planning at the kitchen table.">
        <DCArtboard id="web-dashboard" label="Desktop dashboard" width={1320} height={840}
          style={{ background: 'transparent', boxShadow: 'none' }}>
          <ChromeWindow
            tabs={[{ title: 'sackerl — Home' }, { title: 'Recipes' }]}
            activeIndex={0}
            url="sackerl.app/home"
            width={1320} height={840}>
            <DesktopDashboard />
          </ChromeWindow>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

// ─────────────────────────────────────────────────────────────
// Concept cover — editorial spread, asymmetric grid, side rail
// ─────────────────────────────────────────────────────────────
function CoverNote() {
  return (
    <div className="sk-app" style={{
      width: '100%', height: '100%', background: 'var(--bg)',
      display: 'grid',
      gridTemplateColumns: '44px 1fr',
      gridTemplateRows: '40px 1fr 80px',
      position: 'relative',
    }}>
      {/* corner-bracket details */}
      <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />

      {/* left rail — rotated metadata */}
      <div style={{
        gridColumn: 1, gridRow: '1 / 4',
        borderRight: '1px solid var(--border)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        paddingBottom: 28,
      }}>
        <div style={{
          transform: 'rotate(-90deg)', transformOrigin: 'center',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.22,
          color: 'var(--mute)', textTransform: 'uppercase',
        }}>
          sackerl · grocery os · file 01 · cover
        </div>
      </div>

      {/* top hairline header */}
      <div style={{
        gridColumn: 2, gridRow: 1,
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 36px',
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.22,
        color: 'var(--mute)', textTransform: 'uppercase',
      }}>
        <span>v0.1 — internal</span>
        <span>17.05.2026</span>
      </div>

      {/* body */}
      <div style={{ gridColumn: 2, gridRow: 2, padding: '44px 36px 24px', display: 'flex', flexDirection: 'column' }}>
        {/* wordmark + section number */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <SK.Logo size={20} />
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.22,
            color: 'var(--ink)', textTransform: 'uppercase',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
          }}>
            <span style={{ color: 'var(--mute)' }}>S — 01</span>
            <span>Concept</span>
          </div>
        </div>

        {/* huge display headline */}
        <div style={{ marginTop: 56, position: 'relative' }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontWeight: 800,
            fontSize: 92, lineHeight: 0.88,
            letterSpacing: -0.045 * 92,
            color: 'var(--ink)',
          }}>
            Eat what
            <br/>
            <span style={{ position: 'relative', display: 'inline-block' }}>
              you have.
              {/* bespoke amber highlight stroke under "have" */}
              <span style={{
                position: 'absolute', left: '47%', right: '6%', bottom: 8,
                height: 14, background: 'var(--amber)',
                zIndex: -1, transform: 'skewX(-6deg)',
              }} />
            </span>
          </div>
          {/* corner stamp — bespoke type lockup, replaces the plain dot */}
          <div style={{
            position: 'absolute', right: -4, top: -2,
            border: '1.5px solid var(--ink)', padding: '6px 8px',
            transform: 'rotate(3deg)',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1,
            background: 'var(--bg)',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 0.2, color: 'var(--ink)', textTransform: 'uppercase' }}>N° 01 / 12</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 0.2, color: 'var(--sage-deep)', textTransform: 'uppercase' }}>concept · cover</span>
          </div>
        </div>

        {/* lede in 2 col */}
        <div style={{
          marginTop: 44, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28,
        }}>
          <p style={{
            margin: 0, fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-soft)',
            textWrap: 'pretty',
          }}>
            Sackerl is a quiet grocery assistant for European kitchens.
            Scan a receipt, drop the goods into the rooms of your home,
            and get gentle nudges before something expires. No alarms,
            no streaks — just a little less waste each week.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <RailRow k="Platform" v="iOS · companion web" />
            <RailRow k="Audience" v="DACH households, 25 – 55" />
            <RailRow k="Language" v="DE · EN · FR · IT" />
            <RailRow k="Origin" v="sackerl · n. Austrian for a paper bag" />
          </div>
        </div>

        {/* kraft strip — the bag motif as a band, with Austrian motto */}
        <div className="sk-kraft" style={{
          marginTop: 28, padding: '14px 18px',
          borderRadius: 2,
          border: '1px solid rgba(74,53,32,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.22,
            color: 'var(--kraft-ink)', textTransform: 'uppercase',
          }}>
            Stempel · A-1010 Wien
          </span>
          <span style={{
            fontFamily: 'var(--font-sans)', fontStyle: 'italic',
            fontSize: 18, fontWeight: 500, letterSpacing: -0.3,
            color: 'var(--kraft-ink)',
          }}>
            "Was im Sackerl ist." — what's in the bag.
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.22,
            color: 'var(--kraft-ink)', textTransform: 'uppercase',
          }}>
            kraft · 70 g/m²
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* index of contents */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18, marginTop: 32 }}>
          <div className="sk-eyebrow" style={{ marginBottom: 12 }}>Contents</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 32px' }}>
            {[
              ['01', 'Concept'], ['07', 'Storage detail'],
              ['02', 'System'],  ['08', 'Expiring soon'],
              ['03', 'Onboarding'], ['09', 'Notifications'],
              ['04', 'Dashboard'], ['10', 'Suggestions'],
              ['05', 'Receipt scan'], ['11', 'Premium'],
              ['06', 'Review & place'], ['12', 'Desktop'],
            ].map(([n, t]) => (
              <div key={n} style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 12.5, color: 'var(--ink-soft)',
                paddingBottom: 4, borderBottom: '1px dotted var(--border)',
              }}>
                <span>{t}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--mute)' }}>{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* footer band */}
      <div style={{
        gridColumn: 2, gridRow: 3,
        borderTop: '1px solid var(--border)',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        alignItems: 'center', padding: '0 36px',
      }}>
        {[
          ['12', 'Frames'],
          ['10', 'Mobile screens'],
          ['1', 'Web companion'],
          ['oklch', 'Color space'],
        ].map(([n, k]) => (
          <div key={k}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 26, fontWeight: 600, letterSpacing: -0.5 }}>{n}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.18, color: 'var(--mute)', textTransform: 'uppercase', marginTop: 2 }}>{k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RailRow({ k, v }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      borderBottom: '1px solid var(--border)', paddingBottom: 6,
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.18, color: 'var(--mute)', textTransform: 'uppercase' }}>{k}</span>
      <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{v}</span>
    </div>
  );
}

function Corner({ pos }) {
  const s = { position: 'absolute', width: 14, height: 14, pointerEvents: 'none' };
  const c = 'var(--ink-soft)';
  const stroke = '1px solid ' + c;
  const map = {
    tl: { top: 14, left: 14, borderTop: stroke, borderLeft: stroke },
    tr: { top: 14, right: 14, borderTop: stroke, borderRight: stroke },
    bl: { bottom: 14, left: 14, borderBottom: stroke, borderLeft: stroke },
    br: { bottom: 14, right: 14, borderBottom: stroke, borderRight: stroke },
  };
  return <div style={{ ...s, ...map[pos] }} />;
}

// ─────────────────────────────────────────────────────────────
// System note — proper type/color spec page
// ─────────────────────────────────────────────────────────────
function SystemNote() {
  return (
    <div className="sk-app" style={{ width: '100%', height: '100%', background: 'var(--bg)', overflow: 'auto', position: 'relative' }}>
      {/* header band */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 36px', borderBottom: '1px solid var(--border)',
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.22,
        color: 'var(--mute)', textTransform: 'uppercase',
      }}>
        <span>S — 02 · System specification</span>
        <span>02 / 12</span>
      </div>

      <div style={{ padding: '40px 36px 48px' }}>
        {/* big specimen */}
        <div style={{
          position: 'relative', padding: '28px 0 36px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div className="sk-eyebrow" style={{ marginBottom: 18 }}>Wordmark · 02.1</div>
          <SK.Logo size={64} />
          <div style={{
            marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24, fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.55,
          }}>
            <SpecLine k="Mark" v="Stylised paper bag — sackerl, the Austrian shopper's word for a small bag." />
            <SpecLine k="Type" v="SF Pro Display 700, tracking −0.035em, lowercase only." />
            <SpecLine k="Clear-space" v="½ × cap-height on every side. Never lock the wordmark in a container." />
          </div>
        </div>

        {/* type scale */}
        <div style={{ padding: '32px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div className="sk-eyebrow">Typographic scale · 02.2</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.18, color: 'var(--mute)', textTransform: 'uppercase' }}>SF Pro · 1.250 (minor third)</div>
          </div>
          <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { px: 56, w: 700, label: 'Display' },
              { px: 32, w: 600, label: 'Headline' },
              { px: 22, w: 600, label: 'Title' },
              { px: 16, w: 500, label: 'Body' },
              { px: 13, w: 500, label: 'Caption' },
            ].map((t) => (
              <div key={t.label} style={{ display: 'grid', gridTemplateColumns: '1fr 120px', alignItems: 'baseline', gap: 12, borderBottom: '1px dotted var(--border)', paddingBottom: 10 }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: t.px, fontWeight: t.w, letterSpacing: t.px > 30 ? -0.03 * t.px : -0.015 * t.px, lineHeight: 1 }}>
                  Eat what you have
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.18, color: 'var(--mute)', textTransform: 'uppercase', textAlign: 'right' }}>
                  {t.label} · {t.px}/{t.w}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* palette — with oklch */}
        <div style={{ padding: '32px 0', borderBottom: '1px solid var(--border)' }}>
          <div className="sk-eyebrow" style={{ marginBottom: 18 }}>Palette · 02.3</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { n: 'Paper',    bg: 'var(--bg)',       hex: '#FCFDFA', ok: 'oklch(.99 .005 117)',  fg: 'var(--ink)',  role: 'surface' },
              { n: 'Ink',      bg: 'var(--ink)',      hex: '#1B2418', ok: 'oklch(.21 .015 134)',  fg: '#fff',        role: 'secondary' },
              { n: 'Sunflower',bg: 'var(--amber)',    hex: '#F2C014', ok: 'oklch(.81 .17 91)',    fg: 'var(--ink)',  role: 'primary' },
              { n: 'Mustard',  bg: 'var(--amber-deep)', hex: '#B58A0C', ok: 'oklch(.64 .13 86)',  fg: '#fff',        role: 'hover' },
              { n: 'Cream',    bg: 'var(--amber-soft)',hex: '#FBF3CC',ok: 'oklch(.96 .07 95)',    fg: '#6E5108',     role: 'warn-tint' },
              { n: 'Grass',    bg: 'var(--sage)',     hex: '#4F9D3A', ok: 'oklch(.66 .17 138)',   fg: '#fff',        role: 'label' },
              { n: 'Field',    bg: 'var(--sage-deep)',hex: '#2F6A20', ok: 'oklch(.49 .14 138)',   fg: '#fff',        role: 'label-deep' },
              { n: 'Meadow',   bg: 'var(--sage-soft)',hex: '#ECF6E5', ok: 'oklch(.96 .035 138)',  fg: 'var(--sage-deep)', role: 'tint' },
            ].map((c) => (
              <div key={c.n} style={{
                background: c.bg, color: c.fg, borderRadius: 4, padding: '14px 12px',
                height: 116, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                border: c.n === 'Paper' || c.n === 'Hairline' || c.n === 'Cream' || c.n === 'Meadow' ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{c.n}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.1 }}>{c.role}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, opacity: 0.85, lineHeight: 1.5 }}>
                  <div>{c.hex}</div>
                  <div style={{ opacity: 0.7 }}>{c.ok}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* anatomy + glyphs */}
        <div style={{ padding: '32px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div className="sk-eyebrow">Action hierarchy · 02.4</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.18, color: 'var(--mute)', textTransform: 'uppercase' }}>amber → ink → outline</div>
          </div>
          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'flex-end' }}>
            <ButtonSpec label="Primary" role="Submit, scan, save" Btn={
              <button className="sk-btn sk-btn-primary" style={{ width: '100%' }}>
                Scan receipt <SK.Icon d={SK.icons.arrowRight} size={18} sw={2} />
              </button>
            } />
            <ButtonSpec label="Secondary" role="Confirm, navigate" Btn={
              <button className="sk-btn sk-btn-ink" style={{ width: '100%' }}>Show recipe</button>
            } />
            <ButtonSpec label="Tertiary" role="Cancel, dismiss" Btn={
              <button className="sk-btn sk-btn-ghost" style={{ width: '100%' }}>Maybe later</button>
            } />
          </div>
        </div>

        {/* glyphs + voice */}
        <div style={{ padding: '32px 0 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36 }}>
          <div>
            <div className="sk-eyebrow" style={{ marginBottom: 16 }}>Storage glyphs · 02.5</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <SK.Zone kind="fridge" size={48} />
              <SK.Zone kind="pantry" size={48} />
              <SK.Zone kind="basement" size={48} />
              <SK.Zone kind="freezer" size={48} />
              <SK.Zone kind="cabinet" size={48} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 12, lineHeight: 1.55 }}>
              Abstract tinted tiles, not drawn rooms. Sober, system-friendly, and recolorable.
              Basements are a first-class location in DACH kitchens.
            </div>
          </div>
          <div>
            <div className="sk-eyebrow" style={{ marginBottom: 16 }}>Voice · 02.6</div>
            <ul style={{ paddingLeft: 14, margin: 0, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.75 }}>
              <li>Helpful, not alarming. "Use today" — never "URGENT".</li>
              <li>Metric and European-first: g / kg / L, no oz.</li>
              <li>Yellow is action. Green is information. Black is the ink. That's the whole palette.</li>
              <li>No more than two colored chips per screen.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecLine({ k, v }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.18, color: 'var(--mute)', textTransform: 'uppercase', marginBottom: 6 }}>{k}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, textWrap: 'pretty' }}>{v}</div>
    </div>
  );
}

function ButtonSpec({ label, role, Btn }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4,
        padding: '22px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {Btn}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.18, color: 'var(--ink)', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--mute)' }}>{role}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Mount (skipped in print mode)
// ─────────────────────────────────────────────────────────────
Object.assign(window, { App, Phone, CoverNote, SystemNote });
if (!window.__SKIP_MOUNT) {
  const root = ReactDOM.createRoot(document.getElementById('app'));
  root.render(<App />);
}
