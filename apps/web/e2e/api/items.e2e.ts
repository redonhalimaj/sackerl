import { readE2eEnv } from '../support/env';
import { expect, expectJson, test } from '../support/fixtures';
import {
  createItem,
  isoDateFromToday,
  itemInput,
  missingId,
  setupHousehold,
  uniqueName,
  type Pagination,
  type StockItemBody,
} from '../support/builders/core';

type ItemBody = { readonly item: StockItemBody };
type ListBody = { readonly items: readonly StockItemBody[]; readonly pagination: Pagination };
type StatsBody = {
  readonly stats: {
    readonly current: {
      readonly compostedCount: number;
      readonly month: string;
      readonly totalCount: number;
      readonly usedCount: number;
    };
    readonly householdId: string;
    readonly previous: { readonly month: string };
  };
};

test.describe('/items CRUD', () => {
  test('404 when the caller has no household yet', async ({ owner }) => {
    await expectJson(await owner.get('/me'), 200);
    expect((await expectJson(await owner.get('/items'), 404)).error).toBe('Household not found.');
    await expectJson(await owner.post('/items', itemInput()), 404);
  });

  test('create, list, update and remove an item', async ({ owner }) => {
    const household = await setupHousehold(owner);
    const name = uniqueName('yoghurt');
    const item = await createItem(owner, { name, qtyUnit: 'g', qtyValue: 500 });
    expect(item).toMatchObject({
      categoryId: 'dairy',
      householdId: household.id,
      name,
      qtyUnit: 'g',
      qtyValue: 500,
      removedOn: null,
      source: 'manual',
    });

    const list = await expectJson<ListBody>(await owner.get('/items'), 200);
    expect(list.items.map((i) => i.id)).toContain(item.id);
    expect(list.pagination).toMatchObject({ page: 1, pageSize: 25 });

    const updated = await expectJson<ItemBody>(
      await owner.patch(`/items/${item.id}`, { name: `${name} 2`, qtyValue: 250 }),
      200,
    );
    expect(updated.item).toMatchObject({ id: item.id, name: `${name} 2`, qtyValue: 250 });

    const removed = await expectJson<ItemBody>(
      await owner.delete(`/items/${item.id}?removal_reason=used`),
      200,
    );
    expect(removed.item.removalReason).toBe('used');
    expect(removed.item.removedOn).not.toBeNull();

    const active = await expectJson<ListBody>(await owner.get('/items'), 200);
    expect(active.items.map((i) => i.id)).not.toContain(item.id);
    const all = await expectJson<ListBody>(await owner.get('/items?include_removed=true'), 200);
    expect(all.items.map((i) => i.id)).toContain(item.id);
  });

  test('list filters by category, zone and expiry window', async ({ owner }) => {
    await setupHousehold(owner);
    const soon = await createItem(owner, {
      categoryId: 'dairy',
      expiresOn: isoDateFromToday(1),
      zone: 'fridge',
    });
    const later = await createItem(owner, {
      categoryId: 'pantry',
      expiresOn: isoDateFromToday(60),
      qtyUnit: 'pcs',
      zone: 'pantry',
    });

    const dairy = await expectJson<ListBody>(await owner.get('/items?category=dairy'), 200);
    expect(dairy.items.map((i) => i.id)).toEqual([soon.id]);
    const pantry = await expectJson<ListBody>(await owner.get('/items?zone=pantry'), 200);
    expect(pantry.items.map((i) => i.id)).toEqual([later.id]);
    const expiring = await expectJson<ListBody>(await owner.get('/items?expires_within=3'), 200);
    expect(expiring.items.map((i) => i.id)).toEqual([soon.id]);
    const unknownZone = await expectJson<ListBody>(await owner.get('/items?zone=attic'), 200);
    expect(unknownZone.items).toEqual([]);
    const paged = await expectJson<ListBody>(await owner.get('/items?page=2&page_size=1'), 200);
    expect(paged.pagination).toMatchObject({ page: 2, pageSize: 1, total: 2 });
    expect(paged.items).toHaveLength(1);
  });

  test('batch create', async ({ owner }) => {
    await setupHousehold(owner);
    const names = [uniqueName('a'), uniqueName('b')];
    const body = await expectJson<{ items: StockItemBody[] }>(
      await owner.post('/items/batch', { items: names.map((name) => itemInput({ name })) }),
      201,
    );
    expect(body.items.map((i) => i.name).sort()).toEqual([...names].sort());
  });

  test('create validation 400s', async ({ owner }) => {
    await setupHousehold(owner);
    const cases: [Record<string, unknown> | unknown[], string?][] = [
      [[], 'JSON object body is required.'],
      [itemInput({ name: undefined }), 'name is required.'],
      [itemInput({ qtyValue: '1' }), 'qtyValue is required.'],
      [itemInput({ qtyValue: 0 }), 'Quantity value must be greater than zero.'],
      [itemInput({ categoryId: 'shoes' }), 'Item category is invalid.'],
      [itemInput({ qtyUnit: 'gallon' }), 'Quantity unit is invalid.'],
      [itemInput({ name: 'x'.repeat(121) }), 'Item name must be 120 characters or less.'],
      [itemInput({ zone: undefined }), 'Storage zone is required.'],
      [itemInput({ zone: 'attic' }), 'Storage zone not found.'],
      [itemInput({ expiresOn: '01.02.2026' }), 'expiresOn must be an ISO date.'],
      [itemInput({ source: 'magic' }), 'Item source is invalid.'],
    ];
    for (const [payload, message] of cases) {
      const body = await expectJson(await owner.post('/items', payload), 400);
      if (message) expect(body.error, JSON.stringify(payload)).toBe(message);
    }
  });

  test('batch validation 400s', async ({ owner }) => {
    await setupHousehold(owner);
    expect((await expectJson(await owner.post('/items/batch', {}), 400)).error).toBe(
      'items must be an array.',
    );
    expect((await expectJson(await owner.post('/items/batch', { items: [] }), 400)).error).toBe(
      'At least one item is required.',
    );
    const tooMany = Array.from({ length: 101 }, () => itemInput());
    expect(
      (await expectJson(await owner.post('/items/batch', { items: tooMany }), 400)).error,
    ).toBe('A batch can contain at most 100 items.');
    await expectJson(
      await owner.post('/items/batch', { items: [itemInput({ qtyValue: -1 })] }),
      400,
    );
  });

  test('update and list validation 400s', async ({ owner }) => {
    await setupHousehold(owner);
    const item = await createItem(owner);
    expect((await expectJson(await owner.patch(`/items/${item.id}`, {}), 400)).error).toBe(
      'No item changes were provided.',
    );
    await expectJson(await owner.patch(`/items/${item.id}`, { qtyValue: 'many' }), 400);
    await expectJson(await owner.patch(`/items/${item.id}`, { removalReason: 'eaten' }), 400);
    await expectJson(await owner.delete(`/items/${item.id}?removal_reason=eaten`), 400);
    await expectJson(await owner.get('/items?page=abc'), 400);
    await expectJson(await owner.get('/items?expires_within=-1'), 400);
    await expectJson(await owner.get('/items?category=shoes'), 400);
  });

  test('404 for an unknown item id', async ({ owner }) => {
    await setupHousehold(owner);
    expect(
      (await expectJson(await owner.patch(`/items/${missingId()}`, { name: 'x' }), 404)).error,
    ).toBe('Item not found.');
    await expectJson(await owner.delete(`/items/${missingId()}`), 404);
  });

  test('outsider cannot read, modify or remove another household item', async ({
    owner,
    outsider,
  }) => {
    await setupHousehold(owner);
    const item = await createItem(owner);
    await setupHousehold(outsider);

    const list = await expectJson<ListBody>(await outsider.get('/items?include_removed=true'), 200);
    expect(list.items.map((i) => i.id)).not.toContain(item.id);
    await expectJson(await outsider.patch(`/items/${item.id}`, { name: 'hijacked' }), 404);
    await expectJson(await outsider.delete(`/items/${item.id}`), 404);

    const ownerList = await expectJson<ListBody>(await owner.get('/items'), 200);
    expect(ownerList.items.find((i) => i.id === item.id)).toMatchObject({
      name: item.name,
      removedOn: null,
    });
  });

  test('outsider without a household gets 404', async ({ owner, outsider }) => {
    await setupHousehold(owner);
    const item = await createItem(owner);
    await expectJson(await outsider.patch(`/items/${item.id}`, { name: 'hijacked' }), 404);
  });

  test('401 without or with an invalid bearer token', async ({ request }) => {
    test.skip(!readE2eEnv(), 'No E2E Supabase target configured.');
    const id = missingId();
    await expectJson(await request.get('/items'), 401);
    await expectJson(await request.post('/items', { data: itemInput() }), 401);
    await expectJson(await request.post('/items/batch', { data: { items: [itemInput()] } }), 401);
    await expectJson(await request.patch(`/items/${id}`, { data: { name: 'x' } }), 401);
    await expectJson(await request.delete(`/items/${id}`), 401);
    await expectJson(await request.get('/items/removal-stats'), 401);
    await expectJson(
      await request.get('/items', { headers: { Authorization: 'Bearer invalid' } }),
      401,
    );
  });
});

