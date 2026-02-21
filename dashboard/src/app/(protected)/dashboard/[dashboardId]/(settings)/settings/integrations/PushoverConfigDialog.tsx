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
import { Integration } from '@/entities/dashboard/integration.entities';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

type PushoverConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration?: Integration;
  isPending: boolean;
  onSave: (config: Record<string, unknown>) => void;
};

export function PushoverConfigDialog({
  open,
  onOpenChange,
  integration,
  isPending,
  onSave,
}: PushoverConfigDialogProps) {
  const t = useTranslations('integrationsSettings.pushoverDialog');
  const existingConfig = integration?.config as { userKey?: string } | undefined;

  const [userKey, setUserKey] = useState(existingConfig?.userKey ?? '');
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (open) {
      const config = integration?.config as { userKey?: string } | undefined;
      setUserKey(config?.userKey ?? '');
      setError(undefined);
    }
  }, [open, integration]);

  const handleSave = () => {
    const trimmedUserKey = userKey.trim();

    if (!trimmedUserKey) {
      setError(t('errors.userKeyRequired'));
      return;
    }
    if (!/^[A-Za-z0-9]{30}$/.test(trimmedUserKey)) {
      setError(t('errors.userKeyInvalid'));
      return;
    }

    onSave({ userKey: trimmedUserKey });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Image src='/images/integrations/pushover.svg' alt='Pushover' width={24} height={24} />
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          <div className='space-y-2'>
            <Label htmlFor='pushover-user-key'>{t('userKeyLabel')}</Label>
            <Input
              id='pushover-user-key'
              placeholder={t('userKeyPlaceholder')}
              value={userKey}
              onChange={(e) => {
                setUserKey(e.target.value);
                if (error) setError(undefined);
              }}
              className={error ? 'border-destructive' : ''}
              disabled={isPending}
            />
            {error && <p className='text-destructive text-sm'>{error}</p>}
          </div>

          <p className='text-muted-foreground text-xs'>
            {t.rich('credentialsHint', {
              link: (chunks) => (
                <a
                  href='https://pushover.net'
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
