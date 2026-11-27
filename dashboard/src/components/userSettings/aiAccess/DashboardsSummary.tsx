'use client';

import { useTranslations } from 'next-intl';

interface DashboardsSummaryProps {
  dashboards: { domain: string; aiAccessEnabled: boolean }[];
  // set for a connection with All dashboards: the domains owners or admins removed from it
  allDashboardsExcept?: string[];
}

/** The first dashboard and how many more, then the ones whose AI access is off. */
export default function DashboardsSummary({ dashboards, allDashboardsExcept }: DashboardsSummaryProps) {
  const t = useTranslations('components.userSettings.aiAccess');
  const domains = dashboards.map((dashboard) => dashboard.domain);
  const aiAccessOff = dashboards
    .filter((dashboard) => !dashboard.aiAccessEnabled)
    .map((dashboard) => dashboard.domain);
  const allDashboards = allDashboardsExcept !== undefined;
  const more = allDashboards ? 0 : domains.length - 1;

  let label = domains[0] ?? t('noDashboards');
  let title: string | undefined = domains.join(', ');
  if (allDashboards) {
    const excluded = allDashboardsExcept.length;
    label = excluded > 0 ? t('allDashboardsExcept', { count: excluded }) : t('allDashboards');
    title = excluded > 0 ? t('removedDashboards', { domains: allDashboardsExcept.join(', ') }) : undefined;
  }

  return (
    <>
      {/* the first name truncates, the count after it doesn't, so the cell never hides how many there are */}
      <div className='flex min-w-0 gap-1' title={title}>
        <span className='truncate'>{label}</span>
        {more > 0 && <span className='shrink-0'>{t('moreDashboards', { count: more })}</span>}
      </div>
      {aiAccessOff.length > 0 && (
        <p className='text-muted-foreground truncate text-xs' title={aiAccessOff.join(', ')}>
          {t('aiAccessOffDashboards', { domains: aiAccessOff.join(', ') })}
        </p>
      )}
    </>
  );
}
