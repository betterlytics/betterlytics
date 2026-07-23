'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { createMcpTokenAction, deleteMcpTokenAction } from '@/app/actions/dashboard/mcpToken.action';
import { DestructiveActionDialog } from '@/components/dialogs';
import { useLocale, useTranslations } from 'next-intl';
import { McpTokenListItem } from '@/entities/dashboard/mcpToken.entities';
import { formatLocalDateTime } from '@/utils/dateFormatters';

interface McpTokenManagerProps {
  dashboardId: string;
  tokens: McpTokenListItem[];
}

export function McpTokenManager({ dashboardId, tokens }: McpTokenManagerProps) {
  const t = useTranslations('mcp');
  const locale = useLocale();
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<{ id: string; plainToken: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteTokenId, setDeleteTokenId] = useState<string | null>(null);

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    startTransition(async () => {
      try {
        const created = await createMcpTokenAction(dashboardId, trimmed);
        setNewlyCreatedToken({ id: created.id, plainToken: created.plainToken });
        setName('');
        toast.success(t('toast.created'));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('toast.createError'));
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTokenId) return;
    startTransition(async () => {
      try {
        await deleteMcpTokenAction(dashboardId, deleteTokenId);
        setDeleteTokenId(null);
        if (newlyCreatedToken?.id === deleteTokenId) setNewlyCreatedToken(null);
        toast.success(t('toast.deleted'));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('toast.deleteError'));
      }
    });
  };

  const handleCopy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (date: Date) =>
    formatLocalDateTime(date, locale, { year: 'numeric', month: 'short', day: 'numeric' }) ?? '';

  return (
    <div className='space-y-4'>
      {newlyCreatedToken && (
        <div className='bg-primary/5 border-primary/20 space-y-2 rounded-md border p-3'>
          <p className='text-sm font-medium'>{t('settings.newTokenNotice')}</p>
          <div className='flex items-center gap-2'>
            <code className='bg-muted flex-1 truncate rounded px-2 py-1 text-xs'>
              {newlyCreatedToken.plainToken}
            </code>
            <Button
              variant='ghost'
              size='icon'
              className='size-8 shrink-0 cursor-pointer'
              onClick={() => handleCopy(newlyCreatedToken.plainToken)}
            >
              {copied ? <Check className='size-4' /> : <Copy className='size-4' />}
            </Button>
          </div>
        </div>
      )}

      <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
        <div className='flex-1 space-y-1.5'>
          <Label className='text-muted-foreground'>{t('settings.tokenNameLabel')}</Label>
          <Input
            type='text'
            className='text-sm'
            placeholder={t('settings.tokenNamePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
        </div>
        <Button onClick={handleCreate} disabled={!name.trim() || isPending} className='cursor-pointer sm:w-auto'>
          <Plus className='size-4' />
          {isPending ? t('settings.creating') : t('settings.createButton')}
        </Button>
      </div>

      {tokens.length > 0 && (
        <div className='divide-border divide-y rounded-md border'>
          {tokens.map((tkn) => (
            <div key={tkn.id} className='flex items-center justify-between gap-2 px-4 py-3'>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium'>{tkn.name}</p>
                <p className='text-muted-foreground text-xs'>
                  {t('settings.created', { date: formatDate(tkn.createdAt) })}
                  {tkn.lastUsedAt && <> · {t('settings.lastUsed', { date: formatDate(tkn.lastUsedAt) })}</>}
                </p>
              </div>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground hover:text-destructive size-8 shrink-0 cursor-pointer'
                onClick={() => setDeleteTokenId(tkn.id)}
                disabled={isPending}
              >
                <Trash2 className='size-3.5' />
              </Button>
            </div>
          ))}
        </div>
      )}

      <DestructiveActionDialog
        open={deleteTokenId !== null}
        onOpenChange={(open) => !open && setDeleteTokenId(null)}
        title={t('deleteDialog.title', { name: tokens.find((tkn) => tkn.id === deleteTokenId)?.name ?? 'token' })}
        description={t('deleteDialog.description')}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}
