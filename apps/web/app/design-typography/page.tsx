import { typography, type TypographyName } from '@sackerl/tokens';

import styles from './page.module.css';

const specimens = [
  {
    name: 'display',
    className: styles.display!,
    sample: '85 things at home',
  },
  {
    name: 'headline',
    className: styles.headline!,
    sample: 'Your Sackerl',
  },
  {
    name: 'title',
    className: styles.typeTitle!,
    sample: 'Use these first',
  },
  {
    name: 'body',
    className: styles.body!,
    sample: 'Spinach, yoghurt, and mushrooms are ready for dinner tonight.',
  },
  {
    name: 'caption',
    className: styles.caption!,
    sample: 'Expires in 2 days',
  },
] as const satisfies readonly {
  readonly className: string;
  readonly name: TypographyName;
  readonly sample: string;
}[];

function labelFor(name: TypographyName): string {
  return name.replace(/([A-Z])/g, ' $1').replace(/^./, (first) => first.toUpperCase());
}

export default function DesignTypographyPage(): React.ReactElement {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.eyebrow}>SCKRL-003</div>
        <h1 className={styles.title}>Typography</h1>
        <p className={styles.copy}>
          App typography uses the Sackerl font stacks and implementation text scale. Letter spacing
          is held at zero for stable rendering across web and native.
        </p>
      </header>

      <section className={styles.stack} aria-label="Typography scale">
        {specimens.map(({ className, name, sample }) => {
          const token = typography[name];

          return (
            <article className={styles.card} key={name}>
              <div className={styles.meta}>
                <span>{labelFor(name)}</span>
                <span>{token.fontSize}px</span>
                <span>{token.fontWeight}</span>
                <span>line {token.lineHeight}</span>
                <span>tracking {token.letterSpacing}</span>
              </div>
              <p className={`${styles.specimen} ${className}`}>{sample}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
