import { ApiRequestError } from '@sackerl/api-client';

/**
 * Reads a JSON request body, turning an empty or malformed body into a 400 ApiRequestError
 * instead of letting `request.json()` throw a SyntaxError that surfaces as a 500.
 */
export async function readJsonBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (!text.trim()) {
    throw new ApiRequestError('JSON body is required.', 400);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiRequestError('Invalid JSON body.', 400);
  }
}
