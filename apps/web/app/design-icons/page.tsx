import { Icon, sourceIconNames } from '@sackerl/ui';

import styles from './page.module.css';

export default function DesignIconsPage(): React.ReactElement {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.eyebrow}>SCKRL-005</div>
        <h1 className={styles.title}>Icon set</h1>
        <p className={styles.copy}>
          Stroked line icons extracted from the initial design overview. Icons inherit currentColor,
          use a 24px viewBox, and default to a 1.6 stroke width.
        </p>
      </header>

      <section className={styles.grid} aria-label="Icon set">
        {sourceIconNames.map((name) => (
          <article className={styles.card} key={name}>
            <div className={styles.glyph}>
              <Icon name={name} size={28} title={name} />
            </div>
            <span className={styles.name}>{name}</span>
          </article>
        ))}
      </section>
    </main>
  );
}
