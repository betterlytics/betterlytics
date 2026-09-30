import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge taught the landing theme (landing.css). Without it, token names it
 * doesn't know are all read as colours, so `text-display-1 text-muted` would lose
 * the font size. Use this `cn`, not `@/lib/utils`, anywhere in the landing.
 */
const merge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        'canvas',
        'surface',
        'panel',
        'panel-raised',
        'terminal',
        'fg',
        'muted',
        'volt',
        'volt-hover',
        'volt-lift',
        'volt-soft',
        'volt-text',
        'on-volt',
        'on-paper',
        'down',
        'warn',
        'live',
        'rule',
        'rule-08',
        'rule-10',
        'rule-125',
        'rule-22',
        'rule-30',
        'hatch-ink',
      ],
      text: ['display-1', 'display-2', 'lede', 'title', 'body', 'body-sm', 'label', 'caption', 'code', 'micro'],
      tracking: ['ui'],
      breakpoint: ['3xl'],
      ease: ['out-expo', 'pen'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs));
}
