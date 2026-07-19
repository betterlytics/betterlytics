/** Groups items into a Map of arrays, preserving encounter order within each group. */
export function groupByKey<Item, Value = Item>(
  items: Item[],
  getKey: (item: Item) => string,
  getValue?: (item: Item) => Value,
): Map<string, Value[]> {
  const grouped = new Map<string, Value[]>();
  for (const item of items) {
    const key = getKey(item);
    const value = (getValue ? getValue(item) : item) as Value;
    const list = grouped.get(key);
    if (list) list.push(value);
    else grouped.set(key, [value]);
  }
  return grouped;
}
