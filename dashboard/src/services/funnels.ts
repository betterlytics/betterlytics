'server-only';

import {
  type Funnel,
  type CreateFunnel,
  type FunnelDetails,
  FunnelDetailsSchema,
  FunnelPreview,
  FunnelPreviewSchema,
  FunnelStep,
  UpdateFunnel,
  UpdateFunnelSchema,
} from '@/entities/funnels';
import * as PostgresFunnelRepository from '@/repositories/postgres/funnels';
import * as ClickhouseFunnelRepository from '@/repositories/clickhouse/funnels';
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
          funnel.funnelSteps,
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

  console.log('FUNNEL:', funnel);

  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);

  const visitors = await ClickhouseFunnelRepository.getFunnelDetails(
    siteId,
    funnel.funnelSteps,
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

export async function createFunnelForDashboard(funnel: CreateFunnel) {
  return PostgresFunnelRepository.createFunnel(funnel);
}

export async function getFunnelPreviewData(
  siteId: string,
  funnelSteps: FunnelStep[],
  isStrict: boolean,
): Promise<FunnelPreview> {
  const endDate = endOfHour(new Date());
  const startDate = subHours(endDate, 24);

  const visitors = await ClickhouseFunnelRepository.getFunnelDetails(
    siteId,
    funnelSteps,
    isStrict,
    toDateTimeString(startDate),
    toDateTimeString(endDate),
  );

  return FunnelPreviewSchema.parse({
    funnelSteps,
    visitors,
    isStrict,
  });
}

export async function deleteFunnelFromDashboard(dashboardId: string, funnelId: string): Promise<void> {
  return PostgresFunnelRepository.deleteFunnelById(dashboardId, funnelId);
}

export async function updateFunnelForDashboard(funnel: UpdateFunnel): Promise<void> {
  const validatedFunnel = UpdateFunnelSchema.parse(funnel);
  return PostgresFunnelRepository.updateFunnel(validatedFunnel);
}
