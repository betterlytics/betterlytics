export function calculatePercentageChange(current: number, compare: number | undefined): number | undefined {
  if (compare === undefined || (compare === 0 && current > 0)) return undefined;
  return ((current - compare) / (compare || 1)) * 100;
}
