export function toFormatted<T extends object>(value: T[], formatter: (value: T) => T): T[];
export function toFormatted<T extends object>(value: T[] | undefined, formatter: (value: T) => T): T[] | undefined;
export function toFormatted<T extends object>(value: T[] | null, formatter: (value: T) => T): T[] | null;
export function toFormatted<T>(value: T[], formatter: (value: T) => T): T[];
export function toFormatted<T>(value: T | undefined, formatter: (value: T) => T): T | undefined;
export function toFormatted<T>(value: T | null, formatter: (value: T) => T): T | null;
export function toFormatted<T>(
  value: T | T[] | undefined | null,
  formatter: (value: T) => T,
): T | T[] | undefined | null {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (Array.isArray(value)) {
    return value.map(formatter);
  }
  return formatter(value);
}
