import { readE2eEnv } from '../support/env';
import { buildReviewedReceipt, placementCommand } from '../support/builders/receipts';
import { expect, expectJson, test, type ApiClient } from '../support/fixtures';
import { requirePlacementSchema } from '../support/schema';

async function firstRecipeId(client: ApiClient): Promise<string | undefined> {
  const env = readE2eEnv();
  if (!env) {
    return undefined;
  }
  const response = await fetch(`${env.supabaseUrl}/rest/v1/recipes?select=id&limit=1`, {
    headers: { apikey: env.anonKey, Authorization: `Bearer ${client.user.accessToken}` },
  });
  const rows = response.ok ? ((await response.json()) as { id: string }[]) : [];
  return rows[0]?.id;
}
import {
  createItem,
  createListItem,
  missingId,
  setupHousehold,
  uniqueName,
  type Pagination,
  type ShoppingListItemBody,
} from '../support/builders/core';

type ItemBody = { readonly item: ShoppingListItemBody };
type ListBody = {
  readonly items: readonly ShoppingListItemBody[];
  readonly pagination: Pagination;
};
type SuggestionsBody = {
  readonly suggestions: readonly {
    readonly categoryId: string | null;
    readonly name: string;
    readonly qtyUnit: string;
  }[];
};

test.describe('/shopping-list', () => {
  test('404 when the caller has no household', async ({ owner }) => {
    await expectJson(await owner.get('/me'), 200);
    await expectJson(await owner.get('/shopping-list'), 404);
    await expectJson(await owner.post('/shopping-list', { name: 'x' }), 404);
  });

  test('create with defaults, list, check, update and delete', async ({ owner }) => {
    const household = await setupHousehold(owner);
    const name = uniqueName('bread');
    const item = await createListItem(owner, { name });
    expect(item).toMatchObject({
      categoryId: null,
      checkedAt: null,
      householdId: household.id,
      name,
      qtyUnit: 'pcs',
      qtyValue: 1,
      recipeId: null,
      source: 'manual',
    });

    const list = await expectJson<ListBody>(await owner.get('/shopping-list'), 200);
    expect(list.items.map((i) => i.id)).toContain(item.id);
    expect(list.pagination.page).toBe(1);

    const checked = await expectJson<ItemBody>(
      await owner.patch(`/shopping-list/${item.id}`, { checked: true }),
      200,
    );
    expect(checked.item.checkedAt).not.toBeNull();

    const updated = await expectJson<ItemBody>(
      await owner.patch(`/shopping-list/${item.id}`, {
        categoryId: 'bakery',
        checked: false,
        qtyUnit: 'kg',
        qtyValue: 2,
      }),
      200,
    );
    expect(updated.item).toMatchObject({
      categoryId: 'bakery',
      checkedAt: null,
      qtyUnit: 'kg',
      qtyValue: 2,
    });

    const deleted = await expectJson<ItemBody>(
      await owner.delete(`/shopping-list/${item.id}`),
      200,
    );
    expect(deleted.item.id).toBe(item.id);
    const after = await expectJson<ListBody>(
      await owner.get('/shopping-list?include_archived=true'),
      200,
    );
    expect(after.items.map((i) => i.id)).not.toContain(item.id);
    await expectJson(await owner.delete(`/shopping-list/${item.id}`), 404);
  });

  test('a recipe line is only added once', async ({ owner }) => {
    // recipe_id is a foreign key to the shared recipes catalogue; use a real row.
    const recipeId = await firstRecipeId(owner);
    test.skip(!recipeId, 'Target has no recipes seeded; recipe-line dedupe needs one.');
    await setupHousehold(owner);
    const payload = { name: uniqueName('basil'), recipeId, source: 'recipe' };
    const first = await createListItem(owner, payload);
    const second = await createListItem(owner, payload);
    expect(second.id).toBe(first.id);
  });

  test('batch create', async ({ owner }) => {
    await setupHousehold(owner);
    const names = [uniqueName('a'), uniqueName('b'), uniqueName('c')];
    const body = await expectJson<{ items: ShoppingListItemBody[] }>(
      await owner.post('/shopping-list/batch', { items: names.map((name) => ({ name })) }),
      201,
    );
    expect(body.items.map((i) => i.name).sort()).toEqual([...names].sort());
  });

  test('create and batch validation 400s', async ({ owner }) => {
    await setupHousehold(owner);
    const cases: [unknown, string][] = [
      [[], 'JSON object body is required.'],
      [{}, 'name is required.'],
      [{ name: '   ' }, 'Shopping list item name is required.'],
      [{ name: 'x'.repeat(121) }, 'Shopping list item name must be 120 characters or less.'],
      [{ name: 'x', qtyValue: 0 }, 'Quantity value must be greater than zero.'],
      [{ name: 'x', qtyValue: '2' }, 'qtyValue must be a number.'],
      [{ name: 'x', qtyUnit: 'gallon' }, 'Quantity unit is invalid.'],
      [{ categoryId: 'shoes', name: 'x' }, 'Item category is invalid.'],
      [{ name: 'x', source: 'magic' }, 'Shopping list source is invalid.'],
      [{ name: 'x', recipeId: 'Not Valid!' }, 'Recipe id is invalid.'],
    ];
    for (const [payload, message] of cases) {
      const body = await expectJson(await owner.post('/shopping-list', payload), 400);
      expect(body.error, JSON.stringify(payload)).toBe(message);
    }

    expect((await expectJson(await owner.post('/shopping-list/batch', {}), 400)).error).toBe(
      'items must be an array.',
    );
    expect(
      (await expectJson(await owner.post('/shopping-list/batch', { items: [] }), 400)).error,
    ).toBe('At least one shopping list item is required.');
    const tooMany = Array.from({ length: 51 }, () => ({ name: uniqueName('n') }));
    expect(
      (await expectJson(await owner.post('/shopping-list/batch', { items: tooMany }), 400)).error,
    ).toBe('A batch can contain at most 50 items.');
    await expectJson(await owner.get('/shopping-list?page_size=x'), 400);
  });

  test('update validation 400s and unknown id 404', async ({ owner }) => {
    await setupHousehold(owner);
    const item = await createListItem(owner);
    expect((await expectJson(await owner.patch(`/shopping-list/${item.id}`, {}), 400)).error).toBe(
      'No shopping list changes were provided.',
    );
    expect(
      (await expectJson(await owner.patch(`/shopping-list/${item.id}`, { checked: 'yes' }), 400))
        .error,
    ).toBe('checked must be a boolean.');
    expect(
      (
        await expectJson(
          await owner.patch(`/shopping-list/${item.id}`, { checkedAt: 'not a date' }),
          400,
        )
      ).error,
    ).toBe('checkedAt must be an ISO timestamp.');
    expect(
      (await expectJson(await owner.patch(`/shopping-list/${missingId()}`, { name: 'x' }), 404))
        .error,
    ).toBe('Shopping list item not found.');
  });

  test('outsider cannot read, modify or delete another household list entry', async ({
    owner,
    outsider,
  }) => {
    await setupHousehold(owner);
    const item = await createListItem(owner);
    await setupHousehold(outsider);

    const list = await expectJson<ListBody>(
      await outsider.get('/shopping-list?include_archived=true'),
      200,
    );
    expect(list.items.map((i) => i.id)).not.toContain(item.id);
    await expectJson(await outsider.patch(`/shopping-list/${item.id}`, { checked: true }), 404);
    await expectJson(await outsider.delete(`/shopping-list/${item.id}`), 404);

    const ownerList = await expectJson<ListBody>(await owner.get('/shopping-list'), 200);
    expect(ownerList.items.find((i) => i.id === item.id)).toMatchObject({
      checkedAt: null,
      name: item.name,
    });
  });

  test('401 without or with an invalid bearer token', async ({ request }) => {
    test.skip(!readE2eEnv(), 'No E2E Supabase target configured.');
    const id = missingId();
    await expectJson(await request.get('/shopping-list'), 401);
    await expectJson(await request.post('/shopping-list', { data: { name: 'x' } }), 401);
    await expectJson(
      await request.post('/shopping-list/batch', { data: { items: [{ name: 'x' }] } }),
      401,
    );
    await expectJson(await request.patch(`/shopping-list/${id}`, { data: { checked: true } }), 401);
    await expectJson(await request.delete(`/shopping-list/${id}`), 401);
    await expectJson(await request.get('/shopping-list/suggestions'), 401);
    await expectJson(
      await request.get('/shopping-list', { headers: { Authorization: 'Bearer invalid' } }),
      401,
    );
  });
});

