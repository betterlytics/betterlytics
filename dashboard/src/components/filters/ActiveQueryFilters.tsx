'use client';
import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { XIcon } from 'lucide-react';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { useQueryFiltersEditor, type QueryFilterPart } from '@/contexts/QueryFiltersEditorProvider';
import { useFilterColumnStatus, useFilterColumnDisabledMessage } from '@/hooks/use-is-filter-column-allowed';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui-extended/tooltip';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';
import { FilterColumnLabel } from '@/components/filters/FilterColumnLabel';
import { FilterPillSection } from '@/components/filters/FilterPillSection';
import { FilterPillTooltip } from '@/components/filters/FilterPillTooltip';
import { FilterPillValues } from '@/components/filters/FilterPillValues';
import { cn } from '@/lib/utils';

// One opaque pill colour, so the values' "+N more" label and fade can cover text in exactly that colour.
const pillBackground = cn(
  'bg-(--pill-bg) [--pill-bg:color-mix(in_oklab,var(--muted)_50%,var(--background))] [--pill-bg-hover:var(--muted)]',
  'dark:[--pill-bg:var(--secondary)] dark:[--pill-bg-hover:color-mix(in_oklab,var(--input)_50%,var(--secondary))]',
);

export function ActiveQueryFilters() {
  const { queryFilters, removeQueryFilter } = useQueryFiltersContext();
  const { openEditor } = useQueryFiltersEditor();
  const t = useTranslations('components.filters');
  const getColumnStatus = useFilterColumnStatus();
  const getDisabledMessage = useFilterColumnDisabledMessage();

  // Pills present on first render (e.g. from the URL) must not replay the entrance pulse.
  const initialIdsRef = useRef<Set<string> | null>(null);
  const initialIds = (initialIdsRef.current ??= new Set(queryFilters.map((filter) => filter.id)));

  if (queryFilters.length === 0) {
    return null;
  }
  return (
    <div className='flex flex-wrap gap-1 sm:justify-end'>
      {queryFilters.map((filter) => {
        const status = getColumnStatus(filter.column);
        const disabledMessage = getDisabledMessage(status);
        const operator = filter.operator === '=' ? t('is') : t('isNot');
        const openPart = (part: QueryFilterPart) => () => openEditor({ filterId: filter.id, part });

        const sections = (
          <span className='divide-input inline-flex min-w-0 items-stretch divide-x'>
            <FilterPillSection className='max-w-48 shrink-0' data-pill-part='column' onClick={openPart('column')}>
              <FilterColumnLabel column={filter.column} className='min-w-0 [&_svg]:size-3' />
            </FilterPillSection>
            <FilterPillSection
              className='text-muted-foreground/80 shrink-0'
              data-pill-part='operator'
              onClick={openPart('operator')}
            >
              {operator}
            </FilterPillSection>
            <FilterPillValues filter={filter} onOpen={openEditor} />
          </span>
        );

        return (
          <FilterPillTooltip key={filter.id} filter={filter} disabled={status.disabled}>
            <Badge
              data-filter-pill={filter.id}
              variant='outline'
              className={cn(
                'border-input divide-input max-w-max min-w-0 shrink grow basis-80 items-stretch gap-0 divide-x p-0 font-sans',
                pillBackground,
                !initialIds.has(filter.id) && 'animate-filter-pill-added',
                status.disabled && 'opacity-50',
              )}
            >
              {status.disabled ? (
                <DisabledTooltip disabled message={disabledMessage} wrapperClassName='inline-flex min-w-0'>
                  {() => sections}
                </DisabledTooltip>
              ) : (
                sections
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    data-pill-remove=''
                    aria-label={t('removeFilter')}
                    className='text-muted-foreground/80 hover:text-foreground focus-visible:text-foreground size-8 shrink-0 cursor-pointer rounded-none focus-visible:ring-inset'
                    onClick={() => removeQueryFilter(filter.id)}
                  >
                    <XIcon className='size-3.5' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('removeFilter')}</TooltipContent>
              </Tooltip>
            </Badge>
          </FilterPillTooltip>
        );
      })}
    </div>
  );
}
