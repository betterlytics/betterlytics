'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DestructiveActionDialog } from '@/components/dialogs';
import ExternalLink from '@/components/ExternalLink';
import UserSettingsSection from '@/components/userSettings/shared/UserSettingsSection';
import EditConnectionDashboardsDialog from '@/components/userSettings/aiAccess/EditConnectionDashboardsDialog';
import { listMcpConnectionsAction, revokeMcpConnectionAction } from '@/app/actions/account/mcpConnections.action';
import type { McpConnection, McpConnectionsOverview } from '@/services/auth/mcpConnections.service';
import { formatLocalDateTime } from '@/utils/dateFormatters';

const MCP_SETUP_DOCS_URL = 'https://betterlytics.io/docs/dashboard/mcp';
const SHOWN_DASHBOARDS = 3;
const MCP_CONNECTIONS_QUERY_KEY = ['mcpConnections'] as const;

export default function UserAiAccessSettings() {
  const t = useTranslations('components.userSettings.aiAccess');
  const tDialog = useTranslations('components.userSettings.dialog');
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  // kept after closing, so the dialog keeps its name while it fades out
  const [revoking, setRevoking] = useState<McpConnection | null>(null);
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const [editing, setEditing] = useState<McpConnection | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: MCP_CONNECTIONS_QUERY_KEY,
    // refetched whenever the tab opens: a password change or another device can revoke connections meanwhile
    staleTime: 0,
    queryFn: async () => {
      const result = await listMcpConnectionsAction();
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  });

  const handleRevoke = () => {
    if (!revoking) return;
    const { clientId, name } = revoking;
    startTransition(async () => {
      const result = await revokeMcpConnectionAction(clientId);
      if (result.success) {
        queryClient.setQueryData<McpConnectionsOverview>(
          MCP_CONNECTIONS_QUERY_KEY,
          (current) =>
            current && {
              ...current,
              connections: current.connections.filter((connection) => connection.clientId !== clientId),
            },
        );
        queryClient.invalidateQueries({ queryKey: MCP_CONNECTIONS_QUERY_KEY });
        toast.success(t('toast.revoked', { name }));
        setIsRevokeOpen(false);
      } else {
        toast.error(result.error.message || tDialog('toast.error'));
      }
    });
  };

  return (
    <UserSettingsSection title={t('title')} description={t('description')}>
      {isLoading ? (
        <div className='divide-border divide-y rounded-md border'>
          {[0, 1].map((row) => (
            <div key={row} className='space-y-2 px-4 py-3'>
              <Skeleton className='h-4 w-40' />
              <Skeleton className='h-3 w-64' />
            </div>
          ))}
        </div>
      ) : isError || !data ? (
        <p className='text-muted-foreground text-sm'>{t('loadError')}</p>
      ) : data.connections.length === 0 ? (
        <EmptyState />
      ) : (
        <div className='divide-border divide-y rounded-md border'>
          {data.connections.map((connection) => (
            <ConnectionRow
              key={connection.clientId}
              connection={connection}
              disabled={isPending}
              onEdit={() => setEditing(connection)}
              onRevoke={() => {
                setRevoking(connection);
                setIsRevokeOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <DestructiveActionDialog
        open={isRevokeOpen}
        onOpenChange={setIsRevokeOpen}
        title={t('revokeDialog.title', { name: revoking?.name ?? '' })}
        description={t('revokeDialog.description', { name: revoking?.name ?? '' })}
        cancelLabel={t('revokeDialog.cancel')}
        confirmLabel={t('revokeDialog.confirm')}
        onConfirm={handleRevoke}
        isPending={isPending}
      />

      {editing && data && (
        <EditConnectionDashboardsDialog
          key={editing.clientId}
          connection={editing}
          dashboards={data.dashboards}
          onSaved={() => queryClient.invalidateQueries({ queryKey: MCP_CONNECTIONS_QUERY_KEY })}
          onClose={() => setEditing(null)}
        />
      )}
    </UserSettingsSection>
  );
}

function EmptyState() {
  const t = useTranslations('components.userSettings.aiAccess');

  return (
    <div className='flex flex-col items-center gap-2 rounded-md border border-dashed px-6 py-10 text-center'>
      <Bot className='text-muted-foreground h-6 w-6' />
      <p className='text-sm font-medium'>{t('empty.title')}</p>
      <p className='text-muted-foreground max-w-sm text-xs'>
        {t.rich('empty.description', {
          link: (chunks) => (
            <ExternalLink
              href={MCP_SETUP_DOCS_URL}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary underline underline-offset-2'
            >
              {chunks}
            </ExternalLink>
          ),
        })}
      </p>
    </div>
  );
}

interface ConnectionRowProps {
  connection: McpConnection;
  disabled: boolean;
  onEdit: () => void;
  onRevoke: () => void;
}

function ConnectionRow({ connection, disabled, onEdit, onRevoke }: ConnectionRowProps) {
  const t = useTranslations('components.userSettings.aiAccess');
  const locale = useLocale();

  const formatDate = (date: Date) =>
    formatLocalDateTime(date, locale, { year: 'numeric', month: 'short', day: 'numeric' }) ?? '';

  const domains = connection.dashboards.map((dashboard) => dashboard.domain);
  const hidden = domains.length - SHOWN_DASHBOARDS;
  const dashboardsLabel = connection.allDashboards
    ? t('allDashboards')
    : domains.length === 0
      ? t('noDashboards')
      : hidden > 0
        ? `${domains.slice(0, SHOWN_DASHBOARDS).join(', ')} ${t('moreDashboards', { count: hidden })}`
        : domains.join(', ');

  return (
    <div className='flex items-center justify-between gap-2 px-4 py-3'>
      <div className='min-w-0 flex-1 space-y-1'>
        <div className='flex min-w-0 items-center gap-2'>
          <p className='truncate text-sm font-medium' title={connection.name}>
            {connection.name}
          </p>
          {!connection.verified && (
            <Badge variant='outline' className='text-muted-foreground shrink-0' title={t('unverifiedHint')}>
              {t('unverified')}
            </Badge>
          )}
        </div>
        {connection.host && (
          <p className='text-muted-foreground truncate font-mono text-xs' title={connection.host}>
            {connection.host}
          </p>
        )}
        <p className='truncate text-xs' title={connection.allDashboards ? undefined : domains.join(', ')}>
          {connection.scopes.map((scope) => t(`scopes.${scope}`)).join(', ')}
          {connection.scopes.length > 0 && ' · '}
          {dashboardsLabel}
        </p>
        <p className='text-muted-foreground truncate text-xs'>
          {connection.connectedAt && <>{t('connected', { date: formatDate(connection.connectedAt) })} · </>}
          {connection.lastUsedAt ? t('lastUsed', { date: formatDate(connection.lastUsedAt) }) : t('neverUsed')}
        </p>
      </div>
      <div className='flex shrink-0 items-center gap-1'>
        <Button
          variant='ghost'
          size='icon'
          className='text-muted-foreground hover:text-foreground size-8 cursor-pointer'
          onClick={onEdit}
          disabled={disabled}
          aria-label={t('editDashboards')}
          title={t('editDashboards')}
        >
          <Pencil className='size-3.5' />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          className='text-muted-foreground hover:text-destructive size-8 cursor-pointer'
          onClick={onRevoke}
          disabled={disabled}
          aria-label={t('revoke')}
          title={t('revoke')}
        >
          <Trash2 className='size-3.5' />
        </Button>
      </div>
    </div>
  );
}
