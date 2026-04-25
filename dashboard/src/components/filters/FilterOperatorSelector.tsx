'use client';

import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type FilterOperator, type QueryFilter } from '@/entities/analytics/filter.entities';

type FilterOperatorSelectorProps<TEntity> = {
  filter: QueryFilter & TEntity;
  onFilterUpdate: (filter: QueryFilter & TEntity) => void;
  className?: string;
};

export function FilterOperatorSelector<TEntity>({
  filter,
  onFilterUpdate,
  className,
}: FilterOperatorSelectorProps<TEntity>) {
  const t = useTranslations('components.filters');

  return (
    <Select
      value={filter.operator}
      onValueChange={(operator: FilterOperator) => onFilterUpdate({ ...filter, operator })}
    >
      <SelectTrigger className={className ?? 'w-full cursor-pointer'}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align='start' position='popper'>
        <SelectGroup>
          <SelectLabel>{t('operator')}</SelectLabel>
          <SelectItem className='cursor-pointer' value='='>
            {t('is')}
          </SelectItem>
          <SelectItem className='cursor-pointer' value='!='>
            {t('isNot')}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
