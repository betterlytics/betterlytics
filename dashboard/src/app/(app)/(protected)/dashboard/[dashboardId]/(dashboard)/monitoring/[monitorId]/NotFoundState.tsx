'use client';

import { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';

type NotFoundStateProps = {
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  backdrop?: ReactNode;
};

export function NotFoundState({ title, description, actionLabel, href, backdrop }: NotFoundStateProps) {
  return (
    <div className='container p-2 pt-4 sm:p-6'>
      <div className='relative min-h-[60vh]'>
        {backdrop && (
          <>
            <div className='opacity-50' aria-hidden>
              {backdrop}
            </div>
            <div className='from-background via-background/60 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent' />
            <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--background)_25%,transparent_65%)]' />
          </>
        )}

        <div className='absolute inset-0 flex items-center justify-center px-4'>
          <div className='space-y-5 text-center'>
            <div className='space-y-3'>
              <h2 className='text-2xl font-semibold tracking-tight'>{title}</h2>
              <p className='text-muted-foreground mx-auto max-w-md text-sm leading-relaxed'>{description}</p>
            </div>
            <Button asChild>
              <FilterPreservingLink href={href}>
                <ArrowLeft aria-hidden />
                {actionLabel}
              </FilterPreservingLink>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
