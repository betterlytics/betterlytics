import { ChevronDown, ChevronRight } from 'lucide-react';
import { EventPropertyAnalytics } from '@/entities/analytics/events.entities';
import { PropertyValueBar } from '@/components/PropertyValueBar';
import { cn } from '@/lib/utils';

interface PropertyRowProps {
  property: EventPropertyAnalytics;
  isExpanded: boolean;
  onToggle: () => void;
}

export function PropertyRow({ property, isExpanded, onToggle }: PropertyRowProps) {
  const hasValues = property.topValues.length > 0;

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
            {property.topValues.map((value, index) => (
              <PropertyValueBar key={index} value={value} />
            ))}

            {property.uniqueValueCount > property.topValues.length && (
              <div className='text-muted-foreground flex items-center gap-2 px-3 py-1.5 text-xs'>
                <span>+{property.uniqueValueCount - property.topValues.length} more</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
