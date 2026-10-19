import { alpha2ToAlpha3Code } from '@/utils/countryCodes';

export function parseCountryParam(value: string | null | undefined): string | undefined {
  return value && /^[A-Z]{2}$/.test(value) && alpha2ToAlpha3Code(value) ? value : undefined;
}
