import { colors, nativeFont, nativeTypography, space } from '@sackerl/tokens';
import type {
  AuthenticatedUserContext,
  ShoppingListItem,
  ShoppingListSuggestion,
} from '@sackerl/api-client';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState, type JSX } from 'react';
import {
  ActivityIndicator,
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
import { getMobileProfileClient } from '../lib/profile';
import { getMobileShoppingListClient } from '../lib/shopping-list';

type ShoppingListState = 'error' | 'loading' | 'ready';

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

function ChevronLeftIcon(): JSX.Element {
  return (
    <Svg fill="none" height={22} stroke={colors.ink} viewBox="0 0 24 24" width={22}>
      <Path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function CheckIcon(): JSX.Element {
  return (
    <Svg fill="none" height={15} stroke={colors.bg} viewBox="0 0 24 24" width={15}>
      <Path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.6} />
    </Svg>
  );
}

function PlusIcon(): JSX.Element {
  return (
    <Svg fill="none" height={18} stroke={colors.bg} viewBox="0 0 24 24" width={18}>
      <Path d="M12 5v14M5 12h14" strokeLinecap="round" strokeWidth={2.4} />
    </Svg>
  );
}

function formatCount(value: number, singular: string, plural: string): string {
  return value === 1 ? `1 ${singular}` : `${value} ${plural}`;
}

function formatQuantity(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);
}

function sourceLabel(item: ShoppingListItem): string {
  if (item.source === 'recipe') {
    return 'Recipe';
  }

  if (item.source === 'suggested') {
    return 'Suggested';
  }

  return 'Manual';
}

function suggestionKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function buildContext(
  session: ReturnType<typeof useAuthSession>['session'],
): AuthenticatedUserContext {
  if (!session?.user) {
    throw new Error('Sign in required.');
  }

  return {
    accessToken: session.access_token,
    user: {
      email: session.user.email,
      id: session.user.id,
    },
  };
}

async function getHouseholdId(context: AuthenticatedUserContext): Promise<string> {
  const household = await getMobileProfileClient().getHousehold(context);

  if (!household) {
    throw new Error('Household not found.');
  }

  return household.id;
}

export default function ShoppingListRoute(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuthSession();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [feedbackMessage, setFeedbackMessage] = useState<string | undefined>();
  const [householdId, setHouseholdId] = useState<string | undefined>();
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [items, setItems] = useState<readonly ShoppingListItem[]>([]);
  const [loadState, setLoadState] = useState<ShoppingListState>('loading');
  const [suggestions, setSuggestions] = useState<readonly ShoppingListSuggestion[]>([]);
  const [updatingIds, setUpdatingIds] = useState<ReadonlySet<string>>(() => new Set());
  const openCount = items.filter((item) => !item.checkedAt).length;
  const checkedCount = items.length - openCount;
  const visibleSuggestionChips = useMemo(() => {
    const activeItemNames = new Set(
      items.filter((item) => !item.checkedAt).map((item) => suggestionKey(item.name)),
    );

    return suggestions.filter((suggestion) => !activeItemNames.has(suggestionKey(suggestion.name)));
  }, [items, suggestions]);

  const loadShoppingList = useCallback(async () => {
    if (!session?.user) {
      return;
    }

    setLoadState('loading');
    setErrorMessage(undefined);

    try {
      const context = buildContext(session);
      const nextHouseholdId = await getHouseholdId(context);
      const [listResult, nextSuggestions] = await Promise.all([
        getMobileShoppingListClient().listItems(context, {
          householdId: nextHouseholdId,
        }),
        getMobileShoppingListClient().listSuggestions(context, {
          householdId: nextHouseholdId,
        }),
      ]);

      setHouseholdId(nextHouseholdId);
      setItems(listResult.items);
      setSuggestions(nextSuggestions);
      setLoadState('ready');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load shopping list.');
      setLoadState('error');
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      void loadShoppingList();
    }, [loadShoppingList]),
  );

  function setItemUpdating(id: string, isUpdating: boolean) {
    setUpdatingIds((current) => {
      const next = new Set(current);

      if (isUpdating) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  }

  async function handleAddManual() {
    const name = inputValue.trim();

    if (!name || !householdId) {
      return;
    }

    setIsAdding(true);
    setFeedbackMessage(undefined);

    try {
      const context = buildContext(session);
      const item = await getMobileShoppingListClient().createItem(context, {
        householdId,
        name,
        source: 'manual',
      });

      setItems((current) => [item, ...current]);
      setInputValue('');
      setFeedbackMessage(`${item.name} added.`);
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : 'Unable to add item.');
    } finally {
      setIsAdding(false);
    }
  }

  async function handleAddSuggestion(suggestion: ShoppingListSuggestion) {
    if (!householdId) {
      return;
    }

    setFeedbackMessage(undefined);

    try {
      const context = buildContext(session);
      const item = await getMobileShoppingListClient().createItem(context, {
        categoryId: suggestion.categoryId,
        householdId,
        name: suggestion.name,
        qtyUnit: suggestion.qtyUnit,
        source: 'suggested',
      });

      setItems((current) => [item, ...current]);
      setFeedbackMessage(`${item.name} added from receipt history.`);
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : 'Unable to add suggestion.');
    }
  }

  async function handleToggleItem(item: ShoppingListItem) {
    if (!householdId || updatingIds.has(item.id)) {
      return;
    }

    setItemUpdating(item.id, true);
    setFeedbackMessage(undefined);

    try {
      const context = buildContext(session);
      const updatedItem = await getMobileShoppingListClient().updateItem(context, {
        checked: !item.checkedAt,
        householdId,
        id: item.id,
      });

      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === updatedItem.id ? updatedItem : currentItem,
        ),
      );
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : 'Unable to update item.');
    } finally {
      setItemUpdating(item.id, false);
    }
  }

  async function handleDeleteItem(item: ShoppingListItem) {
    if (!householdId || updatingIds.has(item.id)) {
      return;
    }

    setItemUpdating(item.id, true);
    setFeedbackMessage(undefined);

    try {
      const context = buildContext(session);

      await getMobileShoppingListClient().deleteItem(context, {
        householdId,
        id: item.id,
      });
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      setFeedbackMessage(`${item.name} removed.`);
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : 'Unable to remove item.');
    } finally {
      setItemUpdating(item.id, false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom, space[6]) + 24,
            paddingTop: Math.max(insets.top, 44) + 12,
          },
        ]}
      >
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          onPress={() => {
            router.back();
          }}
          style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
        >
          <ChevronLeftIcon />
        </Pressable>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Shopping list</Text>
          <Text style={styles.title}>What to buy</Text>
          <Text style={styles.subtitle}>
            {formatCount(openCount, 'item', 'items')} open ·{' '}
            {formatCount(checkedCount, 'checked item', 'checked items')}
          </Text>
        </View>

        {loadState === 'loading' ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.sageDeep} />
            <Text style={styles.stateText}>Loading list</Text>
          </View>
        ) : loadState === 'error' ? (
          <View style={styles.centerState}>
            <Text style={styles.errorTitle}>Could not load shopping list</Text>
            <Text style={styles.errorText}>{errorMessage ?? 'Try again in a moment.'}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void loadShoppingList();
              }}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.addCard}>
              <TextInput
                accessibilityLabel="Shopping list item name"
                autoCapitalize="words"
                onChangeText={setInputValue}
                onSubmitEditing={() => {
                  void handleAddManual();
                }}
                placeholder="Add an item"
                placeholderTextColor={colors.muteSoft}
                returnKeyType="done"
                style={styles.input}
                value={inputValue}
              />
              <Pressable
                accessibilityLabel="Add item"
                accessibilityRole="button"
                disabled={isAdding || inputValue.trim().length < 1}
                onPress={() => {
                  void handleAddManual();
                }}
                style={({ pressed }) => [
                  styles.addButton,
                  pressed ? styles.pressed : null,
                  isAdding || inputValue.trim().length < 1 ? styles.disabledButton : null,
                ]}
              >
                {isAdding ? <ActivityIndicator color={colors.bg} /> : <PlusIcon />}
              </Pressable>
            </View>

            {visibleSuggestionChips.length > 0 ? (
              <View style={styles.suggestionWrap}>
                <Text style={styles.sectionEyebrow}>From receipts</Text>
                <View style={styles.suggestionChips}>
                  {visibleSuggestionChips.map((suggestion) => (
                    <Pressable
                      accessibilityRole="button"
                      key={`${suggestion.name}-${suggestion.lastSeenOn}`}
                      onPress={() => {
                        void handleAddSuggestion(suggestion);
                      }}
                      style={({ pressed }) => [
                        styles.suggestionChip,
                        pressed ? styles.pressed : null,
                      ]}
                    >
                      <Text style={styles.suggestionChipText}>{suggestion.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.listCard}>
              {items.length < 1 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No shopping items yet</Text>
                  <Text style={styles.emptyText}>Add one manually or from a recipe.</Text>
                </View>
              ) : (
                items.map((item, index) => {
                  const isChecked = Boolean(item.checkedAt);
                  const isUpdating = updatingIds.has(item.id);

                  return (
                    <View
                      key={item.id}
                      style={[styles.itemRow, index > 0 ? styles.itemRowDivider : null]}
                    >
                      <Pressable
                        accessibilityLabel={`${isChecked ? 'Uncheck' : 'Check'} ${item.name}`}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isChecked }}
                        disabled={isUpdating}
                        onPress={() => {
                          void handleToggleItem(item);
                        }}
                        style={({ pressed }) => [
                          styles.itemMain,
                          pressed ? styles.pressed : null,
                          isUpdating ? styles.disabledButton : null,
                        ]}
                      >
                        <View style={[styles.checkbox, isChecked ? styles.checkboxChecked : null]}>
                          {isChecked ? <CheckIcon /> : null}
                        </View>
                        <View style={styles.itemTextWrap}>
                          <Text
                            style={[styles.itemName, isChecked ? styles.itemNameChecked : null]}
                          >
                            {item.name}
                          </Text>
                          <Text style={styles.itemMeta}>
                            {sourceLabel(item)} · {formatQuantity(item.qtyValue)} {item.qtyUnit}
                          </Text>
                        </View>
                      </Pressable>
                      <Pressable
                        accessibilityLabel={`Remove ${item.name}`}
                        accessibilityRole="button"
                        disabled={isUpdating}
                        onPress={() => {
                          void handleDeleteItem(item);
                        }}
                        style={({ pressed }) => [
                          styles.removeButton,
                          pressed ? styles.pressed : null,
                          isUpdating ? styles.disabledButton : null,
                        ]}
                      >
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </Pressable>
                    </View>
                  );
                })
              )}
            </View>

            {feedbackMessage ? <Text style={styles.feedbackText}>{feedbackMessage}</Text> : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  addCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space[3],
    marginTop: space[6],
    padding: space[3],
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 340,
    paddingHorizontal: space[6],
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1.5,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  checkboxChecked: {
    backgroundColor: colors.sageDeep,
    borderColor: colors.sageDeep,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: space[4.5],
  },
  disabledButton: {
    opacity: 0.48,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: space[4],
    paddingVertical: space[7],
  },
  emptyText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: space[2],
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  errorText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: space[2],
    textAlign: 'center',
  },
  errorTitle: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    textAlign: 'center',
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.sageDeep,
    textAlign: 'center',
  },
  feedbackText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: space[3],
    textAlign: 'center',
  },
  hero: {
    alignItems: 'center',
    marginTop: space[7],
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamily.sans,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    minHeight: 48,
    paddingHorizontal: space[2],
  },
  itemMain: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: space[3],
    minHeight: 62,
    paddingVertical: space[3],
  },
  itemMeta: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 2,
  },
  itemName: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  itemNameChecked: {
    color: colors.mute,
    textDecorationLine: 'line-through',
  },
  itemRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[2],
  },
  itemRowDivider: {
    borderColor: colors.borderSoft,
    borderTopWidth: 1,
  },
  itemTextWrap: {
    flex: 1,
  },
  listCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: space[5],
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
  pressed: {
    opacity: 0.72,
  },
  removeButton: {
    paddingHorizontal: space[2],
    paddingVertical: space[2],
  },
  removeButtonText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 999,
    justifyContent: 'center',
    marginTop: space[5],
    minHeight: 46,
    paddingHorizontal: space[6],
  },
  retryButtonText: {
    color: colors.bg,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  screen: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  sectionEyebrow: {
    ...typography.eyebrow,
    color: colors.mute,
  },
  stateText: {
    color: colors.mute,
    fontFamily: fontFamily.mono,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0,
    marginTop: space[3],
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: space[3],
    textAlign: 'center',
  },
  suggestionChip: {
    backgroundColor: colors.sageSoft,
    borderColor: colors.sageTint,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
  },
  suggestionChipText: {
    color: colors.sageDeep,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
    marginTop: space[3],
  },
  suggestionWrap: {
    marginTop: space[5],
  },
  title: {
    color: colors.ink,
    fontFamily: fontFamily.serif,
    fontSize: 42,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 46,
    marginTop: space[2],
    textAlign: 'center',
  },
});