test.describe('/items expiry provenance', () => {
  test('an undeclared date is recorded as an inferred estimate', async ({ owner }) => {
    await setupHousehold(owner);
    const item = await createItem(owner, { expiresOn: isoDateFromToday(5) });
    expect(item.expiryProvenance).toMatchObject({
      confirmedAt: null,
      origin: 'inferred',
      printedMarking: 'unknown',
      source: 'estimated',
    });
    expect(item.expiryProvenance.factId).not.toBeNull();
  });

  test('a printed date keeps its marking', async ({ owner }) => {
    await setupHousehold(owner);
    const expiresOn = isoDateFromToday(7);
    const item = await createItem(owner, {
      expiresOn,
      expiry: { printedMarking: 'use_by', source: 'printed' },
    });
    expect(item.expiresOn).toBe(expiresOn);
    expect(item.expiryProvenance).toMatchObject({
      confirmedAt: null,
      origin: 'declared',
      printedMarking: 'use_by',
      source: 'printed',
    });
  });

  test('an estimated date can be confirmed without moving it', async ({ owner }) => {
    await setupHousehold(owner);
    const expiresOn = isoDateFromToday(4);
    const item = await createItem(owner, {
      expiresOn,
      expiry: { confidence: 0.6, estimatorVersion: 'category-zone-v1', source: 'estimated' },
    });
    expect(item.expiryProvenance).toMatchObject({
      confirmedAt: null,
      origin: 'declared',
      source: 'estimated',
    });

    const confirmed = await expectJson<ItemBody>(
      await owner.patch(`/items/${item.id}`, {
        expiry: {
          confidence: 0.6,
          confirm: true,
          estimatorVersion: 'category-zone-v1',
          expectedFactId: item.expiryProvenance.factId,
          source: 'estimated',
        },
      }),
      200,
    );
    expect(confirmed.item.expiresOn).toBe(expiresOn);
    expect(confirmed.item.expiryProvenance.source).toBe('estimated');
    expect(confirmed.item.expiryProvenance.confirmedAt).not.toBeNull();
    expect(confirmed.item.expiryProvenance.factId).not.toBe(item.expiryProvenance.factId);
  });

  test('a user date with confirm is confirmed on write', async ({ owner }) => {
    await setupHousehold(owner);
    const item = await createItem(owner, {
      expiresOn: isoDateFromToday(3),
      expiry: { confirm: true, printedMarking: 'best_before', source: 'user' },
    });
    expect(item.expiryProvenance).toMatchObject({
      origin: 'declared',
      printedMarking: 'best_before',
      source: 'user',
    });
    expect(item.expiryProvenance.confirmedAt).not.toBeNull();
  });

  test('a stale expectedFactId is a 409 conflict', async ({ owner }) => {
    await setupHousehold(owner);
    const item = await createItem(owner, { expiresOn: isoDateFromToday(2) });
    const body = await expectJson(
      await owner.patch(`/items/${item.id}`, {
        expiry: { confirm: true, expectedFactId: missingId(), source: 'user' },
      }),
      409,
    );
    expect(body.error).toBe('The expiry date changed. Reload the item before saving.');
  });

  test('expiry declaration validation 400s', async ({ owner }) => {
    await setupHousehold(owner);
    const expiresOn = isoDateFromToday(5);
    const cases: [Record<string, unknown>, string][] = [
      [{ expiresOn, expiry: 'printed' }, 'expiry must be a JSON object.'],
      [
        { expiresOn, expiry: { source: 'printed', actor: 'me' } },
        'expiry.actor is not a supported field.',
      ],
      [{ expiresOn, expiry: {} }, 'source is required.'],
      [
        { expiresOn, expiry: { source: 'model' } },
        'Model-derived expiry provenance is not enabled.',
      ],
      [{ expiresOn, expiry: { source: 'guess' } }, 'expiry.source is invalid.'],
      [
        { expiresOn, expiry: { confirm: 'yes', source: 'user' } },
        'expiry.confirm must be a boolean.',
      ],
      [
        { expiresOn, expiry: { printedMarking: 'eat_by', source: 'printed' } },
        'expiry.printedMarking is invalid.',
      ],
      [
        { expiresOn: null, expiry: { source: 'printed' } },
        'A printed expiry source requires a date.',
      ],
      [
        { expiresOn, expiry: { confidence: 2, source: 'estimated' } },
        'Expiry confidence must be between 0 and 1.',
      ],
      [
        { expiresOn, expiry: { confidence: 0.5, source: 'printed' } },
        'Confidence is only valid for an estimated expiry date.',
      ],
      [
        { expiresOn, expiry: { printedMarking: 'use_by', source: 'estimated' } },
        'A printed marking requires a printed or user-entered date.',
      ],
      [
        { expiresOn, expiry: { expectedFactId: 'nope', source: 'user' } },
        'expectedFactId must be a uuid.',
      ],
    ];
    for (const [overrides, message] of cases) {
      const body = await expectJson(await owner.post('/items', itemInput(overrides)), 400);
      expect(body.error, JSON.stringify(overrides)).toBe(message);
    }
  });

  test('outsider cannot confirm another household expiry', async ({ owner, outsider }) => {
    await setupHousehold(owner);
    const item = await createItem(owner, { expiresOn: isoDateFromToday(2) });
    await setupHousehold(outsider);
    await expectJson(
      await outsider.patch(`/items/${item.id}`, { expiry: { confirm: true, source: 'user' } }),
      404,
    );
  });
});

