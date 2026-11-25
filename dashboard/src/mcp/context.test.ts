import { describe, it, expect } from 'vitest';
import {
  AI_ACCESS_DISABLED,
  AI_ACCESS_DISABLED_ALL,
  DASHBOARD_ID_REQUIRED,
  DASHBOARD_NOT_FOUND,
  listDashboards,
  resolveDashboard,
  type McpContext,
} from '@/mcp/context';

const SHOP = { dashboardId: 'dash-shop', siteId: 'site-shop', domain: 'shop.example.com', role: 'owner' as const };
const BLOG = {
  dashboardId: 'dash-blog',
  siteId: 'site-blog',
  domain: 'blog.example.com',
  role: 'viewer' as const,
};

const single: McpContext = { credentialId: 'mcp-token:1', dashboards: [SHOP], aiAccessDisabledDashboardIds: [] };
const several: McpContext = {
  credentialId: 'mcp-token:2',
  dashboards: [SHOP, BLOG],
  aiAccessDisabledDashboardIds: [],
};
// granted the blog too, whose owners turned AI access off
const blogOff: McpContext = {
  credentialId: 'mcp-token:4',
  dashboards: [SHOP],
  aiAccessDisabledDashboardIds: ['dash-blog'],
};

describe('resolveDashboard', () => {
  it('uses the only dashboard when no dashboardId is given', () => {
    expect(resolveDashboard(single, undefined)).toBe(SHOP);
  });

  it("accepts the only dashboard's own id", () => {
    expect(resolveDashboard(single, 'dash-shop')).toBe(SHOP);
  });

  it('rejects any other id when there is one dashboard', () => {
    expect(() => resolveDashboard(single, 'dash-blog')).toThrow(DASHBOARD_NOT_FOUND);
  });

  it('picks the requested dashboard out of several', () => {
    expect(resolveDashboard(several, 'dash-shop')).toBe(SHOP);
    expect(resolveDashboard(several, 'dash-blog')).toBe(BLOG);
  });

  it('asks for dashboardId and points to list_dashboards when several are allowed and none is given', () => {
    expect(() => resolveDashboard(several, undefined)).toThrow(DASHBOARD_ID_REQUIRED);
    expect(DASHBOARD_ID_REQUIRED).toContain('dashboardId');
    expect(DASHBOARD_ID_REQUIRED).toContain('list_dashboards');
  });

  it('gives an id outside the allowed set the same error as an unknown one', () => {
    expect(() => resolveDashboard(several, 'dash-someone-else')).toThrow(new Error(DASHBOARD_NOT_FOUND));
    expect(() => resolveDashboard(several, '')).toThrow(new Error(DASHBOARD_NOT_FOUND));
  });

  it('names AI access as turned off for a granted dashboard whose owners turned it off', () => {
    expect(() => resolveDashboard(blogOff, 'dash-blog')).toThrow(new Error(AI_ACCESS_DISABLED));
    expect(AI_ACCESS_DISABLED).toContain('turned off');
    expect(AI_ACCESS_DISABLED).toContain('owners or admins');
  });

  it('still reads the other dashboards, and uses the only readable one when no dashboardId is given', () => {
    expect(resolveDashboard(blogOff, 'dash-shop')).toBe(SHOP);
    expect(resolveDashboard(blogOff, undefined)).toBe(SHOP);
  });

  it('names AI access as turned off when no granted dashboard can be read', () => {
    const allOff = (ids: string[]): McpContext => ({
      credentialId: 'mcp-token:5',
      dashboards: [],
      aiAccessDisabledDashboardIds: ids,
    });
    expect(() => resolveDashboard(allOff(['dash-shop']), undefined)).toThrow(new Error(AI_ACCESS_DISABLED));
    expect(() => resolveDashboard(allOff(['dash-shop', 'dash-blog']), undefined)).toThrow(
      new Error(AI_ACCESS_DISABLED_ALL),
    );
    expect(() => resolveDashboard(allOff([]), undefined)).toThrow(new Error(DASHBOARD_NOT_FOUND));
  });

  it("doesn't reveal AI access on a dashboard the credential wasn't granted", () => {
    expect(() => resolveDashboard(blogOff, 'dash-someone-else')).toThrow(new Error(DASHBOARD_NOT_FOUND));
  });
});

describe('listDashboards', () => {
  it('returns id, domain and role for every allowed dashboard, in context order', () => {
    expect(listDashboards(several)).toEqual({
      dashboards: [
        { id: 'dash-shop', domain: 'shop.example.com', role: 'owner' },
        { id: 'dash-blog', domain: 'blog.example.com', role: 'viewer' },
      ],
    });
  });

  it('returns an empty role when the token creator has left the dashboard', () => {
    expect(
      listDashboards({
        credentialId: 'mcp-token:3',
        dashboards: [{ ...SHOP, role: null }],
        aiAccessDisabledDashboardIds: [],
      }),
    ).toEqual({
      dashboards: [{ id: 'dash-shop', domain: 'shop.example.com', role: null }],
    });
  });

  it('leaves out dashboards whose AI access is off', () => {
    expect(listDashboards(blogOff)).toEqual({
      dashboards: [{ id: 'dash-shop', domain: 'shop.example.com', role: 'owner' }],
    });
  });
});
