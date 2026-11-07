import { describe, it, expect } from 'vitest';
import {
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

const single: McpContext = { credentialId: 'mcp-token:1', dashboards: [SHOP] };
const several: McpContext = { credentialId: 'mcp-token:2', dashboards: [SHOP, BLOG] };

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
    expect(listDashboards({ credentialId: 'mcp-token:3', dashboards: [{ ...SHOP, role: null }] })).toEqual({
      dashboards: [{ id: 'dash-shop', domain: 'shop.example.com', role: null }],
    });
  });
});
