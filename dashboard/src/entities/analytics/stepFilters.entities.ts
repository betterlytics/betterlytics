import {
  FILTER_COLUMNS,
  isUsableFilter,
  parseFilterColumn,
  type FilterColumn,
  type QueryFilter,
  type TableFilterColumn,
} from './filter.entities';
import { PROPERTY_SOURCE_KINDS, type PropertySourceKind } from './propertySources';

export type StepFilterKind = 'positional' | 'entry' | 'exit' | 'infeasible';

export type StepFiltersBySlot = Record<string, QueryFilter[]>;

export const ENTRY_FILTER_COLUMNS = [
  'referrer_source',
  'referrer_source_name',
  'referrer_search_term',
  'referrer_url',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const satisfies readonly TableFilterColumn[];

const ENTRY_COLUMN_SET = new Set<TableFilterColumn>(ENTRY_FILTER_COLUMNS);

export function classifyStepFilter(column: FilterColumn, slot: number, lastSlot: number): StepFilterKind {
  if (!Number.isInteger(slot) || slot < 0 || slot > lastSlot) return 'infeasible';
  const parsed = parseFilterColumn(column);
  if (parsed.kind === 'property') return 'infeasible';
  if (parsed.col === 'url') return 'positional';
  if (ENTRY_COLUMN_SET.has(parsed.col)) return slot === 0 ? 'entry' : 'infeasible';
  if (parsed.col === 'outbound_link_url') return slot === lastSlot ? 'exit' : 'infeasible';
  return 'infeasible';
}

export function getStepExcludedColumns(
  slot: number,
  lastSlot: number,
): (TableFilterColumn | PropertySourceKind)[] {
  const excludedColumns = FILTER_COLUMNS.filter(
    (column) => classifyStepFilter(column, slot, lastSlot) === 'infeasible',
  );
  const excludedSources = PROPERTY_SOURCE_KINDS.filter(
    (source) => classifyStepFilter(`${source}.probe`, slot, lastSlot) === 'infeasible',
  );
  return [...excludedColumns, ...excludedSources];
}

export function stripInfeasibleStepFilters(
  stepFilters: StepFiltersBySlot,
  lastSlot: number,
): StepFiltersBySlot {
  const entries = Object.entries(stepFilters)
    .map(
      ([slot, filters]) =>
        [
          slot,
          filters.filter((filter) => classifyStepFilter(filter.column, Number(slot), lastSlot) !== 'infeasible'),
        ] as const,
    )
    .filter(([, filters]) => filters.length > 0);
  return Object.fromEntries(entries);
}

export function pruneStepFilters(stepFilters: StepFiltersBySlot, lastSlot: number): StepFiltersBySlot {
  return Object.fromEntries(Object.entries(stepFilters).filter(([slot]) => Number(slot) <= lastSlot));
}
