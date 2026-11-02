import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  profile: {
    ensureHousehold: vi.fn(),
    getHousehold: vi.fn(),
    updateHousehold: vi.fn(),
    updateMe: vi.fn(),
  },
}));

vi.mock('../../lib/api-auth', () => ({
  getRequestAuthContext: mocks.auth,
  jsonResponse: (data: object, status = 200) => Response.json(data, { status }),
}));
vi.mock('../../lib/profile', () => ({ getWebProfileClient: () => mocks.profile }));

import { GET, PATCH } from './route';

function request(body: string): Request {
  return new Request('https://local.test/me', {
    body,
    headers: { 'Content-Type': 'application/json' },
    method: 'PATCH',
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ accessToken: 'fixture-token', user: { id: 'fixture-user' } });
});

describe('GET /me', () => {
  it('returns the auth gate response before contacting a provider', async () => {
    mocks.auth.mockResolvedValue(
      Response.json({ error: 'Missing bearer token.' }, { status: 401 }),
    );
    const response = await GET(new Request('https://local.test/me'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Missing bearer token.' });
  });
});

describe('PATCH /me rejects unreadable bodies with 400 (SCKRL-913)', () => {
  it.each([
    ['malformed', '{not json', 'Invalid JSON body.'],
    ['empty', '', 'JSON body is required.'],
    ['JSON null', 'null', 'Locale is required.'],
  ])('returns 400 for a %s body without writing', async (_label, body, error) => {
    const response = await PATCH(request(body));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error });
    expect(mocks.profile.updateMe).not.toHaveBeenCalled();
  });
});
