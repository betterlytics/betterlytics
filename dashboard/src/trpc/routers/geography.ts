import { z } from 'zod';
import { createRouter, analyticsProcedure } from '@/trpc/init';
import { GeoLevelSchema, type GeoVisitor, type GeoLevel } from '@/entities/analytics/geography.entities';
import { fetchVisitorsByGeoLevel, fetchCompareVisitorsByGeoLevel } from '@/services/analytics/geography.service';
import { getEnabledGeoLevels } from '@/lib/geoLevels';
import { CountryCodeFormat, dataToWorldMap } from '@/presenters/toWorldMap';
import { toDataTable } from '@/presenters/toDataTable';

const GEO_VISITS_LIMIT = 10;

export const geographyRouter = createRouter({
  geoVisits: analyticsProcedure
    .input(
      z.object({
        level: GeoLevelSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const enabledLevels = getEnabledGeoLevels();
      if (!enabledLevels.includes(input.level)) return [];

      const { main, compare } = ctx;
      const geoVisitors = await fetchVisitorsByGeoLevel(main, input.level, GEO_VISITS_LIMIT);

      const compoundKey: GeoLevel[] =
        input.level === 'country_code'
          ? [input.level]
          : input.level === 'subdivision_code'
            ? [input.level, 'country_code']
            : [input.level, 'subdivision_code', 'country_code'];

      const topKeys = geoVisitors
        .map((r) => compoundKey.map((k) => r[k]))
        .filter((v) => v.reduce((acc, curr) => acc && Boolean(curr), true)) as Array<string>[];

      const compareGeoVisitors =
        compare && topKeys.length > 0
          ? await fetchCompareVisitorsByGeoLevel(compare, input.level, topKeys)
          : undefined;

      return toDataTable({
        data: geoVisitors as (GeoVisitor & Record<GeoLevel, string>)[],
        compare: compareGeoVisitors as (GeoVisitor & Record<GeoLevel, string>)[] | null | undefined,
        categoryKey: compoundKey,
      });
    }),

  worldMap: analyticsProcedure.query(async ({ ctx }) => {
    const enabledLevels = getEnabledGeoLevels();
    if (!enabledLevels.includes('country_code')) {
      return { visitorData: [], compareData: [], maxVisitors: 0 };
    }

    const { main, compare } = ctx;
    const geoVisitors = await fetchVisitorsByGeoLevel(main, 'country_code');
    const compareGeoVisitors = compare && (await fetchVisitorsByGeoLevel(compare, 'country_code'));

    return dataToWorldMap(geoVisitors, compareGeoVisitors ?? [], CountryCodeFormat.Original);
  }),
});
