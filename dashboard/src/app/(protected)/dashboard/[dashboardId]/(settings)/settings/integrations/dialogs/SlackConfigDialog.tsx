'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Integration, type SlackConfig } from '@/entities/dashboard/integration.entities';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

type SlackConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration?: Integration;
  isPending: boolean;
  onSave: (config: Record<string, unknown>) => void;
};

export function SlackConfigDialog({
  open,
  onOpenChange,
  integration,
  isPending,
  onSave,
}: SlackConfigDialogProps) {
  const t = useTranslations('integrationsSettings.slackDialog');
  const existingConfig = integration?.config as Partial<SlackConfig> | undefined;

  const [webhookUrl, setWebhookUrl] = useState(existingConfig?.webhookUrl ?? '');
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (open) {
      const config = integration?.config as Partial<SlackConfig> | undefined;
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
    if (!/^https:\/\/hooks\.slack\.com\/services\//.test(trimmedUrl)) {
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
            <Image src='/images/integrations/slack.svg' alt='Slack' width={24} height={24} />
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <div className='py-2'>
          <div className='space-y-2'>
            <Label htmlFor='slack-webhook-url'>{t('webhookUrlLabel')}</Label>
            <Input
              id='slack-webhook-url'
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
                    href='https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks'
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
