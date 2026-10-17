'use client';

import { forwardRef, type ComponentProps } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type AdminNavLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

export const AdminNavLink = forwardRef<HTMLAnchorElement, AdminNavLinkProps>(
  ({ href, className, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = pathname === href || pathname.startsWith(`${href}/`);

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(className, isActive && 'border-primary bg-secondary border-l-[3px]')}
        {...props}
      />
    );
  },
);

AdminNavLink.displayName = 'AdminNavLink';
