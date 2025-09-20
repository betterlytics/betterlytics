type DataType<K extends string> = Record<K, number>;

type DataToPartialPercentageCompareProps<Keys extends Array<string>> = {
  keys: Keys;
  data: DataType<Keys[number]>;
  compare?: DataType<Keys[number]>;
};

export function toPartialPercentageCompare<Keys extends Array<string>>({
  data,
  compare,
  keys,
}: DataToPartialPercentageCompareProps<Keys>) {
  return keys.reduce(
    (acc, key: Keys[number]) => ({
      ...acc,
      [key]: comparePercentage(data[key], compare?.[key]),
    }),
    {} as Record<Keys[number], number>,
  );
}

function comparePercentage(current: unknown, previous?: unknown) {
  if (!previous) {
    return null;
  }

  if (typeof current !== 'number' || typeof previous !== 'number') {
    throw new Error('Invalid data');
  }

  if (previous === 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
}