test.describe('/items/removal-stats', () => {
  test('counts used and composted removals for the month', async ({ owner }) => {
    const household = await setupHousehold(owner);
    const used = await createItem(owner);
    const composted = await createItem(owner);
    await expectJson(await owner.delete(`/items/${used.id}?removal_reason=used`), 200);
    await expectJson(await owner.delete(`/items/${composted.id}?removal_reason=composted`), 200);

    const month = new Date().toISOString().slice(0, 7);
    const body = await expectJson<StatsBody>(
      await owner.get(`/items/removal-stats?month=${month}`),
      200,
    );
    expect(body.stats.householdId).toBe(household.id);
    expect(body.stats.current).toMatchObject({
      compostedCount: 1,
      month,
      totalCount: 2,
      usedCount: 1,
    });
  });

  test('rejects a malformed month', async ({ owner }) => {
    await setupHousehold(owner);
    expect(
      (await expectJson(await owner.get('/items/removal-stats?month=2026-1'), 400)).error,
    ).toBe('month must use YYYY-MM format.');
  });

  test('stats do not include another household', async ({ owner, outsider }) => {
    await setupHousehold(owner);
    const item = await createItem(owner);
    await expectJson(await owner.delete(`/items/${item.id}?removal_reason=used`), 200);
    await setupHousehold(outsider);
    const body = await expectJson<StatsBody>(await outsider.get('/items/removal-stats'), 200);
    expect(body.stats.current.totalCount).toBe(0);
  });
});
