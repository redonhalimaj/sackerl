// sackerl — print layout (one artboard per page)

const {
  CoverNote, SystemNote, Phone,
  ScreenOnboarding, ScreenDashboard, ScreenScan, ScreenReview, ScreenPlacement,
  ScreenLocation, ScreenExpiring, ScreenNotifs, ScreenSuggestions, ScreenPremium,
  ChromeWindow, DesktopDashboard,
} = window;

function PrintPage({ children, w, h, landscape, scale }) {
  return (
    <div className={'pp' + (landscape ? ' pp-landscape' : '')}>
      <div className="pp-inner" style={{
        width: w, height: h,
        transform: scale ? `scale(${scale})` : undefined,
      }}>
        {children}
      </div>
    </div>
  );
}

// Wrap the cover / system frames so they keep their canvas-mode framing
function FramedBoard({ bg = 'transparent', border, children, w, h }) {
  return (
    <div style={{
      width: w, height: h, background: bg, border, position: 'relative',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

function PrintApp() {
  return (
    <>
      <PrintPage w={560} h={1000}>
        <FramedBoard w={560} h={1000} bg="var(--bg)" border="1px solid var(--border)">
          <CoverNote />
        </FramedBoard>
      </PrintPage>

      <PrintPage w={560} h={1000}>
        <FramedBoard w={560} h={1000} bg="var(--bg)" border="1px solid var(--border)">
          <SystemNote />
        </FramedBoard>
      </PrintPage>

      {/* Mobile screens, two-up where possible to use page real estate */}
      {[
        ['03 Onboarding',   <ScreenOnboarding />],
        ['04 Dashboard',    <ScreenDashboard />],
        ['05 Scan receipt', <ScreenScan />],
        ['06 Review items', <ScreenReview />],
        ['07 Placement',    <ScreenPlacement />],
        ['08 Storage',      <ScreenLocation />],
        ['09 Expiring',     <ScreenExpiring />],
        ['10 Notifications',<ScreenNotifs />],
        ['11 Suggestions',  <ScreenSuggestions />],
        ['12 Premium',      <ScreenPremium />],
      ].map(([label, screen], i) => (
        <PrintPage w={460} h={920} key={i}>
          <PageCaption n={String(i + 3).padStart(2, '0')} label={label.replace(/^\d+\s/, '')} />
          <Phone>{screen}</Phone>
        </PrintPage>
      ))}

      {/* Desktop — landscape page with scale */}
      <PrintPage w={1320} h={840} landscape scale={0.76}>
        <PageCaption n="13" label="Desktop dashboard" />
        <ChromeWindow tabs={[{ title: 'sackerl — Home' }, { title: 'Recipes' }]}
          activeIndex={0} url="sackerl.app/home" width={1320} height={840}>
          <DesktopDashboard />
        </ChromeWindow>
      </PrintPage>
    </>
  );
}

function PageCaption({ n, label }) {
  return (
    <div style={{
      position: 'absolute', top: 8, left: 0, right: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 4px',
      fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
      fontSize: 9, letterSpacing: 0.22, color: '#6E7A6A', textTransform: 'uppercase',
    }}>
      <span><span style={{ color: '#1B2418', fontWeight: 600 }}>sackerl</span> · {label}</span>
      <span>N° {n}</span>
    </div>
  );
}

const printRoot = ReactDOM.createRoot(document.getElementById('app'));
printRoot.render(<PrintApp />);

// Auto-print once fonts have settled and Babel has parsed
(async function autoPrint() {
  try { await document.fonts.ready; } catch (e) {}
  await new Promise(r => setTimeout(r, 700));
  window.print();
})();
