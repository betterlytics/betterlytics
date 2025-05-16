'use client';

import React, { ElementType, ComponentPropsWithoutRef } from 'react';
import { useLocalization } from '@/hooks/useLocalization';
import { LocalizationKeys } from '@/types/i18n';

type LocalizedTextProps<T extends ElementType = 'span'> = {
  k: LocalizationKeys;
  as?: T;
  options?: Record<string, unknown>;
} & ComponentPropsWithoutRef<T>;

export function LocalizedText<T extends ElementType = 'span'>({
  k,
  as,
  options,
  ...props
}: LocalizedTextProps<T>) {
  const { l } = useLocalization();
  const TextComponent = as || 'span';
  return <TextComponent {...props}>{l(k, options)}</TextComponent>;
}
