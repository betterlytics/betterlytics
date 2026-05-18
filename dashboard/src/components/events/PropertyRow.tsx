import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EventPropertyAnalytics } from '@/entities/analytics/events.entities';
import { PropertyValueBar } from '@/components/PropertyValueBar';
import { cn } from '@/lib/utils';

interface PropertyRowProps {
  property: EventPropertyAnalytics;
  isExpanded: boolean;
  onToggle: () => void;
}

export function PropertyRow({ property, isExpanded, onToggle }: PropertyRowProps) {
  const t = useTranslations('components.events.expandedEventContent');
  const hasValues = property.topValues.length > 0;
  const hiddenValueCount = property.uniqueValueCount - property.topValues.length;

  return (
    <div className='relative space-y-2.5'>
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

        <div className='flex min-w-0 flex-1 items-center justify-start gap-3'>
          <span className='text-foreground text-sm font-medium'>{property.propertyName}</span>
          {property.uniqueValueCount > 0 && (
            <Badge variant='outline'>{t('valueCount', { count: property.uniqueValueCount })}</Badge>
          )}
        </div>
      </div>

      {isExpanded && hasValues && (
          <ScrollArea className='relative [&_[data-slot=scroll-area-viewport]]:max-h-48 [&_[data-slot=scroll-area-scrollbar]]:translate-x-1'>
            <div className='bg-border/80 absolute top-0 bottom-0 left-[1.15rem] z-10 w-px' />
            <div className='ml-7 space-y-2 pr-2'>
              {property.topValues.map((value, index) => (
                <PropertyValueBar key={index} value={value} />
              ))}
            </div>
            {hiddenValueCount > 0 && (
              <div className='text-muted-foreground ml-7 flex items-center gap-2 py-3 px-1.5 text-xs'>
                <span>{t('moreValues', { count: hiddenValueCount })}</span>
              </div>
            )}
          </ScrollArea>
      )}
    </div>
  );
}
