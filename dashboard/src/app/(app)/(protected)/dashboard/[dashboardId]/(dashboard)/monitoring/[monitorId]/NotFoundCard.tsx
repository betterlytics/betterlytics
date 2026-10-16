'use client';

import { ChevronLeft, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';

type NotFoundCardProps = {
  title: string;
  description: string;
  actionLabel: string;
  href: string;
};

export function NotFoundCard({ title, description, actionLabel, href }: NotFoundCardProps) {
  return (
    <div className='container flex justify-center p-2 pt-16 sm:p-6 sm:pt-24'>
      <Card className='w-full max-w-md py-4'>
        <CardContent className='space-y-4 pt-2'>
          <div className='space-y-2'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <SearchX className='text-muted-foreground size-5 shrink-0' aria-hidden />
              <h2>{title}</h2>
            </CardTitle>
            <CardDescription className='text-sm leading-relaxed'>{description}</CardDescription>
          </div>

          <div className='flex justify-end pt-2'>
            <Button asChild>
              <FilterPreservingLink href={href}>
                <ChevronLeft aria-hidden />
                {actionLabel}
              </FilterPreservingLink>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
