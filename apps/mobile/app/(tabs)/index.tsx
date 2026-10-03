import { colors, nativeFont, nativeTypography, space } from '@sackerl/tokens';
import type {
  AuthenticatedUserContext,
  RecipeSuggestion,
  StockItem,
  StorageZone,
} from '@sackerl/api-client';
import { categoryMeta, PaperBag, zoneMeta, type TileCategory, type ZoneKind } from '@sackerl/ui';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState, type JSX } from 'react';
import {
  ActivityIndicator,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { useAuthSession } from '../../lib/auth-session';
import { getMobileItemsClient } from '../../lib/items';
import { getMobileProfileClient } from '../../lib/profile';
import { getMobileRecipesClient } from '../../lib/recipes';

type DashboardLoadState = 'error' | 'loading' | 'ready';

type ExpiringSummaryItem = {
  readonly category: TileCategory;
  readonly chipLabel: string;
  readonly id: string;
  readonly name: string;
  readonly zoneLabel: string;
};

type StorageSummaryCard = {
  readonly bg: string;
  readonly id: string;
  readonly ink: string;
  readonly itemCount: number;
  readonly key: string;
  readonly label: string;
  readonly short: string;
  readonly soonCount: number;
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

const defaultDashboardZoneKeys = ['fridge', 'pantry', 'basement', 'freezer'] as const;
let homeScrollOffsetY = 0;

function SearchIcon(): JSX.Element {
  return (
    <Svg fill="none" height={21} stroke={colors.ink} viewBox="0 0 24 24" width={21}>
      <Circle cx={11} cy={11} r={7} strokeWidth={1.7} />
      <Path d="m16.5 16.5 4 4" strokeLinecap="round" strokeWidth={1.7} />
    </Svg>
  );
}

function BellIcon(): JSX.Element {
  return (
    <Svg fill="none" height={21} stroke={colors.ink} viewBox="0 0 24 24" width={21}>
      <Path
        d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
      <Path d="M10 20a2.2 2.2 0 0 0 4 0" strokeLinecap="round" strokeWidth={1.7} />
    </Svg>
  );
}

function ChevronRightIcon(): JSX.Element {
  return (
    <Svg fill="none" height={14} stroke={colors.mute} viewBox="0 0 24 24" width={14}>
      <Path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function SuggestionSparkleIcon(): JSX.Element {
  return (
    <Svg fill="none" height={15} stroke={colors.sageDeep} viewBox="0 0 24 24" width={15}>
      <Path
        d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
      <Path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
    </Svg>
  );
}

function SuggestionArrowIcon(): JSX.Element {
  return (
    <Svg fill="none" height={15} stroke={colors.bg} viewBox="0 0 24 24" width={15}>
      <Path d="M5 12h14" strokeLinecap="round" strokeWidth={2} />
      <Path d="m13 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
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

function ZoneGlyph({ zone }: { readonly zone: StorageSummaryCard }): JSX.Element {
  return (
    <View style={[styles.zoneGlyph, { backgroundColor: zone.bg }]}>
      <Text style={[styles.zoneGlyphText, { color: zone.ink }]}>{zone.short}</Text>
    </View>
  );
}

function formatDashboardDate(date: Date): string {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  })
    .format(date)
    .toUpperCase();
}

function estimateDinnerCount(itemCount: number): number {
  return Math.max(0, Math.round(itemCount / 17));
}

function daysUntilIsoDate(value: string, now = new Date()): number {
  const [year, month, day] = value.split('-').map(Number);
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const targetUtc = Date.UTC(year ?? now.getFullYear(), (month ?? 1) - 1, day ?? 1);

  return Math.round((targetUtc - todayUtc) / 86_400_000);
}

function formatExpiryChip(expiresOn: string | null): string {
  if (!expiresOn) {
    return 'soon';
  }

  const days = daysUntilIsoDate(expiresOn);

  if (days < 0) {
    return 'overdue';
  }

  if (days === 0) {
    return 'today';
  }

  return days === 1 ? 'tomorrow' : `${days} days`;
}

function mapExpiringItem(
  item: StockItem,
  zoneLabelsById: ReadonlyMap<string, string>,
): ExpiringSummaryItem {
  return {
    category: item.categoryId,
    chipLabel: formatExpiryChip(item.expiresOn),
    id: item.id,
    name: item.name,
    zoneLabel: zoneLabelsById.get(item.zoneId) ?? 'Storage',
  };
}

function formatIngredientChip(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function suggestionIngredientChips(suggestion: RecipeSuggestion): readonly string[] {
  const coveredIngredients = suggestion.matchedIngredients
    .filter((ingredient) => ingredient.covered)
    .map((ingredient) => ingredient.ingredient);
  const ingredients =
    coveredIngredients.length > 0 ? coveredIngredients : suggestion.recipe.ingredients;

  return ingredients.slice(0, 4).map(formatIngredientChip);
}

function zoneLabelsById(zones: readonly StorageZone[]): ReadonlyMap<string, string> {
  return new Map(zones.map((zone) => [zone.id, zone.label]));
}

function isKnownZoneKind(value: string): value is ZoneKind {
  return value in zoneMeta;
}

function shortForCustomZone(label: string): string {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}

function labelForZoneKey(key: string): string {
  if (isKnownZoneKind(key)) {
    return zoneMeta[key].label;
  }

  return key
    .split('-')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function storageCardFromZoneKey(key: string): StorageSummaryCard {
  const label = labelForZoneKey(key);
  const knownZone = isKnownZoneKind(key) ? zoneMeta[key] : zoneMeta.cabinet;

  return {
    bg: knownZone.bg,
    id: `household-zone-${key}`,
    ink: knownZone.ink,
    itemCount: 0,
    key,
    label,
    short: isKnownZoneKind(key) ? knownZone.short : shortForCustomZone(label) || 'ST',
    soonCount: 0,
  };
}

async function loadStorageCards(
  context: AuthenticatedUserContext,
  householdId: string,
  zones: readonly StorageZone[],
  householdZoneKeys: readonly string[],
): Promise<readonly StorageSummaryCard[]> {
  const itemsClient = getMobileItemsClient();
  const visibleZones = zones.slice(0, 4);
  const zoneCards = await Promise.all(
    visibleZones.map(async (zone) => {
      const [countResult, soonResult] = await Promise.all([
        itemsClient.listItems(context, {
          householdId,
          pageSize: 1,
          zoneId: zone.id,
        }),
        itemsClient.listItems(context, {
          expiresWithinDays: 7,
          householdId,
          pageSize: 1,
          zoneId: zone.id,
        }),
      ]);
      const knownZone = isKnownZoneKind(zone.key) ? zoneMeta[zone.key] : zoneMeta.cabinet;

      return {
        bg: knownZone.bg,
        id: zone.id,
        ink: knownZone.ink,
        itemCount: countResult.pagination.total ?? countResult.items.length,
        key: zone.key,
        label: zone.label,
        short: isKnownZoneKind(zone.key) ? knownZone.short : shortForCustomZone(zone.label) || 'ST',
        soonCount: soonResult.pagination.total ?? soonResult.items.length,
      };
    }),
  );

  if (zoneCards.length >= 4) {
    return zoneCards;
  }

  const visibleKeys = new Set(zoneCards.map((zone) => zone.key));
  const fallbackZoneKeys =
    householdZoneKeys.length > 0 ? householdZoneKeys : defaultDashboardZoneKeys;
  const fallbackCards = fallbackZoneKeys
    .filter((key) => !visibleKeys.has(key))
    .slice(0, 4 - zoneCards.length)
    .map(storageCardFromZoneKey);

  return [...zoneCards, ...fallbackCards];
}

export default function HomeRoute(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuthSession();
  const scrollViewRef = useRef<ScrollView>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [expiringItems, setExpiringItems] = useState<readonly ExpiringSummaryItem[]>([]);
  const [expiringTotal, setExpiringTotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [loadState, setLoadState] = useState<DashboardLoadState>('loading');
  const [recipeSuggestion, setRecipeSuggestion] = useState<RecipeSuggestion | undefined>();
  const [storageCards, setStorageCards] = useState<readonly StorageSummaryCard[]>([]);

  const dashboardDate = useMemo(() => formatDashboardDate(new Date()), []);
  const dinnerCount = estimateDinnerCount(itemCount);
  const expiringHeaderText =
    expiringTotal === 1 ? '1 item expiring soon' : `${expiringTotal} items expiring soon`;
  const recipeIngredientChips = recipeSuggestion ? suggestionIngredientChips(recipeSuggestion) : [];

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const restoreScrollTimeout =
        homeScrollOffsetY > 0
          ? setTimeout(() => {
              scrollViewRef.current?.scrollTo({ animated: false, y: homeScrollOffsetY });
            }, 80)
          : undefined;

      async function loadDashboardHero() {
        if (!session?.user) {
          return;
        }

        setLoadState((current) => (current === 'ready' ? current : 'loading'));
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
            if (isActive) {
              setExpiringItems([]);
              setExpiringTotal(0);
              setItemCount(0);
              setRecipeSuggestion(undefined);
              setStorageCards(defaultDashboardZoneKeys.map(storageCardFromZoneKey));
              setLoadState('ready');
            }
            return;
          }

          const itemsClient = getMobileItemsClient();
          const recipesClient = getMobileRecipesClient();
          const [countResult, expiringResult, zones, suggestionsResult] = await Promise.all([
            itemsClient.listItems(context, {
              householdId: household.id,
              pageSize: 1,
            }),
            itemsClient.listItems(context, {
              expiresWithinDays: 7,
              householdId: household.id,
              pageSize: 3,
            }),
            itemsClient.listZones(context, household.id),
            recipesClient.listSuggestions(context, {
              householdId: household.id,
              limit: 1,
              minScore: 0.7,
            }),
          ]);

          const labelsById = zoneLabelsById(zones);
          const storageSummaryCards = await loadStorageCards(
            context,
            household.id,
            zones,
            household.zones,
          );

          if (isActive) {
            setExpiringItems(expiringResult.items.map((item) => mapExpiringItem(item, labelsById)));
            setExpiringTotal(expiringResult.pagination.total ?? expiringResult.items.length);
            setItemCount(countResult.pagination.total ?? countResult.items.length);
            setRecipeSuggestion(suggestionsResult.suggestions[0]);
            setStorageCards(storageSummaryCards);
            setLoadState('ready');
          }
        } catch (error) {
          if (isActive) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to load stock.');
            setLoadState('error');
          }
        }
      }

      void loadDashboardHero();

      return () => {
        isActive = false;
        if (restoreScrollTimeout) {
          clearTimeout(restoreScrollTimeout);
        }
      };
    }, [session]),
  );

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    homeScrollOffsetY = event.nativeEvent.contentOffset.y;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        onScroll={handleScroll}
        ref={scrollViewRef}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom, 12) + 116,
            paddingTop: Math.max(insets.top, 44) + 14,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.dateEyebrow}>{dashboardDate}</Text>
            <Text style={styles.greetingTitle}>
              Hello, <Text style={styles.greetingName}>there</Text>
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel="Search stock"
              accessibilityRole="button"
              style={({ pressed }) => [styles.roundButton, pressed ? styles.pressed : null]}
            >
              <SearchIcon />
            </Pressable>
            <Pressable
              accessibilityLabel="Notifications"
              accessibilityRole="button"
              style={({ pressed }) => [styles.roundButton, pressed ? styles.pressed : null]}
            >
              <BellIcon />
              <View aria-hidden style={styles.notificationDot} />
            </Pressable>
          </View>
        </View>

        <Pressable
          accessibilityHint="Opens the stock list"
          accessibilityLabel={`${itemCount} items at home`}
          accessibilityRole="button"
          onPress={() => {
            router.push('/stock');
          }}
          style={({ pressed }) => [
            styles.heroCard,
            loadState === 'error' ? styles.heroCardError : null,
            pressed ? styles.heroPressed : null,
          ]}
        >
          <View aria-hidden style={styles.kraftFiberA} />
          <View aria-hidden style={styles.kraftFiberB} />

          <View style={styles.stamp}>
            <View style={styles.stampRule} />
            <Text style={styles.stampText}>dein sackerl</Text>
          </View>

          <View style={styles.heroCopy}>
            {loadState === 'loading' ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.kraftInk} size="small" />
                <Text style={styles.loadingText}>Counting stock</Text>
              </View>
            ) : (
              <Text accessibilityLabel={`${itemCount} items at home`} style={styles.heroTitle}>
                {itemCount} {itemCount === 1 ? 'thing' : 'things'}
                {'\n'}at home
              </Text>
            )}

            <Text style={styles.heroBody}>
              Enough for <Text style={styles.heroBodyStrong}>{dinnerCount} dinners</Text>. Skip the
              shop on Wednesday.
            </Text>

            <View style={styles.heroPills}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>stock · {itemCount}</Text>
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>dinners · {dinnerCount}</Text>
              </View>
            </View>
          </View>

          <View style={styles.bagFrame}>
            <PaperBag animated={loadState === 'ready'} height={158} width={144} />
          </View>
        </Pressable>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <View style={styles.expiringCard}>
          <View style={styles.expiringHeader}>
            <View style={styles.expiringHeaderTitle}>
              <View aria-hidden style={styles.expiringDot} />
              <Text style={styles.expiringHeaderText}>
                {expiringTotal > 0 ? expiringHeaderText : 'Expiring soon'}
              </Text>
            </View>

            <Pressable
              accessibilityLabel={`See all ${expiringTotal} expiring items`}
              accessibilityRole="button"
              onPress={() => {
                router.push('/use-soon');
              }}
              style={({ pressed }) => [
                styles.seeAllButton,
                pressed ? styles.seeAllButtonPressed : null,
              ]}
            >
              <Text style={styles.seeAllText}>See all</Text>
              <ChevronRightIcon />
            </Pressable>
          </View>

          {loadState === 'loading' ? (
            <View style={styles.expiringLoadingRow}>
              <ActivityIndicator color={colors.amberDeep} size="small" />
              <Text style={styles.expiringMeta}>Checking this week</Text>
            </View>
          ) : expiringItems.length > 0 ? (
            expiringItems.map((item, index) => (
              <View
                accessibilityLabel={`${item.name}, in ${item.zoneLabel}, ${item.chipLabel}`}
                key={item.id}
                style={[styles.expiringRow, index > 0 ? styles.expiringRowDivider : null]}
              >
                <CategoryTile category={item.category} />

                <View style={styles.expiringItemCopy}>
                  <Text numberOfLines={1} style={styles.expiringItemName}>
                    {item.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.expiringMeta}>
                    in {item.zoneLabel}
                  </Text>
                </View>

                <View style={styles.expiryChip}>
                  <Text style={styles.expiryChipText}>{item.chipLabel}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.expiringEmptyText}>Nothing expiring this week - well done.</Text>
          )}
        </View>

        <View style={styles.storageHeader}>
          <Text style={styles.storageEyebrow}>Storage</Text>
          <Text style={styles.storageTotal}>{itemCount} items</Text>
        </View>

        <View style={styles.storageGrid}>
          {loadState === 'loading' ? (
            <View style={styles.storageLoadingCard}>
              <ActivityIndicator color={colors.mute} size="small" />
              <Text style={styles.expiringMeta}>Loading storage</Text>
            </View>
          ) : storageCards.length > 0 ? (
            storageCards.map((zone) => (
              <Pressable
                accessibilityLabel={`${zone.label}, ${zone.itemCount} items${
                  zone.soonCount > 0 ? `, ${zone.soonCount} expiring soon` : ''
                }`}
                accessibilityRole="button"
                key={zone.id}
                onPress={() => {
                  router.push({ pathname: '/stock', params: { zone: zone.key } });
                }}
                style={({ pressed }) => [
                  styles.storageCard,
                  pressed ? styles.storageCardPressed : null,
                ]}
              >
                <View style={styles.storageCardTop}>
                  <ZoneGlyph zone={zone} />
                  {zone.soonCount > 0 ? (
                    <Text style={styles.storageSoonPill}>{zone.soonCount} soon</Text>
                  ) : null}
                </View>

                <Text numberOfLines={1} style={styles.storageLabel}>
                  {zone.label}
                </Text>
                <Text style={styles.storageMeta}>
                  {zone.itemCount} {zone.itemCount === 1 ? 'item' : 'items'}
                </Text>
              </Pressable>
            ))
          ) : (
            <View style={styles.storageLoadingCard}>
              <Text style={styles.expiringMeta}>No storage zones yet.</Text>
            </View>
          )}
        </View>

        {loadState === 'ready' && recipeSuggestion ? (
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <View style={styles.suggestionEyebrowRow}>
                <SuggestionSparkleIcon />
                <Text style={styles.suggestionEyebrow}>From your stock</Text>
              </View>
              <Pressable
                accessibilityLabel="See all recipe suggestions"
                accessibilityRole="button"
                onPress={() => {
                  router.push('/suggestions');
                }}
                style={({ pressed }) => [
                  styles.suggestionSeeAllButton,
                  pressed ? styles.seeAllButtonPressed : null,
                ]}
              >
                <Text style={styles.suggestionSeeAllText}>See all</Text>
              </Pressable>
            </View>

            <Text style={styles.suggestionTitle}>
              You have what you need for{' '}
              <Text style={styles.suggestionRecipeName}>{recipeSuggestion.recipe.name}</Text>{' '}
              tonight.
            </Text>

            <View style={styles.suggestionChips}>
              {recipeIngredientChips.map((ingredient) => (
                <View key={ingredient} style={styles.suggestionChip}>
                  <Text numberOfLines={1} style={styles.suggestionChipText}>
                    {ingredient}
                  </Text>
                </View>
              ))}
            </View>

            <Pressable
              accessibilityLabel={`Show recipe for ${recipeSuggestion.recipe.name}`}
              accessibilityRole="button"
              onPress={() => {
                router.push({
                  pathname: '/recipe/[id]',
                  params: { id: recipeSuggestion.recipe.id },
                });
              }}
              style={({ pressed }) => [
                styles.suggestionButton,
                pressed ? styles.suggestionButtonPressed : null,
              ]}
            >
              <Text style={styles.suggestionButtonText}>Show recipe</Text>
              <SuggestionArrowIcon />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bagFrame: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    height: 168,
    justifyContent: 'flex-end',
    marginBottom: -6,
    width: 138,
  },
  storageCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 128,
    padding: space[4],
    width: '48.4%',
  },
  storageCardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  storageCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space[3.5],
  },
  storageEyebrow: {
    ...typography.eyebrow,
    color: colors.mute,
  },
  storageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2.5],
  },
  storageHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: space[2.5],
    paddingHorizontal: space[1],
    paddingTop: space[7],
  },
  storageLabel: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  storageLoadingCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space[2],
    minHeight: 104,
    padding: space[4],
    width: '100%',
  },
  storageMeta: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 2,
  },
  storageSoonPill: {
    color: colors.amberDeep,
    fontFamily: fontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  storageTotal: {
    color: colors.mute,
    fontFamily: fontFamily.mono,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 14,
  },
  categoryTile: {
    alignItems: 'center',
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  categoryTileText: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0,
  },
  dateEyebrow: {
    ...typography.eyebrow,
    color: colors.mute,
  },
  errorText: {
    ...typography.caption,
    color: colors.amberDeep,
    marginTop: space[3],
    paddingHorizontal: space[1],
  },
  expiringCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: space[4.5],
    paddingBottom: space[2],
    paddingHorizontal: space[4.5],
    paddingTop: space[4.5],
    shadowColor: '#1A1D1A',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  expiringDot: {
    backgroundColor: colors.amber,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  expiringEmptyText: {
    ...typography.caption,
    color: colors.mute,
    paddingBottom: space[3],
    paddingTop: space[1],
  },
  expiringHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space[3.5],
  },
  expiringHeaderText: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  expiringHeaderTitle: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: space[2],
    minWidth: 0,
  },
  expiringItemCopy: {
    flex: 1,
    minWidth: 0,
  },
  expiringItemName: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 19,
  },
  expiringLoadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[2],
    paddingBottom: space[4],
    paddingTop: space[1],
  },
  expiringMeta: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 1,
  },
  expiringRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[3],
    paddingVertical: space[2.5],
  },
  expiringRowDivider: {
    borderColor: colors.borderSoft,
    borderTopWidth: 1,
  },
  expiryChip: {
    backgroundColor: colors.amberSoft,
    borderRadius: 999,
    paddingHorizontal: space[2.5],
    paddingVertical: space[1.5],
  },
  expiryChipText: {
    color: colors.amberDeep,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  greeting: {
    flex: 1,
    minWidth: 0,
  },
  greetingName: {
    fontFamily: fontFamily.serif,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  greetingTitle: {
    color: colors.ink,
    fontFamily: fontFamily.serif,
    fontSize: 30,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 36,
    marginTop: space[1],
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[3],
    justifyContent: 'space-between',
    marginBottom: space[4.5],
    paddingHorizontal: space[1],
  },
  headerActions: {
    flexDirection: 'row',
    gap: space[2],
  },
  heroBody: {
    color: colors.kraftInk,
    fontFamily: fontFamily.sans,
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: space[2.5],
    maxWidth: 176,
    opacity: 0.78,
  },
  heroBodyStrong: {
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: colors.kraftSoft,
    borderColor: 'rgba(74, 53, 32, 0.18)',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space[1],
    minHeight: 178,
    overflow: 'hidden',
    paddingBottom: 0,
    paddingHorizontal: space[4.5],
    paddingTop: space[3.5],
    position: 'relative',
  },
  heroCardError: {
    borderColor: 'rgba(181, 138, 12, 0.44)',
  },
  heroCopy: {
    flex: 1,
    justifyContent: 'flex-end',
    minWidth: 0,
    paddingBottom: space[3.5],
    paddingTop: 34,
  },
  heroPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderColor: 'rgba(74, 53, 32, 0.25)',
    borderRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  heroPillText: {
    color: colors.kraftInk,
    fontFamily: fontFamily.mono,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 13,
    textTransform: 'uppercase',
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1.5],
    marginTop: space[3.5],
  },
  heroPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  heroTitle: {
    color: colors.kraftInk,
    fontFamily: fontFamily.sans,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 29,
  },
  kraftFiberA: {
    backgroundColor: 'rgba(74, 53, 32, 0.08)',
    borderRadius: 1,
    height: 2,
    left: 28,
    position: 'absolute',
    top: 26,
    transform: [{ rotate: '-12deg' }],
    width: 34,
  },
  kraftFiberB: {
    backgroundColor: 'rgba(74, 53, 32, 0.06)',
    borderRadius: 1,
    bottom: 34,
    height: 2,
    position: 'absolute',
    right: 74,
    transform: [{ rotate: '10deg' }],
    width: 42,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[2],
    minHeight: 58,
  },
  loadingText: {
    color: colors.kraftInk,
    fontFamily: fontFamily.mono,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  notificationDot: {
    backgroundColor: colors.amber,
    borderColor: colors.bg,
    borderRadius: 6,
    borderWidth: 2,
    height: 10,
    position: 'absolute',
    right: 8,
    top: 8,
    width: 10,
  },
  pressed: {
    opacity: 0.74,
  },
  roundButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    position: 'relative',
    width: 44,
  },
  screen: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space[4.5],
  },
  seeAllButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    minHeight: 32,
    paddingLeft: space[3],
    paddingVertical: space[1],
  },
  seeAllButtonPressed: {
    opacity: 0.65,
  },
  seeAllText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  stamp: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[1.5],
    position: 'absolute',
    right: space[3.5],
    top: space[3],
    zIndex: 1,
  },
  stampRule: {
    backgroundColor: colors.kraftDeep,
    height: 1,
    opacity: 0.8,
    width: 18,
  },
  stampText: {
    color: colors.kraftDeep,
    fontFamily: fontFamily.mono,
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  suggestionButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.ink,
    borderRadius: 999,
    flexDirection: 'row',
    gap: space[1.5],
    marginTop: space[4.5],
    minHeight: 42,
    paddingHorizontal: space[4.5],
    paddingVertical: space[2.5],
  },
  suggestionButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  suggestionButtonText: {
    color: colors.bg,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  suggestionCard: {
    backgroundColor: colors.sageSoft,
    borderColor: colors.sageTint,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: space[5],
    overflow: 'hidden',
    padding: space[4.5],
  },
  suggestionChip: {
    backgroundColor: colors.card,
    borderColor: 'rgba(47, 106, 32, 0.08)',
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '48%',
    paddingHorizontal: space[3],
    paddingVertical: space[1.5],
  },
  suggestionChipText: {
    color: colors.sageDeep,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 15,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1.5],
    marginTop: space[3.5],
  },
  suggestionEyebrow: {
    ...typography.eyebrow,
    color: colors.sageDeep,
  },
  suggestionEyebrowRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[1.5],
  },
  suggestionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space[2.5],
  },
  suggestionSeeAllButton: {
    minHeight: 30,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  suggestionSeeAllText: {
    color: colors.sageDeep,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  suggestionRecipeName: {
    fontStyle: 'italic',
  },
  suggestionTitle: {
    color: colors.sageDeep,
    fontFamily: fontFamily.serif,
    fontSize: 24,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 28,
    maxWidth: 286,
  },
  zoneGlyph: {
    alignItems: 'center',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  zoneGlyphText: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0,
  },
});
