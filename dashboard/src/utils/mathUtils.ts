/**
 * Calculate the percentage of a number
 * @param count - The number to calculate the percentage of
 * @param total - The total number
 * @returns The percentage of the number
 */
export const calculatePercentage = (count: number, total: number): number =>
  Math.round((count / total) * 100 * 100) / 100;
