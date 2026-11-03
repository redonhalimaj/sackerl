import {
  ReceiptPlacementApiError,
  type FinalizeReceiptPlacementInput,
  type FinalizeReceiptPlacementResult,
} from '@sackerl/api-client';

/**
 * SCKRL-305 dev-only fault hook for the simdrive `receipt-placement-unknown-retry` flow.
 *
 * Guard: active only when `__DEV__` is true (stripped/false in release bundles) AND
 * `EXPO_PUBLIC_APP_ENV === 'dev'` AND `EXPO_PUBLIC_E2E_PLACEMENT_FAULT === 'drop-first-response'`.
 * In any other build it is inert and returns the real result unchanged.
 *
 * When active, the first finalize per idempotency key is sent to the server for real (so it
 * commits), then its response is discarded and reported as outcome-unknown. The retry with the
 * same key must come back `replayed`, proving no duplicate stock.
 */
export function placementFaultInjectionEnabled(): boolean {
  return (
    typeof __DEV__ !== 'undefined' &&
    __DEV__ === true &&
    process.env.EXPO_PUBLIC_APP_ENV === 'dev' &&
    process.env.EXPO_PUBLIC_E2E_PLACEMENT_FAULT === 'drop-first-response'
  );
}

const droppedKeys = new Set<string>();

export async function finalizeWithFaultInjection(
  finalize: (input: FinalizeReceiptPlacementInput) => Promise<FinalizeReceiptPlacementResult>,
  input: FinalizeReceiptPlacementInput,
): Promise<FinalizeReceiptPlacementResult> {
  const result = await finalize(input);
  if (placementFaultInjectionEnabled() && !droppedKeys.has(input.idempotencyKey)) {
    droppedKeys.add(input.idempotencyKey);
    throw new ReceiptPlacementApiError('Injected dropped placement response (dev only).', 0, {
      outcomeUnknown: true,
    });
  }
  return result;
}
