export function formatDate(date: Date, includeTime = false): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
  }).format(date);
}

export function parsePage(pageStr: string | undefined): number {
  return Math.max(1, parseInt(pageStr ?? '1', 10) || 1);
}
