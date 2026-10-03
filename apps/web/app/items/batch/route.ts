import { getRequestAuthContext, jsonResponse } from '../../../lib/api-auth';
import { readCreateItemBatchBody } from '../../../lib/item-payload';
import { getRequestHousehold, getWebItemsClient, itemApiErrorResponse } from '../../../lib/items';

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
    const items = await getWebItemsClient().createItemsBatch(context, {
      householdId: household.id,
      items: readCreateItemBatchBody(await request.json()),
    });

    return jsonResponse({ items }, 201);
  } catch (error) {
    return itemApiErrorResponse(error);
  }
}
