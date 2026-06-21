import { getRequestAuthContext, jsonResponse } from '../../../lib/api-auth';
import { getRequestHousehold } from '../../../lib/items';
import { readUpdateShoppingListItemBody } from '../../../lib/shopping-list-payload';
import { getWebShoppingListClient, shoppingListApiErrorResponse } from '../../../lib/shopping-list';

type ShoppingListItemRouteContext = {
  readonly params: Promise<{
    readonly id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: ShoppingListItemRouteContext,
): Promise<Response> {
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
    const item = await getWebShoppingListClient().updateItem(authContext, {
      ...readUpdateShoppingListItemBody(await request.json()),
      householdId: household.id,
      id,
    });

    return jsonResponse({ item });
  } catch (error) {
    return shoppingListApiErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  context: ShoppingListItemRouteContext,
): Promise<Response> {
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
    const item = await getWebShoppingListClient().deleteItem(authContext, {
      householdId: household.id,
      id,
    });

    return jsonResponse({ item });
  } catch (error) {
    return shoppingListApiErrorResponse(error);
  }
}
