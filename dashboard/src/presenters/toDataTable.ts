type ToDataTableProps<K extends string, D extends string> = {
  categoryKey: K;
  data: Array<Record<K, string> & Record<D, unknown>>;
  compare?: Array<Record<K, string> & Record<D, unknown>>;
};

type ToDataTableReturn<K extends string, D extends string> = Record<K, string> & Record<D, unknown>;

function toDataTable<K extends string, D extends string>({ categoryKey, data, compare }: ToDataTableProps<K, D>) {
  return data.map((row) => {
    const comparedRow = compare?.find((comp) => comp[categoryKey] === row[categoryKey]);

    return {
      [categoryKey]: row[categoryKey],
      current: row,
      compare: comparedRow,
    };
  }) as ToDataTableReturn<K, D>;
}