test.describe('/shopping-list/suggestions', () => {
  /** Receipt-sourced stock can only be created through placement (SCKRL-311 lineage guard). */
  async function placeSampleReceipt(owner: ApiClient): Promise<void> {
    const { review, zones } = await buildReviewedReceipt(owner);
    await expectJson(
      await owner.post(
        `/receipts/${review.receipt.id}/placement`,
        placementCommand(review, zones[0]!.id),
      ),
      200,
    );
  }

  test('suggests deduplicated receipt items only', async ({ owner }) => {
    await requirePlacementSchema();
    await placeSampleReceipt(owner);
    await placeSampleReceipt(owner);
    const manualName = uniqueName('manual cheese');
    await createItem(owner, { name: manualName });

    const body = await expectJson<SuggestionsBody>(
      await owner.get('/shopping-list/suggestions'),
      200,
    );
    const names = body.suggestions.map((s) => s.name);
    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names.map((n) => n.toLowerCase())).size).toBe(names.length);
    expect(names).not.toContain(manualName);
  });

  test('outsider does not see the owner receipt history', async ({ owner, outsider }) => {
    await requirePlacementSchema();
    await placeSampleReceipt(owner);
    await setupHousehold(outsider);
    const body = await expectJson<SuggestionsBody>(
      await outsider.get('/shopping-list/suggestions'),
      200,
    );
    expect(body.suggestions).toEqual([]);
  });

  test('limit must be an integer', async ({ owner }) => {
    await setupHousehold(owner);
    expect(
      (await expectJson(await owner.get('/shopping-list/suggestions?limit=abc'), 400)).error,
    ).toBe('limit must be an integer.');
  });
});
