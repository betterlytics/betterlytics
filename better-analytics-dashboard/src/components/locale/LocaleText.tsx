'use client';

import React, { ElementType, ComponentPropsWithoutRef } from 'react';
import { LocalizationKeys } from '@/types/i18n';
import { useTranslation } from 'react-i18next';

type LocaleTextProps<T extends ElementType = 'span'> = {
  k: LocalizationKeys;
  as?: T;
  options?: Record<string, unknown>;
} & ComponentPropsWithoutRef<T>;

export function LocaleText<T extends ElementType = 'span'>({
  k,
  as,
  options,
  ...props
}: LocaleTextProps<T>) {
  const { t } = useTranslation();
  const TextComponent = as || 'span';
  return <TextComponent {...props}>{t(k, options)}</TextComponent>;
}
