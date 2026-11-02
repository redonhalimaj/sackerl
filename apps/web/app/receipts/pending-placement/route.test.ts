import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), household: vi.fn(), listPending: vi.fn() }));

vi.mock('../../../lib/api-auth', () => ({
  getRequestAuthContext: mocks.auth,
  jsonResponse: (data: object, status = 200) => Response.json(data, { status }),
}));
vi.mock('../../../lib/items', () => ({ getRequestHousehold: mocks.household }));
vi.mock('../../../lib/receipts', () => ({
  getWebReceiptsClient: () => ({ listUnplacedReceiptReviews: mocks.listPending }),
}));

import { GET } from './route';

const ids = { householdId: 'aaaaaaaa-1111-4111-8111-111111111111' };
const auth = { accessToken: 'fixture-token', user: { id: 'fixture-user' } };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue(auth);
  mocks.household.mockResolvedValue({ id: ids.householdId });
  mocks.listPending.mockResolvedValue({
    pagination: { page: 2, pageSize: 10, total: 11 },
    receipts: [],
  });
});

describe('pending placement list route', () => {
  it('calls only the opt-in authoritative list and disables caching', async () => {
    const response = await GET(
      new Request('https://local.test/receipts/pending-placement?page=2&page_size=10'),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(mocks.listPending).toHaveBeenCalledWith(auth, {
      householdId: ids.householdId,
      page: 2,
      pageSize: 10,
    });
  });

  it('rejects invalid pagination before calling the RPC-backed client', async () => {
    const response = await GET(
      new Request('https://local.test/receipts/pending-placement?page_size=101'),
    );
    expect(response.status).toBe(400);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toMatchObject({ code: 'INVALID_PLACEMENT_INPUT' });
    expect(mocks.listPending).not.toHaveBeenCalled();
  });

  it('adds no-store to authentication failures', async () => {
    mocks.auth.mockResolvedValueOnce(
      Response.json({ error: 'Missing bearer token.' }, { status: 401 }),
    );
    const response = await GET(new Request('https://local.test/receipts/pending-placement'));
    expect(response.status).toBe(401);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toMatchObject({ code: 'AUTH_REQUIRED' });
    expect(mocks.listPending).not.toHaveBeenCalled();
  });

  it('maps missing household membership to 403 with the stable code', async () => {
    mocks.household.mockResolvedValueOnce(
      Response.json({ error: 'Household not found.' }, { status: 404 }),
    );
    const response = await GET(new Request('https://local.test/receipts/pending-placement'));
    expect(response.status).toBe(403);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toMatchObject({ code: 'HOUSEHOLD_ACCESS_REQUIRED' });
    expect(mocks.listPending).not.toHaveBeenCalled();
  });
});
