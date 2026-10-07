import { describe, it, expect } from 'vitest';
import { getDashboardSwitchPathname } from './dashboardSwitchPathname';

function switchFrom(pathname: string, params: Record<string, string>, nextDashboardId = 'dash-b') {
  return getDashboardSwitchPathname({
    pathname,
    params: { dashboardId: 'dash-a', ...params },
    dashboardId: 'dash-a',
    nextDashboardId,
  });
}

describe('getDashboardSwitchPathname', () => {
  it('returns to the section list from an entity detail', () => {
    expect(switchFrom('/dashboard/dash-a/monitoring/mon-1', { monitorId: 'mon-1' })).toBe(
      '/dashboard/dash-b/monitoring',
    );
    expect(switchFrom('/dashboard/dash-a/status-pages/sp-1', { statusPageId: 'sp-1' })).toBe(
      '/dashboard/dash-b/status-pages',
    );
  });

  it('returns to the section list when the entity id sits below a static segment', () => {
    expect(switchFrom('/dashboard/dash-a/errors/detail/abc123', { fingerprint: 'abc123' })).toBe(
      '/dashboard/dash-b/errors',
    );
  });

  it('keeps the page on routes without an entity id', () => {
    expect(switchFrom('/dashboard/dash-a', {})).toBe('/dashboard/dash-b');
    expect(switchFrom('/dashboard/dash-a/pages', {})).toBe('/dashboard/dash-b/pages');
    expect(switchFrom('/dashboard/dash-a/settings/members', {})).toBe('/dashboard/dash-b/settings/members');
    expect(switchFrom('/dashboard/dash-a/settings', {})).toBe('/dashboard/dash-b/settings');
  });

  it('keeps the entity detail when the already-open dashboard is selected', () => {
    expect(switchFrom('/dashboard/dash-a/monitoring/mon-1', { monitorId: 'mon-1' }, 'dash-a')).toBe(
      '/dashboard/dash-a/monitoring/mon-1',
    );
  });

  it('leaves paths outside the dashboard root unchanged', () => {
    expect(switchFrom('/en/share/dash-a', { locale: 'en' })).toBe('/en/share/dash-a');
  });
});
