import { useEffect } from 'react';

/** While `open`, a click anywhere but inside `keep` calls `dismiss`, unless it ends a text selection. */
export function useDismiss(open: boolean, keep: string, dismiss: () => void) {
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest(keep)) return;
      if (window.getSelection()?.toString()) return;
      dismiss();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open, keep, dismiss]);
}
