export function firstParamValue(value: string | readonly string[] | undefined): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  return value?.[0];
}

export function normalizeZoneParam(
  value: string | readonly string[] | undefined,
): string | undefined {
  const zone = firstParamValue(value)?.trim().toLowerCase();

  return zone && /^[a-z][a-z0-9-]{1,31}$/.test(zone) ? zone : undefined;
}

export function parseQuantity(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
