import {
  Avatar,
  Button,
  Card,
  CardFlat,
  CardKraft,
  Chip,
  Eyebrow,
  ListRow,
  RoundIconButton,
  Tile,
  Zone,
  buttonSizes,
  buttonVariants,
  categoryMeta,
  chipVariants,
  tileCategories,
  zoneKinds,
  zoneMeta,
  type ButtonSize,
  type ButtonVariant,
  type ChipVariant,
  type TileCategory,
  type ZoneKind,
} from '@sackerl/ui';

import styles from './page.module.css';

const buttonLabels = {
  ghost: 'Secondary',
  ink: 'Continue',
  primary: 'Scan receipt',
  soft: 'Later',
} as const satisfies Record<ButtonVariant, string>;

const chipLabels = {
  amber: 'Expiring',
  default: 'All items',
  ghost: 'Optional',
  sage: 'In stock',
} as const satisfies Record<ChipVariant, string>;

function buttonIconFor(variant: ButtonVariant): 'arrowRight' | 'scan' | undefined {
  if (variant === 'primary') {
    return 'scan';
  }

  if (variant === 'ink') {
    return 'arrowRight';
  }

  return undefined;
}

function categoryLabel(category: TileCategory): string {
  return categoryMeta[category].label;
}

function zoneLabel(kind: ZoneKind): string {
  return zoneMeta[kind].label;
}

export default function DesignComponentsPage(): React.ReactElement {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Eyebrow withMark>SCKRL-004</Eyebrow>
        <h1 className={styles.title}>Core component library</h1>
        <p className={styles.copy}>
          Stateless web primitives using the initial design overview atoms, shared icon registry,
          token CSS variables, and implementation typography rules.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="buttons-heading">
        <div className={styles.sectionHeader}>
          <Eyebrow>Buttons</Eyebrow>
          <h2 id="buttons-heading">Variants and sizes</h2>
        </div>
        <div className={styles.buttonMatrix}>
          {buttonVariants.map((variant) => (
            <div className={styles.buttonRow} key={variant}>
              <span className={styles.rowLabel}>{variant}</span>
              {buttonSizes.map((size: ButtonSize) => (
                <Button
                  key={`${variant}-${size}`}
                  leadingIcon={buttonIconFor(variant)}
                  size={size}
                  trailingIcon={variant === 'ghost' ? 'chevron-right' : undefined}
                  variant={variant}
                >
                  {buttonLabels[variant]}
                </Button>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="chips-heading">
        <div className={styles.sectionHeader}>
          <Eyebrow>Chips</Eyebrow>
          <h2 id="chips-heading">Status and counts</h2>
        </div>
        <div className={styles.inlineGroup}>
          {chipVariants.map((variant, index) => (
            <Chip count={index + 2} key={variant} variant={variant}>
              {chipLabels[variant]}
            </Chip>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="cards-heading">
        <div className={styles.sectionHeader}>
          <Eyebrow>Cards</Eyebrow>
          <h2 id="cards-heading">Surface set</h2>
        </div>
        <div className={styles.cardGrid}>
          <Card className={styles.demoCard}>
            <Eyebrow>Default</Eyebrow>
            <h3>Review groceries</h3>
            <p>Bordered white surface for repeated content and editable lists.</p>
          </Card>
          <CardFlat className={styles.demoCard}>
            <Eyebrow>Flat</Eyebrow>
            <h3>Quiet summary</h3>
            <p>Same radius and background without the border treatment.</p>
          </CardFlat>
          <CardKraft className={styles.demoCard}>
            <Eyebrow>Identity</Eyebrow>
            <h3>Your Sackerl</h3>
            <p>The kraft paper texture is reserved for brand moments.</p>
          </CardKraft>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="atoms-heading">
        <div className={styles.sectionHeader}>
          <Eyebrow>Atoms</Eyebrow>
          <h2 id="atoms-heading">Tiles, zones, avatars, controls</h2>
        </div>
        <div className={styles.atomGrid}>
          <div className={styles.atomBlock}>
            <h3>Categories</h3>
            <div className={styles.tileGrid}>
              {tileCategories.map((category) => (
                <div className={styles.namedAtom} key={category}>
                  <Tile category={category} />
                  <span>{categoryLabel(category)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.atomBlock}>
            <h3>Storage zones</h3>
            <div className={styles.zoneGrid}>
              {zoneKinds.map((kind) => (
                <div className={styles.namedAtom} key={kind}>
                  <Zone kind={kind} />
                  <span>{zoneLabel(kind)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.controlCluster}>
            <Avatar label="Household member" name="Mira Huber" />
            <Avatar label="Household member" name="Redon Halimaj" size="lg" />
            <RoundIconButton icon="settings" label="Settings" />
            <RoundIconButton icon="close" label="Close" variant="dark" />
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="rows-heading">
        <div className={styles.sectionHeader}>
          <Eyebrow>List row</Eyebrow>
          <h2 id="rows-heading">Review list pattern</h2>
        </div>
        <div className={styles.listFrame}>
          <ListRow
            action={<Chip variant="amber">2 days</Chip>}
            category="produce"
            meta="Fridge drawer"
            title="Baby spinach"
          />
          <ListRow
            action={<Chip variant="sage">12 left</Chip>}
            meta="Cold storage"
            title="Greek yoghurt"
            zone="fridge"
          />
          <ListRow
            action={<RoundIconButton icon="chevron-right" label="Open pasta details" />}
            category="pantry"
            meta="Pantry shelf"
            title="Rigatoni"
          />
        </div>
      </section>
    </main>
  );
}
