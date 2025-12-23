export function parseClickHouseDate(dateString: string): Date {
  // Force UTC interpretation by appending 'Z' if not already present
  const utcDateString = dateString.includes('Z') ? dateString : `${dateString}Z`;
  return new Date(utcDateString);
}

export function toIsoUtc(value?: string | null): string | null {
  if (!value) return null;
  return parseClickHouseDate(value).toISOString();
}

export function getDateKey(dateString: string): string {
  const parsedDate = parseClickHouseDate(dateString);
  return parsedDate.valueOf().toString();
}

export function sortByDate<T extends { date: string }>(data: T[]): T[] {
  return data.sort((a, b) => {
    const dateA = parseClickHouseDate(a.date);
    const dateB = parseClickHouseDate(b.date);
    return dateA.getTime() - dateB.getTime();
  });
}

export function computeDaysUntil(isoDate: string | null | undefined): number | null {
  if (!isoDate) return null;
  const targetMs = new Date(isoDate).getTime();
  if (Number.isNaN(targetMs)) return null;
  return Math.ceil((targetMs - Date.now()) / (1000 * 60 * 60 * 24));
}
