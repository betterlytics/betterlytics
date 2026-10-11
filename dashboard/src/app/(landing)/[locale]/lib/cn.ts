import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/** Colours need no list (tailwind-merge takes any unknown value as one); other tokens must be listed, or `text-display-1 text-muted` loses the size. */
const merge = extendTailwindMerge({
  extend: {
    theme: {
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
