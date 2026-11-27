'use client';

import { useState, useTransition } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  removeDashboardFromMcpConnectionAction,
  removeDashboardFromMcpTokenAction,
} from '@/app/actions/dashboard/mcpToken.action';
import { DestructiveActionDialog } from '@/components/dialogs';
import { useLocale, useTranslations } from 'next-intl';
import type { DashboardMcpToken } from '@/entities/dashboard/mcpToken.entities';
import type { DashboardMcpConnection } from '@/services/auth/mcpConnections.service';
import { formatLocalDateTime } from '@/utils/dateFormatters';

type AccessItem = {
  kind: 'connection' | 'token';
  id: string;
  name: string;
  // a connection's client: self-registered ones name themselves, so they are marked and show their host
  verified?: boolean;
  host?: string | null;
  member: string;
  // connected or created
  since: Date | null;
  lastUsedAt: Date | null;
  // undefined for a connection, which doesn't expire
  expiresAt?: Date | null;
};

interface McpAccessListProps {
  dashboardId: string;
  connections: DashboardMcpConnection[];
  tokens: DashboardMcpToken[];
}

/** Members' OAuth connections and personal tokens that can read this dashboard, for owners and admins to cut off. */
export function McpAccessList({ dashboardId, connections, tokens }: McpAccessListProps) {
  const t = useTranslations('mcp');
  const tAccess = useTranslations('components.userSettings.aiAccess');
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  // kept after closing, so the dialog keeps its name while it fades out
  const [removing, setRemoving] = useState<AccessItem | null>(null);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);

  const items: AccessItem[] = [
    ...connections.map((connection): AccessItem => ({
      kind: 'connection',
      id: connection.consentId,
      name: connection.name,
      verified: connection.verified,
      host: connection.host,
      member: connection.member.name || connection.member.email,
      since: connection.connectedAt,
      lastUsedAt: connection.lastUsedAt,
    })),
    ...tokens.map((token): AccessItem => ({
      kind: 'token',
      id: token.id,
      name: token.name,
      member: token.creator.name || token.creator.email,
      since: token.createdAt,
      lastUsedAt: token.lastUsedAt,
      expiresAt: token.expiresAt,
    })),
  ].sort((a, b) => (b.since?.getTime() ?? 0) - (a.since?.getTime() ?? 0));

  const handleRemove = () => {
    if (!removing) return;
    const { kind, id, name } = removing;
    startTransition(async () => {
      try {
        if (kind === 'connection') await removeDashboardFromMcpConnectionAction(dashboardId, id);
        else await removeDashboardFromMcpTokenAction(dashboardId, id);
        setIsRemoveOpen(false);
        toast.success(t('toast.removed', { name }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('toast.removeError'));
      }
    });
  };

  const formatDate = (date: Date) =>
    formatLocalDateTime(date, locale, { year: 'numeric', month: 'short', day: 'numeric' }) ?? '';

  if (items.length === 0) {
    return <p className='text-muted-foreground px-1 py-2 text-sm'>{t('access.empty')}</p>;
  }

  return (
    <>
      <div className='divide-border divide-y rounded-md border'>
        {items.map((item) => (
          <div key={`${item.kind}:${item.id}`} className='flex items-center gap-3 px-4 py-3'>
            <div className='min-w-0 flex-1'>
              {/* the badges wrap below a name that doesn't fit beside them, so short names never truncate */}
              <div className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1'>
                <p className='truncate text-sm font-medium' title={item.name}>
                  {item.name}
                </p>
                <Badge variant='outline' className='text-muted-foreground shrink-0'>
                  {t(`access.kind.${item.kind}`)}
                </Badge>
                {item.verified === false && (
                  <Badge variant='outline' className='text-muted-foreground shrink-0'>
                    {tAccess('unverified')}
                  </Badge>
                )}
              </div>
              {item.host && (
                <p className='text-muted-foreground truncate font-mono text-xs' title={item.host}>
                  {item.host}
                </p>
              )}
              <p className='text-muted-foreground truncate text-xs'>{t('access.member', { name: item.member })}</p>
              <p className='text-muted-foreground flex flex-wrap gap-x-3 text-xs'>
                {item.since && (
                  <span>
                    {item.kind === 'connection'
                      ? t('access.connected', { date: formatDate(item.since) })
                      : t('access.created', { date: formatDate(item.since) })}
                  </span>
                )}
                <span>
                  {item.lastUsedAt
                    ? t('access.lastUsed', { date: formatDate(item.lastUsedAt) })
                    : t('access.neverUsed')}
                </span>
                {item.expiresAt !== undefined && (
                  <TokenExpiry expiresAt={item.expiresAt} formatDate={formatDate} />
                )}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-8 shrink-0 cursor-pointer'
                  disabled={isPending}
                  aria-label={tAccess('actions', { name: item.name })}
                >
                  <MoreHorizontal className='size-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  className='text-destructive focus:text-destructive cursor-pointer'
                  onClick={() => {
                    setRemoving(item);
                    setIsRemoveOpen(true);
                  }}
                >
                  {t('access.remove')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <DestructiveActionDialog
        open={isRemoveOpen}
        onOpenChange={setIsRemoveOpen}
        title={t('removeDialog.title', { name: removing?.name ?? '' })}
        description={
          removing?.kind === 'connection'
            ? t('removeDialog.connectionDescription', { name: removing.name })
            : t('removeDialog.tokenDescription', { name: removing?.name ?? '' })
        }
        cancelLabel={t('removeDialog.cancel')}
        confirmLabel={t('removeDialog.confirm')}
        onConfirm={handleRemove}
        isPending={isPending}
      />
    </>
  );
}

function TokenExpiry({ expiresAt, formatDate }: { expiresAt: Date | null; formatDate: (date: Date) => string }) {
  const t = useTranslations('mcp.access');
  if (expiresAt === null) return <span>{t('neverExpires')}</span>;
  if (expiresAt < new Date()) {
    return <span className='text-destructive font-medium'>{t('expired', { date: formatDate(expiresAt) })}</span>;
  }
  return <span>{t('expires', { date: formatDate(expiresAt) })}</span>;
}
