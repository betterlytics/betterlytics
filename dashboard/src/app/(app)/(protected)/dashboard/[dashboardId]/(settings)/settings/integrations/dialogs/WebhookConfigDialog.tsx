'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Integration,
  type WebhookConfig,
  type WebhookConfigInput,
} from '@/entities/dashboard/integration.entities';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useClientFeatureFlags } from '@/hooks/use-client-feature-flags';

type WebhookConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration?: Integration;
  isPending: boolean;
  onSave: (config: WebhookConfigInput) => void;
};

export function WebhookConfigDialog({
  open,
  onOpenChange,
  integration,
  isPending,
  onSave,
}: WebhookConfigDialogProps) {
  const t = useTranslations('integrationsSettings.webhookDialog');
  const { isFeatureFlagEnabled } = useClientFeatureFlags();
  const allowPrivateTargets = isFeatureFlagEnabled('allowPrivateTargets');
  const config = integration?.config as Partial<WebhookConfig> | undefined;

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
    const urlPattern = allowPrivateTargets ? /^https?:\/\//i : /^https:\/\//;
    if (trimmedUrl && !urlPattern.test(trimmedUrl)) {
      setError(t(allowPrivateTargets ? 'errors.webhookUrlInvalidHttp' : 'errors.webhookUrlInvalid'));
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
              <Image src='/images/integrations/webhook.svg' alt='Webhook' width={24} height={24} />
              {t('title')}
            </DialogTitle>
          </DialogHeader>

          <div className='py-2'>
            <div className='space-y-2'>
              <Label htmlFor='webhook-url'>{t('webhookUrlLabel')}</Label>
              <Input
                id='webhook-url'
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
                {t(allowPrivateTargets ? 'webhookHintPrivate' : 'webhookHint')}
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
