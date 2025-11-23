'use client';

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

type DashboardNavigationContextValue = {
  basePath: string;
  rawBasePath: string;
  dashboardId: string;
  isDemo: boolean;
  dashboardRootPath: string;
  resolveHref: (href: string) => string;
  buildHrefForDashboard: (targetDashboardId: string, href?: string) => string;
};

const DashboardNavigationContext = createContext<DashboardNavigationContextValue | null>(null);

type DashboardNavigationProviderProps = {
  basePath: string;
  dashboardId: string;
  isDemo?: boolean;
  children: ReactNode;
};

const ABSOLUTE_PROTOCOL_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;

export function DashboardNavigationProvider({
  basePath,
  dashboardId,
  isDemo = false,
  children,
}: DashboardNavigationProviderProps) {
  const value = useMemo<DashboardNavigationContextValue>(() => {
    const normalizedBasePath = normalizeBasePath(basePath);
    const basePathSegments = toSegments(normalizedBasePath);
    const basePathWithLeadingSlash = normalizedBasePath ? `/${normalizedBasePath}` : '';

    const resolveHref = (href: string) => createDashboardHref({ basePathSegments, dashboardId, href });

    const buildHrefForDashboard = (targetDashboardId: string, href = '') =>
      createDashboardHref({ basePathSegments, dashboardId: targetDashboardId, href });

    return {
      basePath: basePathWithLeadingSlash,
      rawBasePath: basePath,
      dashboardId,
      isDemo,
      dashboardRootPath: createDashboardHref({ basePathSegments, dashboardId, href: '' }),
      resolveHref,
      buildHrefForDashboard,
    };
  }, [basePath, dashboardId, isDemo]);

  return <DashboardNavigationContext.Provider value={value}>{children}</DashboardNavigationContext.Provider>;
}

export function useDashboardNavigation(): DashboardNavigationContextValue {
  const context = useContext(DashboardNavigationContext);
  if (!context) {
    throw new Error('useDashboardNavigation must be used within a DashboardNavigationProvider');
  }
  return context;
}

export function useOptionalDashboardNavigation(): DashboardNavigationContextValue | null {
  return useContext(DashboardNavigationContext);
}

function normalizeBasePath(basePath: string): string {
  return basePath.replace(/(^\/+|\/+$)/g, '');
}

function toSegments(path: string): string[] {
  return path.split('/').filter(Boolean);
}

function isExternalHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed) {
    return false;
  }

  return ABSOLUTE_PROTOCOL_REGEX.test(trimmed) || trimmed.startsWith('//');
}

type CreateDashboardHrefArgs = {
  basePathSegments: string[];
  dashboardId: string;
  href: string;
};

function createDashboardHref({ basePathSegments, dashboardId, href }: CreateDashboardHrefArgs): string {
  if (!dashboardId) {
    throw new Error('DashboardNavigationProvider requires a dashboardId to resolve routes.');
  }

  const trimmedHref = href.trim();
  if (!trimmedHref) {
    return buildPath(basePathSegments, dashboardId, []);
  }

  if (isExternalHref(trimmedHref)) {
    return trimmedHref;
  }

  const url = new URL(trimmedHref, 'http://placeholder');
  let pathSegments = url.pathname.split('/').filter(Boolean);

  if (basePathSegments.length > 0 && hasLeadingSegments(pathSegments, basePathSegments)) {
    pathSegments = pathSegments.slice(basePathSegments.length);
  }

  if (pathSegments.length > 0 && pathSegments[0] === dashboardId) {
    pathSegments = pathSegments.slice(1);
  }

  const finalPath = buildPath(basePathSegments, dashboardId, pathSegments);
  return `${finalPath}${url.search}${url.hash}`;
}

function hasLeadingSegments(pathSegments: string[], leadingSegments: string[]): boolean {
  if (leadingSegments.length === 0) {
    return false;
  }

  if (leadingSegments.length > pathSegments.length) {
    return false;
  }

  return leadingSegments.every((segment, index) => pathSegments[index] === segment);
}

function buildPath(basePathSegments: string[], dashboardId: string, remainingSegments: string[]): string {
  const segments = [...basePathSegments, dashboardId, ...remainingSegments].filter(Boolean);
  return `/${segments.join('/')}`;
}
