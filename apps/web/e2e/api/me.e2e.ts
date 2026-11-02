import { readE2eEnv } from '../support/env';
import { expect, expectJson, test } from '../support/fixtures';

type ProfileBody = {
  readonly profile: { readonly email: string; readonly id: string; readonly locale: string };
};

test.describe('/me', () => {
  test('GET creates and returns the caller profile', async ({ owner }) => {
    const body = await expectJson<ProfileBody>(await owner.get('/me'), 200);
    expect(body.profile.id).toBe(owner.user.id);
    expect(body.profile.locale).toMatch(/^[a-z]{2}$/);
  });

  test('PATCH updates the locale', async ({ owner }) => {
    await expectJson(await owner.get('/me'), 200);
    const body = await expectJson<ProfileBody>(await owner.patch('/me', { locale: 'en-GB' }), 200);
    expect(body.profile.locale).toBe('en');
    const reread = await expectJson<ProfileBody>(await owner.get('/me'), 200);
    expect(reread.profile.locale).toBe('en');
  });

  test('PATCH falls back to de for an unparseable locale string', async ({ owner }) => {
    await expectJson(await owner.get('/me'), 200);
    const body = await expectJson<ProfileBody>(await owner.patch('/me', { locale: '123' }), 200);
    expect(body.profile.locale).toBe('de');
  });

  test('PATCH rejects a missing or non-string locale', async ({ owner }) => {
    await expectJson(await owner.get('/me'), 200);
    expect((await expectJson(await owner.patch('/me', {}), 400)).error).toBe('Locale is required.');
    await expectJson(await owner.patch('/me', { locale: 42 }), 400);
  });

  test('profiles are per user', async ({ owner, outsider }) => {
    const a = await expectJson<ProfileBody>(await owner.get('/me'), 200);
    const b = await expectJson<ProfileBody>(await outsider.get('/me'), 200);
    expect(a.profile.id).not.toBe(b.profile.id);
    await expectJson(await outsider.patch('/me', { locale: 'fr' }), 200);
    const reread = await expectJson<ProfileBody>(await owner.get('/me'), 200);
    expect(reread.profile.locale).toBe(a.profile.locale);
  });

  test('401 without or with an invalid bearer token', async ({ request }) => {
    test.skip(!readE2eEnv(), 'No E2E Supabase target configured.');
    expect((await expectJson(await request.get('/me'), 401)).error).toBe('Missing bearer token.');
    await expectJson(await request.patch('/me', { data: { locale: 'en' } }), 401);
    const invalid = await request.get('/me', { headers: { Authorization: 'Bearer not-a-jwt' } });
    expect((await expectJson(invalid, 401)).error).toBe('Invalid bearer token.');
  });
});
