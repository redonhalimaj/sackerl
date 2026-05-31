// sackerl — Phase 2 handoff app composition

function P2_Cover() {
  return (
    <section style={{
      padding: '52px 0 60px', display: 'grid', gridTemplateColumns: '44px 1fr',
      gap: 36, position: 'relative',
    }}>
      <div style={{
        borderRight: '1px solid var(--border)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 20,
      }}>
        <div style={{
          transform: 'rotate(-90deg)', whiteSpace: 'nowrap',
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.22,
          color: 'var(--mute)', textTransform: 'uppercase',
        }}>
          sackerl · phase 02 · product handoff · 21.05.2026
        </div>
      </div>

      <div style={{ paddingRight: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <SK.Logo size={22} />
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.22,
            color: 'var(--ink)', textTransform: 'uppercase',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
          }}>
            <span style={{ color: 'var(--mute)' }}>S — 13</span>
            <span>Phase 02 · Handoff</span>
          </div>
        </div>

        <div style={{ marginTop: 56 }}>
          <div className="sk-eyebrow" style={{ marginBottom: 18 }}>
            <span className="sk-mark" />Phase 02 — first usable slice
          </div>
          <div style={{
            fontFamily: 'var(--font-sans)', fontWeight: 800,
            fontSize: 84, lineHeight: 0.92,
            letterSpacing: -0.045 * 84,
            color: 'var(--ink)', maxWidth: 920, textWrap: 'balance',
          }}>
            From onboarding<br />
            to a stocked <span className="sk-serif" style={{ fontStyle: 'italic', fontWeight: 500, color: 'var(--sage-deep)' }}>sackerl.</span>
          </div>
        </div>

        <div style={{
          marginTop: 38, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 36,
        }}>
          <p style={{
            margin: 0, fontSize: 16, lineHeight: 1.55, color: 'var(--ink-soft)',
            textWrap: 'pretty', maxWidth: 640,
          }}>
            Phase 2 ships the first end-to-end slice a real household can use: a person
            opens Sackerl, names their storage zones, scans a receipt, fixes whatever the OCR
            got wrong, drops the items into the right rooms, and confirms when each one
            expires. Eight screens, every state the brief asks for, and a tap-based alternative
            so drag-and-drop is never a dead-end.
            <br /><br />
            This document <strong style={{ color: 'var(--ink)' }}>extends</strong> Phase 1.
            Nothing in the design system, the type scale, the colour roles, the icon set, the
            logo lockup, the paper-bag illustration, or the tab shell is replaced. Three small
            additions are listed in the appendix.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <P2_RailRow k="Scope" v="8 screens · 5 state classes · 1 nav flow" />
            <P2_RailRow k="Platform" v="iOS-first · Android parity" />
            <P2_RailRow k="Languages" v="EN · DE (FR · IT to follow)" />
            <P2_RailRow k="Relationship" v="Extends Phase 1 — replaces nothing" />
            <P2_RailRow k="Priority floor" v="All eight are P0 for v1.0" />
            <P2_RailRow k="Out of scope" v="Suggestions, premium, household sharing" />
          </div>
        </div>

        {/* index */}
        <div style={{ marginTop: 56, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
          <P2D.Eyebrow>Contents</P2D.Eyebrow>
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 36px' }}>
            {[
              ['01', 'Welcome / Onboarding', 'SCKRL-101'],
              ['02', 'Household setup',      'SCKRL-102'],
              ['03', 'Home dashboard',       'SCKRL-203'],
              ['04', 'Scan / import entry',  'SCKRL-301'],
              ['05', 'Receipt review',       'SCKRL-304'],
              ['06', 'Storage placement',    'SCKRL-305'],
              ['07', 'Expiry confirmation',  'SCKRL-306'],
              ['08', 'Universal states',     'SCKRL-9xx'],
              ['A',  'Tokens · components · priorities', 'appendix'],
            ].map(([n, t, tk]) => (
              <div key={n} style={{
                display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 6,
                fontSize: 13, color: 'var(--ink)', paddingBottom: 8,
                borderBottom: '1px dotted var(--border)', alignItems: 'baseline',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--mute)', fontSize: 11 }}>{n}</span>
                <span>{t}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--mute)', letterSpacing: 0.06 }}>{tk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* big four-up — the flow */}
        <div style={{
          marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18,
        }}>
          {[
            { f: <P2.Welcome />,   l: '01 · Welcome' },
            { f: <P2.Household />, l: '02 · Household' },
            { f: <P2.Dashboard />, l: '03 · Dashboard' },
            { f: <P2.Review />,    l: '05 · Review' },
          ].map((s, i) => (
            <P2D.MiniFrame key={i} scale={0.42} label={s.l}>{s.f}</P2D.MiniFrame>
          ))}
        </div>

        <div className="sk-kraft" style={{
          marginTop: 52, padding: '14px 18px',
          borderRadius: 2, border: '1px solid rgba(74,53,32,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.22,
            color: 'var(--kraft-ink)', textTransform: 'uppercase',
          }}>Stempel · A-1010 Wien · Phase 02</span>
          <span style={{
            fontFamily: 'var(--font-sans)', fontStyle: 'italic',
            fontSize: 17, fontWeight: 500, letterSpacing: -0.3, color: 'var(--kraft-ink)',
          }}>
            "Was im Sackerl ist." — engineering-ready.
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.22,
            color: 'var(--kraft-ink)', textTransform: 'uppercase',
          }}>v0.2 · internal</span>
        </div>
      </div>
    </section>
  );
}

function P2_RailRow({ k, v }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 6,
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.18, color: 'var(--mute)', textTransform: 'uppercase' }}>{k}</span>
      <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500, textAlign: 'right' }}>{v}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Universal states section
