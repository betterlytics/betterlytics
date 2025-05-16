import { en, da } from "@/locale/dictionary";

export const dictionaries = {
  en,
  da,
};

export type SupportedLocale = keyof typeof dictionaries;

export function getTranslation(locale: SupportedLocale, key: string): string {
  const parts = key.split(".");
  let result: any = dictionaries[locale];

  for (const part of parts) {
    if (!result || typeof result !== "object") return key;
    result = result[part];
  }

  return typeof result === "string" ? result : key;
}
