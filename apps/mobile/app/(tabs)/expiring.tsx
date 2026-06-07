import { colors, nativeFont, nativeTypography, space } from '@sackerl/tokens';
import type { AuthenticatedUserContext, StockItem, StorageZone } from '@sackerl/api-client';
import { categoryMeta, type TileCategory } from '@sackerl/ui';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState, type JSX } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useAuthSession } from '../../lib/auth-session';
import { getMobileItemsClient } from '../../lib/items';
import { getMobileProfileClient } from '../../lib/profile';

type ExpiringBucketId = 'nextWeek' | 'thisWeek' | 'today' | 'tomorrow';
type ExpiringLoadState = 'error' | 'loading' | 'ready';

type ExpiringBucket = {
  readonly id: ExpiringBucketId;
  readonly items: readonly StockItem[];
  readonly title: string;
};

const typography =
  Platform.OS === 'ios'
    ? nativeTypography.ios
    : Platform.OS === 'android'
      ? nativeTypography.android
      : nativeTypography.fallback;

const fontFamily =
  Platform.OS === 'ios'
    ? nativeFont.ios
    : Platform.OS === 'android'
      ? nativeFont.android
      : nativeFont.fallback;

const expiringPageSize = 100;

function ChevronLeftIcon(): JSX.Element {
  return (
    <Svg fill="none" height={21} stroke={colors.ink} viewBox="0 0 24 24" width={21}>
      <Path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
    </Svg>
  );
}

function FilterIcon(): JSX.Element {
  return (
    <Svg fill="none" height={21} stroke={colors.ink} viewBox="0 0 24 24" width={21}>
      <Path
        d="M4 6h16M7 12h10M10 18h4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function CategoryTile({ category }: { readonly category: TileCategory }): JSX.Element {
  const meta = categoryMeta[category];

  return (
    <View style={[styles.categoryTile, { backgroundColor: meta.bg }]}>
      <Text style={[styles.categoryTileText, { color: meta.ink }]}>{meta.short}</Text>
    </View>
  );
}

function RoundIconButton({
  children,
  label,
  onPress,
}: {
  readonly children: JSX.Element;
  readonly label: string;
  readonly onPress?: (() => void) | undefined;
}): JSX.Element {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.roundButton, pressed ? styles.pressed : null]}
    >
      {children}
    </Pressable>
  );
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIsoDate(value: string, days: number): string {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function daysUntilIsoDate(value: string, now = new Date()): number {
  const [year, month, day] = value.split('-').map(Number);
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const targetUtc = Date.UTC(year ?? now.getFullYear(), (month ?? 1) - 1, day ?? 1);

  return Math.round((targetUtc - todayUtc) / 86_400_000);
}

function expiryBucketId(item: StockItem): ExpiringBucketId {
  const days = item.expiresOn ? daysUntilIsoDate(item.expiresOn) : 14;

  if (days <= 0) {
    return 'today';
  }

  if (days === 1) {
    return 'tomorrow';
  }

  return days <= 7 ? 'thisWeek' : 'nextWeek';
}

function formatQuantity(item: StockItem): string {
  const quantity = Number.isInteger(item.qtyValue)
    ? String(item.qtyValue)
    : new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(item.qtyValue);

  return `${quantity} ${item.qtyUnit}`;
}

function formatExpiryLabel(item: StockItem): string {
  if (!item.expiresOn) {
    return 'soon';
  }

  const days = daysUntilIsoDate(item.expiresOn);

  if (days < 0) {
    return 'overdue';
  }

  if (days === 0) {
    return 'today';
  }

  if (days === 1) {
    return 'tomorrow';
  }

  return `${days}d`;
}

function formatFullDate(value: string | null): string {
  if (!value) {
    return 'No date';
  }

  const [year, month, day] = value.split('-').map(Number);

  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(
    new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1)),
  );
}

function progressWidth(item: StockItem): `${number}%` {
  if (!item.expiresOn) {
    return '0%';
  }

  const days = Math.max(0, Math.min(14, daysUntilIsoDate(item.expiresOn)));

  return `${Math.max(12, Math.round(((14 - days) / 14) * 100))}%`;
}

function zoneLabelsById(zones: readonly StorageZone[]): ReadonlyMap<string, string> {
  return new Map(zones.map((zone) => [zone.id, zone.label]));
}

