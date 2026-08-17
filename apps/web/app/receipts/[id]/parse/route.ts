import { ApiRequestError } from '@sackerl/api-client';

import { getRequestAuthContext, jsonResponse } from '../../../../lib/api-auth';
import { getRequestHousehold } from '../../../../lib/items';
import { readReceiptParseJobBody, runReceiptParseJob } from '../../../../lib/receipt-parsing';
import { receiptApiErrorResponse } from '../../../../lib/receipts';

type ReceiptParseRouteContext = {
  readonly params: Promise<{
    readonly id: string;
  }>;
};

export async function POST(request: Request, context: ReceiptParseRouteContext): Promise<Response> {
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
    const result = await runReceiptParseJob(
      authContext,
      household.id,
      id,
      readReceiptParseJobBody(await readOptionalJson(request)),
    );

    return jsonResponse(result);
  } catch (error) {
    return receiptApiErrorResponse(error);
  }
}

async function readOptionalJson(request: Request): Promise<unknown> {
  const text = await request.text();

  if (!text.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiRequestError('Invalid JSON body.', 400);
  }
}
