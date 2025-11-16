'use client';

import Link, { LinkProps } from 'next/link';
import { useNavigateWithFilters } from '@/hooks/use-navigate-with-filters';
import { ReactNode, forwardRef, useMemo } from 'react';
import { usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useOptionalDashboardNavigation } from '@/contexts/DashboardNavigationContext';

interface FilterPreservingLinkProps extends Omit<LinkProps, 'href'> {
  href: string;
  children: ReactNode;
  className?: string;
  highlightOnPage?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * A Link component that automatically preserves current search parameters (filters)
 * when navigating to dashboard routes. When used within a DashboardNavigationProvider,
 * relative dashboard paths like "devices" or "/devices" are resolved automatically.
 */
export const FilterPreservingLink = forwardRef<HTMLAnchorElement, FilterPreservingLinkProps>(
  ({ href, children, className, onClick, highlightOnPage, ...linkProps }, ref) => {
    const { getHrefWithFilters } = useNavigateWithFilters();
    const navigation = useOptionalDashboardNavigation();
    const resolvedHref = useMemo(() => (navigation ? navigation.resolveHref(href) : href), [navigation, href]);

    const hrefWithFilters = getHrefWithFilters(resolvedHref);

    const pathname = usePathname();
    const isOnPage = highlightOnPage && stripQueryAndHash(resolvedHref) === stripQueryAndHash(pathname);

    return (
      <Link
        ref={ref}
        href={hrefWithFilters}
        className={cn(className, isOnPage && 'border-primary bg-secondary border-l-[3px]')}
        onClick={onClick}
        {...linkProps}
      >
        {children}
      </Link>
    );
  },
);

FilterPreservingLink.displayName = 'FilterPreservingLink';

function stripQueryAndHash(value: string): string {
  const url = new URL(value, 'http://placeholder');
  return url.pathname;
}
