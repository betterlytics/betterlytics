'use client';

import { useTranslation } from 'react-i18next';
import { LocalizationKeys } from '@/types/i18n';

export const useLocalization = () => {
  const { t } = useTranslation();

  const l = (key: LocalizationKeys, options?: Record<string, unknown>) => {
    return t(key, options);
  };

  return { l };
};
