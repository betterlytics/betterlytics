import { Badge } from '@/components/ui/badge';
import type { AdminUserStatus } from '@/entities/admin/adminUser.entities';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<AdminUserStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'border-green-500/30 bg-green-500/15 text-green-600 dark:text-green-400' },
  disabled: { label: 'Disabled', className: 'border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  deleted: { label: 'Deleted', className: 'bg-muted text-muted-foreground border-border' },
};

export function UserStatusBadge({ status }: { status: AdminUserStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <Badge variant='outline' className={style.className}>
      {style.label}
    </Badge>
  );
}

export function UserRoleBadge({ label, highlighted }: { label: string; highlighted: boolean }) {
  return (
    <Badge
      variant='outline'
      className={cn(
        highlighted
          ? 'border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400'
          : 'bg-muted text-muted-foreground border-border',
      )}
    >
      {label}
    </Badge>
  );
}
