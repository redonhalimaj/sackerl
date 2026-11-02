import {
  ApiRequestError,
  ReceiptPlacementApiError,
  type AuthenticatedUserContext,
  type Household,
} from '@sackerl/api-client';

import { getRequestAuthContext, jsonResponse } from './api-auth';
import { getRequestHousehold } from './items';

export async function getPlacementRequestContext(
  request: Request,
): Promise<{ readonly auth: AuthenticatedUserContext; readonly household: Household } | Response> {
  let auth: AuthenticatedUserContext | Response;
  try {
    auth = await getRequestAuthContext(request);
  } catch {
    return withNoStore(jsonResponse({ error: 'Authentication service unavailable.' }, 503));
  }
  if (auth instanceof Response) {
    return placementAuthResponse(auth);
  }

  let household: Household | Response;
  try {
    household = await getRequestHousehold(auth);
  } catch {
    return withNoStore(jsonResponse({ error: 'Household access could not be verified.' }, 503));
  }
  if (household instanceof Response) {
    return placementHouseholdResponse(household);
  }
  return { auth, household };
}

export function withNoStore(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

export function receiptPlacementApiErrorResponse(
  error: unknown,
  commandMutation = false,
): Response {
  if (error instanceof ReceiptPlacementApiError) {
    return jsonResponse(
      {
        error: error.message,
        ...(error.code ? { code: error.code } : {}),
        ...(error.field ? { field: error.field } : {}),
        ...(error.receiptItemId ? { receiptItemId: error.receiptItemId } : {}),
        ...(error.outcomeUnknown ? { outcomeUnknown: true } : {}),
      },
      error.status === 0 ? 503 : error.status,
    );
  }
  if (error instanceof ApiRequestError) {
    const mapping = new Map<number, string>([
      [400, 'INVALID_PLACEMENT_INPUT'],
      [401, 'AUTH_REQUIRED'],
      [403, 'HOUSEHOLD_ACCESS_REQUIRED'],
      [404, 'RECEIPT_NOT_FOUND'],
      [409, 'STALE_RECEIPT_REVIEW'],
      [422, 'INVALID_PLACEMENT_LINE'],
    ]);
    return jsonResponse(
      {
        error: error.message,
        ...(mapping.has(error.status) ? { code: mapping.get(error.status) } : {}),
      },
      error.status,
    );
  }
  return commandMutation
    ? jsonResponse(
        {
          error: 'Placement outcome is unknown; check status and retry the exact command.',
          outcomeUnknown: true,
        },
        503,
      )
    : jsonResponse({ error: 'Placement request failed.' }, 500);
}

export function placementAuthResponse(response: Response): Response {
  if (response.status === 401) {
    return withNoStore(
      jsonResponse({ error: 'Authentication required.', code: 'AUTH_REQUIRED' }, 401),
    );
  }
  return withNoStore(response);
}

export function placementHouseholdResponse(response: Response): Response {
  if ([403, 404, 409].includes(response.status)) {
    return withNoStore(
      jsonResponse(
        { error: 'Current household membership is required.', code: 'HOUSEHOLD_ACCESS_REQUIRED' },
        403,
      ),
    );
  }
  if (response.status === 401) {
    return placementAuthResponse(response);
  }
  return withNoStore(response);
}