function groupExpiringItems(items: readonly StockItem[]): readonly ExpiringBucket[] {
  const grouped: Record<ExpiringBucketId, StockItem[]> = {
    nextWeek: [],
    thisWeek: [],
    today: [],
    tomorrow: [],
  };

  for (const item of items) {
    grouped[expiryBucketId(item)].push(item);
  }

  const buckets: readonly ExpiringBucket[] = [
    { id: 'today', items: grouped.today, title: 'Today' },
    { id: 'tomorrow', items: grouped.tomorrow, title: 'Tomorrow' },
    { id: 'thisWeek', items: grouped.thisWeek, title: 'This week' },
    { id: 'nextWeek', items: grouped.nextWeek, title: 'Next week' },
  ];

  return buckets.filter((bucket) => bucket.items.length > 0);
}

async function loadAllExpiringItems(
  context: AuthenticatedUserContext,
  householdId: string,
): Promise<{ readonly items: readonly StockItem[]; readonly total: number }> {
  const itemsClient = getMobileItemsClient();
  const items: StockItem[] = [];
  let page = 1;
  let total: number | null = null;

  do {
    const result = await itemsClient.listItems(context, {
      expiresWithinDays: 14,
      householdId,
      page,
      pageSize: expiringPageSize,
    });

    items.push(...result.items.filter((item) => item.expiresOn));
    total = result.pagination.total;

    if (result.items.length < expiringPageSize || (total !== null && items.length >= total)) {
      break;
    }

    page += 1;
  } while (page <= 50);

  return { items, total: total ?? items.length };
}

function SummaryChip({
  count,
  isPrimary,
  label,
}: {
  readonly count: number;
  readonly isPrimary?: boolean | undefined;
  readonly label: string;
}): JSX.Element {
  return (
    <View style={[styles.summaryChip, isPrimary ? styles.summaryChipPrimary : null]}>
      <Text style={[styles.summaryChipText, isPrimary ? styles.summaryChipTextPrimary : null]}>
        {label} · {count}
      </Text>
    </View>
  );
}

