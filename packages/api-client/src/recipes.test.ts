import { describe, expect, it, vi } from 'vitest';

import type { ApiRequestError, AuthenticatedUserContext } from './profile';
import {
  createSackerlRecipesClient,
  ingredientMatchesStockItem,
  mapRecipeRow,
  recipeIsDinner,
  recipeIsVegetarian,
  recipeMatchesSuggestionFilter,
  scoreRecipeAgainstStock,
} from './recipes';

const config = {
  anonKey: 'public-key',
  url: 'https://sackerl.supabase.co',
};

const context = {
  accessToken: 'access-token',
  user: {
    email: 'test@sackerl.com',
    id: 'user-123',
  },
} satisfies AuthenticatedUserContext;

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', ...init.headers },
    status: 200,
    ...init,
  });
}

describe('recipe suggestions', () => {
  it('maps recipe database rows into API model shape', () => {
    expect(
      mapRecipeRow({
        created_at: '2026-06-11T10:00:00Z',
        id: 'tomato-pasta',
        image: '/recipes/tomato-pasta.jpg',
        ingredients: ['pasta', 'tomatoes', 'garlic', 'basil'],
        name: 'Tomato Pasta',
        serves: 2,
        time_minutes: 25,
      }),
    ).toEqual({
      createdAt: '2026-06-11T10:00:00Z',
      id: 'tomato-pasta',
      image: '/recipes/tomato-pasta.jpg',
      ingredients: ['pasta', 'tomatoes', 'garlic', 'basil'],
      name: 'Tomato Pasta',
      serves: 2,
      timeMinutes: 25,
    });
  });

  it('matches ingredients against stock item names without broad one-word false positives', () => {
    expect(ingredientMatchesStockItem('canned tomatoes', 'Tomatoes')).toBe(true);
    expect(ingredientMatchesStockItem('garlic', 'Garlic bulb')).toBe(true);
    expect(ingredientMatchesStockItem('bell pepper', 'black pepper')).toBe(false);
    expect(ingredientMatchesStockItem('soy sauce', 'tomato sauce')).toBe(false);
  });

  it('scores recipes from covered ingredients over total ingredients', () => {
    const suggestion = scoreRecipeAgainstStock(
      {
        createdAt: '2026-06-11T10:00:00Z',
        id: 'tomato-pasta',
        image: '/recipes/tomato-pasta.jpg',
        ingredients: ['pasta', 'tomatoes', 'garlic', 'basil'],
        name: 'Tomato Pasta',
        serves: 2,
        timeMinutes: 25,
      },
      [
        { id: 'item-1', name: 'Pasta' },
        { id: 'item-2', name: 'Canned tomatoes' },
        { id: 'item-3', name: 'Garlic bulb' },
      ],
    );

    expect(suggestion).toMatchObject({
      coveredIngredientCount: 3,
      matchedItemIds: ['item-1', 'item-2', 'item-3'],
      missingIngredients: ['basil'],
      score: 0.75,
      totalIngredientCount: 4,
    });
    expect(suggestion.matchedIngredients).toEqual([
      { covered: true, ingredient: 'pasta', matchedItemIds: ['item-1'] },
      { covered: true, ingredient: 'tomatoes', matchedItemIds: ['item-2'] },
      { covered: true, ingredient: 'garlic', matchedItemIds: ['item-3'] },
      { covered: false, ingredient: 'basil', matchedItemIds: [] },
    ]);
  });

  it('matches suggestion filters from recipe heuristics', () => {
    const tomatoPasta = scoreRecipeAgainstStock(
      {
        createdAt: '2026-06-11T10:00:00Z',
        id: 'tomato-pasta',
        image: '/recipes/tomato-pasta.jpg',
        ingredients: ['spaghetti', 'tomatoes', 'garlic', 'olive oil', 'basil'],
        name: 'Tomato Pasta',
        serves: 2,
        timeMinutes: 25,
      },
      [{ id: 'item-1', name: 'Spaghetti' }],
    );
    const chickenSoup = scoreRecipeAgainstStock(
      {
        createdAt: '2026-06-11T10:00:00Z',
        id: 'chicken-rice-soup',
        image: '/recipes/chicken-rice-soup.jpg',
        ingredients: ['chicken', 'rice', 'carrots', 'celery', 'onion'],
        name: 'Chicken Rice Soup',
        serves: 4,
        timeMinutes: 45,
      },
      [{ id: 'item-1', name: 'Rice' }],
    );
    const yogurtBowl = scoreRecipeAgainstStock(
      {
        createdAt: '2026-06-11T10:00:00Z',
        id: 'greek-yogurt-bowl',
        image: '/recipes/greek-yogurt-bowl.jpg',
        ingredients: ['yogurt', 'berries', 'oats', 'honey', 'nuts'],
        name: 'Greek Yogurt Bowl',
        serves: 1,
        timeMinutes: 8,
      },
      [{ id: 'item-1', name: 'Yogurt' }],
    );

    expect(recipeMatchesSuggestionFilter(tomatoPasta, 'vegetarian')).toBe(true);
    expect(recipeMatchesSuggestionFilter(tomatoPasta, 'quick')).toBe(true);
    expect(recipeMatchesSuggestionFilter(tomatoPasta, 'dinner')).toBe(true);
    expect(recipeIsVegetarian(chickenSoup.recipe)).toBe(false);
    expect(recipeMatchesSuggestionFilter(chickenSoup, 'quick')).toBe(false);
    expect(recipeIsDinner(yogurtBowl.recipe)).toBe(false);
  });

  it('lists matching recipes sorted by score and capped by limit', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse([
          {
            created_at: '2026-06-11T10:00:00Z',
            id: 'cheese-toastie',
            image: '/recipes/cheese-toastie.jpg',
            ingredients: ['bread', 'cheese', 'butter', 'tomatoes'],
            name: 'Cheese Toastie',
            serves: 1,
            time_minutes: 10,
          },
          {
            created_at: '2026-06-11T10:00:00Z',
            id: 'tomato-pasta',
            image: '/recipes/tomato-pasta.jpg',
            ingredients: ['pasta', 'tomatoes', 'garlic', 'basil'],
            name: 'Tomato Pasta',
            serves: 2,
            time_minutes: 25,
          },
          {
            created_at: '2026-06-11T10:00:00Z',
            id: 'rice-bean-bowl',
            image: '/recipes/rice-bean-bowl.jpg',
            ingredients: ['rice', 'canned beans', 'corn', 'tomatoes', 'onion'],
            name: 'Rice Bean Bowl',
            serves: 2,
            time_minutes: 20,
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          { id: 'item-1', name: 'Pasta' },
          { id: 'item-2', name: 'Canned tomatoes' },
          { id: 'item-3', name: 'Garlic bulb' },
          { id: 'item-4', name: 'Rice' },
        ]),
      );
    const client = createSackerlRecipesClient(config, { fetch: fetchMock });

    await expect(
      client.listSuggestions(context, {
        householdId: 'household-123',
        limit: 1,
        minScore: 0.7,
      }),
    ).resolves.toMatchObject({
      suggestions: [
        {
          coveredIngredientCount: 3,
          missingIngredients: ['basil'],
          recipe: {
            id: 'tomato-pasta',
            name: 'Tomato Pasta',
          },
          score: 0.75,
          totalIngredientCount: 4,
        },
      ],
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://sackerl.supabase.co/rest/v1/recipes?order=name.asc&select=id%2Cname%2Cimage%2Cingredients%2Cserves%2Ctime_minutes%2Ccreated_at',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://sackerl.supabase.co/rest/v1/items?household_id=eq.household-123&removed_on=is.null&select=id%2Cname',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('gets one recipe suggestion by id with missing ingredients included', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse([
          {
            created_at: '2026-06-11T10:00:00Z',
            id: 'tomato-pasta',
            image: '/recipes/tomato-pasta.jpg',
            ingredients: ['spaghetti', 'tomatoes', 'garlic', 'olive oil', 'basil'],
            name: 'Tomato Pasta',
            serves: 2,
            time_minutes: 25,
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          { id: 'item-1', name: 'Spaghetti' },
          { id: 'item-2', name: 'Tomatoes' },
          { id: 'item-3', name: 'Garlic' },
        ]),
      );
    const client = createSackerlRecipesClient(config, { fetch: fetchMock });

    await expect(
      client.getSuggestion(context, {
        householdId: 'household-123',
        recipeId: 'tomato-pasta',
      }),
    ).resolves.toMatchObject({
      coveredIngredientCount: 3,
      matchedItemIds: ['item-1', 'item-2', 'item-3'],
      missingIngredients: ['olive oil', 'basil'],
      recipe: {
        id: 'tomato-pasta',
        name: 'Tomato Pasta',
      },
      score: 0.6,
      totalIngredientCount: 5,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://sackerl.supabase.co/rest/v1/recipes?id=eq.tomato-pasta&limit=1&select=id%2Cname%2Cimage%2Cingredients%2Cserves%2Ctime_minutes%2Ccreated_at',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://sackerl.supabase.co/rest/v1/items?household_id=eq.household-123&removed_on=is.null&select=id%2Cname',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('returns a not found error for a missing recipe detail', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse([]));
    const client = createSackerlRecipesClient(config, { fetch: fetchMock });

    await expect(
      client.getSuggestion(context, {
        householdId: 'household-123',
        recipeId: 'missing-recipe',
      }),
    ).rejects.toMatchObject({
      message: 'Recipe not found.',
      status: 404,
    } satisfies Partial<ApiRequestError>);
  });

  it('rejects invalid suggestion inputs before calling the API', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const client = createSackerlRecipesClient(config, { fetch: fetchMock });

    await expect(
      client.listSuggestions(context, {
        householdId: 'household-123',
        limit: 0,
      }),
    ).rejects.toMatchObject({
      message: 'limit must be an integer between 1 and 50.',
      status: 400,
    } satisfies Partial<ApiRequestError>);
    await expect(
      client.listSuggestions(context, {
        householdId: 'household-123',
        minScore: 1.1,
      }),
    ).rejects.toMatchObject({
      message: 'minScore must be between 0 and 1.',
      status: 400,
    } satisfies Partial<ApiRequestError>);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects invalid recipe detail inputs before calling the API', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const client = createSackerlRecipesClient(config, { fetch: fetchMock });

    await expect(
      client.getSuggestion(context, {
        householdId: 'household-123',
        recipeId: '../bad',
      }),
    ).rejects.toMatchObject({
      message: 'Recipe id is invalid.',
      status: 400,
    } satisfies Partial<ApiRequestError>);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
