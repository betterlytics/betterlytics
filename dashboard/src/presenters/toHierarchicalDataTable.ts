export type HierarchicalDataTableRow<P extends string, C extends string> = { [key in P]: string } & {
  current: { visitors: number };
  compare?: { visitors: number };
  change?: { visitors: number };
  children?: Array<
    { [key in C]: string } & {
      current: { visitors: number };
      compare?: { visitors: number };
      change?: { visitors: number };
    }
  >;
};

type HierarchicalDataTableInput<P extends string, C extends string> = {
  [K in P]: string;
} & {
  [K in C]: string | null;
} & {
  visitors: number;
  is_rollup: boolean;
};

function labelKey<K extends string>(key: K, value: string): { [P in K]: string } {
  return { [key]: value } as { [P in K]: string };
}

type ToHierarchicalDataTableProps<P extends string, C extends string> = {
  data: Array<HierarchicalDataTableInput<P, C>>;
  compare: Array<HierarchicalDataTableInput<P, C>> | undefined;
  parentKey: P;
  childKey: C;
};

export function toHierarchicalDataTable<P extends string, C extends string>({
  data,
  compare,
  parentKey,
  childKey,
}: ToHierarchicalDataTableProps<P, C>): HierarchicalDataTableRow<P, C>[] {
  const computeChange = compare && compare.length > 0;

  const isParent = (r: HierarchicalDataTableInput<P, C>) => r.is_rollup;
  const keyOf = (r: HierarchicalDataTableInput<P, C>) => r[parentKey];
  const childOf = (r: HierarchicalDataTableInput<P, C>) => r[childKey];

  const compareMap = computeChange
    ? new Map<string, HierarchicalDataTableInput<P, C>>(
        (compare?.filter(isParent) ?? []).map((r) => [keyOf(r), r]),
      )
    : undefined;

  const compareChildMap = computeChange
    ? new Map<string, HierarchicalDataTableInput<P, C>>(
        (compare?.filter((r) => !isParent(r)) ?? []).map((r) => [`${keyOf(r)}::${childOf(r)}`, r]),
      )
    : undefined;

  const childrenByParent = new Map<string, HierarchicalDataTableInput<P, C>[]>();
  const parents: HierarchicalDataTableInput<P, C>[] = [];
  for (const row of data) {
    if (isParent(row)) {
      parents.push(row);
    } else {
      const parentVal = keyOf(row);
      const arr = childrenByParent.get(parentVal) ?? [];
      arr.push(row);
      childrenByParent.set(parentVal, arr);
    }
  }

  return parents
    .map((parent) => {
      const parentVal = keyOf(parent);
      const pCompare = compareMap?.get(parentVal);
      const childRows = (childrenByParent.get(parentVal) ?? [])
        .filter((child) => childOf(child) !== null)
        .map((child) => {
          const childVal = childOf(child);
          const cCompare = compareChildMap?.get(`${keyOf(child)}::${childVal}`);
          return {
            ...labelKey(childKey, childVal),
            current: { visitors: child.visitors },
            compare: cCompare ? { visitors: cCompare.visitors } : undefined,
            change: computeChange
              ? { visitors: ((child.visitors - (cCompare?.visitors ?? 0)) / (cCompare?.visitors ?? 1)) * 100 }
              : undefined,
          };
        });

      return {
        ...labelKey(parentKey, parentVal),
        current: { visitors: parent.visitors },
        compare: pCompare ? { visitors: pCompare.visitors } : undefined,
        change: computeChange
          ? { visitors: ((parent.visitors - (pCompare?.visitors ?? 0)) / (pCompare?.visitors ?? 1)) * 100 }
          : undefined,
        children: childRows.length ? childRows : undefined,
      };
    })
    .sort((a, z) => z.current.visitors - a.current.visitors);
}
