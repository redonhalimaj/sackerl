import { describe, expect, it, vi } from 'vitest';

import type { ApiRequestError, AuthenticatedUserContext } from './profile';
import {
  createSackerlRecipesClient,
  ingredientMatchesStockItem,
  mapRecipeRow,
  mapRecipeStockItemRow,
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

const viennaCalendarTimeZone = 'Europe/Vienna';

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

  it('maps recipe stock rows into API model shape', () => {
    expect(
      mapRecipeStockItemRow({
        expires_on: '2026-09-13',
        id: 'item-1',
        name: 'Tomatoes',
      }),
    ).toEqual({
      expiresOn: '2026-09-13',
      id: 'item-1',
      name: 'Tomatoes',
    });
    expect(
      mapRecipeStockItemRow({
        id: 'item-2',
        name: 'Basil',
      }),
    ).toEqual({
      expiresOn: null,
      id: 'item-2',
      name: 'Basil',
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
        { expiresOn: '2026-09-20', id: 'item-1', name: 'Pasta' },
        { expiresOn: '2026-09-20', id: 'item-2', name: 'Canned tomatoes' },
        { expiresOn: '2026-09-20', id: 'item-3', name: 'Garlic bulb' },
      ],
      '2026-09-13',
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

  it('enforces expiry eligibility inside direct recipe scoring', () => {
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
        { expiresOn: '2026-09-13', id: 'item-today', name: 'Pasta' },
        { expiresOn: '2026-09-12', id: 'item-yesterday', name: 'Canned tomatoes' },
        { expiresOn: '2026-09-14', id: 'item-tomorrow', name: 'Garlic bulb' },
        { expiresOn: null, id: 'item-unknown', name: 'Basil' },
        { expiresOn: '2026-02-29', id: 'item-invalid', name: 'Tomatoes' },
      ],
      '2026-09-13',
    );

    expect(suggestion).toMatchObject({
      coveredIngredientCount: 2,
      matchedItemIds: ['item-today', 'item-tomorrow'],
      missingIngredients: ['tomatoes', 'basil'],
      score: 0.5,
      totalIngredientCount: 4,
    });
    expect(suggestion.matchedIngredients).toEqual([
      { covered: true, ingredient: 'pasta', matchedItemIds: ['item-today'] },
      { covered: false, ingredient: 'tomatoes', matchedItemIds: [] },
      { covered: true, ingredient: 'garlic', matchedItemIds: ['item-tomorrow'] },
      { covered: false, ingredient: 'basil', matchedItemIds: [] },
    ]);
  });

  it('validates recipe scoring dates as strict Gregorian ISO dates', () => {
    expect(
      scoreRecipeAgainstStock(
        {
          createdAt: '2028-02-01T10:00:00Z',
          id: 'leap-soup',
          image: '/recipes/leap-soup.jpg',
          ingredients: ['lentils'],
          name: 'Leap Soup',
          serves: 2,
          timeMinutes: 20,
        },
        [{ expiresOn: '2028-02-29', id: 'item-leap', name: 'Lentils' }],
        '2028-02-29',
      ),
    ).toMatchObject({
      coveredIngredientCount: 1,
      matchedItemIds: ['item-leap'],
      score: 1,
    });

    expect(() =>
      scoreRecipeAgainstStock(
        {
          createdAt: '2026-02-01T10:00:00Z',
          id: 'invalid-leap-soup',
          image: '/recipes/invalid-leap-soup.jpg',
          ingredients: ['lentils'],
          name: 'Invalid Leap Soup',
          serves: 2,
          timeMinutes: 20,
        },
        [{ expiresOn: '2026-03-01', id: 'item-lentils', name: 'Lentils' }],
        '2026-02-29',
      ),
    ).toThrow('today must be an ISO date.');
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
      [{ expiresOn: '2026-09-20', id: 'item-1', name: 'Spaghetti' }],
      '2026-09-13',
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
      [{ expiresOn: '2026-09-20', id: 'item-1', name: 'Rice' }],
      '2026-09-13',
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
      [{ expiresOn: '2026-09-20', id: 'item-1', name: 'Yogurt' }],
      '2026-09-13',
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
          { expires_on: '2026-09-20', id: 'item-1', name: 'Pasta' },
          { expires_on: '2026-09-20', id: 'item-2', name: 'Canned tomatoes' },
          { expires_on: '2026-09-20', id: 'item-3', name: 'Garlic bulb' },
          { expires_on: '2026-09-20', id: 'item-4', name: 'Rice' },
        ]),
      );
    const client = createSackerlRecipesClient(config, {
      calendarTimeZone: viennaCalendarTimeZone,
      clock: () => new Date('2026-09-13T10:00:00.000Z'),
      fetch: fetchMock,
    });

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
      'https://sackerl.supabase.co/rest/v1/items?household_id=eq.household-123&removed_on=is.null&select=id%2Cname%2Cexpires_on',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it.each([
    { label: 'empty stock', stock: [] },
    {
      label: 'reported June expiry',
      stock: [{ expires_on: '2026-06-26', id: 'old', name: 'Tomatoes' }],
    },
    { label: 'null date', stock: [{ expires_on: null, id: 'null', name: 'Tomatoes' }] },
    { label: 'missing date', stock: [{ id: 'missing', name: 'Tomatoes' }] },
    { label: 'empty date', stock: [{ expires_on: '', id: 'empty', name: 'Tomatoes' }] },
    {
      label: 'impossible date',
      stock: [{ expires_on: '2026-09-31', id: 'invalid', name: 'Tomatoes' }],
    },
    {
      label: 'timestamp instead of date',
      stock: [{ expires_on: '2026-09-14T00:00:00Z', id: 'timestamp', name: 'Tomatoes' }],
    },
    {
      label: 'unpadded date',
      stock: [{ expires_on: '2026-9-14', id: 'unpadded', name: 'Tomatoes' }],
    },
    {
      label: 'eligible but unrelated stock',
      stock: [{ expires_on: '2026-09-14', id: 'other', name: 'Bananas' }],
    },
  ])('suppresses zero-coverage recipes with minScore zero: $label', async ({ stock }) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse([
          {
            created_at: '2026-06-11T10:00:00Z',
            id: 'tomato-pasta',
            image: '/recipes/tomato-pasta.jpg',
            ingredients: ['tomatoes'],
            name: 'Tomato Pasta',
            serves: 2,
            time_minutes: 25,
          },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse(stock));
    const client = createSackerlRecipesClient(config, {
      calendarTimeZone: viennaCalendarTimeZone,
      clock: () => new Date('2026-09-13T10:00:00.000Z'),
      fetch: fetchMock,
    });

    await expect(
      client.listSuggestions(context, {
        householdId: 'household-123',
        minScore: 0,
      }),
    ).resolves.toEqual({ suggestions: [] });
  });

  it('uses the configured Vienna date at the UTC previous-day boundary', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse([
          {
            created_at: '2026-06-11T10:00:00Z',
            id: 'midnight-pasta',
            image: '/recipes/midnight-pasta.jpg',
            ingredients: ['pasta', 'tomatoes'],
            name: 'Midnight Pasta',
            serves: 2,
            time_minutes: 25,
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          { expires_on: '2026-09-13', id: 'item-pasta', name: 'Pasta' },
          { expires_on: '2026-09-12', id: 'item-tomatoes', name: 'Tomatoes' },
        ]),
      );
    const client = createSackerlRecipesClient(config, {
      calendarTimeZone: viennaCalendarTimeZone,
      clock: () => new Date('2026-09-12T22:30:00.000Z'),
      fetch: fetchMock,
    });

    await expect(
      client.listSuggestions(context, {
        householdId: 'household-123',
        minScore: 0,
      }),
    ).resolves.toMatchObject({
      suggestions: [
        {
          coveredIngredientCount: 1,
          matchedItemIds: ['item-pasta'],
          missingIngredients: ['tomatoes'],
          score: 0.5,
        },
      ],
    });
  });

  it.each(['2026-10-25T00:30:00.000Z', '2026-10-25T01:30:00.000Z'])(
    'keeps Vienna recipe eligibility stable across fall-back: %s',
    async (instant) => {
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          jsonResponse([
            {
              created_at: '2026-06-11T10:00:00Z',
              id: 'dst-bowl',
              image: '/recipes/dst-bowl.jpg',
              ingredients: ['rice', 'beans'],
              name: 'DST Bowl',
              serves: 2,
              time_minutes: 20,
            },
          ]),
        )
        .mockResolvedValueOnce(
          jsonResponse([
            { expires_on: '2026-10-25', id: 'item-rice', name: 'Rice' },
            { expires_on: '2026-10-24', id: 'item-beans', name: 'Beans' },
          ]),
        );
      const client = createSackerlRecipesClient(config, {
        calendarTimeZone: viennaCalendarTimeZone,
        clock: () => new Date(instant),
        fetch: fetchMock,
      });

      await expect(
        client.listSuggestions(context, {
          householdId: 'household-123',
          minScore: 0,
        }),
      ).resolves.toMatchObject({
        suggestions: [
          {
            coveredIngredientCount: 1,
            matchedItemIds: ['item-rice'],
            missingIngredients: ['beans'],
            score: 0.5,
          },
        ],
      });
    },
  );

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
          { expires_on: '2026-09-20', id: 'item-1', name: 'Spaghetti' },
          { expires_on: '2026-09-20', id: 'item-2', name: 'Tomatoes' },
          { expires_on: '2026-09-20', id: 'item-3', name: 'Garlic' },
        ]),
      );
    const client = createSackerlRecipesClient(config, {
      calendarTimeZone: viennaCalendarTimeZone,
      clock: () => new Date('2026-09-13T10:00:00.000Z'),
      fetch: fetchMock,
    });

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
      'https://sackerl.supabase.co/rest/v1/items?household_id=eq.household-123&removed_on=is.null&select=id%2Cname%2Cexpires_on',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('returns recipe detail with no matches when stock dates are not eligible', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse([
          {
            created_at: '2026-06-11T10:00:00Z',
            id: 'tomato-pasta',
            image: '/recipes/tomato-pasta.jpg',
            ingredients: ['spaghetti', 'tomatoes', 'garlic'],
            name: 'Tomato Pasta',
            serves: 2,
            time_minutes: 25,
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          { expires_on: '2026-09-12', id: 'item-spaghetti', name: 'Spaghetti' },
          { expires_on: null, id: 'item-tomatoes', name: 'Tomatoes' },
          { expires_on: 'bad-date', id: 'item-garlic', name: 'Garlic' },
        ]),
      );
    const client = createSackerlRecipesClient(config, {
      calendarTimeZone: viennaCalendarTimeZone,
      clock: () => new Date('2026-09-13T10:00:00.000Z'),
      fetch: fetchMock,
    });

    await expect(
      client.getSuggestion(context, {
        householdId: 'household-123',
        recipeId: 'tomato-pasta',
      }),
    ).resolves.toMatchObject({
      coveredIngredientCount: 0,
      matchedItemIds: [],
      missingIngredients: ['spaghetti', 'tomatoes', 'garlic'],
      score: 0,
      totalIngredientCount: 3,
    });
  });

  it('keeps list and detail matches aligned after expiry filtering', async () => {
    const recipeRow = {
      created_at: '2026-06-11T10:00:00Z',
      id: 'tomato-pasta',
      image: '/recipes/tomato-pasta.jpg',
      ingredients: ['spaghetti', 'tomatoes', 'garlic', 'olive oil', 'basil'],
      name: 'Tomato Pasta',
      serves: 2,
      time_minutes: 25,
    };
    const stockRows = [
      { expires_on: '2026-09-13', id: 'item-spaghetti', name: 'Spaghetti' },
      { expires_on: '2026-09-12', id: 'item-tomatoes', name: 'Tomatoes' },
      { expires_on: null, id: 'item-garlic', name: 'Garlic' },
      { expires_on: '2026-02-29', id: 'item-olive-oil', name: 'Olive oil' },
    ];
    const clock = vi.fn(() => new Date('2026-09-13T10:00:00.000Z'));
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse([recipeRow]))
      .mockResolvedValueOnce(jsonResponse(stockRows))
      .mockResolvedValueOnce(jsonResponse([recipeRow]))
      .mockResolvedValueOnce(jsonResponse(stockRows));
    const client = createSackerlRecipesClient(config, {
      calendarTimeZone: viennaCalendarTimeZone,
      clock,
      fetch: fetchMock,
    });

    const listResult = await client.listSuggestions(context, {
      householdId: 'household-123',
      minScore: 0,
    });
    expect(clock).toHaveBeenCalledTimes(1);
    const detailResult = await client.getSuggestion(context, {
      householdId: 'household-123',
      recipeId: 'tomato-pasta',
    });

    expect(listResult.suggestions[0]).toMatchObject({
      coveredIngredientCount: 1,
      matchedItemIds: ['item-spaghetti'],
      missingIngredients: ['tomatoes', 'garlic', 'olive oil', 'basil'],
      score: 0.2,
    });
    expect(detailResult).toEqual(listResult.suggestions[0]);
    expect(clock).toHaveBeenCalledTimes(2);
  });

  it.each(['', 'Not/AZone'])('rejects invalid calendar configuration: %s', (calendarTimeZone) => {
    expect(() => createSackerlRecipesClient(config, { calendarTimeZone })).toThrow();
  });

  it('rejects an invalid clock before reading stock', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const client = createSackerlRecipesClient(config, {
      calendarTimeZone: viennaCalendarTimeZone,
      clock: () => new Date(Number.NaN),
      fetch: fetchMock,
    });
    await expect(client.listSuggestions(context, { householdId: 'household-123' })).rejects.toThrow(
      'clock must return a valid Date.',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns a not found error for a missing recipe detail', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse([]));
    const client = createSackerlRecipesClient(config, {
      calendarTimeZone: viennaCalendarTimeZone,
      clock: () => new Date('2026-09-13T10:00:00.000Z'),
      fetch: fetchMock,
    });

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
    const client = createSackerlRecipesClient(config, {
      calendarTimeZone: viennaCalendarTimeZone,
      fetch: fetchMock,
    });

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
    const client = createSackerlRecipesClient(config, {
      calendarTimeZone: viennaCalendarTimeZone,
      fetch: fetchMock,
    });

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
