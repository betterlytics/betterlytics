import { TableTrendIndicator } from '@/components/TableTrendIndicator';
import { Minus } from 'lucide-react';
import { useLocale } from 'next-intl';
import type { SupportedLanguages } from '@/constants/i18n';

type PresetedData<K extends string> = {
  current: Record<K, number | null>;
  compare?: Record<K, number | null>;
  change?: Record<K, number | null>;
};

type TableCompareCellProps<K extends string> = {
  row: PresetedData<K>;
  dataKey: K;
  formatter?: (value: number, locale?: SupportedLanguages) => string;
  allowNullish?: boolean;
};

export function TableCompareCell<K extends string>({
  row,
  dataKey,
  formatter: formatterProp,
  allowNullish,
}: TableCompareCellProps<K>) {
  const locale = useLocale();
  const formatter = (val: number) => formatterProp ? formatterProp(val, locale) : val.toLocaleString(locale);
  const { current, compare, change } = getTableCompareValues(row, dataKey);

  if (current == null && allowNullish) {
    return <Minus className='text-foreground h-3 w-3' />;
  }

  return (
    <div className='flex flex-col'>
      <div>{formatter(current ?? 0)}</div>
      <TableTrendIndicator
        current={current ?? 0}
        compare={compare ?? undefined}
        percentage={change ?? undefined}
        formatter={formatter}
        allowNullish={allowNullish}
      />
    </div>
  );
}

function getTableCompareValues<K extends string>(row: PresetedData<K>, dataKey: K) {
  const { current, compare, change } = row;
  return {
    current: current[dataKey],
    compare: compare?.[dataKey],
    change: change?.[dataKey],
  };
}
