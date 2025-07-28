'server-only';

import {
  type Funnel,
  type CreateFunnel,
  type FunnelDetails,
  FunnelDetailsSchema,
  FunnelPreview,
  FunnelPreviewSchema,
} from '@/entities/funnels';
import * as PostgresFunnelRepository from '@/repositories/postgres/funnels';
import * as ClickhouseFunnelRepository from '@/repositories/clickhouse/funnels';
import { type QueryFilter } from '@/entities/filter';
import { subHours, endOfHour } from 'date-fns';
import { toDateTimeString } from '@/utils/dateFormatters';

export async function getFunnelsByDashboardId(
  dashboardId: string,
  siteId: string,
  startDate: Date,
  endDate: Date,
): Promise<FunnelDetails[]> {
  const funnels = await PostgresFunnelRepository.getFunnelsByDashboardId(dashboardId);

  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);

  const funnelsDetails = await Promise.all(
    funnels.map(async (funnel: Funnel) =>
      FunnelDetailsSchema.parse({
        ...funnel,
        visitors: await ClickhouseFunnelRepository.getFunnelDetails(
          siteId,
          funnel.queryFilters,
          funnel.isStrict,
          formattedStart,
          formattedEnd,
        ),
      }),
    ),
  );
  return funnelsDetails;
}

export async function getFunnelDetailsById(
  siteId: string,
  funnelId: string,
  startDate: Date,
  endDate: Date,
): Promise<FunnelDetails | null> {
  const funnel = await PostgresFunnelRepository.getFunnelById(funnelId);

  if (funnel === null) {
    return null;
  }

  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);

  const visitors = await ClickhouseFunnelRepository.getFunnelDetails(
    siteId,
    funnel.queryFilters,
    funnel.isStrict,
    formattedStart,
    formattedEnd,
  );

  return FunnelDetailsSchema.parse({
    ...funnel,
    visitors,
    isStrict: funnel.isStrict,
  });
}

export async function createFunnelForDashboard(funnel: CreateFunnel): Promise<Funnel> {
  return PostgresFunnelRepository.createFunnel(funnel);
}

export async function getFunnelPreviewData(
  siteId: string,
  queryFilters: QueryFilter[],
  isStrict: boolean,
): Promise<FunnelPreview> {
  const endDate = endOfHour(new Date());
  const startDate = subHours(endDate, 24);

  const visitors = await ClickhouseFunnelRepository.getFunnelDetails(
    siteId,
    queryFilters,
    isStrict,
    toDateTimeString(startDate),
    toDateTimeString(endDate),
  );

  return FunnelPreviewSchema.parse({
    queryFilters,
    visitors,
    isStrict,
  });
}
