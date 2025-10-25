import { EventTypeRow } from '@/entities/events';
import { PropertyRow } from '@/components/events/PropertyRow';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useEventProperties } from '@/hooks/use-event-properties';
import { QueryFilter } from '@/entities/filter';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from 'next-intl';

interface ExpandedEventContentProps {
  event: EventTypeRow;
  expandedProperties: Set<string>;
  onToggleProperty: (propertyName: string) => void;
  startDate: Date;
  endDate: Date;
  queryFilters: QueryFilter[];
}

export function ExpandedEventContent({
  event,
  expandedProperties,
  onToggleProperty,
  startDate,
  endDate,
  queryFilters,
}: ExpandedEventContentProps) {
  const t = useTranslations('components.events.expandedEventContent');
  const dashboardId = useDashboardId();
  const { data: propertiesData, isLoading: propertiesLoading } = useEventProperties(
    dashboardId,
    event.event_name,
    startDate,
    endDate,
    queryFilters,
  );

  return (
    <div className='bg-muted/20 border-primary/30 border-l-2'>
      {propertiesLoading ? (
        <div className='flex flex-col items-center gap-4 py-12'>
          <div className='relative'>
            <Spinner size='sm' />
          </div>
          <p className='text-muted-foreground text-sm'>{t('loading')}</p>
        </div>
      ) : propertiesData?.properties.length ? (
        <div className='py-4 pr-6 pl-8'>
          <div className='space-y-4'>
            {propertiesData.properties.map((property) => (
              <PropertyRow
                key={property.propertyName}
                property={property}
                isExpanded={expandedProperties.has(property.propertyName)}
                onToggle={() => onToggleProperty(property.propertyName)}
              />
            ))}
          </div>
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
