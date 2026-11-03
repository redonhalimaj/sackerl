import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  household: vi.fn(),
  client: {
    createItem: vi.fn(),
    createItemsBatch: vi.fn(),
    updateItem: vi.fn(),
  },
}));

vi.mock('../../lib/api-auth', () => ({
  getRequestAuthContext: mocks.auth,
  jsonResponse: (data: object, status = 200) => Response.json(data, { status }),
}));
vi.mock('../../lib/items', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getRequestHousehold: mocks.household,
  getWebItemsClient: () => mocks.client,
}));

import { PATCH } from './[id]/route';
import { POST as POST_BATCH } from './batch/route';
import { POST } from './route';

const context = { params: Promise.resolve({ id: 'aaaaaaaa-1111-4111-8111-111111111111' }) };

function request(method: string, body: string): Request {
  return new Request('https://local.test/items', {
    body,
    headers: { 'Content-Type': 'application/json' },
    method,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ accessToken: 'fixture-token', user: { id: 'fixture-user' } });
  mocks.household.mockResolvedValue({ id: 'household-1' });
});

describe('items routes reject malformed JSON with 400 (SCKRL-912)', () => {
  const routes = [
    { name: 'POST /items', call: (body: string) => POST(request('POST', body)) },
    { name: 'POST /items/batch', call: (body: string) => POST_BATCH(request('POST', body)) },
    { name: 'PATCH /items/[id]', call: (body: string) => PATCH(request('PATCH', body), context) },
  ];

  it.each(routes)('$name returns 400 for a malformed body', async ({ call }) => {
    const response = await call('{not json');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body.' });
    expect(mocks.client.createItem).not.toHaveBeenCalled();
    expect(mocks.client.createItemsBatch).not.toHaveBeenCalled();
    expect(mocks.client.updateItem).not.toHaveBeenCalled();
  });

  it.each(routes)('$name returns 400 for an empty body', async ({ call }) => {
    const response = await call('');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'JSON body is required.' });
  });
});
