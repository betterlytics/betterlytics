'server-only';

import { type Funnel, type CreateFunnel, FunnelDetails, FunnelDetailsSchema } from '@/entities/funnels';
import * as PostgresFunnelRepository from '@/repositories/postgres/funnels';
import * as ClickhouseFunnelRepository from '@/repositories/clickhouse/funnels';

export async function getFunnelsBySiteId(siteId: string): Promise<FunnelDetails[]> {
  const funnels = await PostgresFunnelRepository.getFunnelsBySiteId(siteId);
  
  const funnelsDetails = await Promise.all(
      funnels.map(async (funnel) => (
        FunnelDetailsSchema.parse({
          ...funnel,
          visitors: await ClickhouseFunnelRepository.getFunnelDetails(siteId, funnel.pages)
        })
      ))
  );
  return funnelsDetails;
}

export async function getFunnelDetailsById(siteId: string, funnelId: string): Promise<FunnelDetails | null> {
  const funnel = await PostgresFunnelRepository.getFunnelById(funnelId);

  if (funnel === null) {
    return null;
  }

  const visitors = await ClickhouseFunnelRepository.getFunnelDetails(siteId, funnel.pages);

  return FunnelDetailsSchema.parse({
    ...funnel,
    visitors
  });
}

export async function createFunnelForSite(funnel: CreateFunnel): Promise<Funnel> {
  return PostgresFunnelRepository.createFunnel(funnel);
}
