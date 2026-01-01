import type { ReactNode } from 'react';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';

type TableGoToFooterLinkProps = {
  href: string;
  label: ReactNode;
};

export function TableGoToFooterLink({ href, label }: TableGoToFooterLinkProps) {
  return (
    <FilterPreservingLink
      href={href}
      className='text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline'
    >
      <span>{label}</span>
      <ArrowRight className='h-3.5 w-3.5' />
    </FilterPreservingLink>
  );
}
