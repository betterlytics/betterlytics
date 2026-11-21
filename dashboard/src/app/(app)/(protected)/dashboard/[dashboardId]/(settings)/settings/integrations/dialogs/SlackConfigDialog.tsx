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
import { Integration, type SlackConfig, type SlackConfigInput } from '@/entities/dashboard/integration.entities';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

type SlackConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration?: Integration;
  isPending: boolean;
  onSave: (config: SlackConfigInput) => void;
};

export function SlackConfigDialog({
  open,
  onOpenChange,
  integration,
  isPending,
  onSave,
}: SlackConfigDialogProps) {
  const t = useTranslations('integrationsSettings.slackDialog');
  const config = integration?.config as Partial<SlackConfig> | undefined;

  const [webhookUrl, setWebhookUrl] = useState('');
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (open) {
      setWebhookUrl('');
      setError(undefined);
    }
  }, [open, integration]);

  const handleSave = () => {
    const trimmedUrl = webhookUrl.trim();

    if (!trimmedUrl && !integration) {
      setError(t('errors.webhookUrlRequired'));
      return;
    }
    if (trimmedUrl && !/^https:\/\/hooks\.slack\.com\/services\//.test(trimmedUrl)) {
      setError(t('errors.webhookUrlInvalid'));
      return;
    }

    onSave(trimmedUrl ? { webhookUrl: trimmedUrl } : {});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
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
                placeholder={config?.webhookUrl ?? t('webhookUrlPlaceholder')}
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
              type='button'
              variant='outline'
              className='cursor-pointer'
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t('cancel')}
            </Button>
            <Button type='submit' className='cursor-pointer' disabled={isPending}>
              {t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
