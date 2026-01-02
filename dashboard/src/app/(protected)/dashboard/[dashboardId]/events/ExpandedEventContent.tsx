import { EventTypeRow } from '@/entities/analytics/events.entities';
import { PropertyRow } from '@/components/events/PropertyRow';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useEventProperties } from '@/hooks/use-event-properties';
import { QueryFilter } from '@/entities/analytics/filter.entities';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from 'next-intl';
import { Text } from '@/components/text';
import { Stack } from '@/components/layout';

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
          <Text variant='description'>{t('loading')}</Text>
        </div>
      ) : propertiesData?.properties.length ? (
        <Stack gap='content-lg' className='py-4 pr-6 pl-8'>
          {propertiesData.properties.map((property) => (
            <PropertyRow
              key={property.propertyName}
              property={property}
              isExpanded={expandedProperties.has(property.propertyName)}
              onToggle={() => onToggleProperty(property.propertyName)}
            />
          ))}
        </Stack>
      ) : (
        <div className='py-12 pl-8 text-center'>
          <h4 className='text-foreground mb-1 text-sm font-medium'>{t('noProperties')}</h4>
          <Text variant='caption'>{t('noPropertiesDesc')}</Text>
        </div>
      )}
    </div>
  );
}
