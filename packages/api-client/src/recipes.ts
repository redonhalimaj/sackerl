import { assertSupabaseAuthConfig, type SupabaseAuthConfig } from './auth';
import { ApiRequestError, type AuthenticatedUserContext } from './profile';

export type Recipe = {
  readonly createdAt: string;
  readonly id: string;
  readonly image: string;
  readonly ingredients: readonly string[];
  readonly name: string;
  readonly serves: number;
  readonly timeMinutes: number;
};

export type DatabaseRecipeRow = {
  readonly created_at: string;
  readonly id: string;
  readonly image: string;
  readonly ingredients: readonly string[];
  readonly name: string;
  readonly serves: number;
  readonly time_minutes: number;
};

export type RecipeStockItem = {
  readonly id: string;
  readonly name: string;
};

export type DatabaseRecipeStockItemRow = {
  readonly id: string;
  readonly name: string;
};

export type RecipeIngredientMatch = {
  readonly covered: boolean;
  readonly ingredient: string;
  readonly matchedItemIds: readonly string[];
};

export type RecipeSuggestion = {
  readonly coveredIngredientCount: number;
  readonly matchedIngredients: readonly RecipeIngredientMatch[];
  readonly matchedItemIds: readonly string[];
  readonly missingIngredients: readonly string[];
  readonly recipe: Recipe;
  readonly score: number;
  readonly totalIngredientCount: number;
};

export const recipeSuggestionFilterIds = ['all', 'vegetarian', 'quick', 'dinner'] as const;

export type RecipeSuggestionFilterId = (typeof recipeSuggestionFilterIds)[number];

export type ListRecipeSuggestionsInput = {
  readonly householdId: string;
  readonly limit?: number | undefined;
  readonly minScore?: number | undefined;
};

export type ListRecipeSuggestionsResult = {
  readonly suggestions: readonly RecipeSuggestion[];
};

export type GetRecipeSuggestionInput = {
  readonly householdId: string;
  readonly recipeId: string;
};

export type RecipesClientOptions = {
  readonly fetch?: typeof fetch | undefined;
};

type QueryValue = boolean | number | string;

const defaultSuggestionLimit = 5;
const defaultMinimumScore = 0.7;
const maxSuggestionLimit = 50;
const recipeSelect = 'id,name,image,ingredients,serves,time_minutes,created_at';
const stockItemSelect = 'id,name';
const animalProteinWords = new Set([
  'bacon',
  'beef',
  'chicken',
  'fish',
  'ham',
  'lamb',
  'pork',
  'salami',
  'salmon',
  'sausage',
  'shrimp',
  'tuna',
  'turkey',
]);
const nonDinnerWords = new Set(['breakfast', 'pancakes', 'porridge', 'smoothie']);
const nonDinnerPhrases = ['overnight oats', 'yogurt bowl'];
const weakIngredientWords = new Set([
  'canned',
  'chopped',
  'dried',
  'fresh',
  'frozen',
  'ground',
  'minced',
  'sliced',
  'whole',
]);

export function mapRecipeRow(row: DatabaseRecipeRow): Recipe {
  return {
    createdAt: row.created_at,
    id: row.id,
    image: row.image,
    ingredients: row.ingredients,
    name: row.name,
    serves: row.serves,
    timeMinutes: row.time_minutes,
  };
}

export function mapRecipeStockItemRow(row: DatabaseRecipeStockItemRow): RecipeStockItem {
  return {
    id: row.id,
    name: row.name,
  };
}

export function scoreRecipeAgainstStock(
  recipe: Recipe,
  stockItems: readonly RecipeStockItem[],
): RecipeSuggestion {
  const matchedItemIds = new Set<string>();
  const matchedIngredients = recipe.ingredients.map((ingredient) => {
    const ingredientItemIds = stockItems
      .filter((item) => ingredientMatchesStockItem(ingredient, item.name))
      .map((item) => item.id);

    for (const itemId of ingredientItemIds) {
      matchedItemIds.add(itemId);
    }

    return {
      covered: ingredientItemIds.length > 0,
      ingredient,
      matchedItemIds: ingredientItemIds,
    };
  });
  const coveredIngredientCount = matchedIngredients.filter((match) => match.covered).length;
  const totalIngredientCount = recipe.ingredients.length;

  return {
    coveredIngredientCount,
    matchedIngredients,
    matchedItemIds: [...matchedItemIds].sort(),
    missingIngredients: matchedIngredients
      .filter((match) => !match.covered)
      .map((match) => match.ingredient),
    recipe,
    score: totalIngredientCount > 0 ? coveredIngredientCount / totalIngredientCount : 0,
    totalIngredientCount,
  };
}

