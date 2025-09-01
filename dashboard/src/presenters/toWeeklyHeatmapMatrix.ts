import { type WeeklyHeatmapRow } from '@/entities/weeklyHeatmap';

export type WeeklyHeatmapMatrix = {
  weekday: number; // 1-7 (Mon..Sun)
  hours: number[]; // 24 numbers
};

export function toWeeklyHeatmapMatrix(rows: WeeklyHeatmapRow[]): WeeklyHeatmapMatrix[] {
  const matrix: Record<number, number[]> = {
    1: Array(24).fill(0),
    2: Array(24).fill(0),
    3: Array(24).fill(0),
    4: Array(24).fill(0),
    5: Array(24).fill(0),
    6: Array(24).fill(0),
    7: Array(24).fill(0),
  };

  rows.forEach((row) => {
    if (row.weekday >= 1 && row.weekday <= 7 && row.hour >= 0 && row.hour <= 23) {
      matrix[row.weekday][row.hour] = row.value;
    }
  });

  const orderedWeekdays: Array<keyof typeof matrix> = [1, 2, 3, 4, 5, 6, 7];
  return orderedWeekdays.map((key) => ({ weekday: Number(key), hours: matrix[key] }));
}
