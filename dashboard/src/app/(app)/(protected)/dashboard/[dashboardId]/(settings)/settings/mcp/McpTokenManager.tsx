'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { removeDashboardFromMcpTokenAction } from '@/app/actions/dashboard/mcpToken.action';
import { DestructiveActionDialog } from '@/components/dialogs';
import { useLocale, useTranslations } from 'next-intl';
import type { DashboardMcpToken } from '@/entities/dashboard/mcpToken.entities';
import { formatLocalDateTime } from '@/utils/dateFormatters';

interface McpTokenManagerProps {
  dashboardId: string;
  tokens: DashboardMcpToken[];
}

/** The personal tokens that can read this dashboard, for owners and admins to cut off. */
export function McpTokenManager({ dashboardId, tokens }: McpTokenManagerProps) {
  const t = useTranslations('mcp');
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  // kept after closing, so the dialog keeps its name while it fades out
  const [removing, setRemoving] = useState<DashboardMcpToken | null>(null);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);

  const handleRemove = () => {
    if (!removing) return;
    const { id, name } = removing;
    startTransition(async () => {
      try {
        await removeDashboardFromMcpTokenAction(dashboardId, id);
        setIsRemoveOpen(false);
        toast.success(t('toast.removed', { name }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('toast.removeError'));
      }
    });
  };

  const formatDate = (date: Date) =>
    formatLocalDateTime(date, locale, { year: 'numeric', month: 'short', day: 'numeric' }) ?? '';

  if (tokens.length === 0) {
    return <p className='text-muted-foreground px-1 py-2 text-sm'>{t('tokens.empty')}</p>;
  }

  return (
    <>
      <div className='divide-border divide-y rounded-md border'>
        {tokens.map((token) => (
          <div
            key={token.id}
            className='flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'
          >
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium'>{token.name}</p>
              <p className='text-muted-foreground truncate text-xs' title={token.creator.email}>
                {t('tokens.createdBy', { name: token.creator.name || token.creator.email })}
              </p>
              <p className='text-muted-foreground text-xs'>
                {t('tokens.created', { date: formatDate(token.createdAt) })}
                {' · '}
                {token.lastUsedAt
                  ? t('tokens.lastUsed', { date: formatDate(token.lastUsedAt) })
                  : t('tokens.neverUsed')}
                {' · '}
                {token.expiresAt === null ? (
                  t('tokens.neverExpires')
                ) : token.expiresAt < new Date() ? (
                  <span className='text-destructive font-medium'>
                    {t('tokens.expired', { date: formatDate(token.expiresAt) })}
                  </span>
                ) : (
                  t('tokens.expires', { date: formatDate(token.expiresAt) })
                )}
              </p>
            </div>
            <Button
              variant='outline'
              size='sm'
              className='text-destructive hover:text-destructive shrink-0 cursor-pointer self-start sm:self-auto'
              onClick={() => {
                setRemoving(token);
                setIsRemoveOpen(true);
              }}
              disabled={isPending}
              aria-label={t('tokens.removeAria', { name: token.name })}
            >
              {t('tokens.remove')}
            </Button>
          </div>
        ))}
      </div>

      <DestructiveActionDialog
        open={isRemoveOpen}
        onOpenChange={setIsRemoveOpen}
        title={t('removeDialog.title', { name: removing?.name ?? '' })}
        description={t('removeDialog.description', { name: removing?.name ?? '' })}
        cancelLabel={t('removeDialog.cancel')}
        confirmLabel={t('removeDialog.confirm')}
        onConfirm={handleRemove}
        isPending={isPending}
      />
    </>
  );
}
