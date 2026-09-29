import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./auth', () => ({
  mobileSupabaseAuthConfig: { anonKey: 'test-public-key', url: 'https://example.test' },
}));

const context = { accessToken: 'test-token', user: { id: 'member' } };
const recipe = {
  id: 'tomato-salad',
  name: 'Tomato salad',
  ingredients: ['tomatoes'],
  created_at: '2026-09-16T00:00:00Z',
  image: null,
  serves: 1,
  time_minutes: 5,
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('mobile household recipe calendar', () => {
  it('keeps list/detail eligibility aligned and changes calendar when households change', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-16T22:30:00Z'));
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve(
          new Response(
            JSON.stringify(
              url.includes('/recipes?')
                ? [recipe]
                : [{ id: 'tomatoes', name: 'Tomatoes', expires_on: '2026-09-16' }],
            ),
          ),
        ),
      ),
    );
    const { getMobileRecipesClient } = await import('./recipes');
    const vienna = getMobileRecipesClient('Europe/Vienna');
    const newYork = getMobileRecipesClient('America/New_York');
    const input = { householdId: 'household', recipeId: recipe.id };

    expect((await vienna.listSuggestions(context, input)).suggestions).toEqual([]);
    expect((await vienna.getSuggestion(context, input)).matchedItemIds).toEqual([]);
    expect((await newYork.listSuggestions(context, input)).suggestions).toHaveLength(1);
    expect((await newYork.getSuggestion(context, input)).matchedItemIds).toEqual(['tomatoes']);
    expect(getMobileRecipesClient('Europe/Vienna')).toBe(vienna);
  });

  it('rejects an invalid household calendar rather than using another calendar', async () => {
    const { getMobileRecipesClient } = await import('./recipes');
    expect(() => getMobileRecipesClient('Europe/NotAPlace')).toThrow();
  });
});
