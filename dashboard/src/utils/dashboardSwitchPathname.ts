type RouteParams = Readonly<Record<string, string | string[] | undefined>>;

type DashboardSwitchPathnameArgs = {
  pathname: string;
  params: RouteParams;
  dashboardId: string;
  nextDashboardId: string;
};

export function getDashboardSwitchPathname({
  pathname,
  params,
  dashboardId,
  nextDashboardId,
}: DashboardSwitchPathnameArgs): string {
  const currentRoot = `/dashboard/${dashboardId}`;
  const nextRoot = `/dashboard/${nextDashboardId}`;
  const isEntityRoute = Object.keys(params).some((key) => key !== 'dashboardId');

  if (nextDashboardId === dashboardId || !isEntityRoute || !pathname.startsWith(`${currentRoot}/`)) {
    return pathname.replace(currentRoot, nextRoot);
  }

  const [section] = pathname.slice(currentRoot.length + 1).split('/');
  return `${nextRoot}/${section}`;
}
