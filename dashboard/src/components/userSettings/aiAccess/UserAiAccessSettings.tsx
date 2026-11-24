'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DestructiveActionDialog } from '@/components/dialogs';
import ExternalLink from '@/components/ExternalLink';
import UserSettingsSection from '@/components/userSettings/shared/UserSettingsSection';
import EditConnectionDashboardsDialog from '@/components/userSettings/aiAccess/EditConnectionDashboardsDialog';
import PersonalMcpTokensSection from '@/components/userSettings/aiAccess/PersonalMcpTokensSection';
import {
  listMcpConnectionsAction,
  revokeMcpConnectionAction,
  updateMcpConnectionDashboardsAction,
} from '@/app/actions/account/mcpConnections.action';
import { usePublicEnvironmentVariablesContext } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import type { McpConnection, McpConnectionsOverview } from '@/services/auth/mcpConnections.service';
import { formatLocalDateTime } from '@/utils/dateFormatters';

const MCP_SETUP_DOCS_URL = 'https://betterlytics.io/docs/dashboard/mcp';
const MCP_CONNECTIONS_QUERY_KEY = ['mcpConnections'] as const;

interface UserAiAccessSettingsProps {
  onCloseDialog: () => void;
}

export default function UserAiAccessSettings({ onCloseDialog }: UserAiAccessSettingsProps) {
  const { MCP_OAUTH_ENABLED } = usePublicEnvironmentVariablesContext();

  return (
    <>
      {MCP_OAUTH_ENABLED && <McpConnectionsSection onCloseDialog={onCloseDialog} />}
      <PersonalMcpTokensSection onCloseDialog={onCloseDialog} />
    </>
  );
}

function McpConnectionsSection({ onCloseDialog }: UserAiAccessSettingsProps) {
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
    // fetched fresh whenever the tab opens, without showing the old list first: a password change or another
    // device can revoke connections meanwhile
    staleTime: 0,
    gcTime: 0,
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
      {isError || (!isLoading && !data) ? (
        <p className='text-muted-foreground text-sm'>{t('loadError')}</p>
      ) : (
        <div className='rounded-md border'>
          <Table className='table-fixed'>
            <TableHeader>
              <TableRow>
                <TableHead className='pl-4 lg:w-1/3'>{t('columns.agent')}</TableHead>
                <TableHead className='hidden lg:table-cell'>{t('columns.dashboards')}</TableHead>
                <TableHead className='hidden w-1/4 lg:table-cell'>{t('columns.lastUsed')}</TableHead>
                <TableHead className='w-12' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!data ? (
                [0, 1].map((row) => (
                  <TableRow key={row}>
                    <TableCell colSpan={4} className='py-3 pl-4'>
                      <Skeleton className='h-4 w-40' />
                      <Skeleton className='mt-1 h-3 w-24' />
                    </TableCell>
                  </TableRow>
                ))
              ) : data.connections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className='text-muted-foreground py-8 text-center whitespace-normal'>
                    {t.rich('empty', {
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
                  </TableCell>
                </TableRow>
              ) : (
                data.connections.map((connection) => (
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
                ))
              )}
            </TableBody>
          </Table>
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
          name={editing.name}
          selection={{
            allDashboards: editing.allDashboards,
            dashboardIds: editing.dashboards.map((dashboard) => dashboard.id),
          }}
          dashboards={data.dashboards}
          save={(selection) => updateMcpConnectionDashboardsAction(editing.clientId, selection)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: MCP_CONNECTIONS_QUERY_KEY })}
          onClose={() => setEditing(null)}
          onCloseDialog={onCloseDialog}
        />
      )}
    </UserSettingsSection>
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
  const more = connection.allDashboards ? 0 : domains.length - 1;
  // the first name truncates, the count after it doesn't, so the cell never hides how many there are
  const dashboardsLabel = (
    <div className='flex min-w-0 gap-1' title={connection.allDashboards ? undefined : domains.join(', ')}>
      <span className='truncate'>
        {connection.allDashboards ? t('allDashboards') : (domains[0] ?? t('noDashboards'))}
      </span>
      {more > 0 && <span className='shrink-0'>{t('moreDashboards', { count: more })}</span>}
    </div>
  );

  return (
    <TableRow>
      <TableCell className='py-3 pl-4'>
        <div className='flex min-w-0 items-center gap-2'>
          <p className='truncate font-medium' title={connection.name}>
            {connection.name}
          </p>
          {!connection.verified && (
            <Badge variant='outline' className='text-muted-foreground shrink-0'>
              {t('unverified')}
            </Badge>
          )}
        </div>
        {connection.host && (
          <p className='text-muted-foreground truncate font-mono text-xs' title={connection.host}>
            {connection.host}
          </p>
        )}
        <div className='text-muted-foreground text-xs lg:hidden'>
          {dashboardsLabel}
          <p className='truncate'>
            {connection.lastUsedAt ? t('lastUsed', { date: formatDate(connection.lastUsedAt) }) : t('neverUsed')}
          </p>
        </div>
      </TableCell>
      <TableCell className='hidden py-3 lg:table-cell'>
        {dashboardsLabel}
        <p className='text-muted-foreground truncate text-xs'>
          {connection.scopes.map((scope) => t(`scopes.${scope}`)).join(', ')}
        </p>
      </TableCell>
      <TableCell className='hidden py-3 lg:table-cell'>
        {connection.lastUsedAt ? (
          <p className='truncate'>{formatDate(connection.lastUsedAt)}</p>
        ) : (
          <p className='text-muted-foreground truncate'>{t('neverUsed')}</p>
        )}
        {connection.connectedAt && (
          <p className='text-muted-foreground truncate text-xs'>
            {t('connected', { date: formatDate(connection.connectedAt) })}
          </p>
        )}
      </TableCell>
      <TableCell className='py-3'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='size-8 cursor-pointer'
              disabled={disabled}
              aria-label={t('actions', { name: connection.name })}
            >
              <MoreHorizontal className='size-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem className='cursor-pointer' onClick={onEdit}>
              {t('editDashboards')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className='text-destructive focus:text-destructive cursor-pointer'
              onClick={onRevoke}
            >
              {t('revoke')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
