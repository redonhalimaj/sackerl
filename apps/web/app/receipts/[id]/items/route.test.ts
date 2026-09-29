import { ApiRequestError } from '@sackerl/api-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as ReceiptsModule from '../../../../lib/receipts';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  household: vi.fn(),
  getReview: vi.fn(),
  saveReview: vi.fn(),
}));

vi.mock('../../../../lib/api-auth', () => ({
  getRequestAuthContext: mocks.auth,
  jsonResponse: (data: object, status = 200) => Response.json(data, { status }),
}));
vi.mock('../../../../lib/items', () => ({ getRequestHousehold: mocks.household }));
vi.mock('../../../../lib/receipts', async (importOriginal) => ({
  ...(await importOriginal<typeof ReceiptsModule>()),
  getWebReceiptsClient: () => ({
    getReceiptReview: mocks.getReview,
    saveReceiptReview: mocks.saveReview,
  }),
}));

import { GET, PUT } from './route';

const auth = { accessToken: 'fixture-token', user: { id: 'fixture-user' } };
const routeContext = { params: Promise.resolve({ id: 'receipt-1' }) };
const body = {
  expectedReviewRevision: 2,
  generationId: 'generation-1',
  lines: [
    {
      categoryId: 'dairy',
      id: 'line-1',
      included: true,
      name: 'Milk',
      qtyUnit: 'l',
      qtyValue: 1,
      reviewState: 'reviewed',
    },
  ],
};
const snapshot = {
  items: [{ id: 'line-1', effectiveName: 'Milk' }],
  receipt: { id: 'receipt-1', activeParseGenerationId: 'generation-1', reviewRevision: 3 },
  summary: { generationId: 'generation-1', reviewRevision: 3 },
};

function request(value: unknown = body): Request {
  return new Request('http://localhost/receipts/receipt-1/items', {
    method: 'PUT',
    body: JSON.stringify(value),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue(auth);
  mocks.household.mockResolvedValue({ id: 'session-household' });
  mocks.getReview.mockResolvedValue(snapshot);
  mocks.saveReview.mockResolvedValue(snapshot);
});

describe('receipt review routes', () => {
  it.each([GET, PUT])(
    'stops unauthenticated requests before household or receipt access',
    async (handler) => {
      mocks.auth.mockResolvedValue(
        Response.json({ error: 'Missing bearer token.' }, { status: 401 }),
      );
      const response = await handler(request(), routeContext);
      expect(response.status).toBe(401);
      expect(mocks.household).not.toHaveBeenCalled();
      expect(mocks.getReview).not.toHaveBeenCalled();
      expect(mocks.saveReview).not.toHaveBeenCalled();
    },
  );

  it('returns the consistent review snapshot and existing item-list envelope', async () => {
    const response = await GET(request(), routeContext);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: snapshot.items, review: snapshot });
    expect(mocks.getReview).toHaveBeenCalledWith(auth, {
      householdId: 'session-household',
      receiptId: 'receipt-1',
    });
  });

  it('derives household and receipt identity from the session and route on save', async () => {
    const response = await PUT(
      request({ ...body, householdId: 'forged-household', receiptId: 'forged-receipt' }),
      routeContext,
    );
    expect(response.status).toBe(200);
    expect(mocks.saveReview).toHaveBeenCalledWith(auth, {
      ...body,
      householdId: 'session-household',
      receiptId: 'receipt-1',
    });
    await expect(response.json()).resolves.toMatchObject({ review: snapshot });
  });

  it('returns a conflict when a review snapshot is stale', async () => {
    mocks.saveReview.mockRejectedValue(new ApiRequestError('Reload before saving.', 409));
    const response = await PUT(request(), routeContext);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: 'Reload before saving.' });
  });

  it('rejects malformed JSON without submitting a review', async () => {
    const response = await PUT(
      new Request('http://localhost/receipts/receipt-1/items', { method: 'PUT', body: '{' }),
      routeContext,
    );
    expect(response.status).toBe(400);
    expect(mocks.saveReview).not.toHaveBeenCalled();
  });

  it('returns a household gate response without submitting a review', async () => {
    mocks.household.mockResolvedValue(
      Response.json({ error: 'Household required.' }, { status: 404 }),
    );
    const response = await PUT(request(), routeContext);
    expect(response.status).toBe(404);
    expect(mocks.saveReview).not.toHaveBeenCalled();
  });
});
