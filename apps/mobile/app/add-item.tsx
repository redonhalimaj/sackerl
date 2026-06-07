import { colors, nativeFont, space } from '@sackerl/tokens';
import {
  estimateExpiryDate,
  itemCategories,
  itemQuantityUnits,
  type AuthenticatedUserContext,
  type ItemCategoryId,
  type ItemQuantityUnit,
  type StorageZone,
} from '@sackerl/api-client';
import { categoryMeta, zoneMeta, type TileCategory, type ZoneKind } from '@sackerl/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type JSX } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useAuthSession } from '../lib/auth-session';
import { getMobileItemsClient } from '../lib/items';
import { getMobileProfileClient } from '../lib/profile';

type FieldErrors = {
  expiry?: string | undefined;
  name?: string | undefined;
  quantity?: string | undefined;
  zone?: string | undefined;
};

type FormLoadState = 'error' | 'loading' | 'ready';

type ZoneOption = {
  readonly id: string | undefined;
  readonly key: string;
  readonly label: string;
};

const fontFamily =
  Platform.OS === 'ios'
    ? nativeFont.ios
    : Platform.OS === 'android'
      ? nativeFont.android
      : nativeFont.fallback;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const defaultZoneKeys = ['fridge', 'pantry', 'basement', 'freezer'] as const;
const quantityStep = 1;

