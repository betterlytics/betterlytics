import type { ComponentType } from 'react';
import { Inline } from '@/components/layout';
import { Text } from '@/components/text';

type SectionHeaderProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
};

export function SectionHeader({ icon: Icon, title }: SectionHeaderProps) {
  return (
    <Inline gap='list'>
      <Icon className='text-muted-foreground h-4 w-4' />
      <Text as='h3' variant='body' className='font-semibold tracking-tight'>
        {title}
      </Text>
    </Inline>
  );
}
