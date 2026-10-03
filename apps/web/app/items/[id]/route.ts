import type { ItemRemovalReason } from '@sackerl/api-client';

import { getRequestAuthContext, jsonResponse } from '../../../lib/api-auth';
import { readUpdateItemBody } from '../../../lib/item-payload';
import { getRequestHousehold, getWebItemsClient, itemApiErrorResponse } from '../../../lib/items';

type ItemRouteContext = {
  readonly params: Promise<{
    readonly id: string;
  }>;
};

export async function PATCH(request: Request, context: ItemRouteContext): Promise<Response> {
  const authContext = await getRequestAuthContext(request);

  if (authContext instanceof Response) {
    return authContext;
  }

  const household = await getRequestHousehold(authContext);

  if (household instanceof Response) {
    return household;
  }

  try {
    const { id } = await context.params;
    const item = await getWebItemsClient().updateItem(authContext, {
      ...readUpdateItemBody(await request.json()),
      householdId: household.id,
      id,
    });

    return jsonResponse({ item });
  } catch (error) {
    return itemApiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: ItemRouteContext): Promise<Response> {
  const authContext = await getRequestAuthContext(_request);

  if (authContext instanceof Response) {
    return authContext;
  }

  const household = await getRequestHousehold(authContext);

  if (household instanceof Response) {
    return household;
  }

  try {
    const { id } = await context.params;
    const removalReason = new URL(_request.url).searchParams.get('removal_reason');
    const item = await getWebItemsClient().deleteItem(authContext, {
      householdId: household.id,
      id,
      ...(removalReason ? { removalReason: removalReason as ItemRemovalReason } : {}),
    });

    return jsonResponse({ item });
  } catch (error) {
    return itemApiErrorResponse(error);
  }
}
