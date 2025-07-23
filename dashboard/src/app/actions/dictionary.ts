import { DEFAULT_LANGUAGE, getDictionaryOrDefault, getEffectiveLanguage } from '@/dictionaries/dictionaries';
import { getUserSettingsAction } from './userSettings';

export async function getDictionary() {
  const result = await getUserSettingsAction();

  const language = result.success ? result.data.language : DEFAULT_LANGUAGE;
  const effectiveLanguage = getEffectiveLanguage(language);

  return {
    dictionary: await getDictionaryOrDefault(language),
    language: effectiveLanguage,
  };
}
