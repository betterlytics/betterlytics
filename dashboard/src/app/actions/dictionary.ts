import { DEFAULT_LANGUAGE, getDictionaryOrDefault, getEffectiveLanguage } from '@/dictionaries/dictionaries';
import { getUserSettingsAction } from './userSettings';

export async function getDictionary() {
  const result = await getUserSettingsAction();

  let language = DEFAULT_LANGUAGE;

  if (result.success) {
    language = result.data.language;
  }

  const effectiveLanguage = getEffectiveLanguage(language);

  return {
    dictionary: await getDictionaryOrDefault(language),
    language: effectiveLanguage,
  };
}
