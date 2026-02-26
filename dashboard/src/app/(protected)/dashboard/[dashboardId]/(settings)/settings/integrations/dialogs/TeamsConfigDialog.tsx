'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Integration, type TeamsConfig } from '@/entities/dashboard/integration.entities';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

type TeamsConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration?: Integration;
  isPending: boolean;
  onSave: (config: Record<string, unknown>) => void;
};

export function TeamsConfigDialog({ open, onOpenChange, integration, isPending, onSave }: TeamsConfigDialogProps) {
  const t = useTranslations('integrationsSettings.teamsDialog');
  const existingConfig = integration?.config as Partial<TeamsConfig> | undefined;

  const [webhookUrl, setWebhookUrl] = useState(existingConfig?.webhookUrl ?? '');
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (open) {
      const config = integration?.config as Partial<TeamsConfig> | undefined;
      setWebhookUrl(config?.webhookUrl ?? '');
      setError(undefined);
    }
  }, [open, integration]);

  const handleSave = () => {
    const trimmedUrl = webhookUrl.trim();

    if (!trimmedUrl) {
      setError(t('errors.webhookUrlRequired'));
      return;
    }
    if (!/^https:\/\//.test(trimmedUrl)) {
      setError(t('errors.webhookUrlInvalid'));
      return;
    }

    onSave({ webhookUrl: trimmedUrl });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Image src='/images/integrations/teams.svg' alt='Microsoft Teams' width={24} height={24} />
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <div className='py-2'>
          <div className='space-y-2'>
            <Label htmlFor='teams-webhook-url'>{t('webhookUrlLabel')}</Label>
            <Input
              id='teams-webhook-url'
              placeholder={t('webhookUrlPlaceholder')}
              value={webhookUrl}
              onChange={(e) => {
                setWebhookUrl(e.target.value);
                if (error) setError(undefined);
              }}
              className={error ? 'border-destructive' : ''}
              disabled={isPending}
            />
            {error && <p className='text-destructive text-sm'>{error}</p>}
            <p className='text-muted-foreground text-xs'>
              {t.rich('webhookHint', {
                link: (chunks) => (
                  <a
                    href='https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook?tabs=newteams%2Cdotnet'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary underline'
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            className='cursor-pointer'
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t('cancel')}
          </Button>
          <Button className='cursor-pointer' onClick={handleSave} disabled={isPending}>
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