export function ingredientMatchesStockItem(ingredient: string, stockItemName: string): boolean {
  const ingredientWords = normaliseIngredientWords(ingredient);
  const stockWords = normaliseIngredientWords(stockItemName);

  if (ingredientWords.length < 1 || stockWords.length < 1) {
    return false;
  }

  const ingredientPhrase = ingredientWords.join(' ');
  const stockPhrase = stockWords.join(' ');

  if (ingredientPhrase === stockPhrase) {
    return true;
  }

  const ingredientMeaningfulWords = meaningfulWords(ingredientWords);
  const stockMeaningfulWords = meaningfulWords(stockWords);
  const ingredientMeaningfulPhrase = ingredientMeaningfulWords.join(' ');
  const stockMeaningfulPhrase = stockMeaningfulWords.join(' ');

  if (!ingredientMeaningfulPhrase || !stockMeaningfulPhrase) {
    return false;
  }

  return (
    phraseContains(ingredientMeaningfulPhrase, stockMeaningfulPhrase) ||
    phraseContains(stockMeaningfulPhrase, ingredientMeaningfulPhrase) ||
    isWordSubset(ingredientMeaningfulWords, stockMeaningfulWords) ||
    isWordSubset(stockMeaningfulWords, ingredientMeaningfulWords)
  );
}

export function recipeMatchesSuggestionFilter(
  suggestion: RecipeSuggestion,
  filterId: RecipeSuggestionFilterId,
): boolean {
  if (filterId === 'all') {
    return true;
  }

  if (filterId === 'quick') {
    return suggestion.recipe.timeMinutes < 30;
  }

  if (filterId === 'vegetarian') {
    return recipeIsVegetarian(suggestion.recipe);
  }

  return recipeIsDinner(suggestion.recipe);
}

export function recipeIsVegetarian(recipe: Pick<Recipe, 'ingredients' | 'name'>): boolean {
  return !recipeSearchWords(recipe).some((word) => animalProteinWords.has(word));
}

export function recipeIsDinner(recipe: Pick<Recipe, 'ingredients' | 'name'>): boolean {
  const recipeName = recipe.name.toLowerCase();

  return (
    !nonDinnerPhrases.some((phrase) => recipeName.includes(phrase)) &&
    !recipeSearchWords(recipe).some((word) => nonDinnerWords.has(word))
  );
}

function normaliseBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function encodeQuery(params: Record<string, QueryValue | undefined>): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      query.set(key, String(value));
    }
  }

  return query.toString();
}

function normaliseIngredientWords(value: string): readonly string[] {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(singulariseIngredientWord);
}

function recipeSearchWords(recipe: Pick<Recipe, 'ingredients' | 'name'>): readonly string[] {
  return normaliseIngredientWords([recipe.name, ...recipe.ingredients].join(' '));
}

function singulariseIngredientWord(word: string): string {
  if (word.length <= 3 || /(ss|us)$/.test(word)) {
    return word;
  }

  if (word.endsWith('ies')) {
    return `${word.slice(0, -3)}y`;
  }

  if (word.endsWith('oes')) {
    return word.slice(0, -2);
  }

  if (/(ches|shes|ses|xes|zes)$/.test(word)) {
    return word.slice(0, -2);
  }

  return word.endsWith('s') ? word.slice(0, -1) : word;
}

function meaningfulWords(words: readonly string[]): readonly string[] {
  return words.filter((word) => !weakIngredientWords.has(word));
}

function phraseContains(value: string, candidate: string): boolean {
  return value.split(' ').includes(candidate) || value.includes(` ${candidate} `);
}

function isWordSubset(candidate: readonly string[], target: readonly string[]): boolean {
  const targetWords = new Set(target);

  return candidate.every((word) => targetWords.has(word));
}

function validateHouseholdId(householdId: string): string {
  const value = householdId.trim();

  if (!value) {
    throw new ApiRequestError('Household is required.', 400);
  }

  return value;
}

function validateRecipeId(recipeId: string): string {
  const value = recipeId.trim();

  if (!/^[a-z][a-z0-9-]{1,63}$/.test(value)) {
    throw new ApiRequestError('Recipe id is invalid.', 400);
  }

  return value;
}

