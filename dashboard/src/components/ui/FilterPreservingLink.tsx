'use client';

import Link, { LinkProps } from 'next/link';
import { useNavigateWithFilters } from '@/hooks/use-navigate-with-filters';
import { ReactNode, forwardRef } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface FilterPreservingLinkProps extends Omit<LinkProps, 'href'> {
  href: string;
  children: ReactNode;
  className?: string;
  highlightOnPage?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * A Link component that automatically preserves current search parameters (filters)
 * when navigating to dashboard routes
 */
export const FilterPreservingLink = forwardRef<HTMLAnchorElement, FilterPreservingLinkProps>(
  ({ href, children, className, onClick, highlightOnPage, ...linkProps }, ref) => {
    const { getHrefWithFilters } = useNavigateWithFilters();

    const hrefWithFilters = getHrefWithFilters(href);

    const pathname = usePathname();
    const isOnPage = highlightOnPage && href === pathname;

    return (
      <Link
        ref={ref}
        href={hrefWithFilters}
        className={cn(className, isOnPage && 'bg-muted')}
        onClick={onClick}
        {...linkProps}
      >
        {children}
      </Link>
    );
  },
);

FilterPreservingLink.displayName = 'FilterPreservingLink';
