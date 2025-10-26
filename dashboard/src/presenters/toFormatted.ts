export function toFormatted<T extends object>(value: T[], formatter: (value: T) => T): T[];
export function toFormatted<T extends object>(value: T[] | undefined, formatter: (value: T) => T): T[] | undefined;
export function toFormatted<T>(value: T[], formatter: (value: T) => T): T[];
export function toFormatted<T>(value: T | undefined, formatter: (value: T) => T): T | undefined;
export function toFormatted<T>(value: T | T[] | undefined, formatter: (value: T) => T): T | T[] | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value.map(formatter);
  }
  return formatter(value);
}