function normaliseSuggestionLimit(value: number | undefined): number {
  const limit = value ?? defaultSuggestionLimit;

  if (!Number.isInteger(limit) || limit < 1 || limit > maxSuggestionLimit) {
    throw new ApiRequestError(`limit must be an integer between 1 and ${maxSuggestionLimit}.`, 400);
  }

  return limit;
}

function normaliseMinimumScore(value: number | undefined): number {
  const minScore = value ?? defaultMinimumScore;

  if (!Number.isFinite(minScore) || minScore < 0 || minScore > 1) {
    throw new ApiRequestError('minScore must be between 0 and 1.', 400);
  }

  return minScore;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { readonly message?: string | undefined };

    return data.message ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

export class SackerlRecipesClient {
  private readonly anonKey: string;
  private readonly fetch: typeof fetch;
  private readonly restUrl: string;

  constructor(config: SupabaseAuthConfig, options: RecipesClientOptions = {}) {
    const resolvedConfig = assertSupabaseAuthConfig(config);

    this.anonKey = resolvedConfig.anonKey;
    this.fetch = options.fetch ?? fetch;
    this.restUrl = `${normaliseBaseUrl(resolvedConfig.url)}/rest/v1`;
  }

  async listSuggestions(
    context: AuthenticatedUserContext,
    input: ListRecipeSuggestionsInput,
  ): Promise<ListRecipeSuggestionsResult> {
    const householdId = validateHouseholdId(input.householdId);
    const limit = normaliseSuggestionLimit(input.limit);
    const minScore = normaliseMinimumScore(input.minScore);
    const recipeRows = await this.requestRows<DatabaseRecipeRow>('recipes', context, {
      order: 'name.asc',
      select: recipeSelect,
    });
    const stockItems = await this.listActiveStockItems(context, householdId);
    const suggestions = recipeRows
      .map(mapRecipeRow)
      .map((recipe) => scoreRecipeAgainstStock(recipe, stockItems))
      .filter((suggestion) => suggestion.score >= minScore)
      .sort(compareRecipeSuggestions)
      .slice(0, limit);

    return { suggestions };
  }

  async getSuggestion(
    context: AuthenticatedUserContext,
    input: GetRecipeSuggestionInput,
  ): Promise<RecipeSuggestion> {
    const householdId = validateHouseholdId(input.householdId);
    const recipeId = validateRecipeId(input.recipeId);
    const recipeRows = await this.requestRows<DatabaseRecipeRow>('recipes', context, {
      id: `eq.${recipeId}`,
      limit: 1,
      select: recipeSelect,
    });
    const recipeRow = recipeRows[0];

    if (!recipeRow) {
      throw new ApiRequestError('Recipe not found.', 404);
    }

    return scoreRecipeAgainstStock(
      mapRecipeRow(recipeRow),
      await this.listActiveStockItems(context, householdId),
    );
  }

  private async listActiveStockItems(
    context: AuthenticatedUserContext,
    householdId: string,
  ): Promise<readonly RecipeStockItem[]> {
    const stockRows = await this.requestRows<DatabaseRecipeStockItemRow>('items', context, {
      household_id: `eq.${householdId}`,
      removed_on: 'is.null',
      select: stockItemSelect,
    });

    return stockRows.map(mapRecipeStockItemRow);
  }

  private async requestRows<T>(
    table: string,
    context: AuthenticatedUserContext,
    query: Record<string, QueryValue | undefined>,
  ): Promise<readonly T[]> {
    if (!context.accessToken) {
      throw new ApiRequestError('Missing auth access token.', 401);
    }

    const response = await this.fetch(`${this.restUrl}/${table}?${encodeQuery(query)}`, {
      headers: {
        Accept: 'application/json',
        apikey: this.anonKey,
        Authorization: `Bearer ${context.accessToken}`,
      },
      method: 'GET',
    });

    if (!response.ok) {
      const message = await readErrorMessage(response);

      throw new ApiRequestError(message, response.status);
    }

    return (await response.json()) as readonly T[];
  }
}

function compareRecipeSuggestions(a: RecipeSuggestion, b: RecipeSuggestion): number {
  return (
    b.score - a.score ||
    b.coveredIngredientCount - a.coveredIngredientCount ||
    a.recipe.timeMinutes - b.recipe.timeMinutes ||
    a.recipe.name.localeCompare(b.recipe.name)
  );
}

export function createSackerlRecipesClient(
  config: SupabaseAuthConfig,
  options?: RecipesClientOptions,
): SackerlRecipesClient {
  return new SackerlRecipesClient(config, options);
}
