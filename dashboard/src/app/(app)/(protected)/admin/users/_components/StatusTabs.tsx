import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { AdminUserStatus } from '@/entities/admin/adminUser.entities';

const TABS: Array<{ status: AdminUserStatus; label: string }> = [
  { status: 'active', label: 'Active' },
  { status: 'disabled', label: 'Disabled' },
  { status: 'deleted', label: 'Deleted' },
];

type StatusTabsProps = {
  active: AdminUserStatus;
  counts: Record<AdminUserStatus, number>;
  search?: string;
};

export function StatusTabs({ active, counts, search }: StatusTabsProps) {
  const hrefFor = (status: AdminUserStatus) => {
    const params = new URLSearchParams();
    if (status !== 'active') params.set('status', status);
    if (search) params.set('search', search);
    const query = params.toString();
    return query ? `/admin/users?${query}` : '/admin/users';
  };

  return (
    <nav aria-label='Filter users by status' className='bg-muted/50 inline-flex rounded-md border p-0.5'>
      {TABS.map(({ status, label }) => {
        const isActive = status === active;
        return (
          <Link
            key={status}
            href={hrefFor(status)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-1.5 rounded px-3 py-1 text-sm font-medium transition-colors',
              isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
            <span className='text-muted-foreground text-xs tabular-nums'>{counts[status]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
