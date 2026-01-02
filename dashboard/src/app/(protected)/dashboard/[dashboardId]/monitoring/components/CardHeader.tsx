'use client';

import { type ReactNode } from 'react';
import { Inline } from '@/components/layout';
import { Text } from '@/components/text';

type CardHeaderProps = {
  title: string;
  badge?: ReactNode;
  actions?: ReactNode;
};

export function CardHeader({ title, badge, actions }: CardHeaderProps) {
  return (
    <Inline gap='content-md' justify='between'>
      <Text variant='label'>{title}</Text>
      <Inline gap='content-md'>
        {actions}
        {badge}
      </Inline>
    </Inline>
  );
}
