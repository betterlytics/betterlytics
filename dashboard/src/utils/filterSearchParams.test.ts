import { describe, it, expect } from 'vitest';
import moment from 'moment-timezone';
import { BAFilterSearchParams } from './filterSearchParams';
import { type QueryFilter } from '@/entities/analytics/filter.entities';

const TZ = 'Etc/UTC';

function decodeParams(params: Record<string, string>) {
  return BAFilterSearchParams.decode(params, TZ);
}

function encodeFilters(filters: unknown[]) {
  return JSON.stringify(filters);
}

const validFilter = { id: 'f1', column: 'url', operator: '=', values: ['/pricing'] };

describe('BAFilterSearchParams.decode with malformed query filters', () => {
  it('drops only the invalid filter and keeps the rest', () => {
    const result = decodeParams({
      queryFilters: encodeFilters([
        validFilter,
        { id: 'f2', column: 'cep.ran\tdom', operator: '=', values: ['b'] },
      ]),
    });

    expect(result.queryFilters).toHaveLength(1);
    expect(result.queryFilters[0].column).toBe('url');
  });

  it('preserves unrelated state when a filter is invalid', () => {
    const result = decodeParams({
      queryFilters: encodeFilters([{ id: 'f2', column: 'not_a_column', operator: '=', values: ['x'] }]),
      interval: '7d',
    });

    expect(result.queryFilters).toHaveLength(0);
    expect(result.interval).toBe('7d');
  });

  it('treats unparseable queryFilters JSON as empty without touching other params', () => {
    const result = decodeParams({
      queryFilters: '{not-json',
      interval: '7d',
    });

    expect(result.queryFilters).toHaveLength(0);
    expect(result.interval).toBe('7d');
  });

  it('treats non-array queryFilters JSON as empty', () => {
    const result = decodeParams({ queryFilters: JSON.stringify({ id: 'f1' }) });

    expect(result.queryFilters).toHaveLength(0);
  });

  it('drops filters with a malformed shape', () => {
    const result = decodeParams({
      queryFilters: encodeFilters([{ id: 'f2', column: 'url' }, validFilter]),
    });

    expect(result.queryFilters).toHaveLength(1);
    expect(result.queryFilters[0].id).toBe('f1');
  });
});

describe('BAFilterSearchParams.decode existing behavior', () => {
  it('keeps valid filters as-is', () => {
    const result = decodeParams({
      queryFilters: encodeFilters([validFilter, { id: 'f2', column: 'gp.plan', operator: '!=', values: ['pro'] }]),
    });

    expect(result.queryFilters).toHaveLength(2);
    expect(result.queryFilters[1].column).toBe('gp.plan');
  });

  it('still migrates legacy single-value filters', () => {
    const result = decodeParams({
      queryFilters: encodeFilters([{ id: 'f1', column: 'url', operator: '=', value: '/pricing' }]),
    });

    expect(result.queryFilters).toHaveLength(1);
    expect(result.queryFilters[0].values).toEqual(['/pricing']);
  });

  it('still caps the number of filters at the row limit', () => {
    const filters = Array.from({ length: 15 }, (_, i) => ({
      id: `f${i}`,
      column: 'url',
      operator: '=',
      values: [`/${i}`],
    }));
    const result = decodeParams({ queryFilters: encodeFilters(filters) });

    expect(result.queryFilters).toHaveLength(10);
  });
});

describe('BAFilterSearchParams round trip', () => {
  /**
   * Ids travel in the query string and sanitizeQueryFilters requires them, so
   * an encoding that omitted them would decode to nothing and a reload would
   * discard the user's filters. The decode half is covered above; this pins
   * the encode half.
   */
  it('preserves filter ids through encode and decode', () => {
    const queryFilters: QueryFilter[] = [
      { id: 'f1', column: 'url', operator: '=', values: ['/pricing'] },
      { id: 'f2', column: 'browser', operator: '!=', values: ['Chrome'] },
    ];
    const encoded = Object.fromEntries(
      BAFilterSearchParams.encode({ ...BAFilterSearchParams.getDefaultFilters(), queryFilters }, TZ),
    );

    const result = decodeParams(encoded);

    expect(result.queryFilters.map((filter) => filter.id)).toEqual(['f1', 'f2']);
  });

  it.each(['America/New_York', 'Asia/Tokyo'])('keeps a custom range stable across URL syncs in %s', (tz) => {
    let params: Record<string, string> = { interval: 'custom', startDate: '2026-09-20', endDate: '2026-09-22' };

    for (let sync = 0; sync < 2; sync++) {
      const decoded = BAFilterSearchParams.decode(params, tz);
      const encoded = BAFilterSearchParams.encode(
        {
          ...BAFilterSearchParams.getDefaultFilters(),
          interval: decoded.interval,
          granularity: decoded.granularity,
          startDate: decoded.startDate,
          endDate: decoded.endDate,
        },
        tz,
      );
      params = Object.fromEntries(encoded);
    }

    expect(params.startDate).toBe('2026-09-20');
    expect(params.endDate).toBe('2026-09-22');
  });

  it('carries a sub-day range through the URL with its times', () => {
    const tz = 'America/New_York';
    const decoded = BAFilterSearchParams.decode(
      { interval: 'custom', startDate: '2026-09-20T14:00', endDate: '2026-09-20T18:00', granularity: 'minute_15' },
      tz,
    );

    expect(decoded.startDate).toEqual(moment.tz('2026-09-20 14:00', tz).toDate());
    expect(decoded.endDate).toEqual(moment.tz('2026-09-20 17:59:59', tz).toDate());
    expect(decoded.granularity).toBe('minute_15');

    const encoded = Object.fromEntries(
      BAFilterSearchParams.encode({ ...BAFilterSearchParams.getDefaultFilters(), ...decoded }, tz),
    );
    expect(encoded.startDate).toBe('2026-09-20T14:00');
    expect(encoded.endDate).toBe('2026-09-20T18:00');
  });

  it('keeps plain dates for a sub-day range that starts or ends at midnight', () => {
    const encoded = Object.fromEntries(
      BAFilterSearchParams.encode(
        {
          ...BAFilterSearchParams.getDefaultFilters(),
          interval: 'custom',
          startDate: moment.tz('2026-09-20 00:00', TZ).toDate(),
          endDate: moment.tz('2026-09-20 05:59:59', TZ).toDate(),
        },
        TZ,
      ),
    );
    expect(encoded.startDate).toBe('2026-09-20');
    expect(encoded.endDate).toBe('2026-09-20T06:00');

    const lateEvening = Object.fromEntries(
      BAFilterSearchParams.encode(
        {
          ...BAFilterSearchParams.getDefaultFilters(),
          interval: 'custom',
          startDate: moment.tz('2026-09-20 20:00', TZ).toDate(),
          endDate: moment.tz('2026-09-20 23:59:59', TZ).toDate(),
        },
        TZ,
      ),
    );
    expect(lateEvening.startDate).toBe('2026-09-20T20:00');
    expect(lateEvening.endDate).toBe('2026-09-20');
  });
});
