import { useState } from 'react';
import { EventTypeRow } from '@/entities/analytics/events.entities';
import { PropertyRow } from '@/components/events/PropertyRow';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from 'next-intl';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';

const MAX_VISIBLE_PROPERTIES = 10;

interface ExpandedEventContentProps {
  event: EventTypeRow;
  expandedProperties: Set<string>;
  onToggleProperty: (propertyName: string) => void;
}

export function ExpandedEventContent({ event, expandedProperties, onToggleProperty }: ExpandedEventContentProps) {
  const t = useTranslations('components.events.expandedEventContent');
  const { input, options } = useBAQueryParams();
  const { data: propertiesData, isLoading: propertiesLoading } = trpc.events.eventPropertiesAnalytics.useQuery(
    {
      ...input,
      eventName: event.event_name,
    },
    options,
  );

  const [showAllProperties, setShowAllProperties] = useState(false);

  const properties = propertiesData?.properties ?? [];
  const visibleProperties = showAllProperties ? properties : properties.slice(0, MAX_VISIBLE_PROPERTIES);

  return (
    <div className='bg-muted/20 border-primary/30 border-l-2'>
      {propertiesLoading ? (
        <div className='flex flex-col items-center gap-4 py-12'>
          <div className='relative'>
            <Spinner size='sm' />
          </div>
          <p className='text-muted-foreground text-sm'>{t('loading')}</p>
        </div>
      ) : properties.length ? (
        <div className='py-4 pr-6 pl-8'>
          <div className='space-y-4'>
            {visibleProperties.map((property) => (
              <PropertyRow
                key={property.propertyName}
                eventName={event.event_name}
                property={property}
                isExpanded={expandedProperties.has(property.propertyName)}
                onToggle={() => onToggleProperty(property.propertyName)}
              />
            ))}
          </div>

          {properties.length > MAX_VISIBLE_PROPERTIES && (
            <button
              type='button'
              className='text-muted-foreground hover:text-foreground mt-3 cursor-pointer px-3 py-1.5 text-xs transition-colors hover:underline'
              onClick={() => setShowAllProperties((prev) => !prev)}
            >
              {showAllProperties ? t('showLess') : t('showAllProperties', { count: properties.length })}
            </button>
          )}
        </div>
      ) : (
        <div className='py-12 pl-8 text-center'>
          <h4 className='text-foreground mb-1 text-sm font-medium'>{t('noProperties')}</h4>
          <p className='text-muted-foreground text-xs'>{t('noPropertiesDesc')}</p>
        </div>
      )}
    </div>
  );
}