// ─────────────────────────────────────────────────────────────
function P2_UniversalStates() {
  return (
    <section style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
      <P2D.SectionHead n="08" title="Universal states" ticket="SCKRL-9xx" />

      <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5, color: 'var(--ink)', maxWidth: 720, textWrap: 'pretty' }}>
        Every screen in this slice handles five state classes the same way. Implementing them once
        here means the eight feature screens don't have to bespoke their own versions. All five
        follow Phase 1's voice rules: helpful, never alarming, no red.
      </p>

      <div style={{
        marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14,
      }}>
        {[
          { tag: 'EMPTY', title: 'Quietly reassuring', body: 'Small Zone glyph (28, mute-soft) · Title 22/600 · Body-S subline · one optional CTA. Stick to one sentence.', tone: 'sage' },
          { tag: 'LOADING', title: 'Skeleton, never spinner', body: 'Bone colour --border-soft, 1.4s shimmer ease-in-out. Layout-faithful: same rows, same heights. Never a spinner.', tone: 'mute' },
          { tag: 'ERROR', title: 'Page-level card', body: 'Ink card, amber leading dot, headline "Something didn\'t work.", body explains what, Retry button. Inline form errors use --amber-deep, not red.', tone: 'amber' },
          { tag: 'PERMISSION', title: 'Why, not just deny', body: 'Always state the value before asking. "Sackerl needs the camera to read receipts. You decide what gets saved." Open Settings (primary) + non-camera alternative.', tone: 'amber' },
          { tag: 'OFFLINE', title: 'Last-sync banner', body: '8px ink banner at top of every authed screen when offline. Last-known stock stays visible; mutations queue and re-send.', tone: 'ink' },
        ].map((s) => (
          <div key={s.tag} style={{
            border: '1px solid var(--border)', borderRadius: 18, padding: '18px 16px 16px',
            background: 'var(--card)', display: 'flex', flexDirection: 'column', gap: 10,
            minHeight: 220,
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.18,
              color: s.tone === 'sage' ? 'var(--sage-deep)'
                   : s.tone === 'amber' ? 'var(--amber-deep)'
                   : s.tone === 'ink' ? 'var(--ink)'
                   : 'var(--mute)',
              textTransform: 'uppercase',
            }}>· {s.tag}</div>
            <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.2 }}>{s.title}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5, textWrap: 'pretty' }}>{s.body}</div>
          </div>
        ))}
      </div>

      {/* state recipes by screen */}
      <div style={{ marginTop: 36 }}>
        <P2D.Eyebrow>State coverage by screen</P2D.Eyebrow>
        <div style={{ marginTop: 14, overflow: 'hidden', borderRadius: 14, border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead style={{ background: 'var(--bg-warm)' }}>
              <tr style={{ textAlign: 'left', color: 'var(--mute)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.16, textTransform: 'uppercase' }}>
                {['Screen', 'Empty', 'Loading', 'Error', 'Permission', 'Offline'].map((h, i) => (
                  <th key={i} style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['01 Welcome',     'n/a',                       'n/a',                  'n/a',                       'n/a',                                 'n/a — pre-auth, no remote calls'],
                ['02 Household',   'CTA disabled · inline hint','n/a',                  'Inline: "Couldn\'t save zones — try again"', 'n/a',                  'Queues writes, banner shown'],
                ['03 Dashboard',   'Bag becomes prompt + CTA',  'Bag count skeletons',  'Toast: "Couldn\'t reach your stock"',        'n/a',                    'Last-sync banner, mutate queues'],
                ['04 Scan entry',  'n/a',                       'n/a',                  'Upload-failed full-screen + Retry',          'Camera-denied full-screen', 'PDF/manual paths still work'],
                ['05 Review',      'Parse-empty card',          'Row skeletons + lede', 'Parse-failed full-screen',                   'n/a',                    'Reads from local; submit queues'],
                ['06 Placement',   'No items to place (skip)',  'Dock skeletons',       'Save-failed inline above CTA',               'n/a',                    'Queues placement'],
                ['07 Expiry',      'No items (skip)',           'Date estimates inline',  'Save-failed inline above CTA',               'n/a (push asked on save)','Reminders queued for next sync'],
              ].map((row, ri) => (
                <tr key={ri}>
                  {row.map((c, ci) => (
                    <td key={ci} style={{
                      padding: '12px 14px', borderBottom: ri < 6 ? '1px solid var(--hairline)' : 'none',
                      color: ci === 0 ? 'var(--ink)' : 'var(--ink-soft)',
                      fontWeight: ci === 0 ? 600 : 400,
                      fontFamily: ci === 0 ? 'var(--font-mono)' : 'var(--font-sans)',
                      fontSize: ci === 0 ? 11 : 12.5,
                      letterSpacing: ci === 0 ? 0.06 : 0,
                    }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Appendix — tokens, components, priorities
// ─────────────────────────────────────────────────────────────
function P2_Appendix() {
  return (
    <section style={{ padding: '60px 0 80px', borderTop: '1px solid var(--border)' }}>
      <P2D.SectionHead n="A" title="Appendix" ticket="tokens · components · priority" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <P2D.SpecPanel title="New tokens added in Phase 2" n="A.1">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              ['--p2-progress-track', 'var(--border)', '3px progress rail (Household setup, Review header)'],
              ['--p2-progress-fill', 'var(--ink)', 'Filled segment of the same rail'],
              ['--p2-overlay-scrim', 'rgba(27,36,24,0.35)', 'Bottom-sheet & permission scrim; matches Phase 1 sheet spec'],
              ['--p2-shimmer-from', 'var(--border-soft)', 'Skeleton bone start'],
              ['--p2-shimmer-to',   'var(--bg)', 'Skeleton shimmer mid-stop'],
            ].map(([k, v, n], i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '180px 140px 1fr', gap: 12,
                fontSize: 12, padding: '8px 0', borderBottom: '1px dotted var(--border)',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--sage-deep)' }}>{k}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>{v}</span>
                <span style={{ color: 'var(--ink-soft)' }}>{n}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--mute)', lineHeight: 1.5 }}>
            All five derive from Phase 1 values — they're aliases for clarity, not new hues.
          </div>
        </P2D.SpecPanel>

        <P2D.SpecPanel title="Component register · changes" n="A.2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
            {[
              { tone: 'new', name: '<HouseholdZoneCard>', note: '168×132 tile · selected = 2px ink + amber check pill' },
              { tone: 'new', name: '<ProgressRail>', note: '3-segment rail used in Household + Review headers' },
              { tone: 'new', name: '<ImportOption>', note: 'Card-button row used 3× on Scan-entry sheet' },
              { tone: 'new', name: '<PermissionGate>', note: 'Generic permission-denied scaffold; camera is first user' },
              { tone: 'new', name: '<OfflineBanner>', note: '8px ink banner, mono uppercase, shown on every authed screen when offline' },
              { tone: 'new', name: '<DragChip>', note: 'Adds selected={bool} variant so tap-mode lifts the chip without a drag' },
              { tone: 'new', name: '<DropTarget>', note: 'Adds highlight={bool} for tap-mode dashed-ink prompt' },
              { tone: 'new', name: '<ExpiryRow>', note: 'List row with estimated/confirmed status and inline picker bus' },
              { tone: 'new', name: '<ExpiryQuickPicks>', note: 'Six bucketed presets: Today · Tomorrow · 2d · 5d · 1w · 2w' },
              { tone: 'new', name: '<NudgeSegment>', note: '3-up segment: 3d before · On the day · Never' },
              { tone: 'changed', name: 'SK.TabBar', note: 'No change. Confirmed: Scan FAB is the *only* on-screen entry to the import sheet' },
              { tone: 'changed', name: 'SK.PaperBag', note: 'No change. Loading state on Dashboard freezes the animation, not the SVG' },
            ].map((c, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '90px 1fr', gap: 12,
                paddingBottom: 8, borderBottom: '1px dotted var(--border)',
              }}>
                <P2D.Tag tone={c.tone}>{c.tone === 'new' ? 'NEW' : 'KEPT'}</P2D.Tag>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2, lineHeight: 1.45 }}>{c.note}</div>
                </div>
              </div>
            ))}
          </div>
        </P2D.SpecPanel>
      </div>

      {/* implementation priority */}
      <div style={{ marginTop: 18 }}>
        <P2D.SpecPanel title="Implementation priority — week-by-week" n="A.3">
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
            All eight screens are P0 for the v1.0 release because the slice is the product. The
            order below is a build sequence, not a value ranking — each row unblocks the next.
          </p>
          <div style={{ marginTop: 14, overflow: 'hidden', borderRadius: 14, border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead style={{ background: 'var(--bg-warm)' }}>
                <tr style={{ textAlign: 'left', color: 'var(--mute)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.16, textTransform: 'uppercase' }}>
                  {['Sprint', 'Screen', 'Hard dependency', 'Unblocks'].map((h, i) => (
                    <th key={i} style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['W1', '01 Welcome + 02 Household', 'Phase 1 atoms · auth shell', 'A user can launch the app with valid zones'],
                  ['W1', '08 Universal states', 'Phase 1 tokens', 'All later screens reuse the five scaffolds'],
                  ['W2', '04 Scan entry (+ camera capture)', 'Camera permission gate · file picker', 'Receipt asset exists'],
                  ['W2', '05 Receipt review', 'OCR provider behind interface · #04', 'Confirmed item list'],
                  ['W3', '06 Storage placement', '#02, #05 · drag-and-drop primitive (with tap alt.)', 'Items have zones'],
                  ['W3', '07 Expiry confirmation', 'Category → shelf-life table · push perms', 'Reminders scheduled'],
                  ['W4', '03 Home dashboard', 'All of the above · expiry day-bucketing', 'First daily-return surface'],
                  ['W4', 'Polish · motion · DE locale', 'Strings frozen', 'Ready for closed beta'],
                ].map((row, ri) => (
                  <tr key={ri}>
                    {row.map((c, ci) => (
                      <td key={ci} style={{
                        padding: '12px 14px',
                        borderBottom: ri < 7 ? '1px solid var(--hairline)' : 'none',
                        color: ci === 0 ? 'var(--ink)' : 'var(--ink-soft)',
                        fontFamily: ci === 0 ? 'var(--font-mono)' : 'var(--font-sans)',
                        fontWeight: ci === 0 || ci === 1 ? 600 : 400,
                        fontSize: ci === 0 ? 11 : 12.5,
                        letterSpacing: ci === 0 ? 0.06 : 0,
                        whiteSpace: ci === 0 ? 'nowrap' : 'normal',
                      }}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </P2D.SpecPanel>
      </div>

      {/* Final accessibility matrix */}
      <div style={{ marginTop: 18 }}>
        <P2D.SpecPanel title="Accessibility floor — every screen" n="A.4">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
            {[
              { h: 'Contrast', b: 'Body ≥ 4.5:1; large ≥ 3:1. Amber-on-ink and ink-on-amber both verified. Amber-soft chip body uses #6E5108 to clear 4.5:1 on its tint.' },
              { h: 'Touch targets', b: 'Minimum 44 × 44pt for every interactive element. Drag chips are 44pt tall by spec; round icon buttons are 36 visually but get a 44pt hit padding.' },
              { h: 'Drag → tap', b: 'Every drag is parallel-implemented with a two-tap interaction: tap chip → tap zone. Drag works on pointer, tap is the default on VoiceOver / TalkBack.' },
              { h: 'Reduced motion', b: 'Paper-bag breathing, item-drop, shimmer skeleton, and tap-feedback scale all freeze under prefers-reduced-motion: reduce.' },
              { h: 'Focus order', b: 'Each screen has a single explicit focus trap inside the primary action region; back chevron is first focus on entry; sheets trap focus until dismissed.' },
              { h: 'Screen reader', b: 'Item rows are <ul> + <li> with the qty announced after the name. Estimated/confirmed status is announced as an aria-description, not a separate node.' },
              { h: 'Labels', b: 'Every icon-only button has aria-label in EN and DE. Status chips (e.g. "tomorrow") are reachable as text, not just colour.' },
              { h: 'Numbers', b: 'fontVariantNumeric: tabular-nums on quantities, dates, counts. Locale-aware ("500 g" vs "500 g", "€25.12" vs "€25,12").' },
              { h: 'No red', b: 'Errors use --amber-deep + the leading dot, never red. Inline form errors are body-S, never larger than the field they qualify.' },
            ].map((c, i) => (
              <div key={i} style={{ paddingBottom: 12, borderBottom: '1px dotted var(--border)' }}>
                <div className="sk-eyebrow" style={{ marginBottom: 6 }}>{c.h}</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--ink-soft)', textWrap: 'pretty' }}>{c.b}</div>
              </div>
            ))}
          </div>
        </P2D.SpecPanel>
      </div>

      {/* sign-off */}
      <div style={{
        marginTop: 32, padding: '18px 22px', borderRadius: 4,
        border: '1px solid var(--border)', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', gap: 14,
      }}>
        <div>
          <div className="sk-eyebrow" style={{ marginBottom: 6 }}>Ship-readiness</div>
          <div style={{ fontSize: 14, color: 'var(--ink)', maxWidth: 640, lineHeight: 1.5 }}>
            Phase 2 is engineering-ready. Strings frozen for EN/DE. FR/IT strings due before W4.
            All component IDs map to <code style={{ fontFamily: 'var(--font-mono)' }}>sk-atoms.jsx</code>; new components live in <code style={{ fontFamily: 'var(--font-mono)' }}>phase-2-screens.jsx</code>.
          </div>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 0.22,
          color: 'var(--mute)', textTransform: 'uppercase', textAlign: 'right',
        }}>
          <div>v0.2 · 2026-05-21</div>
          <div>internal · do not distribute</div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Per-screen section content
// ─────────────────────────────────────────────────────────────

function P2_Welcome_Section() {
  return (
    <P2D.Section
      n="01" title="Welcome / Onboarding" ticket="SCKRL-101"
      priority="P0"
      hierarchy="Entry · pre-auth · 1 screen"
      lede="The user's first 5 seconds in Sackerl. One promise, one CTA, one piece of motion. The animated paper bag (Phase 1 component) does the introducing — copy stays editorial and short. No carousel. No 'allow notifications' before the user has anything to be notified about."
      frame={<P2.Welcome />}
      states={[
        { label: 'DE locale', frame: <P2.Welcome lang="de" /> },
      ]}
      anatomy={[
        ['Status bar',       '54pt fixed iOS · ink text · device-controlled'],
        ['Top row',          'Logo (20) left · locale switcher (mono 11, mute) right · 24pt tall'],
        ['Display headline', '52/0.98 SF Pro 700 · tracking -0.02em · 3 lines · last line italic serif in --sage-deep'],
        ['Body lede',        '16/1.45 ink-soft · max-width 310 · text-wrap pretty'],
        ['PaperBag',         '240 × 260 · centred · breathing at 5.2s · drop items at 4.4s, stagger 1s'],
        ['Primary CTA',      '52pt × 100% · amber bg, ink text, 1.5px ink ring, glow 0 8px 22px rgba(242,192,20,.28)'],
        ['Tertiary',         '"I already have an account" · transparent · body-S mute · 14pt'],
        ['Gutters',          '28pt outer (matches editorial spec, wider than 18pt list-screen default)'],
        ['Bottom inset',     '38pt above home indicator'],
      ]}
      components={[
        { name: 'SK.PaperBag' }, { name: 'SK.Logo' }, { name: '.sk-btn-primary' },
        { name: '.sk-eyebrow' }, { name: '.sk-serif' },
      ]}
      copy={[
        ['eyebrow',     'A friendly pantry assistant',           'Ein leiser Vorrats-Helfer'],
        ['headline.1',  "Know what's",                            'Wisse, was'],
        ['headline.2',  'at home.',                               'zu Hause ist.'],
        ['headline.3',  'Waste less.',                            'Verschwende weniger.'],
        ['body',        'Scan a receipt, drop your groceries into your real kitchen, and get a quiet nudge before food expires.', 'Scanne den Kassenzettel, lege Lebensmittel in deine Küche und bekomme einen leisen Hinweis, bevor etwas abläuft.'],
        ['cta.primary', 'Get started',                            'Loslegen'],
        ['cta.tertiary','I already have an account',              'Ich habe schon ein Konto'],
        ['locale.label','EN · DE · FR · IT',                      'EN · DE · FR · IT'],
      ]}
      a11y={[
        'aria-label on the locale switcher = "Change language". Switcher opens a sheet, never a select.',
        'Display headline is one <h1>; serif italic line is part of the same heading, not a sibling.',
        'PaperBag is decorative (role="img" with aria-label="A paper bag with groceries dropping into it" in EN/DE).',
        'Primary CTA always reachable in 1 tab from app launch; focus ring is the ink ring at 100%.',
        'Reduced motion freezes the bag with all items at rest above the bag mouth — never inside.',
      ]}
      motion={[
        'Mount: 240ms out-quint fade-up on the headline block (16→0px), 80ms after status bar.',
        'PaperBag breathing starts at +180ms so the entry animation reads before the loop.',
        'No autoplay sound. No haptics on entry — first haptic is reserved for shutter capture.',
      ]}
      data={[
        'No remote calls on this screen — pre-auth.',
        'Locale defaults to device locale (CLDR list); fallback EN if unsupported.',
        'CTA "Get started" routes to Household (02); tertiary routes to sign-in (SCKRL-008, out of P2 scope).',
      ]}
      tokens={[]}
    />
  );
}

function P2_Household_Section() {
  return (
    <P2D.Section
      n="02" title="Household setup" ticket="SCKRL-102"
      priority="P0"
      hierarchy="Onboarding · step 2 of 3 · 1 screen + 1 empty-validation state"
      lede="Two questions framed as one: which rooms count, and which one is the catch-all? Cards instead of a list because the choice is spatial — these are places, not preferences. Defaults are selected on entry so a user can keep tapping Continue and still get a sensible setup. Custom zones live on the same grid as a dashed 'plus' card, never in a separate flow."
      frame={<P2.Household />}
      states={[
        { label: 'Empty selection · CTA disabled', frame: <P2.Household state="empty" /> },
        { label: 'DE locale',                       frame: <P2.Household lang="de" /> },
      ]}
      anatomy={[
        ['Top bar',          '44pt total · back chevron 36 · step pip mono 11 mute · right slot reserved 36'],
        ['Progress rail',    '3 segments × 3pt high · 6pt gap · filled = --ink, empty = --border'],
        ['Title block',      'Title-XL 30/1.06 · "food?" set in italic serif weight 400 · 8pt to subtitle'],
        ['Subtitle',         '14/1.45 ink-soft · max 320'],
        ['Zone grid',        '2 columns · 10pt gap · 168×132 cards · 18pt outer gutter'],
        ['Zone card',        'Card 18pt radius · padding 14/16/14/14 · Zone glyph 48 top-left, label + hint bottom-left'],
        ['Selected state',   '2px solid --ink border (replaces 1px --border) · 22pt amber check pill top-right with 1.5px ink ring'],
        ['Custom card',      'Same dimensions · --bg-warm · 1px dashed --border · plus glyph 48 placeholder'],
        ['Sticky CTA',       '52pt × 100% · 18pt side gutters · 30pt bottom inset · gradient fade above it'],
      ]}
      components={[
        { name: 'HouseholdZoneCard', new: true },
        { name: 'ProgressRail',      new: true },
        { name: 'SK.Zone' }, { name: '.sk-btn-primary' }, { name: 'SK.RoundBtn' },
      ]}
      copy={[
        ['step',            'Step 2 of 3',                              'Schritt 2 von 3'],
        ['title',           'Where do you store food?',                  'Wo lagerst du Essen?'],
        ['subtitle',        "Tap every place you'd open looking for ingredients. You can change this later.", 'Wähle alles, wo du nach Zutaten schauen würdest. Du kannst das später ändern.'],
        ['zone.fridge',     'Fridge · cold drinks, dairy',               'Kühlschrank · Milch, Gemüse'],
        ['zone.pantry',     'Pantry · pasta, cans',                      'Vorrat · Nudeln, Konserven'],
        ['zone.basement',   'Basement · bulk, drinks',                   'Keller · Vorrat & Getränke'],
        ['zone.freezer',    'Freezer · long-term',                       'Gefrierfach · TK-Ware'],
        ['zone.cabinet',    'Cabinet · dry goods',                       'Schrank · Trockenes'],
        ['zone.custom',     'Custom place · bath, garage …',             'Eigener Ort · Bad, Garage …'],
        ['validation',      'Pick at least one.',                        'Wähle mindestens einen.'],
        ['cta',             'Continue',                                  'Weiter'],
      ]}
      a11y={[
        'Each card is a <button aria-pressed> with label = zone name; the hint is aria-description.',
        'Empty-selection inline message has role="alert" and is read on the first save attempt only, not on every render.',
        'Continue button is announced as "disabled · pick at least one" while count = 0.',
        'Custom-place opens a sheet with a single labelled text input (placeholder is not the label).',
        'Tap-target safe-area: cards are 132pt tall × ~165pt wide, well above the 44pt minimum.',
      ]}
      motion={[
        'Card-select: 120ms scale 0.98 tap feedback + 200ms border colour transition.',
        'Amber check pill: 180ms scale 0.6 → 1.0 spring on selection; 120ms fade on deselect.',
        'No motion on first paint; cards appear with the page transition only.',
      ]}
      data={[
        'Defaults selected on first entry: Fridge, Pantry, Basement, Freezer. Cabinet unselected.',
        'Zone IDs map 1:1 to Phase 1 SK.Zone kinds; custom zones get a generated slug + chosen colour-token.',
        'Selection writes to local household state immediately; full sync happens on Continue.',
        'Skipping zone setup is not allowed — at least 1 zone is required. (Open question for product: confirm.)',
      ]}
      tokens={[
        '--p2-progress-track and --p2-progress-fill (aliases of --border / --ink).',
      ]}
    />
  );
}

function P2_Dashboard_Section() {
  return (
    <P2D.Section
      n="03" title="Home dashboard" ticket="SCKRL-203"
      priority="P0"
      hierarchy="Authed · top-level tab · 1 screen + 4 state variants"
      lede="The daily-return surface. The kraft 'dein sackerl' hero is the only place this material appears in the app — it has to earn its kraft. Three blocks: who you are (greeting), what's in the bag (hero), what's about to go off (expiring card). The Storage grid sits below the fold; the Suggestions card is Phase 3."
      frame={<P2.Dashboard />}
      states={[
        { label: 'Empty stock · first run', frame: <P2.Dashboard state="empty" /> },
        { label: 'Loading · skeleton',      frame: <P2.Dashboard state="loading" /> },
        { label: 'No expiring · meadow',    frame: <P2.Dashboard state="no-expiring" /> },
        { label: 'Offline banner',          frame: <P2.Dashboard state="offline" /> },
        { label: 'DE locale',               frame: <P2.Dashboard lang="de" /> },
      ]}
      anatomy={[
        ['Greeting',          'Eyebrow mono 11 · serif title 30 · "Lena" italic · 22pt left gutter'],
        ['Hero card',         '--kraft surface · 22pt radius · 1px rgba(74,53,32,0.18) border · 178pt min-height · grid 1fr/auto'],
        ['Hero copy',         'Numerical headline 28/1 SF Pro 700, tracking -0.9 · body 12.5/1.45 at 0.78 opacity · two mono pills below'],
        ['Hero PaperBag',     '160×178 right-aligned, anchored to bottom; never overlapping the stamp'],
        ['Expiring card',     'White card 22pt radius · soft shadow · header with amber dot + count · 3 rows, hairline between'],
        ['Expiring row',      'Tile 38 · name 15/500 · "in [zone]" body-S mute · amber chip days right'],
        ['Storage grid',      '2 cols × 10pt gap · 18pt outer · Zone 42 top-left, label 16/600, item count 12 mute'],
        ['Tab bar',           '88pt incl. home indicator · Scan FAB centred and lifted -24pt'],
      ]}
      components={[
        { name: 'SK.PaperBag' }, { name: 'SK.TabBar' }, { name: 'SK.Tile' }, { name: 'SK.Zone' },
        { name: '.sk-kraft' }, { name: 'OfflineBanner', new: true }, { name: 'SkeletonRow', new: true },
      ]}
      copy={[
        ['eyebrow.date',  'TUESDAY, 17 MAY',                          'DIENSTAG, 17. MAI'],
        ['greeting',      'Hello, Lena',                              'Hallo, Lena'],
        ['hero.stamp',    'dein sackerl',                             'dein sackerl'],
        ['hero.title',    '85 things at home',                        '85 Dinge zu Hause'],
        ['hero.body',     'Enough for 5 dinners. Skip the shop on Wednesday.', 'Genug für 5 Abende. Spar dir Mittwoch.'],
        ['hero.empty',    'Your sackerl is empty. Scan your first receipt.', 'Dein Sackerl ist leer. Scanne deinen ersten Kassenzettel.'],
        ['hero.emptyCta', 'Scan receipt',                             'Kassenzettel scannen'],
        ['exp.header',    '3 items expiring soon',                    '3 laufen bald ab'],
        ['exp.row.day1',  'tomorrow',                                 'morgen'],
        ['exp.row.dayN',  '{n} days',                                 '{n} Tage'],
        ['exp.empty',     'Nothing expiring this week — well done.',  'Diese Woche läuft nichts ab — sehr gut.'],
        ['storage.head',  'STORAGE',                                  'LAGER'],
        ['offline',       'Offline · stock loaded from last sync',     'Offline · Vorrat vom letzten Stand'],
      ]}
      a11y={[
        'Hero card is a region with aria-label="Your stock summary". Numerical headline (85) gets aria-label="85 items at home".',
        'Expiring row chip "tomorrow"/"2 days" is reachable as text; colour is not the sole signal.',
        '"See all" link in the expiring card is a real link with an explicit aria-label including the count.',
        'Storage zone cards are <button> with name + count both in the accessible name.',
        'Notification dot on bell is aria-hidden; "Notifications, 3 unread" is the aria-label of the button itself.',
      ]}
      motion={[
        'PaperBag continues its breathing/drop loop. Loading state replaces the count with skeleton rows; bag stays still (animated=false).',
        'Pull-to-refresh: 60pt threshold, ink-tinted spinner replaced with three skeleton bones in the hero.',
        'Empty → stocked transition (after first receipt): 320ms cross-fade of hero copy, PaperBag restarts animation.',
      ]}
      data={[
        'Hero counts: hard-totals (no estimate). "85 things" = sum of item rows across zones, regardless of unit.',
        'Hero body line: deterministic — "Enough for N dinners" only shown if recipe-coverage ≥ 3; otherwise omit.',
        'Expiring "soon" window: 0–3 days. After 3 days, items appear in /expiring but not on dashboard.',
        'Offline detection: navigator.onLine + 5s heartbeat. Mutations queue locally and replay on reconnect.',
      ]}
      tokens={[
        '--p2-shimmer-from / --p2-shimmer-to (for skeletons).',
      ]}
    />
  );
}

function P2_ScanEntry_Section() {
  return (
    <P2D.Section
      n="04" title="Scan / import entry" ticket="SCKRL-301"
      priority="P0"
      hierarchy="Modal sheet, full-height · 3 import paths · 2 dedicated error states"
      lede="The Scan FAB doesn't open the camera — it opens this sheet first, so 'Photo of receipt' is always one of three peer options, not the only one. This is the single most important UX correction in the slice: it makes the app usable for anyone whose store provides PDFs, and it gives us a clean place to land permission-denied without sending the user back to start."
      frame={<P2.ScanEntry />}
      states={[
        { label: 'Camera permission denied', frame: <P2.ScanEntry state="permission-denied" /> },
        { label: 'Upload error · retry',     frame: <P2.ScanEntry state="error" /> },
        { label: 'DE locale',                frame: <P2.ScanEntry lang="de" /> },
      ]}
      anatomy={[
        ['Sheet header',     '44pt · close button left · mono label centre · empty right slot'],
        ['Title block',      'Title 28/1.1 · 8pt to subtitle · 22pt gutters'],
        ['Option card',      '72pt min-height · 18pt radius · 16/14 padding · 44pt icon tile left · chevron right'],
        ['Primary option',   'First card carries shadow-sm + amber-soft icon tile (primary by recency, not contrast)'],
        ['Permission icon',  '64pt rounded 18 · amber-soft bg · inset 1px amber-deep @18% · camera glyph 26'],
        ['CTA stack',        'Primary 52 + tertiary 38, 18pt gutters, 30pt bottom inset'],
      ]}
      components={[
        { name: 'ImportOption',    new: true },
        { name: 'PermissionGate',  new: true },
        { name: 'SK.Icon' }, { name: '.sk-btn-primary' }, { name: '.sk-btn-ghost' },
      ]}
      copy={[
        ['title',           'Update your stock',                          'Vorrat aktualisieren'],
        ['subtitle',        'Pick how you want to add your shopping.',    'Wähle, wie du deinen Einkauf hinzufügen möchtest.'],
        ['opt.camera',      'Photo of receipt · Aim camera, hold steady', 'Foto vom Zettel · Kamera ausrichten und auslösen'],
        ['opt.pdf',         'Digital receipt · PDF, screenshot, email attachment', 'Digitaler Zettel · PDF, Screenshot oder E-Mail-Anhang'],
        ['opt.manual',      'Add by hand · No receipt — type it in',      'Manuell hinzufügen · Ohne Zettel — direkt eingeben'],
        ['perm.title',      'Camera access needed',                       'Kamerazugriff erforderlich'],
        ['perm.body',       'Sackerl needs the camera to read receipts. You decide what gets saved.', 'Sackerl braucht die Kamera, um Kassenzettel zu lesen. Du bestimmst, was gespeichert wird.'],
        ['perm.cta',        'Open Settings',                              'Einstellungen öffnen'],
        ['perm.alt',        'Upload a photo instead',                     'Stattdessen Foto hochladen'],
        ['err.title',       "Upload didn't finish.",                      'Hochladen unterbrochen.'],
        ['err.body',        "We couldn't send your receipt. Check your connection and try again.", 'Wir konnten den Zettel nicht senden. Internet prüfen und erneut versuchen.'],
        ['err.cta',         'Try again',                                  'Erneut versuchen'],
        ['err.alt',         'Save offline for now',                       'Trotzdem speichern (offline)'],
      ]}
      a11y={[
        'Sheet is a focus trap; close button is first tab on entry; escape / hardware back closes.',
        'Each option card is a <button> with name + hint both spoken in the accessible name.',
        'Permission state is reached after a *deliberate* denial — never on first launch; we never request camera until user picks the camera option.',
        'Error state announces the retry button as the first focus on the page.',
      ]}
      motion={[
        'Sheet enter/exit: 240ms out-quint translate-y from 100vh.',
        'Option tap: scale 0.98 + 120ms colour move on the icon tile, never on the card itself.',
        'Error → success: the icon tile cross-fades, the title slides up 12pt over 200ms.',
      ]}
      data={[
        'Camera permission is requested only after the user taps "Photo of receipt".',
        'Receipt upload sends raw image + EXIF; OCR provider is abstracted behind a single interface (SCKRL-303).',
        'Offline path: image stored locally, queued for upload, user advanced to a stub Review screen with no OCR yet — surfaced when reconnected.',
        'Manual path opens an "Add item" sheet pre-bound to a synthesised receipt with no store/total.',
      ]}
      tokens={[
        '--p2-overlay-scrim (sheet/scrim alias of rgba(27,36,24,0.35)).',
      ]}
    />
  );
}

function P2_Review_Section() {
  return (
    <P2D.Section
      n="05" title="Receipt review & correction" ticket="SCKRL-304"
      priority="P0"
      hierarchy="Onboarding-style · step 2 of 3 · loading + fail states"
      lede="The single highest-risk screen in the slice — OCR will not be perfect, and the user has to feel safe correcting it. Three signals together: raw OCR string under every parsed name (so the user can verify), confidence chips at the top (so they know how much to scan), and a tinted row + 'check' tag on any low-confidence item (so they know where to look). Tap a row to open a full inline edit; never confront the user with a giant form."
      frame={<P2.Review />}
      states={[
        { label: 'Loading · OCR running', frame: <P2.Review state="loading" /> },
        { label: 'Parse failed',          frame: <P2.Review state="fail" /> },
        { label: 'DE locale',             frame: <P2.Review lang="de" /> },
      ]}
      anatomy={[
        ['Header bar',       '44pt total · back · step pip · kebab (More) right'],
        ['Title',            '28/1 SF Pro 600 · count "8 items" italic serif weight 400 · 6pt to meta'],
        ['Meta line',        '14 mute · "From {store} · {date} · {total}"'],
        ['Confidence chips', '14pt above list · sage chip "N confident" + amber chip "M check" · only 2 chips ever, per system rule'],
        ['Item row',         '12pt vertical pad · Tile 40 · name 15/500 · raw mono 11 mute-soft below · qty + chevron right'],
        ['Low-conf row',     'Background tint rgba(185,113,56,0.04) · "· check" amber-deep tag after name'],
        ['Add missing',      'Dashed 1px border · 14pt pad · plus icon + body mute'],
        ['Sticky CTA',       '52pt × 100% · gradient fade above · disabled while any "check" row remains'],
      ]}
      components={[
        { name: 'ItemRow', new: true },
        { name: 'SK.Tile' }, { name: '.sk-chip-sage' }, { name: '.sk-chip-amber' },
        { name: '.sk-btn-primary' }, { name: 'SkeletonRow', new: true },
      ]}
      copy={[
        ['step',            'Step 2 of 3',                              'Schritt 2 von 3'],
        ['title',           'Review 8 items',                            'Prüfe 8 Posten'],
        ['meta',            'From Grocery Markt · 17.05.2026 · €25.12',  'Von Grocery Markt · 17.05.2026 · €25,12'],
        ['chip.conf',       '7 confident',                               '7 sicher'],
        ['chip.check',      '1 needs review',                            '1 prüfen'],
        ['row.check',       '· check',                                   '· prüfen'],
        ['add',             'Add missing item',                          'Posten hinzufügen'],
        ['cta',             'Continue to placement',                     'Weiter zur Einlagerung'],
        ['load.title',      'Reading your receipt …',                    'Zettel wird gelesen …'],
        ['load.body',       "We're matching products against our list. A few seconds.", 'Wir gleichen Produkte ab. Das dauert ein paar Sekunden.'],
        ['fail.title',      "We couldn't read this one.",                 'Konnten den Zettel nicht lesen.'],
        ['fail.body',       'Might be a tricky angle or an unusual format. You can add items by hand.', 'Vielleicht zu unscharf, oder ein ungewohntes Format. Du kannst die Posten per Hand eintragen.'],
        ['fail.cta',        'Add manually',                              'Manuell hinzufügen'],
        ['fail.alt',        'Try scanning again',                        'Erneut scannen'],
      ]}
      a11y={[
        'List is a single <ul>; each item is a <li> with a <button> for "edit". Name + qty + raw are part of the accessible name; status is aria-description.',
        'Low-confidence rows are announced as "needs review" — colour and the "· check" tag are redundant, not alternative.',
        'Confidence chips are <button>s that filter the list — not decorative.',
        'When the CTA is disabled, focus jumps to the first low-confidence row with a clarifying message.',
      ]}
      motion={[
        'Row edit: 240ms sheet rise from below; row stays in place (no list jump).',
        'Skeleton shimmer: 1.4s ease-in-out infinite; row heights match final to avoid layout-shift.',
        'Fail-state PaperBag is replaced by a still scan-glyph card; nothing animates on this state by design.',
      ]}
      data={[
        'Confidence thresholds (placeholder, confirm with vendor): high ≥ 0.85, med 0.65–0.85, low < 0.65.',
        'Raw OCR string preserved per row for re-matching when the user edits the name.',
        'Empty parse (zero items recognised) routes to the fail state, not an empty list.',
        '"Add missing" creates a row with status=manual; manual rows never carry a confidence chip.',
      ]}
      tokens={[]}
    />
  );
}

function P2_Placement_Section() {
  return (
    <P2D.Section
      n="06" title="Storage placement" ticket="SCKRL-305"
      priority="P0"
      hierarchy="Onboarding-style · step 3 of 3 · drag + tap interaction parity"
      lede="The signature interaction. Drag-and-drop is the primary path — playful, fast, satisfying — but every chip and every zone also responds to tap, so the screen passes accessibility without a separate mode. 'Auto-sort' accepts the category defaults so a user can ship in two taps. The amber ring on a chip hints at its category's default zone before any interaction; the user can override at any time."
      frame={<P2.Placement />}
      states={[
        { label: 'Drag · ghost mid-air',  frame: <P2.Placement state="drag" /> },
        { label: 'Tap alternative',       frame: <P2.Placement state="tap" /> },
        { label: 'DE locale',             frame: <P2.Placement lang="de" /> },
      ]}
      anatomy={[
        ['Dock',             'White card 16pt radius · 12pt pad · eyebrow + counter row · chip wrap below'],
        ['Drag chip',        '44pt tall · 14pt radius · Tile 26 + label · shadow-sm · selected = +outline ink 2px + 6/16 shadow + translate-y -2'],
        ['Drop zone',        '1.5px dashed --border · 20pt radius · 12pt pad · Zone glyph 42 + name + "drop items here" meta'],
        ['Active zone',      'Border + bg = --sage / --sage-soft · "release here" sage chip top-right'],
        ['Tap target zone',  'Dashed --ink 2px when a chip is selected · "Place here" pill ink top-right'],
        ['Ghost chip',       'Position absolute · rotate -3deg · scale 1.05 · sage 1.5px ring · pointer-events: none'],
        ['CTA',              '52pt × 100% · always enabled (auto-sort accepts unplaced)'],
      ]}
      components={[
        { name: 'DragChip',   new: true },
        { name: 'DropTarget', new: true },
        { name: 'SK.Zone' }, { name: 'SK.Tile' }, { name: '.sk-grocery-chip' }, { name: '.sk-zone' },
      ]}
      copy={[
        ['step',            'Step 3 of 3',                              'Schritt 3 von 3'],
        ['auto',            'Auto-sort',                                'Auto-Sortierung'],
        ['title',           'Where does it go?',                         'Wohin damit?'],
        ['sub.drag',        'Drag each item into its storage spot.',    'Ziehe jeden Posten an seinen Lagerort.'],
        ['sub.tap',         'Tap an item, then tap its storage spot.',  'Tippe einen Posten an, dann den Lagerort.'],
        ['dock.head',       'TO PLACE · {n}',                            'EINZULAGERN · {n}'],
        ['dock.done',       '{m} / {n} done',                            '{m} / {n} fertig'],
        ['zone.empty',      'drop items here',                           'hier ablegen'],
        ['zone.placed',     '{n} placed',                                '{n} eingelagert'],
        ['zone.active',     'release here',                              'hier loslassen'],
        ['zone.tap',        'Place here',                                'Hier ablegen'],
        ['cta',             'Save & set reminders',                      'Speichern & Hinweise einrichten'],
      ]}
      a11y={[
        'Tap alternative is *always live* — drag is layered on top of it, not switched between.',
        'Each chip is a <button aria-pressed="false">; activating it sets aria-pressed="true" and announces "selected, choose a storage spot".',
        'Each zone is a <button>; when a chip is selected, zones become primary actions (announced "Place {chip} in {zone}").',
        'Drag operations are decorative for AT users; the tap path satisfies WCAG 2.1.1.',
        'Auto-sort announces "Placed 5 items" with a live region after completion.',
      ]}
      motion={[
        'Pickup: 120ms scale 1.05 + tilt -3deg; shadow lifts to shadow-lg.',
        'Drop hit: 180ms snap into chip-row slot at zone bottom; ghost dissolves over 80ms.',
        'Drop miss: shake 4px × 2 cycles over 220ms; chip returns to dock at original index.',
        'Reduced motion: no tilt, no shake — chip simply moves to destination or back, 100ms linear.',
      ]}
      data={[
        'Category → default zone map lives in feature flags (initial: dairy→fridge, frozen→freezer, pantry/canned/spices→pantry, drinks/produce→fridge, bakery→cabinet).',
        'Placement writes to local first; full sync on Save.',
        'Auto-sort sends per-category defaults; user-overridden chips are kept as-is.',
        '"Save" routes to Expiry confirmation (07), never back to the dashboard directly.',
      ]}
      tokens={[]}
    />
  );
}

function P2_Expiry_Section() {
  return (
    <P2D.Section
      n="07" title="Expiry confirmation" ticket="SCKRL-306"
      priority="P0"
      hierarchy="New screen — last step before dashboard · 1 inline picker variant"
      lede="The brief asks the app to never take full responsibility for expiry — so the screen names the gamble in language and visual. 'Estimated' is mono mute, 'Confirmed' is mono sage. The estimate buckets are six big presets, not a calendar wheel: today / tomorrow / 2d / 5d / 1w / 2w covers ~90% of fresh items. A 'Confirm all' shortcut at the top lets users who trust the estimates ship in one tap; 'Save without reminders' at the bottom gives the unsure a permanent escape."
      frame={<P2.Expiry />}
      states={[
        { label: 'Inline picker open',  frame: <P2.Expiry state="focus" /> },
        { label: 'DE locale',           frame: <P2.Expiry lang="de" /> },
      ]}
      anatomy={[
        ['Top bar',          '44pt · back · "Last step" mono pip · "Confirm all" text button right in --sage-deep'],
        ['Title',            'Title 26/1 · "go?" italic serif · 4pt to subtitle 13 mute'],
        ['List',             'White card 18pt radius · 1px --border · 12pt vertical pad on row'],
        ['Row',              'Tile 40 · name 15/500 · status mono 11 (mute for estimated, sage-deep for confirmed) · date pill right'],
        ['Date pill',        '30pt × auto · 999 radius · estimated = bg-warm, confirmed = sage-soft · chevron-down 12 right'],
        ['Inline picker',    'Same row width · amber-soft tint · 6 quick-pick chips wrap · nudge segmented control below'],
        ['Quick pick',       '32pt tall · 999 radius · selected = ink bg, deselected = card bg + 1px border'],
        ['Nudge control',    '3-up 36pt segments · selected = ink bg · 12pt mono labels'],
        ['CTA stack',        'Primary "Save reminders" 52 + tertiary "Save without" 38 · 30pt bottom inset'],
      ]}
      components={[
        { name: 'ExpiryRow',         new: true },
        { name: 'ExpiryQuickPicks',  new: true },
        { name: 'NudgeSegment',      new: true },
        { name: 'SK.Tile' }, { name: '.sk-btn-primary' },
      ]}
      copy={[
        ['step',            'Last step',                                 'Letzter Schritt'],
        ['title',           'When does it expire?',                      'Wann läuft es ab?'],
        ['sub',             'Estimated from category — you can tighten any.', 'Geschätzt aus Kategorie — du kannst sicher anpassen.'],
        ['confirmAll',      'Confirm all',                               'Alle bestätigen'],
        ['status.est',      'estimated',                                 'geschätzt'],
        ['status.conf',     'confirmed',                                 'bestätigt'],
        ['pick.today',      'Today',                                     'Heute'],
        ['pick.tomorrow',   'Tomorrow',                                  'Morgen'],
        ['pick.days',       'in {n} days',                               'in {n} Tagen'],
        ['pick.weeks',      'in {n} weeks',                              'in {n} Wochen'],
        ['nudge.label',     'Nudge me',                                  'Nudge mich'],
        ['nudge.before',    '3 days before',                             '3 Tage vorher'],
        ['nudge.day',       'On the day',                                'Am Tag'],
        ['nudge.never',     'Never',                                     'Nie'],
        ['cta.save',        'Save reminders',                            'Hinweise speichern'],
        ['cta.skip',        'Save without reminders',                    'Ohne Hinweise speichern'],
      ]}
      a11y={[
        'Estimated/confirmed status is announced as aria-description on the row, not a separate node.',
        'Date pill announces full date as well as relative ("Tomorrow, 18 May 2026").',
        'Inline picker traps focus inside the row; collapsing it returns focus to the date pill.',
        '"Confirm all" requires explicit user activation — never default-tapped.',
        'Push permission is *only* requested if the user picks any "Nudge me" value other than "Never" and taps Save reminders.',
      ]}
      motion={[
        'Row expand: 240ms ease-out, height auto → measured; amber-soft tint fades in over 160ms.',
        'Quick-pick tap: ink bg fills from selected pill, 120ms.',
        'Save: success haptic + 280ms slide-up to dashboard.',
      ]}
      data={[
        'Estimated date = today + category-shelf-life lookup (placeholder table — confirm with product, SCKRL-405).',
        'Confirmed = user-overridden date OR user-tapped "Confirm" on the same row.',
        'Reminder schedule: nudge=3d-before → push at 9am 3 days prior; on-the-day → push at 9am.',
        '"Save without reminders" still writes the expiry date for the dashboard summary — it only skips push scheduling.',
      ]}
      tokens={[]}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Top-level layout
// ─────────────────────────────────────────────────────────────
function App() {
  return (
    <div className="sk-app" style={{
      background: 'var(--bg)', color: 'var(--ink)',
      minHeight: '100vh',
      padding: '0 56px',
    }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <P2_Cover />
        <P2_Welcome_Section />
        <P2_Household_Section />
        <P2_Dashboard_Section />
        <P2_ScanEntry_Section />
        <P2_Review_Section />
        <P2_Placement_Section />
        <P2_Expiry_Section />
        <P2_UniversalStates />
        <P2_Appendix />
      </div>
    </div>
  );
}

Object.assign(window, { App });
const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />);
