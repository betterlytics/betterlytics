import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Must list landing.css's tokens, or tailwind-merge reads unknown ones as colours
 * (`text-display-1 text-muted` loses the size). Use this `cn`, not `@/lib/utils`, in the landing.
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
