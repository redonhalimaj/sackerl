import { Chip, PaperBag, paperBagDefaults } from '@sackerl/ui';

import styles from './page.module.css';

export default function DesignPaperBagPage(): React.ReactElement {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.eyebrow}>SCKRL-006</div>
        <h1 className={styles.title}>Animated paper bag</h1>
        <p className={styles.copy}>
          SVG Sackerl component ported from the initial atom reference, with default falling items,
          stamped label, kraft gradients, paper fibers, and reduced-motion fallback.
        </p>
      </header>

      <section className={styles.stage} aria-label="Paper bag component preview">
        <div className={styles.hero}>
          <PaperBag />
        </div>
        <div className={styles.meta}>
          <Chip variant="sage">{paperBagDefaults.animationDuration}s cycle</Chip>
          <Chip variant="amber">4 items</Chip>
          <Chip variant="ghost">Reduced motion ready</Chip>
        </div>
      </section>

      <section className={styles.variants} aria-label="Paper bag static variants">
        <article>
          <PaperBag animated={false} height={190} label="STATIC" width={180} />
          <span>Static</span>
        </article>
        <article>
          <PaperBag height={190} label="WIEN" width={180} />
          <span>Compact</span>
        </article>
      </section>
    </main>
  );
}
