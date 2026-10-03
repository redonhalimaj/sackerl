import { colors, nativeFont, space } from '@sackerl/tokens';
import type {
  AuthenticatedUserContext,
  RecipeSuggestion,
  RecipeSuggestionFilterId,
} from '@sackerl/api-client';
import { recipeMatchesSuggestionFilter, recipeSuggestionFilterIds } from '@sackerl/api-client';
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

import { useAuthSession } from '../lib/auth-session';
import { getMobileProfileClient } from '../lib/profile';
import { getMobileRecipesClient } from '../lib/recipes';

type SuggestionsState = 'error' | 'loading' | 'ready';

const fontFamily =
  Platform.OS === 'ios'
    ? nativeFont.ios
    : Platform.OS === 'android'
      ? nativeFont.android
      : nativeFont.fallback;

const filterLabels: Readonly<Record<RecipeSuggestionFilterId, string>> = {
  all: 'All',
  dinner: 'Dinner',
  quick: 'Quick',
  vegetarian: 'Vegetarian',
};

function ChevronLeftIcon(): JSX.Element {
  return (
    <Svg fill="none" height={22} stroke={colors.ink} viewBox="0 0 24 24" width={22}>
      <Path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function FilterIcon(): JSX.Element {
  return (
    <Svg fill="none" height={20} stroke={colors.ink} viewBox="0 0 24 24" width={20}>
      <Path d="M4 5h16M7 12h10M10 19h4" strokeLinecap="round" strokeWidth={1.9} />
    </Svg>
  );
}

function HeartIcon(): JSX.Element {
  return (
    <Svg fill="none" height={18} stroke={colors.ink} viewBox="0 0 24 24" width={18}>
      <Path
        d="M20.8 8.6c0 4.7-8.8 9.9-8.8 9.9S3.2 13.3 3.2 8.6A4.5 4.5 0 0 1 12 7.1a4.5 4.5 0 0 1 8.8 1.5Z"
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
    </Svg>
  );
}

function ArrowIcon(): JSX.Element {
  return (
    <Svg fill="none" height={15} stroke={colors.bg} viewBox="0 0 24 24" width={15}>
      <Path d="M5 12h14" strokeLinecap="round" strokeWidth={2} />
      <Path d="m13 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
}

function formatIngredient(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function matchChipText(suggestion: RecipeSuggestion): string {
  return `${suggestion.coveredIngredientCount} of ${suggestion.totalIngredientCount} ingredients`;
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

function RecipeCard({ suggestion }: { readonly suggestion: RecipeSuggestion }): JSX.Element {
  const router = useRouter();

  return (
    <View style={styles.recipeCard}>
      <View style={styles.recipeHeader}>
        <View style={styles.recipeTitleWrap}>
          <Text style={styles.recipeTitle}>{suggestion.recipe.name}</Text>
          <Text style={styles.recipeMeta}>
            Serves {suggestion.recipe.serves} · {suggestion.recipe.timeMinutes} min
          </Text>
        </View>
        <View style={styles.matchChip}>
          <Text style={styles.matchChipText}>{matchChipText(suggestion)}</Text>
        </View>
      </View>

      <View style={styles.ingredientChips}>
        {suggestion.matchedIngredients.map((ingredient) => (
          <View
            key={ingredient.ingredient}
            style={[
              styles.ingredientChip,
              ingredient.covered ? styles.ingredientChipCovered : styles.ingredientChipMissing,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.ingredientChipText,
                ingredient.covered
                  ? styles.ingredientChipTextCovered
                  : styles.ingredientChipTextMissing,
              ]}
            >
              {formatIngredient(ingredient.ingredient)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.cardActions}>
        <Pressable
          accessibilityLabel={`Show recipe for ${suggestion.recipe.name}`}
          accessibilityRole="button"
          onPress={() => {
            router.push({
              pathname: '/recipe/[id]',
              params: { id: suggestion.recipe.id },
            });
          }}
          style={({ pressed }) => [
            styles.showRecipeButton,
            pressed ? styles.showRecipeButtonPressed : null,
          ]}
        >
          <Text style={styles.showRecipeText}>Show recipe</Text>
          <ArrowIcon />
        </Pressable>

        <Pressable
          accessibilityLabel={`Save ${suggestion.recipe.name}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          disabled
          style={styles.heartButton}
        >
          <HeartIcon />
        </Pressable>
      </View>
    </View>
  );
}

export default function SuggestionsRoute(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuthSession();
  const [activeFilter, setActiveFilter] = useState<RecipeSuggestionFilterId>('all');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [loadState, setLoadState] = useState<SuggestionsState>('loading');
  const [suggestions, setSuggestions] = useState<readonly RecipeSuggestion[]>([]);
  const filteredSuggestions = useMemo(
    () =>
      suggestions.filter((suggestion) => recipeMatchesSuggestionFilter(suggestion, activeFilter)),
    [activeFilter, suggestions],
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadSuggestions() {
        if (!session?.user) {
          return;
        }

        setLoadState('loading');
        setErrorMessage(undefined);

        try {
          const context = buildContext(session);
          const household = await getMobileProfileClient().getHousehold(context);

          if (!household) {
            if (isActive) {
              setSuggestions([]);
              setLoadState('ready');
            }
            return;
          }

          const result = await getMobileRecipesClient().listSuggestions(context, {
            householdId: household.id,
            limit: 50,
            minScore: 0.2,
          });

          if (isActive) {
            setSuggestions(result.suggestions);
            setLoadState('ready');
          }
        } catch (error) {
          if (isActive) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to load suggestions.');
            setLoadState('error');
          }
        }
      }

      void loadSuggestions();

      return () => {
        isActive = false;
      };
    }, [session]),
  );

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
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Back"
            accessibilityRole="button"
            onPress={() => {
              router.back();
            }}
            style={({ pressed }) => [styles.roundButton, pressed ? styles.pressed : null]}
          >
            <ChevronLeftIcon />
          </Pressable>

          <Text style={styles.topBarTitle}>From your stock</Text>

          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.roundButton}
          >
            <FilterIcon />
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.title}>
            <Text style={styles.titleItalic}>Ideas</Text>
            {'\n'}from your stock
          </Text>
          <Text style={styles.subtitle}>
            Best matches first. Missing ingredients stay visible before you cook.
          </Text>
        </View>

        <View style={styles.filters}>
          {recipeSuggestionFilterIds.map((filterId) => {
            const isActive = activeFilter === filterId;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={isActive ? { selected: true } : undefined}
                key={filterId}
                onPress={() => {
                  setActiveFilter(filterId);
                }}
                style={({ pressed }) => [
                  styles.filterChip,
                  isActive ? styles.filterChipActive : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text
                  style={[styles.filterChipText, isActive ? styles.filterChipTextActive : null]}
                >
                  {filterLabels[filterId]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loadState === 'loading' ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.sageDeep} />
            <Text style={styles.stateText}>Finding ideas</Text>
          </View>
        ) : loadState === 'error' ? (
          <View style={styles.centerState}>
            <Text style={styles.errorTitle}>Could not load ideas</Text>
            <Text style={styles.errorText}>{errorMessage ?? 'Try again in a moment.'}</Text>
          </View>
        ) : filteredSuggestions.length > 0 ? (
          <View style={styles.recipeList}>
            {filteredSuggestions.map((suggestion) => (
              <RecipeCard key={suggestion.recipe.id} suggestion={suggestion} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Stock a few more things</Text>
            <Text style={styles.emptyText}>Then we'll suggest dinners from what is at home.</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                router.push('/add-item');
              }}
              style={({ pressed }) => [
                styles.addItemButton,
                pressed ? styles.showRecipeButtonPressed : null,
              ]}
            >
              <Text style={styles.addItemButtonText}>Add item</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  addItemButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.sageDeep,
    borderRadius: 999,
    justifyContent: 'center',
    marginTop: space[4],
    minHeight: 42,
    paddingHorizontal: space[5],
  },
  addItemButtonText: {
    color: colors.bg,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  cardActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space[4],
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 320,
    paddingBottom: space[8],
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: space[4.5],
  },
  emptyCard: {
    backgroundColor: colors.kraftSoft,
    borderColor: 'rgba(74, 53, 32, 0.18)',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: space[6],
    padding: space[5],
  },
  emptyText: {
    color: colors.kraftInk,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
    marginTop: space[2],
    opacity: 0.76,
  },
  emptyTitle: {
    color: colors.kraftInk,
    fontFamily: fontFamily.serif,
    fontSize: 25,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 29,
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
  filterChip: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
  filterChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  filterChipText: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
  },
  filterChipTextActive: {
    color: colors.bg,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
    marginTop: space[5],
  },
  heartButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  hero: {
    marginTop: space[5],
    paddingHorizontal: space[1],
  },
  ingredientChip: {
    borderRadius: 999,
    maxWidth: '48%',
    paddingHorizontal: space[3],
    paddingVertical: space[1.5],
  },
  ingredientChipCovered: {
    backgroundColor: colors.sageSoft,
  },
  ingredientChipMissing: {
    backgroundColor: colors.amberSoft,
  },
  ingredientChipText: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 15,
  },
  ingredientChipTextCovered: {
    color: colors.sageDeep,
  },
  ingredientChipTextMissing: {
    color: colors.amberDeep,
  },
  ingredientChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[1.5],
    marginTop: space[4],
  },
  matchChip: {
    backgroundColor: colors.sageSoft,
    borderRadius: 999,
    paddingHorizontal: space[3],
    paddingVertical: space[1.5],
  },
  matchChipText: {
    color: colors.sageDeep,
    fontFamily: fontFamily.sans,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.72,
  },
  recipeCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: space[4.5],
  },
  recipeHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: space[3],
    justifyContent: 'space-between',
  },
  recipeList: {
    gap: space[3.5],
    marginTop: space[5],
  },
  recipeMeta: {
    color: colors.mute,
    fontFamily: fontFamily.mono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 15,
    marginTop: space[1],
    textTransform: 'uppercase',
  },
  recipeTitle: {
    color: colors.ink,
    fontFamily: fontFamily.serif,
    fontSize: 25,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 29,
  },
  recipeTitleWrap: {
    flex: 1,
    minWidth: 0,
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
  showRecipeButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: 999,
    flexDirection: 'row',
    gap: space[1.5],
    minHeight: 42,
    paddingHorizontal: space[4.5],
  },
  showRecipeButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  showRecipeText: {
    color: colors.bg,
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  stateText: {
    color: colors.mute,
    fontFamily: fontFamily.mono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0,
    marginTop: space[3],
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.mute,
    fontFamily: fontFamily.sans,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: space[3],
    maxWidth: 300,
  },
  title: {
    color: colors.ink,
    fontFamily: fontFamily.serif,
    fontSize: 34,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 38,
  },
  titleItalic: {
    fontStyle: 'italic',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topBarTitle: {
    color: colors.sageDeep,
    fontFamily: fontFamily.mono,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
});
