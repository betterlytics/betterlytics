export const SUBDIVISION_COUNTRY_PARAM = 'country';

export function parseCountryParam(value: string | null | undefined): string | undefined {
  return value && /^[A-Z]{2}$/.test(value) ? value : undefined;
}
