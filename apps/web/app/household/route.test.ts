import { describe, expect, it } from 'vitest';

import { GET } from './route';

describe('GET /household', () => {
  it('rejects requests without credentials before contacting a provider', async () => {
    const response = await GET(new Request('http://localhost/household'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Missing bearer token.' });
  });
});
