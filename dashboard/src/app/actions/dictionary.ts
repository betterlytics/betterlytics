import { getDictionaryOrDefault, getEffectiveLanguage } from '@/dictionaries/dictionaries';
import { getUserSettingsAction } from './userSettings';

export async function getDictionary() {
  const { language } = await getUserSettingsAction();
  const effectiveLanguage = getEffectiveLanguage(language);

  return {
    dictionary: await getDictionaryOrDefault(language),
    language: effectiveLanguage,
  };
}
