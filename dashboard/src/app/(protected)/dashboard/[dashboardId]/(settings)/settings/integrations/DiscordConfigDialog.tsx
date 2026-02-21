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
import { Integration, type DiscordConfig } from '@/entities/dashboard/integration.entities';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

type DiscordConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration?: Integration;
  isPending: boolean;
  onSave: (config: Record<string, unknown>) => void;
};

export function DiscordConfigDialog({
  open,
  onOpenChange,
  integration,
  isPending,
  onSave,
}: DiscordConfigDialogProps) {
  const t = useTranslations('integrationsSettings.discordDialog');
  const existingConfig = integration?.config as Partial<DiscordConfig> | undefined;

  const [webhookUrl, setWebhookUrl] = useState(existingConfig?.webhookUrl ?? '');
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (open) {
      const config = integration?.config as Partial<DiscordConfig> | undefined;
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
    if (!/^https:\/\/discord\.com\/api\/webhooks\//.test(trimmedUrl)) {
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
            <Image src='/images/integrations/discord.svg' alt='Discord' width={24} height={24} />
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <div className='py-2'>
          <div className='space-y-2'>
            <Label htmlFor='discord-webhook-url'>{t('webhookUrlLabel')}</Label>
            <Input
              id='discord-webhook-url'
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
                    href='https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks'
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
