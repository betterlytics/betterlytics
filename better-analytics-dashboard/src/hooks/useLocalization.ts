"use client";

import { useTranslation, UseTranslationOptions } from "react-i18next";
import type { Namespace, i18n as I18nType, TOptions } from "i18next";
import { LocalizationKeys } from "@/types/i18n";

let isDebugI18n: boolean | null = null;

/**
 * Checks if the i18n debug mode is enabled via URL query parameter `?debug_18n=true`.
 * Uses a module-level cache to avoid repeated parsing.
 * 
 * @returns {boolean} `true` if debug-mode is enabled, otherwise `false`.
 */
function getIsDebugI18n(): boolean {
  if (isDebugI18n !== null) return isDebugI18n;
  if (typeof window === "undefined") return false;
  isDebugI18n = new URLSearchParams(window.location.search).get("debug_18n") === "true";
  return isDebugI18n;
}

// Restrict keys to LocalizationKeys, to get auto-completion when using `t` function
type TypedTFunction = <TKey extends LocalizationKeys>(
  key: TKey,
  options?: TOptions
) => string;

/**
 * Custom hook wrapping react-i18next's `useTranslation` to provide:
 *  - Type-safe access to translation function `t`
 *  - Access to i18n instance and readiness flag
 *  - Debug feature: if URL contains `?debug_18n=true`, returns keys instead of translated strings
 * 
 * @template Ns Namespace type or array of namespaces (default: "translation")
 * @template KPrefix Optional key prefix (default: undefined)
 * 
 * @param {Ns} [ns] Namespace(s) to load translations from
 * @param {UseTranslationOptions<KPrefix>} [options] Options passed to react-i18next's `useTranslation`
 * @returns {UseTranslationResponse<Ns, KPrefix>} Tuple with `[t, i18n, ready]` and named properties, where `t` respects debug mode
 */
export function useLocalization<
  Ns extends Namespace = 'translation',
  KPrefix extends string | undefined = undefined
>(
  ns?: Ns,
  options?: UseTranslationOptions<KPrefix>
): [TypedTFunction, I18nType, boolean] {
  const { t: baseT, i18n, ready } = useTranslation(ns, options);

  const isDebug = getIsDebugI18n();

  const t: TypedTFunction = ((key: LocalizationKeys, opts?: TOptions) => {
    if (isDebug) {
      if (Array.isArray(key)) {
        return key.join(', ');
      }
      return typeof key === 'string' ? key : '';
    }
    return baseT(key as string, opts);
  }) as TypedTFunction;

  return [t, i18n, ready];
}
