import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as ReceiptsModule from '../../lib/receipts';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  household: vi.fn(),
  createReceipt: vi.fn(),
}));

vi.mock('../../lib/api-auth', () => ({
  getRequestAuthContext: mocks.auth,
  jsonResponse: (data: object, status = 200) => Response.json(data, { status }),
}));
vi.mock('../../lib/items', () => ({ getRequestHousehold: mocks.household }));
vi.mock('../../lib/receipts', async (importOriginal) => ({
  ...(await importOriginal<typeof ReceiptsModule>()),
  getWebReceiptsClient: () => ({ createReceipt: mocks.createReceipt }),
}));

import { POST } from './route';

function request(body: string): Request {
  return new Request('https://local.test/receipts', {
    body,
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ accessToken: 'fixture-token', user: { id: 'fixture-user' } });
  mocks.household.mockResolvedValue({ id: 'household-1' });
});

describe('POST /receipts rejects unreadable bodies with 400 (SCKRL-913)', () => {
  it.each([
    ['malformed', '{not json', 'Invalid JSON body.'],
    ['empty', '', 'JSON body is required.'],
  ])('returns 400 for a %s body without creating a receipt', async (_label, body, error) => {
    const response = await POST(request(body));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error });
    expect(mocks.createReceipt).not.toHaveBeenCalled();
  });
});
