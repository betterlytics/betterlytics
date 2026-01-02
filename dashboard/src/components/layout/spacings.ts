/** Sizing */
type Layer = 'layout' | 'content';

export type GapSize = 'none' | `${Layer}-${'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'}`;

export const GAP_CLASSES: Record<GapSize, string> = {
  none: 'gap-none',

  'layout-xs': 'gap-layout-xs',
  'layout-sm': 'gap-layout-sm',
  'layout-md': 'gap-layout-md',
  'layout-lg': 'gap-layout-lg',
  'layout-xl': 'gap-layout-xl',
  'layout-2xl': 'gap-layout-2xl',

  'content-xs': 'gap-content-xs',
  'content-sm': 'gap-content-sm',
  'content-md': 'gap-content-md',
  'content-lg': 'gap-content-lg',
  'content-xl': 'gap-content-xl',
  'content-2xl': 'gap-content-2xl',
};

/** Alignment */
export type Alignment = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
export type Justification = 'start' | 'center' | 'end' | 'between' | 'around';

export const ALIGN_CLASSES: Record<Alignment, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
};

export const JUSTIFY_CLASSES: Record<Justification, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
};

/** Grid */
export type ColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type ColBreakpoints = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export const COLS_CLASSES: Record<ColBreakpoints, Record<ColumnCount, string>> = {
  base: {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
  },
  sm: {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
    5: 'sm:grid-cols-5',
    6: 'sm:grid-cols-6',
    7: 'sm:grid-cols-7',
    8: 'sm:grid-cols-8',
  },
  md: {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
    7: 'md:grid-cols-7',
    8: 'md:grid-cols-8',
  },
  lg: {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
    7: 'lg:grid-cols-7',
    8: 'lg:grid-cols-8',
  },
  xl: {
    1: 'xl:grid-cols-1',
    2: 'xl:grid-cols-2',
    3: 'xl:grid-cols-3',
    4: 'xl:grid-cols-4',
    5: 'xl:grid-cols-5',
    6: 'xl:grid-cols-6',
    7: 'xl:grid-cols-7',
    8: 'xl:grid-cols-8',
  },
  '2xl': {
    1: '2xl:grid-cols-1',
    2: '2xl:grid-cols-2',
    3: '2xl:grid-cols-3',
    4: '2xl:grid-cols-4',
    5: '2xl:grid-cols-5',
    6: '2xl:grid-cols-6',
    7: '2xl:grid-cols-7',
    8: '2xl:grid-cols-8',
  },
};
