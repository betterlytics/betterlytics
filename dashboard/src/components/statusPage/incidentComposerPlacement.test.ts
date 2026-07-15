import { describe, expect, it } from 'vitest';
import { resolveComposerPlacement, type PlacementRow } from './incidentComposerPlacement';

const at = (hhmm: string) => new Date(`2026-07-15T${hhmm}:00`);

// Newest first, matching the order the editor keeps its timeline rows in.
const rows: PlacementRow[] = [
  { status: 'monitoring', date: at('11:00') },
  { status: 'investigating', date: at('10:00') },
];

const placement = (args: Partial<Parameters<typeof resolveComposerPlacement>[0]>) =>
  resolveComposerPlacement({
    rows,
    entryDate: at('12:00'),
    status: 'monitoring',
    message: '',
    fallbackStatus: 'monitoring',
    ...args,
  });

describe('resolveComposerPlacement', () => {
  describe('at the end of the timeline', () => {
    it('says nothing new when the status is unchanged and there is no message', () => {
      expect(placement({ status: 'monitoring' })).toMatchObject({
        previousStatus: 'monitoring',
        isLatestEntry: true,
        isNoop: true,
      });
    });

    it('posts a progress note when the status is unchanged but a message is written', () => {
      expect(placement({ status: 'monitoring', message: 'still looking' })).toMatchObject({
        previousStatus: 'monitoring',
        isLatestEntry: true,
        isNoop: false,
      });
    });

    it('posts a bare status change with no message', () => {
      expect(placement({ status: 'resolved' })).toMatchObject({
        previousStatus: 'monitoring',
        isLatestEntry: true,
        isNoop: false,
      });
    });

    it('ignores a whitespace-only message', () => {
      expect(placement({ status: 'monitoring', message: '   ' })).toMatchObject({ isNoop: true });
    });
  });

  describe('backdated into the middle of the timeline', () => {
    it('follows the status in effect at its own timestamp, not the newest one', () => {
      // 10:30 sits after "investigating" (10:00) and before "monitoring" (11:00).
      expect(placement({ entryDate: at('10:30'), status: 'investigating' })).toMatchObject({
        previousStatus: 'investigating',
        isLatestEntry: false,
        isNoop: true,
      });
    });

    it('posts a historical status change that matches the newest status but not the one it follows', () => {
      // Regression guard: keying off the newest row (monitoring) instead of the row this entry
      // actually follows (investigating) made this a no-op, so saving silently dropped it.
      expect(placement({ entryDate: at('10:30'), status: 'monitoring' })).toMatchObject({
        previousStatus: 'investigating',
        isLatestEntry: false,
        isNoop: false,
      });
    });

    it('does not move the incident status even when it changes status', () => {
      expect(placement({ entryDate: at('10:30'), status: 'identified' })).toMatchObject({
        isLatestEntry: false,
        isNoop: false,
      });
    });

    it('has no preceding status when it lands before every entry', () => {
      expect(placement({ entryDate: at('09:00'), status: 'monitoring' })).toMatchObject({
        previousStatus: null,
        isLatestEntry: false,
        isNoop: false,
      });
    });
  });

  describe('when there are no rows to place against', () => {
    it('falls back to the incident status while the timeline is still loading', () => {
      expect(placement({ rows: [], status: 'monitoring', fallbackStatus: 'monitoring' })).toMatchObject({
        previousStatus: 'monitoring',
        isLatestEntry: true,
        isNoop: true,
      });
    });

    it('always posts the opening entry of a brand-new incident', () => {
      expect(placement({ rows: [], status: 'investigating', fallbackStatus: null })).toMatchObject({
        previousStatus: null,
        isLatestEntry: true,
        isNoop: false,
      });
    });
  });
});
