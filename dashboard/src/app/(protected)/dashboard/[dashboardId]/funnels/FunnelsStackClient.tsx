'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FunnelBarplot from '@/components/funnels/FunnelBarplot';
import { DeleteFunnelDialog } from './DeleteFunnelDialog';
import { EditFunnelDialog } from './EditFunnelDialog';
import type { fetchFunnelsAction } from '@/app/actions/index.actions';

type FunnelsStackClientProps = {
  funnels: Awaited<ReturnType<typeof fetchFunnelsAction>>;
};

const PAGE_SIZE = 3;

export function FunnelsStackClient({ funnels }: FunnelsStackClientProps) {
  const [pageIndex, setPageIndex] = useState(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(funnels.length / PAGE_SIZE)), [funnels.length]);

  useEffect(() => {
    // Clamp page index if funnels count changes (e.g. after create/delete)
    setPageIndex((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 0 || nextPage >= totalPages || nextPage === pageIndex) return;
    setPageIndex(nextPage);
  };

  const start = pageIndex * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const currentFunnels = funnels.slice(start, end);

  return (
    <div className='space-y-6'>
      <Pagination
        pageIndex={pageIndex}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        className='justify-end'
      />

      <div className='space-y-10'>
        {currentFunnels.map((funnel, i) => (
          <div key={funnel.id + i} className='bg-card w-full gap-10 space-y-4 rounded-xl border p-2'>
            <div className='flex w-full items-center justify-between'>
              <h2 className='text-foreground px-1 text-xl font-semibold sm:px-2'>{funnel.name}</h2>
              <div className='hidden gap-2 md:flex'>
                <DeleteFunnelDialog funnel={funnel} />
                <EditFunnelDialog funnel={funnel} />
              </div>
            </div>
            <FunnelBarplot funnel={funnel} />
          </div>
        ))}
      </div>

      <Pagination pageIndex={pageIndex} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
}

type PaginationProps = {
  pageIndex: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

function Pagination({ pageIndex, totalPages, onPageChange, className }: PaginationProps) {
  const currentPage = pageIndex + 1;
  const isFirst = pageIndex === 0;
  const isLast = pageIndex === totalPages - 1;

  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <span className='text-muted-foreground text-sm'>
        Page {currentPage} of {totalPages}
      </span>
      <div className='flex items-center gap-1.5'>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 cursor-pointer'
          disabled={isFirst}
          aria-label='Previous page'
          onClick={() => onPageChange(pageIndex - 1)}
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 cursor-pointer'
          disabled={isLast}
          aria-label='Next page'
          onClick={() => onPageChange(pageIndex + 1)}
        >
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
