'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { getDismissedBannerIds, useBannerContext } from '@/contexts/BannerProvider';
import { useDashboardAlerts } from '@/hooks/use-dashboard-alerts';

const MONITOR_DOWN_PREFIX = 'monitor-down:';
const STATUS_PAGE_INCIDENT_PREFIX = 'status-page-incident:';

// A banner id lists the incidents it covers. Dismissing it stores that id, so a later banner stays
// hidden while every incident it covers was in some dismissed banner, and comes back for a new one.
function toBannerId(prefix: string, incidentIds: string[]): string {
  return prefix + [...incidentIds].sort().join(',');
}

function hasUndismissedIncident(prefix: string, incidentIds: string[]): boolean {
  const dismissed = new Set(
    getDismissedBannerIds()
      .filter((id) => id.startsWith(prefix))
      .flatMap((id) => id.slice(prefix.length).split(',')),
  );
  return incidentIds.some((id) => !dismissed.has(id));
}

export function MonitorDownBanner() {
  const t = useTranslations('banners.monitorDown');
  const alerts = useDashboardAlerts();
  const { addBanner, removeBanner } = useBannerContext();

  useEffect(() => {
    const downMonitors = alerts?.downMonitors ?? [];
    const incidentIds = downMonitors.map((monitor) => monitor.incidentId);
    if (!incidentIds.length || !hasUndismissedIncident(MONITOR_DOWN_PREFIX, incidentIds)) return;

    const id = toBannerId(MONITOR_DOWN_PREFIX, incidentIds);
    const single = downMonitors.length === 1 ? downMonitors[0] : null;

    addBanner({
      id,
      level: 'error',
      title: single ? t('titleSingle', { name: single.name }) : t('titleMultiple', { count: downMonitors.length }),
      description: single ? undefined : downMonitors.map((monitor) => monitor.name).join(', '),
      action: (
        <Button
          asChild
          variant='default'
          size='sm'
          className='text-primary-foreground cursor-pointer border-1 border-white bg-red-500 shadow-md hover:bg-red-400'
        >
          <FilterPreservingLink href={single ? `/monitoring/${single.monitorId}` : '/monitoring'}>
            {single ? t('viewMonitor') : t('viewMonitors')}
          </FilterPreservingLink>
        </Button>
      ),
      dismissible: true,
      scope: 'global',
      sticky: true,
    });

    return () => removeBanner(id);
  }, [alerts, addBanner, removeBanner, t]);

  return null;
}

export function StatusPageIncidentBanner() {
  const t = useTranslations('banners.statusPageIncident');
  const alerts = useDashboardAlerts();
  const { addBanner, removeBanner } = useBannerContext();

  useEffect(() => {
    const incidents = alerts?.statusPageIncidents ?? [];
    const incidentIds = incidents.map((incident) => incident.incidentId);
    if (!incidentIds.length || !hasUndismissedIncident(STATUS_PAGE_INCIDENT_PREFIX, incidentIds)) return;

    const id = toBannerId(STATUS_PAGE_INCIDENT_PREFIX, incidentIds);
    const single = incidents.length === 1 ? incidents[0] : null;

    addBanner({
      id,
      level: 'info',
      title: single
        ? t('titleSingle', { statusPage: single.statusPageName })
        : t('titleMultiple', { count: incidents.length }),
      description: single ? single.title : incidents.map((incident) => incident.title).join(', '),
      action: (
        <Button
          asChild
          variant='default'
          size='sm'
          className='bg-primary text-primary-foreground hover:bg-primary/40 cursor-pointer border-1 border-white shadow-md'
        >
          <FilterPreservingLink
            href={single ? `/status-pages/${single.statusPageId}?incident=${single.incidentId}` : '/status-pages'}
          >
            {single ? t('viewIncident') : t('viewIncidents')}
          </FilterPreservingLink>
        </Button>
      ),
      dismissible: true,
      scope: 'global',
    });

    return () => removeBanner(id);
  }, [alerts, addBanner, removeBanner, t]);

  return null;
}
