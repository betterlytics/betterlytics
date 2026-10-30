import { describe, expect, it } from 'vitest';
import {
  clearRegion,
  drilldownFromParams,
  parseCountryParam,
  parseRegionParam,
  queriedCountry,
  sameDrilldown,
  toggleCountry,
  toggleRegion,
} from '@/components/map/panel/drilldown-state';

describe('parseCountryParam', () => {
  it('accepts a known two-letter country code', () => {
    expect(parseCountryParam('DK')).toBe('DK');
  });

  it('rejects everything else', () => {
    expect(parseCountryParam(null)).toBeUndefined();
    expect(parseCountryParam(undefined)).toBeUndefined();
    expect(parseCountryParam('')).toBeUndefined();
    expect(parseCountryParam('dk')).toBeUndefined();
    expect(parseCountryParam('DNK')).toBeUndefined();
    expect(parseCountryParam('D1')).toBeUndefined();
    expect(parseCountryParam('ZZ')).toBeUndefined();
  });
});

describe('parseRegionParam', () => {
  it('accepts a region id of the selected country', () => {
    expect(parseRegionParam('DK-84', 'DK')).toBe('DK-84');
    expect(parseRegionParam('US-CA', 'US')).toBe('US-CA');
    expect(parseRegionParam('BF-CASCADES~', 'BF')).toBe('BF-CASCADES~');
  });

  it('rejects ids outside the selected country and malformed values', () => {
    expect(parseRegionParam('DK-84', undefined)).toBeUndefined();
    expect(parseRegionParam('DK-84', 'SE')).toBeUndefined();
    expect(parseRegionParam(null, 'DK')).toBeUndefined();
    expect(parseRegionParam('', 'DK')).toBeUndefined();
    expect(parseRegionParam('DK', 'DK')).toBeUndefined();
    expect(parseRegionParam('DK-', 'DK')).toBeUndefined();
    expect(parseRegionParam('dk-84', 'DK')).toBeUndefined();
    expect(parseRegionParam('DK-8 4', 'DK')).toBeUndefined();
    expect(parseRegionParam('DK-ABCDEFGHIJKLMNOPQ', 'DK')).toBeUndefined();
  });
});

describe('drilldownFromParams', () => {
  it('drops a region whose country is missing or different', () => {
    expect(drilldownFromParams('DK', 'DK-84')).toEqual({ countryCode: 'DK', regionCode: 'DK-84' });
    expect(drilldownFromParams(undefined, 'DK-84')).toEqual({ countryCode: undefined, regionCode: undefined });
    expect(drilldownFromParams('SE', 'DK-84')).toEqual({ countryCode: 'SE', regionCode: undefined });
  });
});

describe('transitions', () => {
  it('toggles the country and drops the region with it', () => {
    expect(toggleCountry({}, 'DK')).toEqual({ countryCode: 'DK' });
    expect(toggleCountry({ countryCode: 'DK', regionCode: 'DK-84' }, 'DK')).toEqual({});
    expect(toggleCountry({ countryCode: 'DK', regionCode: 'DK-84' }, 'SE')).toEqual({ countryCode: 'SE' });
  });

  it('toggles a region only while a country is selected', () => {
    expect(toggleRegion({ countryCode: 'DK' }, 'DK-84')).toEqual({ countryCode: 'DK', regionCode: 'DK-84' });
    expect(toggleRegion({ countryCode: 'DK', regionCode: 'DK-84' }, 'DK-84')).toEqual({ countryCode: 'DK' });
    const closed = {};
    expect(toggleRegion(closed, 'DK-84')).toBe(closed);
  });

  it('clears the region and keeps the state identity when there is none', () => {
    expect(clearRegion({ countryCode: 'DK', regionCode: 'DK-84' })).toEqual({ countryCode: 'DK' });
    const withoutRegion = { countryCode: 'DK' };
    expect(clearRegion(withoutRegion)).toBe(withoutRegion);
  });

  it('compares drilldowns by value', () => {
    expect(sameDrilldown({ countryCode: 'DK' }, { countryCode: 'DK' })).toBe(true);
    expect(sameDrilldown({ countryCode: 'DK' }, { countryCode: 'DK', regionCode: 'DK-84' })).toBe(false);
  });
});

describe('queriedCountry', () => {
  it('reads the country from a tRPC query key', () => {
    expect(
      queriedCountry([['geography', 'subdivisionMap'], { input: { countryCode: 'NO' }, type: 'query' }]),
    ).toBe('NO');
  });

  it('is undefined without a previous query or an input', () => {
    expect(queriedCountry(undefined)).toBeUndefined();
    expect(queriedCountry([['geography', 'subdivisionMap']])).toBeUndefined();
  });
});
