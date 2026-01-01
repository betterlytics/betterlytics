'use client';

import { type ReactNode } from 'react';
import { Inline } from '@/components/layout';
import { Label } from '@/components/text';

type CardHeaderProps = {
  title: string;
  badge?: ReactNode;
  actions?: ReactNode;
};

export function CardHeader({ title, badge, actions }: CardHeaderProps) {
  return (
    <Inline gap='list' justify='between'>
      <Label as='p'>{title}</Label>
      <Inline gap='list'>
        {actions}
        {badge}
      </Inline>
    </Inline>
  );
}
