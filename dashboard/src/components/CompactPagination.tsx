'use client';

import { memo, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type CompactPaginationProps = {
  pageIndex: number;
  totalPages: number;
  onPageChange: (pageIndex: number) => void;
  label?: ReactNode;
};

export const CompactPagination = memo(
  ({ pageIndex, totalPages, onPageChange, label }: CompactPaginationProps) => {
    const currentPage = pageIndex + 1;

    return (
      <div className='flex items-center justify-between py-1'>
        {label && <span className='text-muted-foreground text-sm'>{label}</span>}
        <div className={`flex items-center gap-2 ${label ? '' : 'ml-auto'}`}>
          <span className='text-muted-foreground text-xs'>
            Page {currentPage} of {totalPages}
          </span>
          <div className='flex items-center'>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7 cursor-pointer'
              disabled={pageIndex === 0}
              onClick={() => onPageChange(pageIndex - 1)}
              aria-label='Previous page'
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7 cursor-pointer'
              disabled={pageIndex >= totalPages - 1}
              onClick={() => onPageChange(pageIndex + 1)}
              aria-label='Next page'
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    );
  },
);

CompactPagination.displayName = 'CompactPagination';
