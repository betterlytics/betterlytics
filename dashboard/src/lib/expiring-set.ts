/**
 * Set of keys that forget themselves after `ttlMs`. Expiry is lazy (checked on access) and the
 * size cap evicts oldest-inserted, so no sweep is needed. Re-adding a key moves it to the tail.
 */
export class ExpiringSet {
  private readonly until = new Map<string, number>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries: number,
  ) {}

  has(key: string): boolean {
    const expiry = this.until.get(key);
    if (expiry === undefined) return false;
    if (expiry > Date.now()) return true;
    this.until.delete(key);
    return false;
  }

  add(key: string): void {
    this.until.delete(key);
    while (this.until.size >= this.maxEntries) {
      const oldest = this.until.keys().next().value;
      if (oldest === undefined) break;
      this.until.delete(oldest);
    }
    this.until.set(key, Date.now() + this.ttlMs);
  }

  delete(key: string): void {
    this.until.delete(key);
  }
}
