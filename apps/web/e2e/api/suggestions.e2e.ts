import { readE2eEnv } from '../support/env';
import { expect, expectJson, test } from '../support/fixtures';
import { createItem, isoDateFromToday, setupHousehold } from '../support/builders/core';

type SuggestionsBody = {
  readonly suggestions: readonly {
    readonly coveredIngredientCount: number;
    readonly matchedItemIds: readonly string[];
    readonly recipe: { readonly id: string; readonly name: string };
    readonly score: number;
  }[];
};

test.describe('/suggestions', () => {
  test('404 when the caller has no household', async ({ owner }) => {
    await expectJson(await owner.get('/me'), 200);
    await expectJson(await owner.get('/suggestions'), 404);
  });

  test('an empty household gets no suggestions', async ({ owner }) => {
    await setupHousehold(owner);
    const body = await expectJson<SuggestionsBody>(await owner.get('/suggestions'), 200);
    expect(body.suggestions).toEqual([]);
  });

  test('suggestions only reference the caller stock and respect limit/min_score', async ({
    owner,
  }) => {
    await setupHousehold(owner);
    const names = ['Tomatoes', 'Pasta', 'Onions', 'Garlic', 'Eggs', 'Milk'];
    const ids = new Set<string>();
    for (const name of names) {
      const item = await createItem(owner, {
        categoryId: 'pantry',
        expiresOn: isoDateFromToday(10),
        name,
        qtyUnit: 'pcs',
        zone: 'pantry',
      });
      ids.add(item.id);
    }

    const body = await expectJson<SuggestionsBody>(
      await owner.get('/suggestions?limit=2&min_score=0'),
      200,
    );
    expect(body.suggestions.length).toBeLessThanOrEqual(2);
    for (const suggestion of body.suggestions) {
      expect(suggestion.coveredIngredientCount).toBeGreaterThan(0);
      for (const id of suggestion.matchedItemIds) expect(ids.has(id)).toBe(true);
    }
  });

  test('outsider suggestions never include the owner stock', async ({ owner, outsider }) => {
    await setupHousehold(owner);
    const item = await createItem(owner, { expiresOn: isoDateFromToday(5), name: 'Tomatoes' });
    await setupHousehold(outsider);
    const body = await expectJson<SuggestionsBody>(
      await outsider.get('/suggestions?min_score=0'),
      200,
    );
    expect(body.suggestions.flatMap((s) => s.matchedItemIds)).not.toContain(item.id);
    expect(body.suggestions).toEqual([]);
  });

  test('query validation 400s', async ({ owner }) => {
    await setupHousehold(owner);
    expect((await expectJson(await owner.get('/suggestions?limit=1.5'), 400)).error).toBe(
      'limit must be an integer.',
    );
    await expectJson(await owner.get('/suggestions?limit=0'), 400);
    await expectJson(await owner.get('/suggestions?limit=51'), 400);
    expect((await expectJson(await owner.get('/suggestions?min_score=abc'), 400)).error).toBe(
      'min_score must be a number.',
    );
    expect((await expectJson(await owner.get('/suggestions?min_score=1.5'), 400)).error).toBe(
      'minScore must be between 0 and 1.',
    );
  });

  test('401 without or with an invalid bearer token', async ({ request }) => {
    test.skip(!readE2eEnv(), 'No E2E Supabase target configured.');
    await expectJson(await request.get('/suggestions'), 401);
    await expectJson(
      await request.get('/suggestions', { headers: { Authorization: 'Bearer invalid' } }),
      401,
    );
  });
});
