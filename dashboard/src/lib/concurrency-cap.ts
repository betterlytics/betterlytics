// In-memory count of open slots per key plus a process-wide total; per process like
// lib/rate-limit.ts. release() is idempotent so a pipeline callback can call it freely.
export type SlotRelease = () => void;
export type SlotResult = { release: SlotRelease } | { refused: 'key' | 'total' };

export function createConcurrencyCap(perKey: number, total: number): (key: string) => SlotResult {
  const perKeyCounts = new Map<string, number>();
  let running = 0;

  return function acquire(key: string): SlotResult {
    const current = perKeyCounts.get(key) ?? 0;
    if (current >= perKey) return { refused: 'key' };
    if (running >= total) return { refused: 'total' };
    perKeyCounts.set(key, current + 1);
    running++;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      running--;
      const remaining = (perKeyCounts.get(key) ?? 1) - 1;
      if (remaining <= 0) perKeyCounts.delete(key);
      else perKeyCounts.set(key, remaining);
    };
    return { release };
  };
}
