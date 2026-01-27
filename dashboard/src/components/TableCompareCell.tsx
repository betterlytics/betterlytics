import { TableTrendIndicator } from '@/components/TableTrendIndicator';
import { Minus } from 'lucide-react';

type PresetedData<K extends string> = {
  current: Record<K, number | null>;
  compare?: Record<K, number | null>;
  change?: Record<K, number | null>;
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
  const { current, compare, change } = getTableCompareValues(row, dataKey);

  if (current === null) {
    return <Minus className='text-foreground h-3 w-3' />;
  }

  return (
    <div className='flex flex-col'>
      <div>{formatter(current)}</div>
      {compare != null && change != null ? (
        <TableTrendIndicator current={current} compare={compare} percentage={change} formatter={formatter} />
      ) : (
        <div className='flex items-center gap-1 text-xs opacity-85'>
          <span className='text-muted-foreground'>vs </span>
          <Minus className='h-3 w-3' />
        </div>
      )}
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
