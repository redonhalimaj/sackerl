import {
  ApiRequestError,
  createSackerlReceiptsClient,
  ReceiptPlacementApiError,
} from '@sackerl/api-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  household: vi.fn(),
  finalize: vi.fn(),
  getStatus: vi.fn(),
  client: null as ReturnType<typeof createSackerlReceiptsClient> | null,
}));

vi.mock('../../../../lib/api-auth', () => ({
  getRequestAuthContext: mocks.auth,
  jsonResponse: (data: object, status = 200) => Response.json(data, { status }),
}));
vi.mock('../../../../lib/items', () => ({ getRequestHousehold: mocks.household }));
vi.mock('../../../../lib/receipts', () => ({
  getWebReceiptsClient: () =>
    mocks.client ?? {
      finalizeReceiptPlacement: mocks.finalize,
      getReceiptPlacement: mocks.getStatus,
    },
}));

import { GET, POST } from './route';

const ids = {
  householdId: 'aaaaaaaa-1111-4111-8111-111111111111',
  receiptId: 'bbbbbbbb-2222-4222-8222-222222222222',
  generationId: 'cccccccc-3333-4333-8333-333333333333',
  idempotencyKey: 'dddddddd-4444-4444-8444-444444444444',
  lineId: 'eeeeeeee-5555-4555-8555-555555555555',
  zoneId: 'ffffffff-6666-4666-8666-666666666666',
};
const auth = { accessToken: 'fixture-token', user: { id: 'fixture-user' } };
const context = { params: Promise.resolve({ id: ids.receiptId }) };
const command = {
  assignments: [{ receiptItemId: ids.lineId, zoneId: ids.zoneId }],
  expectedReviewRevision: 2,
  generationId: ids.generationId,
  idempotencyKey: ids.idempotencyKey,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.client = null;
  mocks.auth.mockResolvedValue(auth);
  mocks.household.mockResolvedValue({ id: ids.householdId });
  mocks.finalize.mockResolvedValue({ outcome: 'placed', placement: { receiptId: ids.receiptId } });
  mocks.getStatus.mockResolvedValue({
    state: 'unplaced',
    receiptId: ids.receiptId,
    placement: null,
    keyMatches: null,
  });
});

