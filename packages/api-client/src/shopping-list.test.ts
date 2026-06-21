import { describe, expect, it, vi } from 'vitest';

import { createSackerlShoppingListClient, mapShoppingListItemRow } from './shopping-list';
import type { AuthenticatedUserContext } from './profile';

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

function requireString(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Expected a string value.');
  }

  return value;
}

describe('shopping list API client', () => {
  it('maps shopping list database rows into API model shape', () => {
    expect(
      mapShoppingListItemRow({
        category_id: 'produce',
        checked_at: null,
        created_at: '2026-06-12T09:00:00Z',
        household_id: 'household-123',
        id: 'shopping-item-123',
        name: 'Garlic',
        qty_unit: 'pcs',
        qty_value: '1.000',
        recipe_id: 'tomato-pasta',
        source: 'recipe',
        updated_at: '2026-06-12T09:00:00Z',
      }),
    ).toEqual({
      categoryId: 'produce',
      checkedAt: null,
      createdAt: '2026-06-12T09:00:00Z',
      householdId: 'household-123',
      id: 'shopping-item-123',
      name: 'Garlic',
      qtyUnit: 'pcs',
      qtyValue: 1,
      recipeId: 'tomato-pasta',
      source: 'recipe',
      updatedAt: '2026-06-12T09:00:00Z',
    });
  });

  it('lists unarchived shopping list items with pagination', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse(
        [
          {
            category_id: null,
            checked_at: null,
            created_at: '2026-06-12T09:00:00Z',
            household_id: 'household-123',
            id: 'shopping-item-123',
            name: 'Milk',
            qty_unit: 'pcs',
            qty_value: 1,
            recipe_id: null,
            source: 'manual',
            updated_at: '2026-06-12T09:00:00Z',
          },
        ],
        { headers: { 'Content-Range': '0-24/1' } },
      ),
    );
    const client = createSackerlShoppingListClient(config, { fetch: fetchMock });

    await expect(
      client.listItems(context, {
        householdId: 'household-123',
        page: 1,
        pageSize: 25,
      }),
    ).resolves.toMatchObject({
      items: [{ id: 'shopping-item-123', name: 'Milk', source: 'manual' }],
      pagination: { page: 1, pageSize: 25, total: 1 },
    });

    const url = new URL(requireString(fetchMock.mock.calls[0]?.[0]));

    expect(url.pathname).toBe('/rest/v1/shopping_list_items');
    expect(url.searchParams.get('household_id')).toBe('eq.household-123');
    expect(url.searchParams.get('or')).toContain('checked_at.is.null');
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      Prefer: 'count=exact',
      Range: '0-24',
    });
  });

  it('creates recipe missing ingredients as a batch', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            category_id: null,
            checked_at: null,
            created_at: '2026-06-12T09:00:00Z',
            household_id: 'household-123',
            id: 'shopping-item-123',
            name: 'Garlic',
            qty_unit: 'pcs',
            qty_value: 1,
            recipe_id: 'tomato-pasta',
            source: 'recipe',
            updated_at: '2026-06-12T09:00:00Z',
          },
        ]),
      );
    const client = createSackerlShoppingListClient(config, { fetch: fetchMock });

    await expect(
      client.createItemsBatch(context, {
        householdId: 'household-123',
        items: [
          {
            name: 'Garlic',
            recipeId: 'tomato-pasta',
            source: 'recipe',
          },
        ],
      }),
    ).resolves.toMatchObject([{ name: 'Garlic', recipeId: 'tomato-pasta', source: 'recipe' }]);

    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('GET');
    expect(fetchMock.mock.calls[1]?.[1]?.method).toBe('POST');
    expect(JSON.parse(requireString(fetchMock.mock.calls[1]?.[1]?.body))).toEqual({
      category_id: null,
      household_id: 'household-123',
      name: 'Garlic',
      qty_unit: 'pcs',
      qty_value: 1,
      recipe_id: 'tomato-pasta',
      source: 'recipe',
    });
  });

  it('does not create duplicate visible recipe shopping list items', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse([
        {
          category_id: null,
          checked_at: null,
          created_at: '2026-06-12T09:00:00Z',
          household_id: 'household-123',
          id: 'shopping-item-123',
          name: 'Garlic',
          qty_unit: 'pcs',
          qty_value: 1,
          recipe_id: 'tomato-pasta',
          source: 'recipe',
          updated_at: '2026-06-12T09:00:00Z',
        },
      ]),
    );
    const client = createSackerlShoppingListClient(config, { fetch: fetchMock });

    await expect(
      client.createItemsBatch(context, {
        householdId: 'household-123',
        items: [
          {
            name: 'garlic',
            recipeId: 'tomato-pasta',
            source: 'recipe',
          },
        ],
      }),
    ).resolves.toMatchObject([{ id: 'shopping-item-123', name: 'Garlic' }]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('GET');
  });

  it('checks a shopping list item with an ISO timestamp', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse([
        {
          category_id: null,
          checked_at: '2026-06-12T10:00:00.000Z',
          created_at: '2026-06-12T09:00:00Z',
          household_id: 'household-123',
          id: 'shopping-item-123',
          name: 'Milk',
          qty_unit: 'pcs',
          qty_value: 1,
          recipe_id: null,
          source: 'manual',
          updated_at: '2026-06-12T10:00:00Z',
        },
      ]),
    );
    const client = createSackerlShoppingListClient(config, { fetch: fetchMock });

    await expect(
      client.updateItem(context, {
        checked: true,
        checkedAt: '2026-06-12T10:00:00.000Z',
        householdId: 'household-123',
        id: 'shopping-item-123',
      }),
    ).resolves.toMatchObject({
      checkedAt: '2026-06-12T10:00:00.000Z',
      id: 'shopping-item-123',
    });

    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('PATCH');
    expect(JSON.parse(requireString(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      checked_at: '2026-06-12T10:00:00.000Z',
    });
  });

  it('dedupes suggestions from prior receipt items', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse([
        {
          added_on: '2026-06-12',
          category_id: 'dairy',
          name: 'Milk',
          qty_unit: 'l',
        },
        {
          added_on: '2026-06-01',
          category_id: 'dairy',
          name: 'milk',
          qty_unit: 'l',
        },
        {
          added_on: '2026-05-30',
          category_id: 'produce',
          name: 'Tomatoes',
          qty_unit: 'pcs',
        },
      ]),
    );
    const client = createSackerlShoppingListClient(config, { fetch: fetchMock });

    await expect(
      client.listSuggestions(context, {
        householdId: 'household-123',
        limit: 2,
      }),
    ).resolves.toEqual([
      {
        categoryId: 'dairy',
        lastSeenOn: '2026-06-12',
        name: 'Milk',
        qtyUnit: 'l',
      },
      {
        categoryId: 'produce',
        lastSeenOn: '2026-05-30',
        name: 'Tomatoes',
        qtyUnit: 'pcs',
      },
    ]);

    const url = new URL(requireString(fetchMock.mock.calls[0]?.[0]));

    expect(url.pathname).toBe('/rest/v1/items');
    expect(url.searchParams.get('source')).toBe('eq.receipt');
  });

  it('rejects invalid shopping list input', async () => {
    const client = createSackerlShoppingListClient(config, { fetch: vi.fn<typeof fetch>() });

    await expect(
      client.createItem(context, {
        householdId: 'household-123',
        name: '   ',
      }),
    ).rejects.toThrow('Shopping list item name is required.');
  });
});