function ExpiringRow({
  actionItemId,
  item,
  onCompost,
  onSnooze,
  onUsed,
  zoneLabel,
}: {
  readonly actionItemId: string | undefined;
  readonly item: StockItem;
  readonly onCompost: (item: StockItem) => void;
  readonly onSnooze: (item: StockItem) => void;
  readonly onUsed: (item: StockItem) => void;
  readonly zoneLabel: string;
}): JSX.Element {
  const days = item.expiresOn ? daysUntilIsoDate(item.expiresOn) : 14;
  const isBusy = actionItemId === item.id;
  const isUrgent = days <= 2;

  return (
    <View style={styles.itemRow}>
      <View style={styles.itemMainRow}>
        <CategoryTile category={item.categoryId} />
        <View style={styles.itemCopy}>
          <Text numberOfLines={1} style={styles.itemName}>
            {item.name}
          </Text>
          <Text numberOfLines={1} style={styles.itemMeta}>
            {formatQuantity(item)} · {zoneLabel}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: progressWidth(item) },
                isUrgent ? styles.progressFillUrgent : null,
              ]}
            />
          </View>
        </View>
        <View style={[styles.expiryChip, isUrgent ? styles.expiryChipUrgent : null]}>
          <Text style={[styles.expiryChipText, isUrgent ? styles.expiryChipTextUrgent : null]}>
            {formatExpiryLabel(item)}
          </Text>
          <Text style={styles.expiryChipDate}>{formatFullDate(item.expiresOn)}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          accessibilityLabel={`Mark ${item.name} as used`}
          accessibilityRole="button"
          disabled={isBusy}
          onPress={() => {
            onUsed(item);
          }}
          style={({ pressed }) => [
            styles.actionButton,
            styles.actionButtonUsed,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={[styles.actionButtonText, styles.actionButtonTextUsed]}>Used</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={`Snooze ${item.name} for 2 days`}
          accessibilityRole="button"
          disabled={isBusy}
          onPress={() => {
            onSnooze(item);
          }}
          style={({ pressed }) => [
            styles.actionButton,
            styles.actionButtonSnooze,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.actionButtonText}>Snooze 2d</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={`Compost ${item.name}`}
          accessibilityRole="button"
          disabled={isBusy}
          onPress={() => {
            onCompost(item);
          }}
          style={({ pressed }) => [
            styles.actionButton,
            styles.actionButtonCompost,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={[styles.actionButtonText, styles.actionButtonTextCompost]}>Compost</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ExpiringRoute(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuthSession();
  const [actionItemId, setActionItemId] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [items, setItems] = useState<readonly StockItem[]>([]);
  const [loadState, setLoadState] = useState<ExpiringLoadState>('loading');
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [totalItems, setTotalItems] = useState(0);
  const [zoneLabels, setZoneLabels] = useState<ReadonlyMap<string, string>>(() => new Map());

  const groupedItems = useMemo(() => groupExpiringItems(items), [items]);
  const todayCount = useMemo(
    () => items.filter((item) => expiryBucketId(item) === 'today').length,
    [items],
  );
  const weekCount = useMemo(
    () =>
      items.filter((item) => {
        const bucket = expiryBucketId(item);

        return bucket === 'today' || bucket === 'tomorrow' || bucket === 'thisWeek';
      }).length,
    [items],
  );
  const nextWeekCount = useMemo(
    () => items.filter((item) => expiryBucketId(item) === 'nextWeek').length,
    [items],
  );
  const subtitle =
    totalItems > 0
      ? `${totalItems} ${totalItems === 1 ? 'item wants' : 'items want'} your attention.`
      : 'Nothing needs attention for the next two weeks.';

  const loadExpiringItems = useCallback(async () => {
    if (!session?.user) {
      return;
    }

    setLoadState('loading');
    setErrorMessage(undefined);

    try {
      const context = {
        accessToken: session.access_token,
        user: {
          email: session.user.email,
          id: session.user.id,
        },
      };
      const household = await getMobileProfileClient().getHousehold(context);

      if (!household) {
        setItems([]);
        setTotalItems(0);
        setZoneLabels(new Map());
        setLoadState('ready');
        return;
      }

      const [expiringResult, zones] = await Promise.all([
        loadAllExpiringItems(context, household.id),
        getMobileItemsClient().listZones(context, household.id),
      ]);

      setItems(expiringResult.items);
      setTotalItems(expiringResult.total);
      setZoneLabels(zoneLabelsById(zones));
      setLoadState('ready');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load expiring items.');
      setLoadState('error');
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      void loadExpiringItems();
    }, [loadExpiringItems]),
  );

  function authContext(): AuthenticatedUserContext | null {
    if (!session?.user) {
      return null;
    }

    return {
      accessToken: session.access_token,
      user: {
        email: session.user.email,
        id: session.user.id,
      },
    };
  }

  async function removeItem(item: StockItem, kind: 'composted' | 'used') {
    const context = authContext();

    if (!context || actionItemId) {
      return;
    }

    setActionItemId(item.id);
    setStatusMessage(undefined);

    try {
      await getMobileItemsClient().deleteItem(context, {
        householdId: item.householdId,
        id: item.id,
        removalReason: kind === 'used' ? 'used' : 'composted',
        removedOn: todayIsoDate(),
      });

      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      setTotalItems((current) => Math.max(0, current - 1));
      setStatusMessage(
        kind === 'used' ? `${item.name} marked as used.` : `${item.name} composted.`,
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to update item.');
    } finally {
      setActionItemId(undefined);
    }
  }

  async function snoozeItem(item: StockItem) {
    const context = authContext();

    if (!context || actionItemId) {
      return;
    }

    const currentExpiry = item.expiresOn ?? todayIsoDate();
    const nextExpiry = addDaysIsoDate(currentExpiry, 2);

    setActionItemId(item.id);
    setStatusMessage(undefined);

    try {
      const updatedItem = await getMobileItemsClient().updateItem(context, {
        expiresOn: nextExpiry,
        householdId: item.householdId,
        id: item.id,
      });

      const updatedDays = updatedItem.expiresOn ? daysUntilIsoDate(updatedItem.expiresOn) : 99;

      setItems((current) => {
        const nextItems =
          updatedDays <= 14
            ? current.map((currentItem) =>
                currentItem.id === updatedItem.id ? updatedItem : currentItem,
              )
            : current.filter((currentItem) => currentItem.id !== updatedItem.id);

        return [...nextItems].sort((a, b) => {
          const aDate = a.expiresOn ?? '9999-12-31';
          const bDate = b.expiresOn ?? '9999-12-31';

          return aDate.localeCompare(bDate) || a.name.localeCompare(b.name);
        });
      });

      if (updatedDays > 14) {
        setTotalItems((current) => Math.max(0, current - 1));
      }

      setStatusMessage(`${item.name} snoozed by 2 days.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to snooze item.');
    } finally {
      setActionItemId(undefined);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom, 12) + 116,
            paddingTop: Math.max(insets.top, 44) + 10,
          },
        ]}
      >
        <View style={styles.topBar}>
          <RoundIconButton
            label="Back"
            onPress={() => {
              router.back();
            }}
          >
            <ChevronLeftIcon />
          </RoundIconButton>
          <RoundIconButton label="Filter expiring items">
            <FilterIcon />
          </RoundIconButton>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>
            <Text style={styles.titleEmphasis}>Use</Text> soon
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.summaryChips}>
          <SummaryChip count={todayCount} isPrimary label="Today" />
          <SummaryChip count={weekCount} label="This week" />
          <SummaryChip count={nextWeekCount} label="Next week" />
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}

        {loadState === 'loading' ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.amberDeep} size="small" />
            <Text style={styles.loadingText}>Checking expiry dates</Text>
          </View>
        ) : groupedItems.length > 0 ? (
          groupedItems.map((bucket) => (
            <View key={bucket.id} style={styles.section}>
              <Text style={styles.sectionEyebrow}>
                {bucket.title} · {bucket.items.length}
              </Text>
              <View style={styles.itemCard}>
                {bucket.items.map((item, index) => (
                  <View key={item.id} style={index > 0 ? styles.itemRowDivider : undefined}>
                    <ExpiringRow
                      actionItemId={actionItemId}
                      item={item}
                      onCompost={(nextItem) => {
                        void removeItem(nextItem, 'composted');
                      }}
                      onSnooze={(nextItem) => {
                        void snoozeItem(nextItem);
                      }}
                      onUsed={(nextItem) => {
                        void removeItem(nextItem, 'used');
                      }}
                      zoneLabel={zoneLabels.get(item.zoneId) ?? 'Storage'}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <View aria-hidden style={styles.emptyGlyph}>
              <Text style={styles.emptyGlyphText}>✓</Text>
            </View>
            <Text style={styles.emptyTitle}>Nothing expiring soon.</Text>
            <Text style={styles.emptyBody}>Your stock is quiet for the next two weeks.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 999,
    flex: 1,
    height: 34,
    justifyContent: 'center',
  },
  actionButtonCompost: {
    backgroundColor: colors.ink,
  },
  actionButtonSnooze: {
    backgroundColor: colors.amberSoft,
  },
  actionButtonText: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 15,
  },
  actionButtonTextCompost: {
    color: colors.bg,
  },
  actionButtonTextUsed: {
    color: colors.sageDeep,
  },
  actionButtonUsed: {
    backgroundColor: colors.sageSoft,
  },
  actionRow: {
    flexDirection: 'row',
    gap: space[2],
    marginTop: space[3],
  },
  categoryTile: {
    alignItems: 'center',
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  categoryTileText: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0,
  },
  emptyBody: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: space[2],
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.sageSoft,
    borderColor: colors.sageTint,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: space[5],
    minHeight: 210,
    padding: space[6],
  },
  emptyGlyph: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  emptyGlyphText: {
    color: colors.sageDeep,
    fontFamily: fontFamily.sans,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 25,
    marginTop: space[4],
    textAlign: 'center',
  },
  errorText: {
    ...typography.caption,
    color: colors.amberDeep,
    marginTop: space[4],
  },
  expiryChip: {
    alignItems: 'flex-end',
    backgroundColor: colors.bgWarm,
    borderRadius: 14,
    minWidth: 58,
    paddingHorizontal: space[2.5],
    paddingVertical: space[2],
  },
  expiryChipDate: {
    color: colors.muteSoft,
    fontFamily: fontFamily.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 12,
    marginTop: 1,
  },
  expiryChipText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  expiryChipTextUrgent: {
    color: colors.amberDeep,
  },
  expiryChipUrgent: {
    backgroundColor: colors.amberSoft,
  },
  header: {
    paddingHorizontal: space[1],
    paddingTop: space[2],
  },
  itemCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
  },
  itemMainRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[3],
  },
  itemMeta: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 1,
  },
  itemName: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 19,
  },
  itemRow: {
    paddingHorizontal: space[3.5],
    paddingVertical: space[3.5],
  },
  itemRowDivider: {
    borderTopColor: colors.hairline,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  loadingCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space[2],
    marginTop: space[5],
    minHeight: 112,
    padding: space[4],
  },
  loadingText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.72,
  },
  progressFill: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    height: '100%',
  },
  progressFillUrgent: {
    backgroundColor: colors.amber,
  },
  progressTrack: {
    backgroundColor: colors.bgWarm,
    borderRadius: 999,
    height: 4,
    marginTop: space[2],
    overflow: 'hidden',
  },
  roundButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  screen: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space[3.5],
  },
  section: {
    marginTop: space[5],
  },
  sectionEyebrow: {
    ...typography.eyebrow,
    color: colors.mute,
    paddingBottom: space[2],
    paddingHorizontal: space[1.5],
  },
  statusText: {
    color: colors.sageDeep,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: space[4],
  },
  subtitle: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    marginTop: space[1],
  },
  summaryChip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: space[3],
  },
  summaryChipPrimary: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  summaryChipText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 15,
  },
  summaryChipTextPrimary: {
    color: colors.bg,
  },
  summaryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1.5],
    paddingBottom: space[1],
    paddingHorizontal: space[1],
    paddingTop: space[4],
  },
  title: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 37,
  },
  titleEmphasis: {
    fontFamily: fontFamily.serif,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: space[2],
    paddingHorizontal: space[1],
  },
});
