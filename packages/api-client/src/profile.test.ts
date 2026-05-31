import { describe, expect, it, vi } from 'vitest';

import {
  createSackerlProfileClient,
  resolveDeviceLocale,
  type ApiRequestError,
  type AuthenticatedUserContext,
} from './profile';

const config = {
  anonKey: 'public-key',
  url: 'https://sackerl.supabase.co',
};

const context = {
  accessToken: 'access-token',
  user: {
    email: 'test@sackerl.com',
    id: 'user-123',
  },
} satisfies AuthenticatedUserContext;

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
    ...init,
  });
}

describe('device locale resolution', () => {
  it('uses the device language code', () => {
    expect(resolveDeviceLocale('de-AT')).toBe('de');
    expect(resolveDeviceLocale(['fr-CH', 'de-AT'])).toBe('fr');
  });

  it('falls back to German when no valid device locale is available', () => {
    expect(resolveDeviceLocale(undefined)).toBe('de');
    expect(resolveDeviceLocale('')).toBe('de');
    expect(resolveDeviceLocale('invalid')).toBe('de');
  });
});

describe('profile API client', () => {
  it('fetches the current user profile with auth headers', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse([
        {
          created_at: '2026-05-24T20:00:00Z',
          email: 'test@sackerl.com',
          id: 'user-123',
          locale: 'de',
        },
      ]),
    );
    const client = createSackerlProfileClient(config, { fetch: fetchMock });

    await expect(client.getMe(context)).resolves.toEqual({
      createdAt: '2026-05-24T20:00:00Z',
      email: 'test@sackerl.com',
      id: 'user-123',
      locale: 'de',
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://sackerl.supabase.co/rest/v1/users?id=eq.user-123&limit=1&select=id%2Cemail%2Clocale%2Ccreated_at',
    );
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('GET');
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: 'Bearer access-token',
      apikey: 'public-key',
    });
  });

  it('creates a profile with the resolved device locale when missing', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            created_at: '2026-05-24T20:00:00Z',
            email: 'test@sackerl.com',
            id: 'user-123',
            locale: 'it',
          },
        ]),
      );
    const client = createSackerlProfileClient(config, { fetch: fetchMock });

    await expect(client.ensureMe(context, { deviceLocale: 'it-IT' })).resolves.toMatchObject({
      locale: 'it',
    });

    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe(
      'https://sackerl.supabase.co/rest/v1/users?on_conflict=id&select=id%2Cemail%2Clocale%2Ccreated_at',
    );
    expect(fetchMock.mock.calls.at(-1)?.[1]?.body).toBe(
      JSON.stringify({ email: 'test@sackerl.com', id: 'user-123', locale: 'it' }),
    );
    expect(fetchMock.mock.calls.at(-1)?.[1]?.headers).toMatchObject({
      Prefer: 'resolution=merge-duplicates,return=representation',
    });
    expect(fetchMock.mock.calls.at(-1)?.[1]?.method).toBe('POST');
  });

  it('creates a v1 owned household and owner membership', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            created_at: '2026-05-24T20:00:00Z',
            email: 'test@sackerl.com',
            id: 'user-123',
            locale: 'de',
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            created_at: '2026-05-24T20:01:00Z',
            id: 'household-123',
            name: 'Kitchen',
            owner_id: 'user-123',
            zones: ['fridge', 'pantry', 'basement', 'freezer'],
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            household_id: 'household-123',
            role: 'owner',
            user_id: 'user-123',
          },
        ]),
      );
    const client = createSackerlProfileClient(config, { fetch: fetchMock });

    await expect(client.ensureHousehold(context, { name: 'Kitchen' })).resolves.toEqual({
      createdAt: '2026-05-24T20:01:00Z',
      id: 'household-123',
      name: 'Kitchen',
      ownerId: 'user-123',
      role: 'owner',
      zones: ['fridge', 'pantry', 'basement', 'freezer'],
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      'https://sackerl.supabase.co/rest/v1/households?select=id%2Cowner_id%2Cname%2Czones%2Ccreated_at',
      expect.objectContaining({
        body: JSON.stringify({ name: 'Kitchen', owner_id: 'user-123' }),
        method: 'POST',
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      'https://sackerl.supabase.co/rest/v1/household_members?select=household_id%2Cuser_id%2Crole',
      expect.objectContaining({
        body: JSON.stringify({
          household_id: 'household-123',
          role: 'owner',
          user_id: 'user-123',
        }),
        method: 'POST',
      }),
    );
  });

  it('updates household zones with normalized non-empty values', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse([
        {
          created_at: '2026-05-24T20:01:00Z',
          id: 'household-123',
          name: 'Kitchen',
          owner_id: 'user-123',
          zones: ['fridge', 'pantry', 'cabinet'],
        },
      ]),
    );
    const client = createSackerlProfileClient(config, { fetch: fetchMock });

    await expect(
      client.updateHouseholdZones(context, {
        zones: ['Fridge', ' pantry ', 'fridge', 'Cabinet', 'bad value'],
      }),
    ).resolves.toMatchObject({
      zones: ['fridge', 'pantry', 'cabinet'],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://sackerl.supabase.co/rest/v1/households?owner_id=eq.user-123&select=id%2Cowner_id%2Cname%2Czones%2Ccreated_at',
      expect.objectContaining({
        body: JSON.stringify({ zones: ['fridge', 'pantry', 'cabinet'] }),
        method: 'PATCH',
      }),
    );
  });

  it('rejects empty household zones', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const client = createSackerlProfileClient(config, { fetch: fetchMock });

    await expect(client.updateHouseholdZones(context, { zones: [] })).rejects.toMatchObject({
      message: 'At least one storage zone is required.',
      status: 400,
    } satisfies Partial<ApiRequestError>);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces API errors with status codes', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ message: 'not found' }, { status: 404 }));
    const client = createSackerlProfileClient(config, { fetch: fetchMock });

    await expect(client.getMe(context)).rejects.toMatchObject({
      message: 'not found',
      status: 404,
    } satisfies Partial<ApiRequestError>);
  });
});
