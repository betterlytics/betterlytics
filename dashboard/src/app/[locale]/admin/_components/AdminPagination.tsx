'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

function PageButton({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  if (disabled) {
    return (
      <Button variant='outline' size='sm' disabled>
        {children}
      </Button>
    );
  }
  return (
    <Button variant='outline' size='sm' asChild>
      <Link href={href}>{children}</Link>
    </Button>
  );
}

export function AdminPagination({ page, totalPages, total, pageSize }: AdminPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function buildPageHref(targetPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(targetPage));
    return `${pathname}?${params.toString()}`;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className='mt-4 flex items-center justify-between'>
      <p className='text-muted-foreground text-sm'>
        {from}-{to} of {total}
      </p>
      <div className='flex items-center gap-2'>
        <PageButton href={buildPageHref(page - 1)} disabled={page <= 1}>
          <ChevronLeft className='h-4 w-4' />
          Previous
        </PageButton>
        <span className='text-muted-foreground text-sm'>
          {page} / {totalPages}
        </span>
        <PageButton href={buildPageHref(page + 1)} disabled={page >= totalPages}>
          Next
          <ChevronRight className='h-4 w-4' />
        </PageButton>
      </div>
    </div>
  );
}
