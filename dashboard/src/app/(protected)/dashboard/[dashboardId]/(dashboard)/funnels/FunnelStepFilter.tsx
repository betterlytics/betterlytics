import { FilterColumn, FilterOperator, QueryFilter } from '@/entities/analytics/filter.entities';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dispatch, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { FilterValueSearch } from '@/components/filters/FilterValueSearch';
import { Input } from '@/components/ui/input';
import { FILTER_COLUMN_SELECT_OPTIONS } from '@/components/filters/QueryFilterInputRow';

type FunnelStepFilterProps = {
  onFilterUpdate: Dispatch<QueryFilter & { name: string }>;
  filter: QueryFilter & { name: string };
  requestRemoval: () => void;
  disableDeletion?: boolean;
  showEmptyError?: boolean;
};

export function FunnelStepFilter({
  filter,
  onFilterUpdate,
  requestRemoval,
  disableDeletion,
  showEmptyError,
}: FunnelStepFilterProps) {
  const isMobile = useIsMobile();
  const t = useTranslations('components.filters');

  const filterColumnRef = useRef<string>(filter.column);
  useEffect(() => {
    if (filter.column !== filterColumnRef.current) {
      onFilterUpdate({ ...filter, value: '' });
      filterColumnRef.current = filter.column;
    }
  }, [filter.column]);

  const showNameEmptyError = showEmptyError && filter.name.trim() === '';
  const showValueEmptyError = showEmptyError && filter.value.trim() === '';

  return (
    <div className='flex h-fit min-h-14 w-full items-center gap-2 p-2'>
      <Input
        className={cn('w-52', showNameEmptyError && 'border-destructive')}
        value={filter.name}
        onChange={(e) => onFilterUpdate({ ...filter, name: e.target.value })}
        placeholder={t('namePlaceholder')}
      />
      <Select
        value={filter.column}
        onValueChange={(column: FilterColumn) => {
          onFilterUpdate({ ...filter, column });
        }}
      >
        <SelectTrigger className='w-50 cursor-pointer'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          align={'start'}
          position={'popper'}
          className={cn('w-[--radix-select-trigger-width]', isMobile && 'max-h-72')}
        >
          <SelectGroup>
            <SelectLabel>{t('type')}</SelectLabel>
            {FILTER_COLUMN_SELECT_OPTIONS.map((column) => {
              return (
                <SelectItem className='cursor-pointer' key={column.value} value={column.value}>
                  {column.icon}
                  {t(`columns.${column.value}`)}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={filter.operator}
        onValueChange={(operator: FilterOperator) => onFilterUpdate({ ...filter, operator })}
      >
        <SelectTrigger className='w-25 cursor-pointer'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align={'start'} position={'popper'}>
          <SelectGroup>
            <SelectLabel>{t('operator')}</SelectLabel>
            <SelectItem className='cursor-pointer' value={'='}>
              {t('is')}
            </SelectItem>
            <SelectItem className='cursor-pointer' value={'!='}>
              {t('isNot')}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <FilterValueSearch
        filter={filter}
        onFilterUpdate={onFilterUpdate}
        key={filter.column}
        className='grow'
        triggerClassName={cn(showValueEmptyError && 'border-destructive')}
        useExtendedRange
      />
      <Button variant='ghost' className='cursor-pointer' onClick={requestRemoval} disabled={disableDeletion}>
        <Trash2 />
      </Button>
    </div>
  );
}
