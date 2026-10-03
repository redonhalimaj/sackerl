import { colors, nativeFont, nativeTypography, space } from '@sackerl/tokens';
import type {
  AuthenticatedUserContext,
  RecipeIngredientMatch,
  RecipeSuggestion,
} from '@sackerl/api-client';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
import { getMobileRecipesClient } from '../../lib/recipes';
import { getMobileShoppingListClient } from '../../lib/shopping-list';

type RecipeDetailState = 'error' | 'loading' | 'ready';

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
    <Svg fill="none" height={15} stroke={colors.ink} viewBox="0 0 24 24" width={15}>
      <Path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} />
    </Svg>
  );
}

function firstParamValue(value: string | readonly string[] | undefined): string {
  return typeof value === 'string' ? value : (value?.[0] ?? 'recipe');
}

function formatIngredient(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function matchedItemIds(matches: readonly RecipeIngredientMatch[]): readonly string[] {
  const ids = new Set<string>();

  for (const match of matches) {
    for (const itemId of match.matchedItemIds) {
      ids.add(itemId);
    }
  }

  return [...ids];
}

export default function RecipeDetailRoute(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { session } = useAuthSession();
  const recipeId = firstParamValue(params.id);
  const [detailState, setDetailState] = useState<RecipeDetailState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [feedbackMessage, setFeedbackMessage] = useState<string | undefined>();
  const [isAddingMissing, setIsAddingMissing] = useState(false);
  const [isCooking, setIsCooking] = useState(false);
  const [suggestion, setSuggestion] = useState<RecipeSuggestion | undefined>();
  const stockItemIds = useMemo(
    () => matchedItemIds(suggestion?.matchedIngredients ?? []),
    [suggestion],
  );
  const coveredCount = suggestion?.coveredIngredientCount ?? 0;
  const totalCount = suggestion?.totalIngredientCount ?? 0;

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadRecipeDetail() {
        if (!session?.user) {
          return;
        }

        setDetailState('loading');
        setErrorMessage(undefined);
        setFeedbackMessage(undefined);

        try {
          const context = {
            accessToken: session.access_token,
            user: {
              email: session.user.email,
              id: session.user.id,
            },
          } satisfies AuthenticatedUserContext;
          const household = await getMobileProfileClient().getHousehold(context);

          if (!household) {
            throw new Error('Household not found.');
          }

          const nextSuggestion = await getMobileRecipesClient().getSuggestion(context, {
            householdId: household.id,
            recipeId,
          });

          if (isActive) {
            setSuggestion(nextSuggestion);
            setDetailState('ready');
          }
        } catch (error) {
          if (isActive) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to load recipe.');
            setDetailState('error');
          }
        }
      }

      void loadRecipeDetail();

      return () => {
        isActive = false;
      };
    }, [recipeId, session]),
  );

  async function handleCookedIt() {
    if (!session?.user || !suggestion || stockItemIds.length < 1) {
      return;
    }

    setIsCooking(true);
    setFeedbackMessage(undefined);

    try {
      const context = {
        accessToken: session.access_token,
        user: {
          email: session.user.email,
          id: session.user.id,
        },
      } satisfies AuthenticatedUserContext;
      const household = await getMobileProfileClient().getHousehold(context);

      if (!household) {
        throw new Error('Household not found.');
      }

      await Promise.all(
        stockItemIds.map((itemId) =>
          getMobileItemsClient().deleteItem(context, {
            householdId: household.id,
            id: itemId,
            removalReason: 'used',
          }),
        ),
      );

      setFeedbackMessage('Cooked it. Matched stock items were marked as used.');
      setSuggestion({
        ...suggestion,
        coveredIngredientCount: 0,
        matchedIngredients: suggestion.matchedIngredients.map((ingredient) => ({
          ...ingredient,
          covered: false,
          matchedItemIds: [],
        })),
        matchedItemIds: [],
        missingIngredients: suggestion.recipe.ingredients,
        score: 0,
      });
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : 'Unable to mark items as used.');
    } finally {
      setIsCooking(false);
    }
  }

  async function handleAddMissingToShoppingList() {
    if (!session?.user || !suggestion) {
      return;
    }

    const missingIngredients = suggestion.missingIngredients;

    if (missingIngredients.length < 1) {
      setFeedbackMessage('No missing ingredients to add.');
      return;
    }

    setIsAddingMissing(true);
    setFeedbackMessage(undefined);

    try {
      const context = {
        accessToken: session.access_token,
        user: {
          email: session.user.email,
          id: session.user.id,
        },
      } satisfies AuthenticatedUserContext;
      const household = await getMobileProfileClient().getHousehold(context);

      if (!household) {
        throw new Error('Household not found.');
      }

      await getMobileShoppingListClient().createItemsBatch(context, {
        householdId: household.id,
        items: missingIngredients.map((ingredient) => ({
          name: formatIngredient(ingredient),
          recipeId: suggestion.recipe.id,
          source: 'recipe',
        })),
      });

      setFeedbackMessage(
        missingIngredients.length === 1
          ? 'Added 1 missing item to shopping list.'
          : `Added ${missingIngredients.length} missing items to shopping list.`,
      );
      router.push('/shopping-list');
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : 'Unable to add missing items.');
    } finally {
      setIsAddingMissing(false);
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

        {detailState === 'loading' ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.sageDeep} />
            <Text style={styles.stateText}>Checking your stock</Text>
          </View>
        ) : detailState === 'error' || !suggestion ? (
          <View style={styles.centerState}>
            <Text style={styles.eyebrow}>Recipe detail</Text>
            <Text style={styles.title}>Could not load recipe</Text>
            <Text style={styles.body}>{errorMessage ?? 'Try again from the Home card.'}</Text>
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <View style={styles.recipeImage}>
                <Text style={styles.recipeImageText}>Recipe</Text>
              </View>
              <Text style={styles.eyebrow}>From your stock</Text>
              <Text style={styles.title}>{suggestion.recipe.name}</Text>
              <Text style={styles.body}>
                {coveredCount} of {totalCount} ingredients are already at home. Serves{' '}
                {suggestion.recipe.serves} · {suggestion.recipe.timeMinutes} min.
              </Text>
            </View>

            <View style={styles.ingredientsCard}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              {suggestion.matchedIngredients.map((ingredient, index) => (
                <View
                  key={ingredient.ingredient}
                  style={[styles.ingredientRow, index > 0 ? styles.ingredientRowDivider : null]}
                >
                  <View
                    style={[
                      styles.ingredientIcon,
                      ingredient.covered ? styles.ingredientIconCovered : styles.ingredientIconBuy,
                    ]}
                  >
                    {ingredient.covered ? (
                      <CheckIcon />
                    ) : (
                      <Text style={styles.buyChipText}>buy</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.ingredientName,
                      ingredient.covered ? styles.ingredientNameCovered : styles.ingredientNameBuy,
                    ]}
                  >
                    {formatIngredient(ingredient.ingredient)}
                  </Text>
                </View>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void handleAddMissingToShoppingList();
              }}
              disabled={isAddingMissing}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed ? styles.pressed : null,
                isAddingMissing ? styles.disabledButton : null,
              ]}
            >
              {isAddingMissing ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.secondaryButtonText}>Add missing to shopping list</Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={isCooking || stockItemIds.length < 1}
              onPress={() => {
                void handleCookedIt();
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed ? styles.primaryButtonPressed : null,
                isCooking || stockItemIds.length < 1 ? styles.disabledButton : null,
              ]}
            >
              {isCooking ? (
                <ActivityIndicator color={colors.ink} />
              ) : (
                <Text style={styles.primaryButtonText}>Cooked it</Text>
              )}
            </Pressable>

            {feedbackMessage ? <Text style={styles.feedbackText}>{feedbackMessage}</Text> : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  body: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginTop: space[3],
    textAlign: 'center',
  },
  buyChipText: {
    color: colors.amberDeep,
    fontFamily: fontFamily.sans,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  centerState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 520,
    paddingBottom: 64,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: space[4.5],
  },
  disabledButton: {
    opacity: 0.48,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.sageDeep,
    marginTop: space[5],
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
    paddingTop: space[6],
  },
  ingredientIcon: {
    alignItems: 'center',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 50,
  },
  ingredientIconBuy: {
    backgroundColor: colors.amberSoft,
  },
  ingredientIconCovered: {
    backgroundColor: colors.sageSoft,
  },
  ingredientName: {
    flex: 1,
    fontFamily: fontFamily.sans,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
  },
  ingredientNameBuy: {
    color: colors.amberDeep,
  },
  ingredientNameCovered: {
    color: colors.ink,
  },
  ingredientRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[3],
    paddingVertical: space[3],
  },
  ingredientRowDivider: {
    borderColor: colors.borderSoft,
    borderTopWidth: 1,
  },
  ingredientsCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: space[6],
    paddingHorizontal: space[4],
    paddingVertical: space[3],
  },
  pressed: {
    opacity: 0.72,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: 999,
    justifyContent: 'center',
    marginTop: space[3],
    minHeight: 52,
    paddingHorizontal: space[5],
  },
  primaryButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  recipeImage: {
    alignItems: 'center',
    backgroundColor: colors.sageSoft,
    borderColor: colors.sageTint,
    borderRadius: 26,
    borderWidth: 1,
    height: 172,
    justifyContent: 'center',
    width: '100%',
  },
  recipeImageText: {
    color: colors.sageDeep,
    fontFamily: fontFamily.mono,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  screen: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 999,
    justifyContent: 'center',
    marginTop: space[4],
    minHeight: 50,
    paddingHorizontal: space[5],
  },
  secondaryButtonText: {
    color: colors.bg,
    fontFamily: fontFamily.sans,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fontFamily.sans,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    paddingBottom: space[1],
    paddingTop: space[1],
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
  title: {
    color: colors.ink,
    fontFamily: fontFamily.serif,
    fontSize: 36,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 40,
    marginTop: space[2],
    textAlign: 'center',
  },
});
