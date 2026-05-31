import { colorTokens } from '@sackerl/tokens';

import styles from './page.module.css';

function humanizeTokenName(name: string): string {
  return name.replace(/([A-Z])/g, ' $1').replace(/^./, (first) => first.toUpperCase());
}

export default function DesignTokensPage(): React.ReactElement {
  const entries = Object.entries(colorTokens);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.eyebrow}>SCKRL-002</div>
        <h1 className={styles.title}>Design tokens</h1>
        <p className={styles.copy}>
          Provisional token inventory extracted from the initial design overview. Values are kept
          close to the source handoff and exposed through both TypeScript and CSS variables.
        </p>
      </header>

      <section className={styles.grid} aria-label="Colour tokens">
        {entries.map(([name, token]) => (
          <article className={styles.card} key={name}>
            <div aria-hidden="true" className={styles.swatch} style={{ background: token.value }} />
            <div className={styles.meta}>
              <div className={styles.nameRow}>
                <span className={styles.name}>{humanizeTokenName(name)}</span>
                <span className={styles.cssVar}>{token.cssVariable}</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.label}>Value</span>
                <span className={styles.value}>{token.value}</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.label}>OKLCH</span>
                <span className={styles.value}>{token.oklch}</span>
              </div>
              <p className={styles.role}>{token.role}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
