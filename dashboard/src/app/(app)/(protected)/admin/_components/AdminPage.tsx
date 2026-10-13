import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type AdminPageProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  width?: 'default' | 'wide';
  children: ReactNode;
};

export function AdminPage({ title, description, actions, back, width = 'default', children }: AdminPageProps) {
  return (
    <div className={cn('w-full p-6', width === 'wide' ? 'max-w-5xl' : 'max-w-2xl')}>
      {back && (
        <Link
          href={back.href}
          className='text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm'
        >
          <ChevronLeft className='h-4 w-4' />
          {back.label}
        </Link>
      )}
      <div className='mb-8 flex items-start justify-between gap-4'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-semibold'>{title}</h1>
          {description && <p className='text-muted-foreground mt-1 text-sm'>{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
