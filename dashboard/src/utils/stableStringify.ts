export function normalizeForStableStringify(value: unknown): unknown {
  if (value instanceof Date) {
    return { __date: value.toISOString() };
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeForStableStringify(item));
  }

  if (value && typeof value === 'object') {
    const normalized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      normalized[key] = normalizeForStableStringify(val);
    }
    return normalized;
  }

  return value;
}

export function sortKeysDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sortKeysDeep(item)) as unknown as T;
  }

  if (value && typeof value === 'object') {
    if (value instanceof Date) {
      return value;
    }

    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));

    const sorted: Record<string, unknown> = {};
    for (const [key, val] of entries) {
      sorted[key] = sortKeysDeep(val);
    }

    return sorted as unknown as T;
  }

  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}
