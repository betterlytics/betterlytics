type WidthCallback = (width: number) => void;

let observer: ResizeObserver | null = null;
const callbacks = new Map<Element, Set<WidthCallback>>();

function entryWidth(entry: ResizeObserverEntry): number {
  const inline = entry.contentBoxSize?.[0]?.inlineSize;
  return Math.round(inline ?? entry.contentRect.width);
}

function getObserver(): ResizeObserver {
  observer ??= new ResizeObserver((entries) => {
    for (const entry of entries) {
      const subs = callbacks.get(entry.target);
      if (!subs) continue;
      const width = entryWidth(entry);
      subs.forEach((cb) => cb(width));
    }
  });
  return observer;
}

export function subscribeWidth(el: Element, cb: WidthCallback): () => void {
  let subs = callbacks.get(el);
  if (!subs) {
    subs = new Set();
    callbacks.set(el, subs);
    getObserver().observe(el);
  }
  subs.add(cb);
  return () => {
    const current = callbacks.get(el);
    if (!current) return;
    current.delete(cb);
    if (current.size === 0) {
      callbacks.delete(el);
      observer?.unobserve(el);
    }
  };
}
