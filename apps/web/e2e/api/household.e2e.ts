import { readE2eEnv } from '../support/env';
import { expect, expectJson, test } from '../support/fixtures';
import { setupHousehold, uniqueName, type HouseholdBody } from '../support/builders/core';

test.describe('/household', () => {
  test('a new user has no household until PATCH creates one', async ({ owner }) => {
    await expectJson(await owner.get('/me'), 200);
    expect((await expectJson(await owner.get('/household'), 404)).error).toBe(
      'Household not found.',
    );

    const name = uniqueName('home');
    const created = await expectJson<HouseholdBody>(await owner.patch('/household', { name }), 200);
    expect(created.household.name).toBe(name);
    expect(created.household.ownerId).toBe(owner.user.id);
    expect(created.household.zones).toEqual(
      expect.arrayContaining(['fridge', 'pantry', 'freezer']),
    );

    const read = await expectJson<HouseholdBody>(await owner.get('/household'), 200);
    expect(read.household.id).toBe(created.household.id);
    expect(read.household.role).toBe('owner');
  });

  test('PATCH on an existing household renames it in place', async ({ owner }) => {
    const household = await setupHousehold(owner);
    const name = uniqueName('renamed');
    const body = await expectJson<HouseholdBody>(await owner.patch('/household', { name }), 200);
    expect(body.household.id).toBe(household.id);
    expect(body.household.name).toBe(name);
  });

  test('PATCH with an empty name on a new user creates the default household', async ({
    owner,
  }) => {
    await expectJson(await owner.get('/me'), 200);
    const body = await expectJson<HouseholdBody>(
      await owner.patch('/household', { name: '' }),
      200,
    );
    expect(body.household.name).toBe('My household');
  });

  test('PATCH validation', async ({ owner }) => {
    await setupHousehold(owner);
    expect((await expectJson(await owner.patch('/household', {}), 400)).error).toBe(
      'Household name is required.',
    );
    await expectJson(await owner.patch('/household', { name: 7 }), 400);
    await expectJson(await owner.patch('/household', { name: '   ' }), 400);
  });

  test('PATCH returns 400 for a malformed JSON body', async ({ owner, request }) => {
    await setupHousehold(owner);
    const headers = {
      Authorization: `Bearer ${owner.user.accessToken}`,
      'Content-Type': 'application/json',
    };
    // A string would be JSON-encoded by Playwright; send raw bytes so the body is malformed.
    const data = Buffer.from('{not json');
    const response = await request.patch('/household', { data, headers });
    expect((await expectJson(response, 400)).error).toBe('Invalid JSON body.');
  });

  test('households are isolated between users', async ({ owner, outsider }) => {
    const ownerHousehold = await setupHousehold(owner);
    await expectJson(await outsider.get('/me'), 200);
    await expectJson(await outsider.get('/household'), 404);

    const outsiderHousehold = await setupHousehold(outsider);
    expect(outsiderHousehold.id).not.toBe(ownerHousehold.id);

    const reread = await expectJson<HouseholdBody>(await owner.get('/household'), 200);
    expect(reread.household.name).toBe(ownerHousehold.name);
  });

  test('401 without or with an invalid bearer token', async ({ request }) => {
    test.skip(!readE2eEnv(), 'No E2E Supabase target configured.');
    await expectJson(await request.get('/household'), 401);
    await expectJson(await request.patch('/household', { data: { name: 'x' } }), 401);
    await expectJson(
      await request.get('/household', { headers: { Authorization: 'Bearer invalid' } }),
      401,
    );
  });
});
