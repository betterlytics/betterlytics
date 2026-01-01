import type { ReactNode } from 'react';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';
import { Text } from '@/components/text';

type TableGoToFooterLinkProps = {
  href: string;
  label: ReactNode;
};

export function TableGoToFooterLink({ href, label }: TableGoToFooterLinkProps) {
  return (
    <FilterPreservingLink href={href} className='inline-flex items-center gap-1 hover:underline'>
      <Text variant='caption'>{label}</Text>
      <ArrowRight className='h-3.5 w-3.5' />
    </FilterPreservingLink>
  );
}
