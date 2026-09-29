import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  household: vi.fn(),
  context: { accessToken: 'test-token', user: { id: 'member' } },
}));

vi.mock('../../lib/auth', () => ({
  webSupabaseAuthConfig: { anonKey: 'test-public-key', url: 'https://example.test' },
}));
vi.mock('../../lib/api-auth', () => ({
  getRequestAuthContext: () => Promise.resolve(mocks.context),
  jsonResponse: (data: unknown) => Response.json(data),
}));
vi.mock('../../lib/items', () => ({ getRequestHousehold: mocks.household }));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
});

it('uses the request household calendar without leaking the previous household zone', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-16T22:30:00Z'));
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve(
        Response.json(
          url.includes('/recipes?')
            ? [
                {
                  id: 'tomato-salad',
                  name: 'Tomato salad',
                  ingredients: ['tomatoes'],
                  created_at: '2026-09-16T00:00:00Z',
                  image: null,
                  serves: 1,
                  time_minutes: 5,
                },
              ]
            : [{ id: 'tomatoes', name: 'Tomatoes', expires_on: '2026-09-16' }],
        ),
      ),
    ),
  );
  const { GET } = await import('./route');
  mocks.household.mockResolvedValue({ id: 'vienna', calendarTimeZone: 'Europe/Vienna' });
  expect(await (await GET(new Request('https://example.test/suggestions'))).json()).toEqual({
    suggestions: [],
  });
  mocks.household.mockResolvedValue({ id: 'new-york', calendarTimeZone: 'America/New_York' });
  const response = await GET(new Request('https://example.test/suggestions'));
  expect(response.status).toBe(200);
  const body = (await response.json()) as { suggestions: { matchedItemIds: string[] }[] };
  expect(body.suggestions[0]?.matchedItemIds).toEqual(['tomatoes']);
});
