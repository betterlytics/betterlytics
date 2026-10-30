import { alpha2ToAlpha3Code } from '@/utils/countryCodes';

export type Drilldown = { countryCode?: string; regionCode?: string };

export function parseCountryParam(value: string | null | undefined): string | undefined {
  return value && /^[A-Z]{2}$/.test(value) && alpha2ToAlpha3Code(value) ? value : undefined;
}

export function parseRegionParam(
  value: string | null | undefined,
  countryCode: string | undefined,
): string | undefined {
  if (!value || !countryCode) return undefined;
  const prefix = `${countryCode}-`;
  return value.startsWith(prefix) && /^[A-Z0-9~]{1,16}$/.test(value.slice(prefix.length)) ? value : undefined;
}

export function drilldownFromParams(country: string | undefined, region: string | undefined): Drilldown {
  const countryCode = parseCountryParam(country);
  return { countryCode, regionCode: parseRegionParam(region, countryCode) };
}

export const sameDrilldown = (a: Drilldown, b: Drilldown) =>
  a.countryCode === b.countryCode && a.regionCode === b.regionCode;

export const toggleCountry = (prev: Drilldown, code: string): Drilldown =>
  prev.countryCode === code ? {} : { countryCode: code };

export const toggleRegion = (prev: Drilldown, code: string): Drilldown =>
  prev.countryCode
    ? { countryCode: prev.countryCode, regionCode: prev.regionCode === code ? undefined : code }
    : prev;

export const clearRegion = (prev: Drilldown): Drilldown =>
  prev.regionCode ? { countryCode: prev.countryCode } : prev;

// tRPC query keys carry the input as [path, { input, type }]
export function queriedCountry(queryKey: readonly unknown[] | undefined): string | undefined {
  const countryCode = (queryKey?.[1] as { input?: { countryCode?: unknown } } | undefined)?.input?.countryCode;
  return typeof countryCode === 'string' ? countryCode : undefined;
}
