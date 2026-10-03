import { colors, nativeFont, nativeTypography, space } from '@sackerl/tokens';
import {
  estimateExpiryDate,
  itemCategories,
  itemQuantityUnits,
  type AuthenticatedUserContext,
  type ItemCategoryId,
  type ItemQuantityUnit,
  type StockItem,
  type StorageZone,
} from '@sackerl/api-client';
import { categoryMeta, zoneMeta, type TileCategory, type ZoneKind } from '@sackerl/ui';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type JSX } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { useAuthSession } from '../../lib/auth-session';
import { getMobileItemsClient } from '../../lib/items';
import { getMobileProfileClient } from '../../lib/profile';

type StockLoadState = 'error' | 'loading' | 'ready';
type CategoryFilter = 'all' | ItemCategoryId;

type ItemEditErrors = {
  expiry?: string | undefined;
  name?: string | undefined;
  quantity?: string | undefined;
  zone?: string | undefined;
};

type ZoneViewModel = {
  readonly bg: string;
  readonly id: string | undefined;
  readonly ink: string;
  readonly key: string;
  readonly label: string;
  readonly short: string;
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

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const defaultZoneKeys = ['fridge', 'pantry', 'basement', 'freezer'] as const;
const itemPageSize = 100;

function ChevronLeftIcon(): JSX.Element {
  return (
    <Svg fill="none" height={21} stroke={colors.ink} viewBox="0 0 24 24" width={21}>
      <Path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
    </Svg>
  );
}

function DotsIcon(): JSX.Element {
  return (
    <Svg fill="none" height={21} viewBox="0 0 24 24" width={21}>
      <Circle cx={5} cy={12} fill={colors.ink} r={1.6} />
      <Circle cx={12} cy={12} fill={colors.ink} r={1.6} />
      <Circle cx={19} cy={12} fill={colors.ink} r={1.6} />
    </Svg>
  );
}

function PlusIcon(): JSX.Element {
  return (
    <Svg fill="none" height={22} stroke={colors.bg} viewBox="0 0 24 24" width={22}>
      <Path d="M12 5v14" strokeLinecap="round" strokeWidth={2} />
      <Path d="M5 12h14" strokeLinecap="round" strokeWidth={2} />
    </Svg>
  );
}

function FilterIcon(): JSX.Element {
  return (
    <Svg fill="none" height={12} stroke={colors.mute} viewBox="0 0 24 24" width={12}>
      <Path
        d="M4 6h16M7 12h10M10 18h4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

function XIcon(): JSX.Element {
  return (
    <Svg fill="none" height={18} stroke={colors.ink} viewBox="0 0 24 24" width={18}>
      <Path d="M6 6l12 12" strokeLinecap="round" strokeWidth={2} />
      <Path d="M18 6 6 18" strokeLinecap="round" strokeWidth={2} />
    </Svg>
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

function CategoryTile({ category }: { readonly category: TileCategory }): JSX.Element {
  const meta = categoryMeta[category];

  return (
    <View style={[styles.categoryTile, { backgroundColor: meta.bg }]}>
      <Text style={[styles.categoryTileText, { color: meta.ink }]}>{meta.short}</Text>
    </View>
  );
}

function ZoneGlyph({ zone }: { readonly zone: ZoneViewModel }): JSX.Element {
  return (
    <View style={[styles.zoneGlyph, { backgroundColor: zone.bg }]}>
      <Text style={[styles.zoneGlyphText, { color: zone.ink }]}>{zone.short}</Text>
    </View>
  );
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

function zoneFromKey(key: string): ZoneViewModel {
  const label = labelForZoneKey(key);
  const knownZone = isKnownZoneKind(key) ? zoneMeta[key] : zoneMeta.cabinet;

  return {
    bg: knownZone.bg,
    id: undefined,
    ink: knownZone.ink,
    key,
    label,
    short: isKnownZoneKind(key) ? knownZone.short : shortForCustomZone(label) || 'ST',
  };
}

function zoneFromStorageZone(zone: StorageZone): ZoneViewModel {
  const knownZone = isKnownZoneKind(zone.key) ? zoneMeta[zone.key] : zoneMeta.cabinet;

  return {
    bg: knownZone.bg,
    id: zone.id,
    ink: knownZone.ink,
    key: zone.key,
    label: zone.label,
    short: isKnownZoneKind(zone.key) ? knownZone.short : shortForCustomZone(zone.label) || 'ST',
  };
}

function resolveZoneOptions(
  zones: readonly StorageZone[],
  householdZoneKeys: readonly string[],
): readonly ZoneViewModel[] {
  if (zones.length > 0) {
    return zones.map(zoneFromStorageZone);
  }

  const fallbackKeys = householdZoneKeys.length > 0 ? householdZoneKeys : defaultZoneKeys;

  return fallbackKeys.map(zoneFromKey);
}

function firstParamValue(value: string | readonly string[] | undefined): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  return value?.[0];
}

function normalizeZoneParam(value: string | readonly string[] | undefined): string | undefined {
  const zone = firstParamValue(value)?.trim().toLowerCase();

  return zone && /^[a-z][a-z0-9-]{1,31}$/.test(zone) ? zone : undefined;
}

function daysUntilIsoDate(value: string, now = new Date()): number {
  const [year, month, day] = value.split('-').map(Number);
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const targetUtc = Date.UTC(year ?? now.getFullYear(), (month ?? 1) - 1, day ?? 1);

  return Math.round((targetUtc - todayUtc) / 86_400_000);
}

function isUseSoonItem(item: StockItem): boolean {
  return item.expiresOn ? daysUntilIsoDate(item.expiresOn) <= 7 : false;
}

function sortByExpiryAscending(items: readonly StockItem[]): readonly StockItem[] {
  return [...items].sort((a, b) => {
    if (a.expiresOn && b.expiresOn) {
      return a.expiresOn.localeCompare(b.expiresOn) || b.addedOn.localeCompare(a.addedOn);
    }

    if (a.expiresOn) {
      return -1;
    }

    if (b.expiresOn) {
      return 1;
    }

    return b.addedOn.localeCompare(a.addedOn) || a.name.localeCompare(b.name);
  });
}

function formatExpiryChip(expiresOn: string | null): string {
  if (!expiresOn) {
    return 'no date';
  }

  const days = daysUntilIsoDate(expiresOn);

  if (days < 0) {
    return 'overdue';
  }

  if (days === 0) {
    return 'today';
  }

  if (days === 1) {
    return 'tomorrow';
  }

  return days <= 7 ? `${days}d` : `${days}d`;
}

function formatQuantity(item: StockItem): string {
  const quantity = formatQuantityValue(item.qtyValue);

  return `${quantity} ${item.qtyUnit}`;
}

function formatQuantityValue(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);
}

function parseQuantityValue(value: string): number | null {
  const parsed = Number(value.trim().replace(',', '.'));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatAddedMeta(addedOn: string): string {
  const days = Math.max(0, -daysUntilIsoDate(addedOn));

  if (days === 0) {
    return 'added today';
  }

  return days === 1 ? 'added yesterday' : `added ${days} days ago`;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function loadAllZoneItems(
  context: AuthenticatedUserContext,
  householdId: string,
  zoneId: string,
): Promise<{ readonly items: readonly StockItem[]; readonly total: number }> {
  const itemsClient = getMobileItemsClient();
  const items: StockItem[] = [];
  let page = 1;
  let total: number | null = null;

  do {
    const result = await itemsClient.listItems(context, {
      householdId,
      page,
      pageSize: itemPageSize,
      zoneId,
    });

    items.push(...result.items);
    total = result.pagination.total;

    if (result.items.length < itemPageSize || (total !== null && items.length >= total)) {
      break;
    }

    page += 1;
  } while (page <= 50);

  return { items, total: total ?? items.length };
}

function countItemsByCategory(items: readonly StockItem[]): ReadonlyMap<ItemCategoryId, number> {
  const counts = new Map<ItemCategoryId, number>();

  for (const item of items) {
    counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
  }

  return counts;
}

function LocationRow({
  isLast,
  item,
  onPress,
}: {
  readonly isLast: boolean;
  readonly item: StockItem;
  readonly onPress: () => void;
}): JSX.Element {
  const isUrgent = item.expiresOn ? daysUntilIsoDate(item.expiresOn) <= 2 : false;

  return (
    <Pressable
      accessibilityLabel={`${item.name}, ${formatQuantity(item)}, ${formatExpiryChip(
        item.expiresOn,
      )}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.itemRow,
        isLast ? null : styles.itemRowDivider,
        pressed ? styles.itemRowPressed : null,
      ]}
    >
      <CategoryTile category={item.categoryId} />
      <View style={styles.itemCopy}>
        <Text numberOfLines={1} style={styles.itemName}>
          {item.name}
        </Text>
        <Text numberOfLines={1} style={styles.itemMeta}>
          {formatQuantity(item)} · {formatAddedMeta(item.addedOn)}
        </Text>
      </View>
      <View style={[styles.expiryChip, isUrgent ? styles.expiryChipUrgent : null]}>
        <Text style={[styles.expiryChipText, isUrgent ? styles.expiryChipTextUrgent : null]}>
          {formatExpiryChip(item.expiresOn)}
        </Text>
      </View>
    </Pressable>
  );
}

function SectionCard({
  children,
  title,
}: {
  readonly children: readonly JSX.Element[] | JSX.Element;
  readonly title: string;
}): JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionEyebrow}>{title}</Text>
      <View style={styles.itemCard}>{children}</View>
    </View>
  );
}

export default function StockRoute(): JSX.Element {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ zone?: string }>();
  const requestedZoneKey = useMemo(() => normalizeZoneParam(params.zone), [params.zone]);
  const router = useRouter();
  const { session } = useAuthSession();
  const [activeZone, setActiveZone] = useState<ZoneViewModel>(() => zoneFromKey('fridge'));
  const [detailErrorMessage, setDetailErrorMessage] = useState<string | undefined>();
  const [editCategoryId, setEditCategoryId] = useState<ItemCategoryId>('produce');
  const [editErrors, setEditErrors] = useState<ItemEditErrors>({});
  const [editExpiryInput, setEditExpiryInput] = useState('');
  const [editName, setEditName] = useState('');
  const [editQuantityInput, setEditQuantityInput] = useState('1');
  const [editQuantityUnit, setEditQuantityUnit] = useState<ItemQuantityUnit>('pcs');
  const [editZoneKey, setEditZoneKey] = useState('fridge');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [items, setItems] = useState<readonly StockItem[]>([]);
  const [isDetailSaving, setIsDetailSaving] = useState(false);
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [loadState, setLoadState] = useState<StockLoadState>('loading');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedItem, setSelectedItem] = useState<StockItem | undefined>();
  const [totalItems, setTotalItems] = useState(0);
  const [zoneOptions, setZoneOptions] = useState<readonly ZoneViewModel[]>([]);

  useEffect(() => {
    setSelectedCategory('all');
  }, [requestedZoneKey]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadStockDetail() {
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
            const fallbackZones = defaultZoneKeys.map(zoneFromKey);
            const nextActiveZone =
              fallbackZones.find((zone) => zone.key === requestedZoneKey) ?? zoneFromKey('fridge');

            if (isActive) {
              setActiveZone(nextActiveZone);
              setItems([]);
              setTotalItems(0);
              setZoneOptions(fallbackZones);
              setLoadState('ready');
            }
            return;
          }

          const itemsClient = getMobileItemsClient();
          const zones = await itemsClient.listZones(context, household.id);
          const nextZoneOptions = resolveZoneOptions(zones, household.zones);
          const nextActiveZone =
            nextZoneOptions.find((zone) => zone.key === requestedZoneKey) ?? nextZoneOptions[0];
          const itemResult = nextActiveZone?.id
            ? await loadAllZoneItems(context, household.id, nextActiveZone.id)
            : { items: [], total: 0 };

          if (isActive && nextActiveZone) {
            setActiveZone(nextActiveZone);
            setItems(sortByExpiryAscending(itemResult.items));
            setTotalItems(itemResult.total);
            setZoneOptions(nextZoneOptions);
            setLoadState('ready');
          }
        } catch (error) {
          if (isActive) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to load storage.');
            setLoadState('error');
          }
        }
      }

      void loadStockDetail();

      return () => {
        isActive = false;
      };
    }, [requestedZoneKey, session]),
  );

  const categoryCounts = useMemo(() => countItemsByCategory(items), [items]);
  const visibleCategoryChips = useMemo(
    () =>
      itemCategories
        .map((category) => ({
          count: categoryCounts.get(category.id) ?? 0,
          id: category.id,
          label: category.label,
        }))
        .filter((category) => category.count > 0 || selectedCategory === category.id),
    [categoryCounts, selectedCategory],
  );
  const filteredItems = useMemo(
    () =>
      selectedCategory === 'all'
        ? items
        : items.filter((item) => item.categoryId === selectedCategory),
    [items, selectedCategory],
  );
  const useSoonItems = useMemo(
    () => sortByExpiryAscending(filteredItems.filter(isUseSoonItem)),
    [filteredItems],
  );
  const stockedItems = useMemo(
    () => sortByExpiryAscending(filteredItems.filter((item) => !isUseSoonItem(item))),
    [filteredItems],
  );
  const soonTotal = useMemo(() => items.filter(isUseSoonItem).length, [items]);
  const selectedCategoryLabel =
    selectedCategory === 'all' ? 'All' : categoryMeta[selectedCategory].label;
  const selectedEditZone = useMemo(
    () => zoneOptions.find((zone) => zone.key === editZoneKey),
    [editZoneKey, zoneOptions],
  );
  const bottomInset = Math.max(insets.bottom, 12);
  const hasItems = items.length > 0;
  const hasFilteredItems = filteredItems.length > 0;
  const bottomPadding = bottomInset + 122;
  const detailQuantityValue = parseQuantityValue(editQuantityInput) ?? 1;

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

  function closeItemDetail(options: { readonly force?: boolean } = {}) {
    if (isDetailSaving && !options.force) {
      return;
    }

    setSelectedItem(undefined);
    setDetailErrorMessage(undefined);
    setEditErrors({});
    setIsMoveMode(false);
  }

  function openItemDetail(item: StockItem) {
    const itemZone = zoneOptions.find((zone) => zone.id === item.zoneId) ?? activeZone;

    setSelectedItem(item);
    setDetailErrorMessage(undefined);
    setEditErrors({});
    setEditName(item.name);
    setEditQuantityInput(formatQuantityValue(item.qtyValue));
    setEditQuantityUnit(item.qtyUnit);
    setEditCategoryId(item.categoryId);
    setEditZoneKey(itemZone.key);
    setEditExpiryInput(item.expiresOn ?? '');
    setIsMoveMode(false);
  }

  function updateDetailQuantity(nextValue: number) {
    setEditQuantityInput(formatQuantityValue(Math.max(1, nextValue)));
  }

  function validateEditFields(): {
    readonly expiresOn: string | null;
    readonly qtyValue: number;
    readonly zone: ZoneViewModel;
  } | null {
    const nextErrors: ItemEditErrors = {};
    const trimmedName = editName.trim();
    const qtyValue = parseQuantityValue(editQuantityInput);
    const trimmedExpiry = editExpiryInput.trim();

    if (!trimmedName) {
      nextErrors.name = 'Name is required.';
    }

    if (!qtyValue) {
      nextErrors.quantity = 'Quantity must be greater than zero.';
    }

    if (!selectedEditZone) {
      nextErrors.zone = 'Choose a storage zone.';
    } else if (!selectedEditZone.id) {
      nextErrors.zone = 'This storage zone is not ready yet. Save storage setup again.';
    }

    if (trimmedExpiry && !datePattern.test(trimmedExpiry)) {
      nextErrors.expiry = 'Use YYYY-MM-DD or leave it blank.';
    }

    setEditErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !qtyValue || !selectedEditZone?.id) {
      return null;
    }

    return {
      expiresOn:
        trimmedExpiry ||
        estimateExpiryDate({
          categoryId: editCategoryId,
          zoneKey: selectedEditZone.key,
        }),
      qtyValue,
      zone: selectedEditZone,
    };
  }

  function removeItemFromList(itemId: string) {
    setItems((current) => current.filter((item) => item.id !== itemId));
    setTotalItems((current) => Math.max(0, current - 1));
  }

  async function handleSaveItem() {
    const context = authContext();
    const validFields = validateEditFields();

    if (!context || !selectedItem || !validFields || isDetailSaving) {
      return;
    }

    setIsDetailSaving(true);
    setDetailErrorMessage(undefined);

    try {
      const household = await getMobileProfileClient().ensureHousehold(context);
      const updatedItem = await getMobileItemsClient().updateItem(context, {
        categoryId: editCategoryId,
        expiresOn: validFields.expiresOn,
        householdId: household.id,
        id: selectedItem.id,
        name: editName.trim(),
        qtyUnit: editQuantityUnit,
        qtyValue: validFields.qtyValue,
        zoneId: validFields.zone.id,
      });

      if (validFields.zone.key === activeZone.key) {
        setItems((current) =>
          sortByExpiryAscending(
            current.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
          ),
        );
      } else {
        removeItemFromList(updatedItem.id);
        router.setParams({ zone: validFields.zone.key });
      }

      closeItemDetail({ force: true });
    } catch (error) {
      setDetailErrorMessage(error instanceof Error ? error.message : 'Unable to save item.');
    } finally {
      setIsDetailSaving(false);
    }
  }

  async function removeSelectedItem(kind: 'delete' | 'used') {
    const context = authContext();

    if (!context || !selectedItem || isDetailSaving) {
      return;
    }

    setIsDetailSaving(true);
    setDetailErrorMessage(undefined);

    try {
      const household = await getMobileProfileClient().ensureHousehold(context);

      if (kind === 'delete') {
        await getMobileItemsClient().deleteItem(context, {
          householdId: household.id,
          id: selectedItem.id,
        });
      } else {
        await getMobileItemsClient().deleteItem(context, {
          householdId: household.id,
          id: selectedItem.id,
          removalReason: 'used',
          removedOn: todayIsoDate(),
        });
      }

      removeItemFromList(selectedItem.id);
      closeItemDetail({ force: true });
    } catch (error) {
      setDetailErrorMessage(error instanceof Error ? error.message : 'Unable to update item.');
    } finally {
      setIsDetailSaving(false);
    }
  }

  function confirmMarkUsed() {
    Alert.alert('Mark as used?', 'This removes the item from active stock.', [
      { style: 'cancel', text: 'Cancel' },
      {
        onPress: () => {
          void removeSelectedItem('used');
        },
        text: 'Mark used',
      },
    ]);
  }

  function confirmDelete() {
    Alert.alert('Delete item?', 'This removes the item from active stock.', [
      { style: 'cancel', text: 'Cancel' },
      {
        onPress: () => {
          void removeSelectedItem('delete');
        },
        style: 'destructive',
        text: 'Delete',
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: bottomPadding,
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
          <RoundIconButton label="More storage actions">
            <DotsIcon />
          </RoundIconButton>
        </View>

        <View style={styles.zoneHeader}>
          <ZoneGlyph zone={activeZone} />
          <View style={styles.zoneHeaderCopy}>
            <Text numberOfLines={1} style={styles.zoneTitle}>
              {activeZone.label}
            </Text>
            <View style={styles.zoneMetaRow}>
              <Text style={styles.zoneMetaText}>
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </Text>
              <Text style={styles.zoneMetaDivider}>·</Text>
              <Text style={styles.zoneSoonText}>
                {soonTotal} {soonTotal === 1 ? 'expires' : 'expire'} soon
              </Text>
            </View>
          </View>
        </View>

        {zoneOptions.length > 1 ? (
          <ScrollView
            contentContainerStyle={styles.zonePickerContent}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {zoneOptions.map((zone) => {
              const isSelected = zone.key === activeZone.key;

              return (
                <Pressable
                  accessibilityLabel={`Open ${zone.label}`}
                  accessibilityRole="button"
                  accessibilityState={isSelected ? { selected: true } : undefined}
                  key={zone.key}
                  onPress={() => {
                    router.setParams({ zone: zone.key });
                  }}
                  style={[styles.zoneChip, isSelected ? styles.zoneChipSelected : null]}
                >
                  <Text
                    style={[styles.zoneChipText, isSelected ? styles.zoneChipTextSelected : null]}
                  >
                    {zone.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.categoryChips}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <Pressable
            accessibilityLabel={`All categories, ${items.length} items`}
            accessibilityRole="button"
            accessibilityState={selectedCategory === 'all' ? { selected: true } : undefined}
            onPress={() => {
              setSelectedCategory('all');
            }}
            style={[styles.categoryChip, selectedCategory === 'all' ? styles.chipSelected : null]}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === 'all' ? styles.chipSelectedText : null,
              ]}
            >
              All · {items.length}
            </Text>
          </Pressable>
          {visibleCategoryChips.map((category) => {
            const isSelected = selectedCategory === category.id;

            return (
              <Pressable
                accessibilityLabel={`${category.label}, ${category.count} items`}
                accessibilityRole="button"
                accessibilityState={isSelected ? { selected: true } : undefined}
                key={category.id}
                onPress={() => {
                  setSelectedCategory(category.id);
                }}
                style={[styles.categoryChip, isSelected ? styles.chipSelected : null]}
              >
                <Text
                  style={[styles.categoryChipText, isSelected ? styles.chipSelectedText : null]}
                >
                  {category.label} · {category.count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {loadState === 'loading' ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.mute} size="small" />
            <Text style={styles.loadingText}>Loading {activeZone.label}</Text>
          </View>
        ) : !hasItems ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nothing in your {activeZone.label} yet.</Text>
            <Text style={styles.emptyBody}>
              Add items manually or scan a receipt to fill this zone.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                router.push({ pathname: '/add-item', params: { zone: activeZone.key } });
              }}
              style={({ pressed }) => [styles.inlineAddButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.inlineAddButtonText}>Add item</Text>
            </Pressable>
          </View>
        ) : !hasFilteredItems ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No {selectedCategoryLabel} in your {activeZone.label}.
            </Text>
            <Text style={styles.emptyBody}>Choose another category or add a matching item.</Text>
          </View>
        ) : (
          <>
            {useSoonItems.length > 0 ? (
              <View style={styles.useSoonSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionEyebrow}>Use soon</Text>
                  <View style={styles.sortLabel}>
                    <FilterIcon />
                    <Text style={styles.sortLabelText}>Sort: expiry</Text>
                  </View>
                </View>
                <View style={styles.itemCard}>
                  {useSoonItems.map((item, index) => (
                    <LocationRow
                      isLast={index === useSoonItems.length - 1}
                      item={item}
                      key={item.id}
                      onPress={() => {
                        openItemDetail(item);
                      }}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {stockedItems.length > 0 ? (
              <SectionCard title="Stocked">
                {stockedItems.map((item, index) => (
                  <LocationRow
                    isLast={index === stockedItems.length - 1}
                    item={item}
                    key={item.id}
                    onPress={() => {
                      openItemDetail(item);
                    }}
                  />
                ))}
              </SectionCard>
            ) : null}
          </>
        )}
      </ScrollView>

      {loadState !== 'loading' ? (
        <Pressable
          accessibilityLabel={`Add item to ${activeZone.label}`}
          accessibilityRole="button"
          onPress={() => {
            router.push({ pathname: '/add-item', params: { zone: activeZone.key } });
          }}
          style={({ pressed }) => [
            styles.addFab,
            { bottom: 34 },
            pressed ? styles.addFabPressed : null,
          ]}
        >
          <PlusIcon />
        </Pressable>
      ) : null}

      <Modal
        animationType="slide"
        onRequestClose={() => {
          closeItemDetail();
        }}
        transparent
        visible={Boolean(selectedItem)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <Pressable
            accessibilityLabel="Close item details"
            accessibilityRole="button"
            onPress={() => {
              closeItemDetail();
            }}
            style={styles.modalBackdrop}
          />
          <View style={styles.detailSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleGroup}>
                <Text style={styles.sheetEyebrow}>Item detail</Text>
                <Text numberOfLines={1} style={styles.sheetTitle}>
                  {selectedItem?.name ?? 'Item'}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close"
                accessibilityRole="button"
                disabled={isDetailSaving}
                onPress={() => {
                  closeItemDetail();
                }}
                style={({ pressed }) => [styles.sheetCloseButton, pressed ? styles.pressed : null]}
              >
                <XIcon />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.detailField}>
                <Text style={styles.detailLabel}>Name</Text>
                <TextInput
                  editable={!isDetailSaving}
                  onChangeText={(value) => {
                    setEditName(value);
                    if (editErrors.name) {
                      setEditErrors((current) => ({ ...current, name: undefined }));
                    }
                  }}
                  style={styles.detailInput}
                  value={editName}
                />
                {editErrors.name ? <Text style={styles.detailError}>{editErrors.name}</Text> : null}
              </View>

              <View style={styles.detailField}>
                <Text style={styles.detailLabel}>Category</Text>
                <ScrollView
                  contentContainerStyle={styles.editCategoryList}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {itemCategories.map((category) => {
                    const isSelected = category.id === editCategoryId;

                    return (
                      <Pressable
                        accessibilityLabel={category.label}
                        accessibilityRole="button"
                        accessibilityState={isSelected ? { selected: true } : undefined}
                        disabled={isDetailSaving}
                        key={category.id}
                        onPress={() => {
                          setEditCategoryId(category.id);
                        }}
                        style={[
                          styles.editCategoryChip,
                          isSelected ? styles.editCategoryChipSelected : null,
                        ]}
                      >
                        <CategoryTile category={category.id} />
                        <Text style={styles.editCategoryChipText}>{category.label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.detailField}>
                <Text style={styles.detailLabel}>Quantity</Text>
                <View style={styles.editQuantityRow}>
                  <Pressable
                    accessibilityLabel="Decrease quantity"
                    accessibilityRole="button"
                    disabled={isDetailSaving}
                    onPress={() => {
                      updateDetailQuantity(detailQuantityValue - 1);
                    }}
                    style={({ pressed }) => [
                      styles.editStepButton,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.editStepButtonText}>-</Text>
                  </Pressable>
                  <TextInput
                    editable={!isDetailSaving}
                    keyboardType="decimal-pad"
                    onChangeText={(value) => {
                      setEditQuantityInput(value);
                      if (editErrors.quantity) {
                        setEditErrors((current) => ({ ...current, quantity: undefined }));
                      }
                    }}
                    style={styles.editQuantityInput}
                    value={editQuantityInput}
                  />
                  <Pressable
                    accessibilityLabel="Increase quantity"
                    accessibilityRole="button"
                    disabled={isDetailSaving}
                    onPress={() => {
                      updateDetailQuantity(detailQuantityValue + 1);
                    }}
                    style={({ pressed }) => [
                      styles.editStepButton,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.editStepButtonText}>+</Text>
                  </Pressable>
                </View>
                {editErrors.quantity ? (
                  <Text style={styles.detailError}>{editErrors.quantity}</Text>
                ) : null}

                <View style={styles.editSegmentRow}>
                  {itemQuantityUnits.map((unit) => {
                    const isSelected = unit === editQuantityUnit;

                    return (
                      <Pressable
                        accessibilityLabel={unit}
                        accessibilityRole="button"
                        accessibilityState={isSelected ? { selected: true } : undefined}
                        disabled={isDetailSaving}
                        key={unit}
                        onPress={() => {
                          setEditQuantityUnit(unit);
                        }}
                        style={[styles.editSegment, isSelected ? styles.editSegmentSelected : null]}
                      >
                        <Text
                          style={[
                            styles.editSegmentText,
                            isSelected ? styles.editSegmentTextSelected : null,
                          ]}
                        >
                          {unit}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.detailField}>
                <View style={styles.moveHeader}>
                  <View>
                    <Text style={styles.detailLabel}>Zone</Text>
                    <Text style={styles.detailMeta}>
                      {selectedEditZone?.label ?? activeZone.label}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isDetailSaving}
                    onPress={() => {
                      setIsMoveMode((value) => !value);
                    }}
                    style={({ pressed }) => [styles.moveButton, pressed ? styles.pressed : null]}
                  >
                    <Text style={styles.moveButtonText}>Move to...</Text>
                  </Pressable>
                </View>
                {isMoveMode ? (
                  <View style={styles.editZoneGrid}>
                    {zoneOptions.map((zone) => {
                      const isSelected = zone.key === editZoneKey;

                      return (
                        <Pressable
                          accessibilityLabel={zone.label}
                          accessibilityRole="button"
                          accessibilityState={isSelected ? { selected: true } : undefined}
                          disabled={isDetailSaving}
                          key={zone.key}
                          onPress={() => {
                            setEditZoneKey(zone.key);
                            if (editErrors.zone) {
                              setEditErrors((current) => ({ ...current, zone: undefined }));
                            }
                          }}
                          style={[
                            styles.editZoneChip,
                            isSelected ? styles.editZoneChipSelected : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.editZoneChipText,
                              isSelected ? styles.editZoneChipTextSelected : null,
                            ]}
                          >
                            {zone.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
                {editErrors.zone ? <Text style={styles.detailError}>{editErrors.zone}</Text> : null}
              </View>

              <View style={styles.detailField}>
                <Text style={styles.detailLabel}>Expires on</Text>
                <TextInput
                  editable={!isDetailSaving}
                  keyboardType="numbers-and-punctuation"
                  onChangeText={(value) => {
                    setEditExpiryInput(value);
                    if (editErrors.expiry) {
                      setEditErrors((current) => ({ ...current, expiry: undefined }));
                    }
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.muteSoft}
                  style={styles.detailInput}
                  value={editExpiryInput}
                />
                <Text style={styles.detailMeta}>
                  Leave blank to use the estimate for {categoryMeta[editCategoryId].label} in{' '}
                  {selectedEditZone?.label ?? activeZone.label}.
                </Text>
                {editErrors.expiry ? (
                  <Text style={styles.detailError}>{editErrors.expiry}</Text>
                ) : null}
              </View>

              <View style={styles.recordCard}>
                <View style={styles.recordRow}>
                  <Text style={styles.recordLabel}>Added</Text>
                  <Text style={styles.recordValue}>{selectedItem?.addedOn ?? '-'}</Text>
                </View>
                <View style={styles.recordRow}>
                  <Text style={styles.recordLabel}>Source</Text>
                  <Text style={styles.recordValue}>{selectedItem?.source ?? '-'}</Text>
                </View>
                <View style={styles.recordRow}>
                  <Text style={styles.recordLabel}>Status</Text>
                  <Text style={styles.recordValue}>
                    {selectedItem?.removedOn ? `Removed ${selectedItem.removedOn}` : 'Active'}
                  </Text>
                </View>
              </View>

              {detailErrorMessage ? (
                <Text style={styles.detailStatusText}>{detailErrorMessage}</Text>
              ) : null}

              <View style={styles.sheetActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isDetailSaving}
                  onPress={() => {
                    void handleSaveItem();
                  }}
                  style={({ pressed }) => [
                    styles.saveButton,
                    isDetailSaving ? styles.saveButtonDisabled : null,
                    pressed ? styles.saveButtonPressed : null,
                  ]}
                >
                  {isDetailSaving ? (
                    <ActivityIndicator color={colors.ink} size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save changes</Text>
                  )}
                </Pressable>

                <View style={styles.secondaryActionRow}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isDetailSaving}
                    onPress={confirmMarkUsed}
                    style={({ pressed }) => [
                      styles.secondarySheetButton,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.secondarySheetButtonText}>Mark as used</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isDetailSaving}
                    onPress={confirmDelete}
                    style={({ pressed }) => [
                      styles.deleteSheetButton,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.deleteSheetButtonText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  addFab: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    shadowColor: '#1A1D1A',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    width: 56,
  },
  addFabPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.97 }],
  },
  deleteSheetButton: {
    alignItems: 'center',
    borderColor: 'rgba(181, 138, 12, 0.42)',
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  deleteSheetButtonText: {
    color: colors.amberDeep,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  detailError: {
    color: colors.amberDeep,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: space[1.5],
  },
  detailField: {
    marginTop: space[4],
  },
  detailInput: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 15,
    fontWeight: '600',
    height: 48,
    marginTop: space[2],
    paddingHorizontal: space[3.5],
  },
  detailLabel: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
  },
  detailMeta: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: space[1],
  },
  detailSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '86%',
    paddingHorizontal: space[4],
    paddingTop: space[2],
    shadowColor: '#1A1D1A',
    shadowOffset: { height: -8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  detailStatusText: {
    color: colors.amberDeep,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: space[4],
    textAlign: 'center',
  },
  editCategoryChip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: space[1.5],
    minHeight: 78,
    paddingHorizontal: space[3],
    paddingVertical: space[2.5],
    width: 90,
  },
  editCategoryChipSelected: {
    borderColor: colors.ink,
    borderWidth: 1.5,
  },
  editCategoryChipText: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
    textAlign: 'center',
  },
  editCategoryList: {
    gap: space[2],
    paddingHorizontal: 1,
    paddingVertical: space[1.5],
  },
  editQuantityInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamily.mono,
    fontSize: 20,
    fontWeight: '700',
    height: 48,
    letterSpacing: 0,
    textAlign: 'center',
  },
  editQuantityRow: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: space[2],
    overflow: 'hidden',
  },
  editSegment: {
    alignItems: 'center',
    borderRadius: 999,
    flex: 1,
    height: 32,
    justifyContent: 'center',
  },
  editSegmentRow: {
    backgroundColor: colors.bgWarm,
    borderRadius: 999,
    flexDirection: 'row',
    gap: space[1],
    marginTop: space[3],
    padding: space[1],
  },
  editSegmentSelected: {
    backgroundColor: colors.ink,
  },
  editSegmentText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 15,
  },
  editSegmentTextSelected: {
    color: colors.bg,
  },
  editStepButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 54,
  },
  editStepButtonText: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 23,
    fontWeight: '500',
    lineHeight: 27,
  },
  editZoneChip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 38,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
  },
  editZoneChipSelected: {
    backgroundColor: colors.sageSoft,
    borderColor: colors.sageTint,
  },
  editZoneChipText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  editZoneChipTextSelected: {
    color: colors.sageDeep,
  },
  editZoneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
    marginTop: space[3],
  },
  categoryChip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    paddingHorizontal: space[3],
  },
  categoryChipText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 15,
  },
  categoryChips: {
    gap: space[1.5],
    paddingBottom: space[2],
    paddingHorizontal: space[4.5],
    paddingTop: space[3],
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
  chipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipSelectedText: {
    color: colors.bg,
  },
  emptyBody: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    maxWidth: 250,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.kraftSoft,
    borderColor: 'rgba(74, 53, 32, 0.18)',
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: space[3.5],
    marginTop: space[5],
    minHeight: 180,
    padding: space[6],
  },
  emptyTitle: {
    color: colors.kraftInk,
    fontFamily: fontFamily.sans,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: space[2],
    textAlign: 'center',
  },
  errorText: {
    ...typography.caption,
    color: colors.amberDeep,
    marginHorizontal: space[4.5],
    marginTop: space[2],
  },
  expiryChip: {
    backgroundColor: colors.bgWarm,
    borderRadius: 999,
    paddingHorizontal: space[2.5],
    paddingVertical: space[1.5],
  },
  expiryChipText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  expiryChipTextUrgent: {
    color: colors.amberDeep,
  },
  expiryChipUrgent: {
    backgroundColor: colors.amberSoft,
  },
  inlineAddButton: {
    backgroundColor: colors.ink,
    borderRadius: 999,
    marginTop: space[4],
    paddingHorizontal: space[5],
    paddingVertical: space[3],
  },
  inlineAddButtonText: {
    color: colors.bg,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  itemCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
  },
  itemMeta: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 1,
  },
  itemName: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 19,
  },
  itemRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[3],
    minHeight: 64,
    paddingHorizontal: space[3.5],
    paddingVertical: space[3],
  },
  itemRowDivider: {
    borderBottomColor: colors.hairline,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemRowPressed: {
    backgroundColor: colors.bgWarm,
  },
  loadingCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space[2],
    marginHorizontal: space[3.5],
    marginTop: space[5],
    minHeight: 104,
    padding: space[4],
  },
  loadingText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27, 36, 24, 0.18)',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  moveButton: {
    alignItems: 'center',
    backgroundColor: colors.bgWarm,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: space[3],
  },
  moveButtonText: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 15,
  },
  moveHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[3],
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.72,
  },
  recordCard: {
    backgroundColor: colors.bgWarm,
    borderRadius: 16,
    gap: space[2],
    marginTop: space[4],
    padding: space[3.5],
  },
  recordLabel: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  recordRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[3],
    justifyContent: 'space-between',
  },
  recordValue: {
    color: colors.ink,
    flexShrink: 1,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'right',
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
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: 999,
    height: 50,
    justifyContent: 'center',
    shadowColor: colors.amber,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  saveButtonDisabled: {
    opacity: 0.68,
  },
  saveButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  saveButtonText: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  secondaryActionRow: {
    flexDirection: 'row',
    gap: space[2],
  },
  secondarySheetButton: {
    alignItems: 'center',
    backgroundColor: colors.bgWarm,
    borderRadius: 999,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  secondarySheetButtonText: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  screen: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space[3.5],
  },
  sheetActions: {
    gap: space[2.5],
    paddingBottom: space[6],
    paddingTop: space[4],
  },
  sheetCloseButton: {
    alignItems: 'center',
    backgroundColor: colors.bgWarm,
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  sheetContent: {
    paddingBottom: space[2],
  },
  sheetEyebrow: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 4,
    marginBottom: space[3],
    width: 42,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[3],
    justifyContent: 'space-between',
  },
  sheetTitle: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 27,
  },
  sheetTitleGroup: {
    flex: 1,
    minWidth: 0,
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
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: space[2],
    paddingHorizontal: space[1.5],
  },
  sortLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingVertical: space[1],
  },
  sortLabelText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 15,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: space[2],
    paddingHorizontal: space[1],
  },
  useSoonSection: {
    marginTop: space[2],
  },
  zoneChip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    paddingHorizontal: space[3],
  },
  zoneChipSelected: {
    backgroundColor: colors.sageSoft,
    borderColor: colors.sageTint,
  },
  zoneChipText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 15,
  },
  zoneChipTextSelected: {
    color: colors.sageDeep,
  },
  zoneGlyph: {
    alignItems: 'center',
    borderRadius: 20,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  zoneGlyphText: {
    fontFamily: fontFamily.mono,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
  },
  zoneHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: space[3.5],
    paddingBottom: space[1],
    paddingHorizontal: space[1.5],
    paddingTop: space[2],
  },
  zoneHeaderCopy: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  zoneMetaDivider: {
    color: colors.muteSoft,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  zoneMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
    marginTop: space[1.5],
  },
  zoneMetaText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  zonePickerContent: {
    gap: space[1.5],
    paddingHorizontal: space[4.5],
    paddingTop: space[4],
  },
  zoneSoonText: {
    color: colors.amberDeep,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  zoneTitle: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 34,
  },
});
