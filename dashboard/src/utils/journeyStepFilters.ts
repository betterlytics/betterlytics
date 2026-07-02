import { isUsableFilter, type QueryFilter } from '@/entities/analytics/filter.entities';

export type JourneyStepFilters = Record<string, QueryFilter[]>;

type PositionalUrlFilters = {
  position: number;
  filters: QueryFilter[];
};

export function splitStepFilters(stepFilters: JourneyStepFilters): {
  sessionFilters: QueryFilter[];
  positionalUrlFilters: PositionalUrlFilters[];
} {
  const entries = Object.entries(stepFilters);

  const sessionFilters = entries.flatMap(([, filters]) => filters.filter((f) => f.column !== 'url'));

  const positionalUrlFilters = entries
    .map(([position, filters]) => ({
      position: Number(position),
      filters: filters.filter((f) => f.column === 'url' && isUsableFilter(f)),
    }))
    .filter((entry) => entry.filters.length > 0)
    .sort((a, b) => a.position - b.position);

  return { sessionFilters, positionalUrlFilters };
}

export function pruneStepFilters(stepFilters: JourneyStepFilters, numberOfSteps: number): JourneyStepFilters {
  const kept = Object.entries(stepFilters).filter(([position]) => Number(position) <= numberOfSteps);
  if (kept.length === Object.keys(stepFilters).length) return stepFilters;
  return Object.fromEntries(kept);
}

export function setStepFiltersAt(
  stepFilters: JourneyStepFilters,
  position: number,
  filters: QueryFilter[],
): JourneyStepFilters {
  if (filters.length === 0) {
    return Object.fromEntries(Object.entries(stepFilters).filter(([key]) => key !== String(position)));
  }
  return { ...stepFilters, [String(position)]: filters };
}
