import type { ComponentType } from 'react';
import { Inline } from '@/components/layout';

type SectionHeaderProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
};

export function SectionHeader({ icon: Icon, title }: SectionHeaderProps) {
  return (
    <Inline gap='list'>
      <Icon className='text-muted-foreground h-4 w-4' />
      <h3 className='text-sm font-semibold tracking-tight'>{title}</h3>
    </Inline>
  );
}