function ChevronLeftIcon(): JSX.Element {
  return (
    <Svg fill="none" height={22} stroke={colors.ink} viewBox="0 0 24 24" width={22}>
      <Path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function CheckIcon(): JSX.Element {
  return (
    <Svg fill="none" height={14} stroke={colors.bg} viewBox="0 0 24 24" width={14}>
      <Path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
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

function isKnownZoneKind(value: string): value is ZoneKind {
  return value in zoneMeta;
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

function zoneOptionFromKey(key: string): ZoneOption {
  return {
    id: undefined,
    key,
    label: labelForZoneKey(key),
  };
}

function zoneOptionFromStorageZone(zone: StorageZone): ZoneOption {
  return {
    id: zone.id,
    key: zone.key,
    label: zone.label,
  };
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

function parseQuantity(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatQuantity(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);
}

function resolveZoneOptions(
  zones: readonly StorageZone[],
  householdZoneKeys: readonly string[],
): readonly ZoneOption[] {
  if (zones.length > 0) {
    return zones.map(zoneOptionFromStorageZone);
  }

  const fallbackKeys = householdZoneKeys.length > 0 ? householdZoneKeys : defaultZoneKeys;

  return fallbackKeys.map(zoneOptionFromKey);
}

function dedupeZoneKeys(zones: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const zone of zones) {
    const value = zone.trim().toLowerCase();

    if (/^[a-z][a-z0-9-]{1,31}$/.test(value) && !seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }

  return result.length > 0 ? result : [...defaultZoneKeys];
}

async function loadWritableZones(
  context: AuthenticatedUserContext,
): Promise<readonly ZoneOption[]> {
  const profileClient = getMobileProfileClient();
  const itemsClient = getMobileItemsClient();
  const household = await profileClient.ensureHousehold(context);
  let zones = await itemsClient.listZones(context, household.id);

  if (zones.length < 1) {
    const householdZones = dedupeZoneKeys(household.zones);
    const updatedHousehold = await profileClient.updateHouseholdZones(context, {
      zones: householdZones,
    });

    zones = await itemsClient.listZones(context, updatedHousehold.id);

    if (zones.length < 1) {
      return resolveZoneOptions(zones, updatedHousehold.zones);
    }
  }

  return resolveZoneOptions(zones, household.zones);
}

function FieldError({ message }: { readonly message: string | undefined }): JSX.Element | null {
  return message ? <Text style={styles.errorText}>{message}</Text> : null;
}

export default function AddItemRoute(): JSX.Element {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ zone?: string }>();
  const requestedZoneKey = useMemo(() => normalizeZoneParam(params.zone), [params.zone]);
  const initialZoneKey = requestedZoneKey ?? 'fridge';
  const router = useRouter();
  const { session } = useAuthSession();
  const [categoryId, setCategoryId] = useState<ItemCategoryId>('produce');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [expiryInput, setExpiryInput] = useState(() =>
    estimateExpiryDate({ categoryId: 'produce', zoneKey: initialZoneKey }),
  );
  const [expiryTouched, setExpiryTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadState, setLoadState] = useState<FormLoadState>('loading');
  const [name, setName] = useState('');
  const [quantityInput, setQuantityInput] = useState('1');
  const [quantityUnit, setQuantityUnit] = useState<ItemQuantityUnit>('pcs');
  const [selectedZoneKey, setSelectedZoneKey] = useState(initialZoneKey);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [zoneOptions, setZoneOptions] = useState<readonly ZoneOption[]>([]);

  useEffect(() => {
    if (!expiryTouched) {
      setExpiryInput(estimateExpiryDate({ categoryId, zoneKey: selectedZoneKey }));
    }
  }, [categoryId, expiryTouched, selectedZoneKey]);

  const loadZones = useCallback(async () => {
    if (!session?.user) {
      return;
    }

    setLoadState('loading');
    setStatusMessage(undefined);

    try {
      const context = {
        accessToken: session.access_token,
        user: {
          email: session.user.email,
          id: session.user.id,
        },
      };
      const zones = await loadWritableZones(context);
      const nextSelectedZone =
        zones.find((zone) => zone.key === requestedZoneKey) ??
        zones[0] ??
        zoneOptionFromKey('fridge');

      setZoneOptions(zones);
      setSelectedZoneKey(nextSelectedZone.key);
      setLoadState('ready');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to load storage zones.');
      setLoadState('error');
    }
  }, [requestedZoneKey, session]);

  useEffect(() => {
    void loadZones();
  }, [loadZones]);

  const selectedZone = useMemo(
    () => zoneOptions.find((zone) => zone.key === selectedZoneKey),
    [selectedZoneKey, zoneOptions],
  );
  const selectedCategory = categoryMeta[categoryId];
  const quantityValue = parseQuantity(quantityInput) ?? 1;
  const isLocked = isSaving || loadState === 'loading';

  function updateQuantity(nextValue: number) {
    setQuantityInput(formatQuantity(Math.max(quantityStep, nextValue)));
  }

  function validateForm(): { readonly expiresOn: string | null; readonly qtyValue: number } | null {
    const nextErrors: FieldErrors = {};
    const trimmedName = name.trim();
    const qtyValue = parseQuantity(quantityInput);
    const trimmedExpiry = expiryInput.trim();

    if (!trimmedName) {
      nextErrors.name = 'Name is required.';
    }

    if (!qtyValue) {
      nextErrors.quantity = 'Quantity must be greater than zero.';
    }

    if (!selectedZone) {
      nextErrors.zone = 'Choose a storage zone.';
    } else if (!selectedZone.id) {
      nextErrors.zone = 'This storage zone is not ready yet. Reopen storage setup and save zones.';
    }

    if (trimmedExpiry && !datePattern.test(trimmedExpiry)) {
      nextErrors.expiry = 'Use YYYY-MM-DD or leave it blank.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !qtyValue || !selectedZone) {
      return null;
    }

    return {
      expiresOn: trimmedExpiry || estimateExpiryDate({ categoryId, zoneKey: selectedZone.key }),
      qtyValue,
    };
  }

  async function handleSubmit() {
    if (!session?.user || isSaving) {
      return;
    }

    const validFields = validateForm();

    if (!validFields || !selectedZone?.id) {
      return;
    }

    setIsSaving(true);
    setStatusMessage(undefined);

    try {
      const context = {
        accessToken: session.access_token,
        user: {
          email: session.user.email,
          id: session.user.id,
        },
      };
      const household = await getMobileProfileClient().ensureHousehold(context);

      await getMobileItemsClient().createItem(context, {
        categoryId,
        expiresOn: validFields.expiresOn,
        householdId: household.id,
        name: name.trim(),
        qtyUnit: quantityUnit,
        qtyValue: validFields.qtyValue,
        source: 'manual',
        zoneId: selectedZone.id,
      });

      router.replace({ pathname: '/stock', params: { zone: selectedZone.key } });
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to add item.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom, 12) + 24,
            paddingTop: Math.max(insets.top, 44) + 10,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Cancel add item"
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => {
              router.back();
            }}
            style={({ pressed }) => [styles.roundButton, pressed ? styles.pressed : null]}
          >
            <ChevronLeftIcon />
          </Pressable>
          <Text style={styles.topBarTitle}>Add item</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.sheet}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              autoCapitalize="words"
              editable={!isLocked}
              onChangeText={(value) => {
                setName(value);
                if (errors.name) {
                  setErrors((current) => ({ ...current, name: undefined }));
                }
              }}
              placeholder="e.g. Cucumber"
              placeholderTextColor={colors.muteSoft}
              returnKeyType="next"
              style={styles.nameInput}
              value={name}
            />
            <FieldError message={errors.name} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView
              contentContainerStyle={styles.categoryList}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {itemCategories.map((category) => {
                const isSelected = category.id === categoryId;

                return (
                  <Pressable
                    accessibilityLabel={category.label}
                    accessibilityRole="button"
                    accessibilityState={isSelected ? { selected: true } : undefined}
                    disabled={isLocked}
                    key={category.id}
                    onPress={() => {
                      setCategoryId(category.id);
                    }}
                    style={[styles.categoryChip, isSelected ? styles.categoryChipSelected : null]}
                  >
                    <CategoryTile category={category.id} />
                    <Text style={styles.categoryChipText}>{category.label}</Text>
                    {isSelected ? (
                      <View style={styles.categoryCheck}>
                        <CheckIcon />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Quantity</Text>
            <View style={styles.quantityRow}>
              <Pressable
                accessibilityLabel="Decrease quantity"
                accessibilityRole="button"
                disabled={isLocked}
                onPress={() => {
                  updateQuantity(quantityValue - quantityStep);
                }}
                style={({ pressed }) => [styles.stepButton, pressed ? styles.pressed : null]}
              >
                <Text style={styles.stepButtonText}>-</Text>
              </Pressable>
              <TextInput
                editable={!isLocked}
                keyboardType="decimal-pad"
                onChangeText={(value) => {
                  setQuantityInput(value);
                  if (errors.quantity) {
                    setErrors((current) => ({ ...current, quantity: undefined }));
                  }
                }}
                style={styles.quantityInput}
                value={quantityInput}
              />
              <Pressable
                accessibilityLabel="Increase quantity"
                accessibilityRole="button"
                disabled={isLocked}
                onPress={() => {
                  updateQuantity(quantityValue + quantityStep);
                }}
                style={({ pressed }) => [styles.stepButton, pressed ? styles.pressed : null]}
              >
                <Text style={styles.stepButtonText}>+</Text>
              </Pressable>
            </View>
            <FieldError message={errors.quantity} />

            <View style={styles.segmentedRow}>
              {itemQuantityUnits.map((unit) => {
                const isSelected = unit === quantityUnit;

                return (
                  <Pressable
                    accessibilityLabel={unit}
                    accessibilityRole="button"
                    accessibilityState={isSelected ? { selected: true } : undefined}
                    disabled={isLocked}
                    key={unit}
                    onPress={() => {
                      setQuantityUnit(unit);
                    }}
                    style={[styles.segment, isSelected ? styles.segmentSelected : null]}
                  >
                    <Text
                      style={[styles.segmentText, isSelected ? styles.segmentTextSelected : null]}
                    >
                      {unit}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Zone</Text>
            {loadState === 'loading' ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.mute} size="small" />
                <Text style={styles.metaText}>Loading zones</Text>
              </View>
            ) : (
              <View style={styles.zoneGrid}>
                {zoneOptions.map((zone) => {
                  const isSelected = zone.key === selectedZoneKey;

                  return (
                    <Pressable
                      accessibilityLabel={zone.label}
                      accessibilityRole="button"
                      accessibilityState={isSelected ? { selected: true } : undefined}
                      disabled={isLocked}
                      key={zone.key}
                      onPress={() => {
                        setSelectedZoneKey(zone.key);
                        if (errors.zone) {
                          setErrors((current) => ({ ...current, zone: undefined }));
                        }
                      }}
                      style={[styles.zoneSegment, isSelected ? styles.zoneSegmentSelected : null]}
                    >
                      <Text
                        style={[
                          styles.zoneSegmentText,
                          isSelected ? styles.zoneSegmentTextSelected : null,
                        ]}
                      >
                        {zone.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            <FieldError message={errors.zone} />
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.expiryHeader}>
              <Text style={styles.fieldLabel}>Expires on</Text>
              <Text style={styles.estimatedBadge}>estimated</Text>
            </View>
            <TextInput
              editable={!isLocked}
              keyboardType="numbers-and-punctuation"
              onChangeText={(value) => {
                setExpiryTouched(true);
                setExpiryInput(value);
                if (errors.expiry) {
                  setErrors((current) => ({ ...current, expiry: undefined }));
                }
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muteSoft}
              style={styles.expiryInput}
              value={expiryInput}
            />
            <Text style={styles.metaText}>
              Based on {selectedCategory.label.toLowerCase()} in{' '}
              {(selectedZone?.label ?? 'storage').toLowerCase()}; edit if you know better.
            </Text>
            <FieldError message={errors.expiry} />
          </View>

          {statusMessage ? <Text style={styles.formStatusText}>{statusMessage}</Text> : null}

          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => {
                router.back();
              }}
              style={({ pressed }) => [styles.cancelButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isLocked}
              onPress={() => {
                void handleSubmit();
              }}
              style={({ pressed }) => [
                styles.submitButton,
                isLocked ? styles.submitButtonDisabled : null,
                pressed ? styles.submitButtonPressed : null,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.ink} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Add</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: space[2.5],
    marginTop: space[5],
  },
  cancelButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    height: 52,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
  },
  categoryCheck: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -6,
    top: -6,
    width: 20,
  },
  categoryChip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: space[2],
    minHeight: 84,
    paddingHorizontal: space[3],
    paddingVertical: space[3],
    position: 'relative',
    width: 96,
  },
  categoryChipSelected: {
    borderColor: colors.ink,
    borderWidth: 1.5,
  },
  categoryChipText: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 15,
    textAlign: 'center',
  },
  categoryList: {
    gap: space[2],
    paddingHorizontal: 2,
    paddingVertical: space[1],
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
  errorText: {
    color: colors.amberDeep,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: space[1.5],
  },
  estimatedBadge: {
    backgroundColor: colors.sageSoft,
    borderRadius: 999,
    color: colors.sageDeep,
    fontFamily: fontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    paddingHorizontal: space[2.5],
    paddingVertical: space[1],
  },
  expiryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expiryInput: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: fontFamily.mono,
    fontSize: 16,
    fontWeight: '600',
    height: 50,
    letterSpacing: 0,
    marginTop: space[2],
    paddingHorizontal: space[3.5],
  },
  fieldGroup: {
    marginTop: space[5],
  },
  fieldLabel: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
  },
  formStatusText: {
    color: colors.amberDeep,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: space[4],
    textAlign: 'center',
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[2],
    minHeight: 46,
  },
  metaText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: space[1.5],
  },
  nameInput: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 17,
    fontWeight: '600',
    height: 56,
    marginTop: space[2],
    paddingHorizontal: space[4],
  },
  pressed: {
    opacity: 0.72,
  },
  quantityInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamily.mono,
    fontSize: 22,
    fontWeight: '700',
    height: 50,
    letterSpacing: 0,
    textAlign: 'center',
  },
  quantityRow: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
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
    paddingHorizontal: space[4.5],
  },
  segment: {
    alignItems: 'center',
    borderRadius: 999,
    flex: 1,
    height: 34,
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.ink,
  },
  segmentText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 15,
  },
  segmentTextSelected: {
    color: colors.bg,
  },
  segmentedRow: {
    backgroundColor: colors.bgWarm,
    borderRadius: 999,
    flexDirection: 'row',
    gap: space[1],
    marginTop: space[3],
    padding: space[1],
  },
  sheet: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: space[4],
    paddingBottom: space[5],
    paddingHorizontal: space[4],
  },
  stepButton: {
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
    width: 56,
  },
  stepButtonText: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 24,
    fontWeight: '500',
    lineHeight: 28,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: 999,
    flex: 1,
    height: 52,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.48,
  },
  submitButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  submitButtonText: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 18,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topBarSpacer: {
    width: 44,
  },
  topBarTitle: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  zoneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
    marginTop: space[2],
  },
  zoneSegment: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 40,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
  },
  zoneSegmentSelected: {
    backgroundColor: colors.sageSoft,
    borderColor: colors.sageTint,
  },
  zoneSegmentText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  zoneSegmentTextSelected: {
    color: colors.sageDeep,
  },
});
