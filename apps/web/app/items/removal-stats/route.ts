import { getRequestAuthContext, jsonResponse } from '../../../lib/api-auth';
import { getRequestHousehold, getWebItemsClient, itemApiErrorResponse } from '../../../lib/items';

export async function GET(request: Request): Promise<Response> {
  const context = await getRequestAuthContext(request);

  if (context instanceof Response) {
    return context;
  }

  const household = await getRequestHousehold(context);

  if (household instanceof Response) {
    return household;
  }

  try {
    const month = new URL(request.url).searchParams.get('month') || undefined;
    const stats = await getWebItemsClient().getRemovalStats(context, {
      householdId: household.id,
      ...(month ? { month } : {}),
    });

    return jsonResponse({ stats });
  } catch (error) {
    return itemApiErrorResponse(error);
  }
}