describe('receipt placement route', () => {
  it('derives household and receipt ids from the authenticated request and disables caching', async () => {
    const response = await POST(
      new Request('https://local.test/receipts/id/placement', {
        method: 'POST',
        body: JSON.stringify(command),
      }),
      context,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(mocks.finalize).toHaveBeenCalledWith(auth, {
      ...command,
      householdId: ids.householdId,
      receiptId: ids.receiptId,
    });
  });

  it('rejects extra caller-owned identity fields before calling the placement client', async () => {
    const response = await POST(
      new Request('https://local.test/receipts/id/placement', {
        method: 'POST',
        body: JSON.stringify({ ...command, householdId: 'forged' }),
      }),
      context,
    );

    expect(response.status).toBe(400);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toMatchObject({ code: 'INVALID_PLACEMENT_INPUT' });
    expect(mocks.finalize).not.toHaveBeenCalled();
  });

  it('returns stable authenticated error details without leaking other-household content', async () => {
    mocks.finalize.mockRejectedValue(
      new ReceiptPlacementApiError('Receipt not found.', 404, {
        code: 'RECEIPT_NOT_FOUND',
      }),
    );
    const response = await POST(
      new Request('https://local.test/receipts/id/placement', {
        method: 'POST',
        body: JSON.stringify(command),
      }),
      context,
    );

    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({
      error: 'Receipt not found.',
      code: 'RECEIPT_NOT_FOUND',
    });
  });

  it('passes the PLACEMENT_CONFLICT code through as a 409 (SCKRL-912)', async () => {
    mocks.finalize.mockRejectedValue(
      new ReceiptPlacementApiError('Placement conflicted with a concurrent change.', 409, {
        code: 'PLACEMENT_CONFLICT',
      }),
    );
    const response = await POST(
      new Request('https://local.test/receipts/id/placement', {
        method: 'POST',
        body: JSON.stringify(command),
      }),
      context,
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: 'Placement conflicted with a concurrent change.',
      code: 'PLACEMENT_CONFLICT',
    });
  });

  it.each([409, 422])(
    'does not invent a specific code for an uncoded %i ApiRequestError',
    async (status) => {
      mocks.finalize.mockRejectedValue(new ApiRequestError('Request conflicted.', status));
      const response = await POST(
        new Request('https://local.test/receipts/id/placement', {
          method: 'POST',
          body: JSON.stringify(command),
        }),
        context,
      );

      expect(response.status).toBe(status);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      await expect(response.json()).resolves.toEqual({ error: 'Request conflicted.' });
    },
  );

  it('returns only a stable 404 for a foreign-household receipt', async () => {
    mocks.finalize.mockRejectedValue(
      new ReceiptPlacementApiError('Receipt not found.', 404, { code: 'RECEIPT_NOT_FOUND' }),
    );
    const response = await POST(
      new Request('https://local.test/receipts/id/placement', {
        method: 'POST',
        body: JSON.stringify(command),
      }),
      context,
    );

    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({
      error: 'Receipt not found.',
      code: 'RECEIPT_NOT_FOUND',
    });
  });

  it('returns canonical placement status by optional key with no-store', async () => {
    const response = await GET(
      new Request(`https://local.test/receipts/id/placement?idempotency_key=${ids.idempotencyKey}`),
      context,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(mocks.getStatus).toHaveBeenCalledWith(auth, {
      householdId: ids.householdId,
      idempotencyKey: ids.idempotencyKey,
      receiptId: ids.receiptId,
    });
  });

  it('returns an error status for an unknown placement outcome', async () => {
    mocks.finalize.mockRejectedValue(
      new ReceiptPlacementApiError('Placement outcome is unknown.', 502, {
        outcomeUnknown: true,
      }),
    );
    const response = await POST(
      new Request('https://local.test/receipts/id/placement', {
        method: 'POST',
        body: JSON.stringify(command),
      }),
      context,
    );
    expect(response.status).toBe(502);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toMatchObject({ outcomeUnknown: true });
  });

  it.each([
    ['malformed', { outcome: 'placed' }],
    [
      'mismatched',
      {
        outcome: 'placed',
        placement: {
          addedOn: '2026-10-19',
          generationId: ids.generationId,
          householdId: '11111111-1111-4111-8111-111111111111',
          idempotencyKey: ids.idempotencyKey,
          items: [
            {
              acquisitionEventId: '22222222-2222-4222-8222-222222222222',
              categoryId: 'dairy',
              expiresOn: null,
              expiryFactId: null,
              itemId: '33333333-3333-4333-8333-333333333333',
              name: 'Milk',
              qtyUnit: 'l',
              qtyValue: 1,
              receiptItemId: ids.lineId,
              zoneId: ids.zoneId,
            },
          ],
          placedAt: '2026-10-19T10:00:00.000Z',
          placedBy: '44444444-4444-4444-8444-444444444444',
          placementId: '55555555-5555-4555-8555-555555555555',
          purchasedOn: null,
          receiptId: ids.receiptId,
          reviewRevision: 2,
        },
      },
    ],
  ])(
    'maps a %s successful RPC response to an unknown 502 at the HTTP boundary',
    async (_label, rpcBody) => {
      const rpcFetch = vi.fn<typeof fetch>().mockResolvedValue(Response.json(rpcBody));
      mocks.client = createSackerlReceiptsClient(
        { anonKey: 'public-key', url: 'https://sackerl.supabase.co' },
        { fetch: rpcFetch },
      );

      const response = await POST(
        new Request('https://local.test/receipts/id/placement', {
          method: 'POST',
          body: JSON.stringify(command),
        }),
        context,
      );

      expect(response.status).toBe(502);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      await expect(response.json()).resolves.toMatchObject({ outcomeUnknown: true });
      expect(rpcFetch).toHaveBeenCalledTimes(1);
      expect(rpcFetch.mock.calls[0]?.[0]).toBe(
        'https://sackerl.supabase.co/rest/v1/rpc/finalize_receipt_placement',
      );
      const sentBody = rpcFetch.mock.calls[0]?.[1]?.body;
      if (typeof sentBody !== 'string') {
        throw new Error('Placement RPC body was not serialized as JSON.');
      }
      expect(JSON.parse(sentBody)).toMatchObject({
        p_idempotency_key: ids.idempotencyKey,
        p_receipt_id: ids.receiptId,
      });
    },
  );

  it('adds no-store to auth failures and rejects unrecognized status query fields', async () => {
    mocks.auth.mockResolvedValueOnce(
      Response.json({ error: 'Missing bearer token.' }, { status: 401 }),
    );
    const unauthorized = await GET(
      new Request('https://local.test/receipts/id/placement'),
      context,
    );
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.headers.get('Cache-Control')).toBe('no-store');
    await expect(unauthorized.json()).resolves.toMatchObject({ code: 'AUTH_REQUIRED' });

    const invalid = await GET(
      new Request(`https://local.test/receipts/id/placement?other=${ids.idempotencyKey}`),
      context,
    );
    expect(invalid.status).toBe(400);
    expect(invalid.headers.get('Cache-Control')).toBe('no-store');
    expect(mocks.getStatus).not.toHaveBeenCalled();
  });

  it('maps missing current household membership to 403 before replay or status access', async () => {
    mocks.household.mockResolvedValueOnce(
      Response.json({ error: 'Household not found.' }, { status: 404 }),
    );
    const response = await GET(
      new Request(`https://local.test/receipts/id/placement?idempotency_key=${ids.idempotencyKey}`),
      context,
    );
    expect(response.status).toBe(403);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toMatchObject({ code: 'HOUSEHOLD_ACCESS_REQUIRED' });
    expect(mocks.getStatus).not.toHaveBeenCalled();
  });

  it('checks current household membership before any placement command replay', async () => {
    mocks.household.mockResolvedValueOnce(
      Response.json({ error: 'Membership revoked.' }, { status: 403 }),
    );
    const response = await POST(
      new Request('https://local.test/receipts/id/placement', {
        method: 'POST',
        body: JSON.stringify(command),
      }),
      context,
    );
    expect(response.status).toBe(403);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toMatchObject({ code: 'HOUSEHOLD_ACCESS_REQUIRED' });
    expect(mocks.finalize).not.toHaveBeenCalled();
  });

  it('maps household helper conflict responses to current-membership denial', async () => {
    mocks.household.mockResolvedValueOnce(
      Response.json({ error: 'Membership required.' }, { status: 409 }),
    );
    const response = await POST(
      new Request('https://local.test/receipts/id/placement', {
        method: 'POST',
        body: JSON.stringify(command),
      }),
      context,
    );
    expect(response.status).toBe(403);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toMatchObject({ code: 'HOUSEHOLD_ACCESS_REQUIRED' });
    expect(mocks.finalize).not.toHaveBeenCalled();
  });
});
