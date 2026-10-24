'use client';
import { useRef, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { XIcon } from 'lucide-react';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { useQueryFiltersEditor, type QueryFilterPart } from '@/contexts/QueryFiltersEditorProvider';
import { useFilterColumnStatus, useFilterColumnDisabledMessage } from '@/hooks/use-is-filter-column-allowed';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui-extended/tooltip';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';
import { FilterColumnLabel } from '@/components/filters/FilterColumnLabel';
import { FilterValueLabel } from '@/components/filters/FilterValueLabel';
import { FilterValueList } from '@/components/filters/FilterDescription';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { getFilterStrategy } from '@/entities/analytics/filterColumnStrategy';
import { cn } from '@/lib/utils';

const MAX_TOOLTIP_VALUES = 20;

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
            <FilterPillSection className='shrink-0' onClick={openPart('column')}>
              <FilterColumnLabel column={filter.column} className='[&_svg]:size-3' />
            </FilterPillSection>
            <FilterPillSection className='text-muted-foreground/80 shrink-0' onClick={openPart('operator')}>
              {operator}
            </FilterPillSection>
            <FilterPillSection className='min-w-0 gap-1' onClick={openPart('values')}>
              <FilterValueList filter={filter} />
            </FilterPillSection>
          </span>
        );

        return (
          <Badge
            key={filter.id}
            variant='outline'
            className={cn(
              'border-input bg-muted/50 dark:bg-secondary divide-input max-w-full items-stretch gap-0 divide-x p-0 font-sans',
              !initialIds.has(filter.id) && 'animate-filter-pill-added',
              status.disabled && 'opacity-50',
            )}
          >
            {status.disabled ? (
              <DisabledTooltip disabled message={disabledMessage} wrapperClassName='inline-flex min-w-0'>
                {() => sections}
              </DisabledTooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>{sections}</TooltipTrigger>
                <TooltipContent side='bottom' className='max-w-xs'>
                  <FilterValuesTooltip filter={filter} operator={operator} />
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
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
        );
      })}
    </div>
  );
}

type FilterPillSectionProps = {
  className?: string;
  onClick: () => void;
  children: ReactNode;
};

function FilterPillSection({ className, onClick, children }: FilterPillSectionProps) {
  return (
    <button
      type='button'
      aria-haspopup='dialog'
      onClick={onClick}
      className={cn(
        'hover:bg-muted dark:hover:bg-input/50 inline-flex h-8 cursor-pointer items-center px-1.5 outline-none',
        'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-inset',
        className,
      )}
    >
      {children}
    </button>
  );
}

function FilterValuesTooltip({ filter, operator }: { filter: QueryFilter; operator: string }) {
  const t = useTranslations('components.filters');
  const locale = useLocale();
  const strategy = getFilterStrategy(filter.column);
  const visibleValues = filter.values.slice(0, MAX_TOOLTIP_VALUES);
  const hiddenCount = filter.values.length - visibleValues.length;

  return (
    <div className='flex flex-col gap-1.5 text-xs'>
      <div className='flex items-center gap-1 font-medium'>
        <FilterColumnLabel column={filter.column} className='min-w-0 [&_svg]:size-3' />
        <span className='text-muted-foreground shrink-0'>{operator}</span>
      </div>
      <ul className='flex flex-col gap-0.5'>
        {visibleValues.map((value) => (
          <li key={value}>
            <FilterValueLabel column={filter.column} value={value} className='flex'>
              <span className='min-w-0 wrap-anywhere'>{strategy.formatValue(value, locale)}</span>
            </FilterValueLabel>
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <span className='text-muted-foreground'>{t('pillMoreValues', { count: hiddenCount })}</span>
      )}
    </div>
  );
}
