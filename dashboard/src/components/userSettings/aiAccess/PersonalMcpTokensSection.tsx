'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import CreateMcpTokenDialog from '@/components/userSettings/aiAccess/CreateMcpTokenDialog';
import DashboardsSummary, { aiAccessOffDomains } from '@/components/userSettings/aiAccess/DashboardsSummary';
import RowDetails from '@/components/userSettings/aiAccess/RowDetails';
import EditConnectionDashboardsDialog from '@/components/userSettings/aiAccess/EditConnectionDashboardsDialog';
import { MCP_SETUP_DOCS_URL } from '@/constants/mcp';
import {
  listPersonalMcpTokensAction,
  revokePersonalMcpTokenAction,
  updatePersonalMcpTokenDashboardsAction,
} from '@/app/actions/account/mcpTokens.action';
import type { PersonalMcpToken, PersonalMcpTokensOverview } from '@/services/dashboard/mcpToken.service';
import { formatLocalDateTime } from '@/utils/dateFormatters';

const MCP_TOKENS_QUERY_KEY = ['personalMcpTokens'] as const;

interface PersonalMcpTokensSectionProps {
  onCloseDialog: () => void;
}

export default function PersonalMcpTokensSection({ onCloseDialog }: PersonalMcpTokensSectionProps) {
  const t = useTranslations('components.userSettings.aiAccess.tokens');
  const tDialog = useTranslations('components.userSettings.dialog');
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [isCreating, setIsCreating] = useState(false);
  // kept after closing, so the dialog keeps its name while it fades out
  const [deleting, setDeleting] = useState<PersonalMcpToken | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<PersonalMcpToken | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: MCP_TOKENS_QUERY_KEY,
    // fetched fresh whenever the tab opens: an admin can remove a dashboard from a token meanwhile
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      const result = await listPersonalMcpTokensAction();
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: MCP_TOKENS_QUERY_KEY });

  const handleDelete = () => {
    if (!deleting) return;
    const { id, name } = deleting;
    startTransition(async () => {
      const result = await revokePersonalMcpTokenAction(id);
      if (result.success) {
        queryClient.setQueryData<PersonalMcpTokensOverview>(
          MCP_TOKENS_QUERY_KEY,
          (current) => current && { ...current, tokens: current.tokens.filter((token) => token.id !== id) },
        );
        refresh();
        toast.success(t('toast.deleted', { name }));
        setIsDeleteOpen(false);
      } else {
        toast.error(result.error.message || tDialog('toast.error'));
      }
    });
  };

  return (
    <UserSettingsSection
      title={t('title')}
      description={t('description')}
      headerAction={
        <Button size='sm' className='cursor-pointer' disabled={!data} onClick={() => setIsCreating(true)}>
          <Plus className='size-4' />
          {t('create')}
        </Button>
      }
    >
      {isError || (!isLoading && !data) ? (
        <p className='text-muted-foreground text-sm'>{t('loadError')}</p>
      ) : (
        <div className='rounded-md border'>
          <Table className='table-fixed'>
            <TableHeader className='hidden lg:table-header-group'>
              <TableRow>
                <TableHead className='pl-4 lg:w-1/3'>{t('columns.token')}</TableHead>
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
              ) : data.tokens.length === 0 ? (
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
                data.tokens.map((token) => (
                  <TokenRow
                    key={token.id}
                    token={token}
                    disabled={isPending}
                    onEdit={() => setEditing(token)}
                    onDelete={() => {
                      setDeleting(token);
                      setIsDeleteOpen(true);
                    }}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <DestructiveActionDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={t('deleteDialog.title', { name: deleting?.name ?? '' })}
        description={t('deleteDialog.description', { name: deleting?.name ?? '' })}
        cancelLabel={t('deleteDialog.cancel')}
        confirmLabel={t('deleteDialog.confirm')}
        onConfirm={handleDelete}
        isPending={isPending}
      />

      {isCreating && data && (
        <CreateMcpTokenDialog
          dashboards={data.dashboards}
          onCreated={refresh}
          onClose={() => setIsCreating(false)}
          onCloseDialog={onCloseDialog}
        />
      )}

      {editing && data && (
        <EditConnectionDashboardsDialog
          key={editing.id}
          name={editing.name}
          selection={{ allDashboards: false, dashboardIds: editing.dashboards.map((dashboard) => dashboard.id) }}
          dashboards={data.dashboards}
          allowAllDashboards={false}
          description={t('editDescription')}
          save={(selection) => updatePersonalMcpTokenDashboardsAction(editing.id, selection.dashboardIds)}
          onSaved={refresh}
          onClose={() => setEditing(null)}
          onCloseDialog={onCloseDialog}
        />
      )}
    </UserSettingsSection>
  );
}

interface TokenRowProps {
  token: PersonalMcpToken;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function TokenRow({ token, disabled, onEdit, onDelete }: TokenRowProps) {
  const t = useTranslations('components.userSettings.aiAccess.tokens');
  const tAccess = useTranslations('components.userSettings.aiAccess');
  const locale = useLocale();

  const formatDate = (date: Date) =>
    formatLocalDateTime(date, locale, { year: 'numeric', month: 'short', day: 'numeric' }) ?? '';

  const aiAccessOff = aiAccessOffDomains(token.dashboards);
  const expired = token.expiresAt !== null && token.expiresAt < new Date();
  const expiry = (
    <p
      className={
        expired ? 'text-destructive truncate text-xs font-medium' : 'text-muted-foreground truncate text-xs'
      }
    >
      {token.expiresAt === null
        ? t('neverExpires')
        : t(expired ? 'expired' : 'expires', { date: formatDate(token.expiresAt) })}
    </p>
  );

  return (
    <TableRow>
      <TableCell className='py-3 pl-4'>
        <p className='truncate font-medium' title={token.name}>
          {token.name}
        </p>
        <p className='text-muted-foreground hidden truncate text-xs lg:block'>
          {t('created', { date: formatDate(token.createdAt) })}
        </p>
        <RowDetails
          rows={[
            {
              label: tAccess('columns.dashboards'),
              value: <DashboardsSummary dashboards={token.dashboards} withAiAccessOff={false} />,
            },
            ...(aiAccessOff.length > 0
              ? [{ label: tAccess('details.aiAccessOff'), value: aiAccessOff.join(', ') }]
              : []),
            { label: tAccess('details.permissions'), value: tAccess('scopes.readAnalytics') },
            {
              label: tAccess('columns.lastUsed'),
              value: token.lastUsedAt ? formatDate(token.lastUsedAt) : tAccess('details.never'),
            },
            {
              label: tAccess(expired ? 'details.expired' : 'details.expires'),
              value: token.expiresAt ? (
                <span className={expired ? 'text-destructive font-medium' : undefined}>
                  {formatDate(token.expiresAt)}
                </span>
              ) : (
                tAccess('details.never')
              ),
            },
            { label: tAccess('details.created'), value: formatDate(token.createdAt) },
          ]}
        />
      </TableCell>
      <TableCell className='hidden py-3 lg:table-cell'>
        <DashboardsSummary dashboards={token.dashboards} />
        <p className='text-muted-foreground truncate text-xs'>{tAccess('scopes.readAnalytics')}</p>
      </TableCell>
      <TableCell className='hidden py-3 lg:table-cell'>
        {token.lastUsedAt ? (
          <p className='truncate'>{formatDate(token.lastUsedAt)}</p>
        ) : (
          <p className='text-muted-foreground truncate'>{t('neverUsed')}</p>
        )}
        {expiry}
      </TableCell>
      {/* sized here too: with the header hidden on narrow screens, the fixed layout takes widths from this row */}
      <TableCell className='w-12 py-3'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='size-8 cursor-pointer'
              disabled={disabled}
              aria-label={t('actions', { name: token.name })}
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
              onClick={onDelete}
            >
              {t('delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
