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
 * A typed wrapper around `useTranslation` from react-i18next.
 *
 * Features:
 * - Strongly typed translation function `t`
 * - Access to `i18n` instance and `ready` status
 * - Debug mode: when `?debug_18n=true` is in the URL, `t` returns keys instead of translations
 *
 * @template Ns Translation namespace(s), default: "translation"
 * @template KPrefix Key prefix for type-safe keys, optional
 * @param ns - Namespace(s) to load
 * @param options - Options passed to `useTranslation`
 * @returns Tuple `[t, i18n, ready]` where `t` respects debug mode
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
