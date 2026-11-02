import { ApiRequestError } from '@sackerl/api-client';
import { describe, expect, it } from 'vitest';

import { readJsonBody } from './request-json';

function post(body: string): Request {
  return new Request('https://local.test/x', { body, method: 'POST' });
}

describe('readJsonBody', () => {
  it('parses a valid JSON body', async () => {
    await expect(readJsonBody(post('{"a":1}'))).resolves.toEqual({ a: 1 });
  });

  it.each([
    ['{not json', 'Invalid JSON body.'],
    ['', 'JSON body is required.'],
    ['   ', 'JSON body is required.'],
  ])('rejects %j with a 400 ApiRequestError', async (body, message) => {
    const error = await readJsonBody(post(body)).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({ message, status: 400 });
  });
});
