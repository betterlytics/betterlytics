import { type FilterColumn } from '@/entities/analytics/filter.entities';
import { CountryFlagLabel } from '@/components/filters/CountryFlagLabel';

type FilterValueLabelProps = {
  column: FilterColumn;
  value: string;
  className?: string;
  children: React.ReactNode;
};

export function FilterValueLabel({ column, value, className, children }: FilterValueLabelProps) {
  if (column === 'country_code') {
    return (
      <CountryFlagLabel countryCode={value} className={className}>
        {children}
      </CountryFlagLabel>
    );
  }
  return <span className={className}>{children}</span>;
}
