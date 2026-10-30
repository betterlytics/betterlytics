'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { capitalizeFirstLetter } from '@/utils/formatters';

const REFERRER_CATEGORIES = ['search', 'social', 'ai', 'direct', 'email', 'other'] as const;
type ReferrerCategory = (typeof REFERRER_CATEGORIES)[number];

function isReferrerCategory(value: string): value is ReferrerCategory {
  return (REFERRER_CATEGORIES as readonly string[]).includes(value);
}

export function useReferrerCategoryLabel() {
  const t = useTranslations('components.referrers.categories');

  return useCallback(
    (category: string) => {
      const key = category.toLowerCase();
      return isReferrerCategory(key) ? t(key) : capitalizeFirstLetter(category);
    },
    [t],
  );
}
