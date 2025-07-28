import { TableTrendIndicator } from '@/components/TableTrendIndicator';

type PresetedData<K extends string> = {
  current: Record<K, number>;
  compare?: Record<K, number>;
  change?: Record<K, number>;
};

type TableCompareCellProps<K extends string> = {
  row: PresetedData<K>;
  dataKey: K;
  formatter?: (value: number) => string;
};

export function TableCompareCell<K extends string>({
  row,
  dataKey,
  formatter = (val) => val.toLocaleString(),
}: TableCompareCellProps<K>) {
  return (
    <div className='flex flex-col'>
      <div>{formatter(row.current[dataKey] ?? 0)}</div>
      <TableTrendIndicator
        current={row.current[dataKey] ?? 0}
        compare={row.compare?.[dataKey]}
        percentage={row.change?.[dataKey]}
        formatter={formatter}
      />
    </div>
  );
}
