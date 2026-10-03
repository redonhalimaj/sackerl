import { getRequestAuthContext, jsonResponse } from '../../../lib/api-auth';
import { getRequestHousehold } from '../../../lib/items';
import { readCreateShoppingListBatchBody } from '../../../lib/shopping-list-payload';
import { getWebShoppingListClient, shoppingListApiErrorResponse } from '../../../lib/shopping-list';

export async function POST(request: Request): Promise<Response> {
  const context = await getRequestAuthContext(request);

  if (context instanceof Response) {
    return context;
  }

  const household = await getRequestHousehold(context);

  if (household instanceof Response) {
    return household;
  }

  try {
    const items = readCreateShoppingListBatchBody(await request.json());
    const createdItems = await getWebShoppingListClient().createItemsBatch(context, {
      householdId: household.id,
      items,
    });

    return jsonResponse({ items: createdItems }, 201);
  } catch (error) {
    return shoppingListApiErrorResponse(error);
  }
}
