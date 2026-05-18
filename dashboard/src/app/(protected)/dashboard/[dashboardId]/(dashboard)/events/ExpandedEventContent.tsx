import { SunsetIcon, TagsIcon, type LucideIcon } from 'lucide-react';
import { EventTypeRow, EventPropertyAnalytics } from '@/entities/analytics/events.entities';
import { PropertyRow } from '@/components/events/PropertyRow';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from 'next-intl';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';

interface ExpandedEventContentProps {
  event: EventTypeRow;
  expandedProperties: Set<string>;
  onToggleProperty: (propertyName: string) => void;
}

export function ExpandedEventContent({ event, expandedProperties, onToggleProperty }: ExpandedEventContentProps) {
  const t = useTranslations('components.events.expandedEventContent');
  const { input, options } = useBAQueryParams();
  const { data, isLoading } = trpc.events.eventPropertiesAnalytics.useQuery(
    {
      ...input,
      eventName: event.event_name,
    },
    options,
  );

  if (isLoading) {
    return (
      <div className='bg-muted/20 border-primary/30 border-l-2'>
        <div className='flex flex-col items-center gap-4 py-12'>
          <Spinner size='sm' />
          <p className='text-muted-foreground text-sm'>{t('loading')}</p>
        </div>
      </div>
    );
  }

  const eventProperties = data?.properties ?? [];
  const globalProperties = data?.globalProperties ?? [];
  const hasEventProperties = eventProperties.length > 0;
  const hasGlobalProperties = globalProperties.length > 0;

  if (!hasEventProperties && !hasGlobalProperties) {
    return (
      <div className='bg-muted/20 border-primary/30 border-l-2'>
        <div className='py-12 pl-8 text-center'>
          <h4 className='text-foreground mb-1 text-sm font-medium'>{t('noPropertiesTitle')}</h4>
          <p className='text-muted-foreground text-xs'>{t('noEventOrGlobalProperties')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-muted/20 border-primary/30 border-l-2 @container'>
      <div className='grid grid-cols-1 gap-x-8 gap-y-6 py-4 pr-6 pl-8 @[720px]:grid-cols-2'>
        <PropertyGroup
          label={t('eventProperties')}
          icon={SunsetIcon}
          properties={eventProperties}
          keyPrefix='event'
          expandedProperties={expandedProperties}
          onToggleProperty={onToggleProperty}
          emptyMessage={t('noProperties', { propertyName: t('eventPropertiesInline') })}
        />
        <PropertyGroup
          label={t('globalProperties')}
          icon={TagsIcon}
          properties={globalProperties}
          keyPrefix='global'
          expandedProperties={expandedProperties}
          onToggleProperty={onToggleProperty}
          emptyMessage={t('noProperties', { propertyName: t('globalPropertiesInline') })}
        />
      </div>
    </div>
  );
}

interface PropertyGroupProps {
  label: string;
  icon: LucideIcon;
  properties: EventPropertyAnalytics[];
  keyPrefix: 'event' | 'global';
  expandedProperties: Set<string>;
  onToggleProperty: (propertyName: string) => void;
  emptyMessage: string;
}

function PropertyGroup({
  label,
  icon: Icon,
  properties,
  keyPrefix,
  expandedProperties,
  onToggleProperty,
  emptyMessage,
}: PropertyGroupProps) {
  return (
    <div>
      <div className='text-muted-foreground mb-2 flex items-center gap-2 font-medium'>
        <Icon className='size-4' aria-hidden='true' />
        <span>{label}</span>
      </div>
      {properties.length === 0 ? (
        <p className='text-muted-foreground py-2 text-xs'>{emptyMessage}</p>
      ) : (
        <div className='space-y-4'>
          {properties.map((property) => {
            const namespacedKey = `${keyPrefix}:${property.propertyName}`;
            return (
              <PropertyRow
                key={namespacedKey}
                property={property}
                isExpanded={expandedProperties.has(namespacedKey)}
                onToggle={() => onToggleProperty(namespacedKey)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
