'use client';

import { memo, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslations } from 'next-intl';

const PAGE_SIZE_OPTIONS = [6, 10, 25, 50] as const;

export type CompactPaginationControlsProps = {
  pageIndex: number;
  totalPages: number;
  onPageChange: (pageIndex: number) => void;
};

export const CompactPaginationControls = memo(
  ({ pageIndex, totalPages, onPageChange }: CompactPaginationControlsProps) => {
    const t = useTranslations('components.campaign.pagination');
    const currentPage = pageIndex + 1;
    const isFirstPage = pageIndex === 0;
    const isLastPage = pageIndex === totalPages - 1;

    return (
      <div className='flex items-center justify-end gap-2 py-1'>
        <span className='text-muted-foreground text-xs'>{t('pageOf', { currentPage, totalPages })}</span>
        <div className='flex items-center'>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            disabled={isFirstPage}
            onClick={() => onPageChange(pageIndex - 1)}
            aria-label='Previous page'
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            disabled={isLastPage}
            onClick={() => onPageChange(pageIndex + 1)}
            aria-label='Next page'
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
    );
  },
);

CompactPaginationControls.displayName = 'CompactPaginationControls';

export type PaginationControlsProps = {
  pageIndex: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (size: number) => void;
};

export const PaginationControls = memo(
  ({ pageIndex, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange }: PaginationControlsProps) => {
    const t = useTranslations('components.campaign.pagination');
    const currentPage = pageIndex + 1;
    const isFirstPage = pageIndex === 0;
    const isLastPage = pageIndex === totalPages - 1;
    const startItem = pageIndex * pageSize + 1;
    const endItem = Math.min(startItem + pageSize - 1, totalItems);

    const pages = useMemo(() => getPages(currentPage, totalPages), [currentPage, totalPages]);

    return (
      <div className='flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex w-full items-center justify-between gap-3 sm:w-auto'>
          <p className='text-muted-foreground/80 text-sm'>{t('showing', { startItem, endItem, totalItems })}</p>
          <div className='flex items-center gap-2'>
            <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
              <SelectTrigger size='sm' className='w-[70px] cursor-pointer'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)} className='cursor-pointer'>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className='text-muted-foreground/80 text-sm'>{t('perPage')}</span>
          </div>
        </div>

        <nav
          aria-label='Pagination'
          className='border-border/40 flex items-center justify-end gap-0.5 sm:border-l sm:pl-4'
        >
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 cursor-pointer'
            disabled={isFirstPage}
            onClick={() => onPageChange(0)}
            aria-label='First page'
          >
            <ChevronsLeft className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 cursor-pointer'
            disabled={isFirstPage}
            onClick={() => onPageChange(pageIndex - 1)}
            aria-label='Previous page'
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>

          {totalPages > 1 && (
            <div className='flex items-center px-1'>
              {pages.map((page) =>
                typeof page === 'string' ? (
                  <span key={page} className='text-muted-foreground/50 px-1.5 text-sm select-none'>
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    type='button'
                    onClick={() => onPageChange(page - 1)}
                    aria-current={page === currentPage ? 'page' : undefined}
                    className={`min-w-[1.75rem] cursor-pointer rounded-md px-2 py-1 text-sm font-medium tabular-nums transition-colors ${
                      page === currentPage
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    {page.toLocaleString()}
                  </button>
                ),
              )}
            </div>
          )}

          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 cursor-pointer'
            disabled={isLastPage}
            onClick={() => onPageChange(pageIndex + 1)}
            aria-label='Next page'
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 cursor-pointer'
            disabled={isLastPage}
            onClick={() => onPageChange(totalPages - 1)}
            aria-label='Last page'
          >
            <ChevronsRight className='h-4 w-4' />
          </Button>
        </nav>
      </div>
    );
  },
);

PaginationControls.displayName = 'PaginationControls';

function getPages(currentPage: number, totalPages: number): Array<number | 'ellipsis-start' | 'ellipsis-end'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-end', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis-start', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'ellipsis-start', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-end', totalPages];
}
