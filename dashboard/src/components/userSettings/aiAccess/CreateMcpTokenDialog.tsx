'use client';

import { useId, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CopyButton } from '@/components/CopyButton';
import ExternalLink from '@/components/ExternalLink';
import DashboardGrantPickerList from '@/components/userSettings/aiAccess/DashboardGrantPickerList';
import { createPersonalMcpTokenAction } from '@/app/actions/account/mcpTokens.action';
import { useDashboardGrantPicker } from '@/hooks/use-dashboard-grant-picker';
import { usePublicEnvironmentVariablesContext } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import {
  DEFAULT_MCP_TOKEN_LIFETIME,
  McpTokenLifetime,
  McpTokenLifetimeSchema,
} from '@/entities/dashboard/mcpToken.entities';
import type { PersonalMcpTokensOverview } from '@/services/dashboard/mcpToken.service';

const MCP_SETUP_DOCS_URL = 'https://betterlytics.io/docs/dashboard/mcp';
const MAX_TOKEN_NAME_LENGTH = 100;
const COPY_BUTTON_CLASSES =
  'text-muted-foreground hover:text-foreground hover:bg-muted flex size-8 flex-none cursor-pointer items-center justify-center rounded-md transition-colors';

interface CreateMcpTokenDialogProps {
  dashboards: PersonalMcpTokensOverview['dashboards'];
  onCreated: () => Promise<unknown>;
  onClose: () => void;
  onCloseDialog: () => void;
}

export default function CreateMcpTokenDialog({
  dashboards,
  onCreated,
  onClose,
  onCloseDialog,
}: CreateMcpTokenDialogProps) {
  const t = useTranslations('components.userSettings.aiAccess.tokens.createDialog');
  const tToast = useTranslations('components.userSettings.aiAccess.tokens.toast');
  const tDialog = useTranslations('components.userSettings.dialog');
  const { PUBLIC_IS_CLOUD, PUBLIC_BASE_URL } = usePublicEnvironmentVariablesContext();
  const id = useId();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [lifetime, setLifetime] = useState<McpTokenLifetime>(DEFAULT_MCP_TOKEN_LIFETIME);
  const [plainToken, setPlainToken] = useState<string | null>(null);
  const picker = useDashboardGrantPicker(dashboards, { allDashboards: false, dashboardIds: [] });

  const endpointUrl = PUBLIC_IS_CLOUD ? null : `${PUBLIC_BASE_URL}/api/mcp`;
  const canCreate = name.trim().length > 0 && picker.picked.size > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    startTransition(async () => {
      const result = await createPersonalMcpTokenAction(name.trim(), [...picker.picked], lifetime);
      if (result.success) {
        setPlainToken(result.data.plainToken);
        await onCreated();
        toast.success(tToast('created', { name: result.data.name }));
      } else {
        toast.error(result.error.message || tDialog('toast.error'));
      }
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        {plainToken ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('createdTitle')}</DialogTitle>
              <DialogDescription>{t('createdNotice')}</DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <code className='bg-muted min-w-0 flex-1 rounded-md px-3 py-2 font-mono text-xs break-all select-all'>
                  {plainToken}
                </code>
                <CopyButton
                  text={plainToken}
                  ariaLabel={t('copyToken')}
                  copiedLabel={t('tokenCopied')}
                  className={COPY_BUTTON_CLASSES}
                  iconClassName='size-4'
                />
              </div>

              {endpointUrl && (
                <div className='space-y-1.5'>
                  <Label className='text-muted-foreground'>{t('endpointLabel')}</Label>
                  <div className='flex items-center gap-2'>
                    <p className='bg-background min-w-0 flex-1 rounded-md border px-3 py-2 font-mono text-xs break-all select-all'>
                      {endpointUrl}
                    </p>
                    <CopyButton
                      text={endpointUrl}
                      ariaLabel={t('copyEndpoint')}
                      copiedLabel={t('endpointCopied')}
                      className={COPY_BUTTON_CLASSES}
                      iconClassName='size-4'
                    />
                  </div>
                </div>
              )}

              <p className='text-muted-foreground text-xs'>
                {t.rich('endpointHint', {
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

            <DialogFooter>
              <Button className='cursor-pointer' onClick={onClose}>
                {t('done')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('title')}</DialogTitle>
              <DialogDescription>{t('description')}</DialogDescription>
            </DialogHeader>

            <fieldset className='min-w-0 space-y-4' disabled={isPending}>
              <div className='space-y-1.5'>
                <Label htmlFor={`${id}-name`}>{t('nameLabel')}</Label>
                <Input
                  id={`${id}-name`}
                  value={name}
                  maxLength={MAX_TOKEN_NAME_LENGTH}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t('namePlaceholder')}
                  autoComplete='off'
                />
              </div>

              <div className='space-y-1.5'>
                <p className='text-sm font-medium'>{t('dashboardsLabel')}</p>
                <DashboardGrantPickerList picker={picker} onCloseDialog={onCloseDialog} />
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor={`${id}-lifetime`}>{t('expirationLabel')}</Label>
                <Select value={lifetime} onValueChange={(value) => setLifetime(value as McpTokenLifetime)}>
                  <SelectTrigger id={`${id}-lifetime`} className='w-full cursor-pointer sm:w-48'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {McpTokenLifetimeSchema.options.map((option) => (
                      <SelectItem key={option} value={option} className='cursor-pointer'>
                        {t(`lifetime.${option}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm'>
                <ShieldAlert className='mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500' />
                <div className='space-y-1'>
                  <p>{t('actsAsYou')}</p>
                  <p className='text-muted-foreground'>{t('readOnly')}</p>
                </div>
              </div>
            </fieldset>

            <DialogFooter>
              <Button variant='outline' className='cursor-pointer' onClick={onClose} disabled={isPending}>
                {t('cancel')}
              </Button>
              <Button className='cursor-pointer' onClick={handleCreate} disabled={isPending || !canCreate}>
                {isPending ? t('creating') : t('create')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
