'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EventPropertyAnalytics } from '@/entities/analytics/events.entities';
import { PropertyValueBar } from '@/components/PropertyValueBar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { cn } from '@/lib/utils';

interface PropertyRowProps {
  eventName: string;
  property: EventPropertyAnalytics;
  isExpanded: boolean;
  onToggle: () => void;
}

export function PropertyRow({ eventName, property, isExpanded, onToggle }: PropertyRowProps) {
  const t = useTranslations('components.events.expandedEventContent');
  const hasValues = property.topValues.length > 0;
  const hiddenValueCount = property.uniqueValueCount - property.topValues.length;

  const [showAll, setShowAll] = useState(false);
  const { input, options } = useBAQueryParams();
  const valuesQuery = trpc.events.eventPropertyValues.useQuery(
    { ...input, eventName, propertyName: property.propertyName },
    { ...options, enabled: showAll },
  );

  const allValues = showAll ? valuesQuery.data : undefined;

  return (
    <div className='relative space-y-3'>
      <div
        className={cn(
          'hover:ring-border/60 flex cursor-pointer items-center gap-3 rounded px-3 py-2 transition-colors hover:ring-1',
          isExpanded ? 'bg-accent/40 hover:bg-accent/60' : 'hover:bg-accent/40 dark:hover:bg-accent/60',
        )}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <div className='flex h-4 w-4 items-center justify-center'>
          {hasValues ? (
            isExpanded ? (
              <ChevronDown className='text-muted-foreground h-3.5 w-3.5 transition-transform duration-200' />
            ) : (
              <ChevronRight className='text-muted-foreground h-3.5 w-3.5 transition-transform duration-200' />
            )
          ) : (
            <div className='bg-muted-foreground/50 h-1.5 w-1.5 rounded-full' />
          )}
        </div>

        <div className='flex min-w-0 flex-1 items-center justify-between'>
          <span className='text-foreground text-sm font-medium'>{property.propertyName}</span>
        </div>
      </div>

      {isExpanded && hasValues && (
        <>
          {/* Connecting border */}
          <div className='bg-border/80 absolute top-10 bottom-0 left-[1.15rem] w-px' />

          <div className='ml-7 space-y-2'>
            {allValues ? (
              // 22rem = the height of the top-10 list (10 x h-7 bars + 9 x space-y-2 gaps),
              // so swapping in the full list never changes the row's height.
              <ScrollArea className='pr-2 [&_[data-slot=scroll-area-viewport]]:max-h-[22rem]'>
                <div className='space-y-2'>
                  {allValues.values.map((value, index) => (
                    <PropertyValueBar key={index} value={value} />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              property.topValues.map((value, index) => <PropertyValueBar key={index} value={value} />)
            )}

            {allValues ? (
              <div className='flex items-center gap-3 px-3 py-1.5 text-xs'>
                {allValues.uniqueValueCount > allValues.values.length && (
                  <span className='text-muted-foreground'>
                    {t('valuesCapped', { shown: allValues.values.length, total: allValues.uniqueValueCount })}
                  </span>
                )}
                <button
                  type='button'
                  className='text-muted-foreground hover:text-foreground cursor-pointer transition-colors hover:underline'
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAll(false);
                  }}
                >
                  {t('showLess')}
                </button>
              </div>
            ) : (
              hiddenValueCount > 0 && (
                <button
                  type='button'
                  disabled={valuesQuery.isFetching}
                  className='text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:underline disabled:cursor-default disabled:hover:no-underline'
                  onClick={(e) => {
                    e.stopPropagation();
                    // A previous attempt may have errored with the query left enabled; retry explicitly.
                    if (showAll) {
                      valuesQuery.refetch();
                    } else {
                      setShowAll(true);
                    }
                  }}
                >
                  {valuesQuery.isFetching && <Spinner size='sm' />}
                  <span>{t('showAllValues', { count: property.uniqueValueCount })}</span>
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
