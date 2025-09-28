'use client';

export function markerBgClassForLabel(label: string): string {
  switch (label) {
    case 'Mouse Interaction':
      return 'bg-sky-500 dark:bg-sky-400';
    case 'Selection':
      return 'bg-emerald-500 dark:bg-emerald-400';
    case 'DOM Mutation':
    case 'Full snapshot':
      return 'bg-violet-500 dark:bg-violet-400';
    case 'Scroll':
      return 'bg-amber-500 dark:bg-amber-400';
    case 'Navigation':
      return 'bg-primary';
    case 'Input':
      return 'bg-rose-500 dark:bg-rose-400';
    case 'Pageview':
      return 'bg-sky-500 dark:bg-sky-400';
    default:
      return 'bg-muted-foreground';
  }
}
