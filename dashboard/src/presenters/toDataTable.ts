type ToDataTableProps<K extends string, D> = {
  categoryKey: K;
  data: Array<Record<K, string> & D>;
  compare?: Array<Record<K, string> & D>;
};

type RowProps<D extends Record<string, unknown>> = {
  row: D;
  compareRow?: D;
  enabled: boolean;
};

function rowChange<D extends Record<string, unknown>>({ row, compareRow, enabled }: RowProps<D>) {
  return Object.entries(row).reduce((acc, [key, value]) => {
    if (typeof value !== 'number') {
      return {
        ...acc,
        [key]: value,
      };
    }

    const compareValue = (compareRow?.[key] as number | undefined) || 0;
    const difference = value - compareValue;

    return {
      ...acc,
      [key]: enabled ? (100 * difference) / (compareValue || 1) : undefined,
    };
  }, {} as D);
}

export type ToDataTable<K extends string, D> = Record<K, string> & {
  current: D;
  compare?: D;
  change?: D;
};

export function toDataTable<K extends string, D>({ categoryKey, data, compare }: ToDataTableProps<K, D>) {
  return data.map((row) => {
    const compareRow = compare?.find((comp) => comp[categoryKey] === row[categoryKey]);

    return {
      [categoryKey]: row[categoryKey],
      current: row,
      compare: compareRow,
      change: rowChange<Record<K, string> & D>({ row, compareRow, enabled: Boolean(compare) }),
    } as ToDataTable<K, D>;
  });
}
