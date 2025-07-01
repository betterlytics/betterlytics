export function parseClickHouseDate(dateString: string): Date {
  // Force UTC interpretation by appending 'Z' if not already present
  const DateString = dateString.includes('Z') ? dateString : `${dateString}Z`;
  return new Date(DateString);
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
