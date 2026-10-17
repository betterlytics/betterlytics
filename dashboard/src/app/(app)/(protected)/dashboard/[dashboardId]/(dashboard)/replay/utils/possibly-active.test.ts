import { describe, it, expect } from 'vitest';
import { isPossiblyActive, POSSIBLY_ACTIVE_WINDOW_MS } from './possibly-active';

const now = new Date('2026-09-28T12:00:00Z').getTime();

describe('isPossiblyActive', () => {
  it('is active when the last segment arrived just now', () => {
    expect(isPossiblyActive(new Date(now), now)).toBe(true);
  });

  it('is active just inside the window', () => {
    expect(isPossiblyActive(new Date(now - POSSIBLY_ACTIVE_WINDOW_MS + 1000), now)).toBe(true);
  });

  it('is not active once the window has passed', () => {
    expect(isPossiblyActive(new Date(now - POSSIBLY_ACTIVE_WINDOW_MS), now)).toBe(false);
  });

  it('treats an ended_at slightly ahead of the client clock as active', () => {
    expect(isPossiblyActive(new Date(now + 30_000), now)).toBe(true);
  });
});
