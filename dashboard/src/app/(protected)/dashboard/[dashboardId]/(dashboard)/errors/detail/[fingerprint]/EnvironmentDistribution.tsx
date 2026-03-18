import { PropertyValueBar } from '@/components/PropertyValueBar';
import type { ErrorGroupEnvironmentRow } from '@/entities/analytics/errors.entities';

type EnvironmentDistributionProps = {
  title: string;
  items: (ErrorGroupEnvironmentRow & { icon?: React.ReactElement })[];
};

export function EnvironmentDistribution({ title, items }: EnvironmentDistributionProps) {
  const maxValue = Math.max(...items.map((d) => d.count), 1);
  const total = items.reduce((sum, d) => sum + d.count, 0) || 1;

  return (
    <div className='border-border space-y-2 border-t pt-2'>
      <p className='text-foreground text-base font-medium'>{title}</p>
      <div className='space-y-2'>
        {items.map((item, index) => (
          <PropertyValueBar
            key={item.label}
            value={{
              value: item.label,
              count: item.count,
              relativePercentage: Math.max((item.count / maxValue) * 100, 2),
              percentage: (item.count / total) * 100,
            }}
            icon={item.icon}
            index={index + 1}
          />
        ))}
      </div>
    </div>
  );
}
