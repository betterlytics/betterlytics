'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Integration } from '@/entities/dashboard/integration.entities';
import { useTranslations } from 'next-intl';

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
  const existingConfig = integration?.config as { userKey?: string; apiToken?: string } | undefined;

  const [userKey, setUserKey] = useState(existingConfig?.userKey ?? '');
  const [apiToken, setApiToken] = useState(existingConfig?.apiToken ?? '');
  const [errors, setErrors] = useState<{ userKey?: string; apiToken?: string }>({});

  useEffect(() => {
    if (open) {
      const config = integration?.config as { userKey?: string; apiToken?: string } | undefined;
      setUserKey(config?.userKey ?? '');
      setApiToken(config?.apiToken ?? '');
      setErrors({});
    }
  }, [open, integration]);

  const handleSave = () => {
    const trimmedUserKey = userKey.trim();
    const trimmedApiToken = apiToken.trim();

    const fieldErrors: { userKey?: string; apiToken?: string } = {};
    if (!trimmedUserKey) {
      fieldErrors.userKey = t('errors.userKeyRequired');
    } else if (!/^[A-Za-z0-9]{30}$/.test(trimmedUserKey)) {
      fieldErrors.userKey = t('errors.userKeyInvalid');
    }
    if (!trimmedApiToken) {
      fieldErrors.apiToken = t('errors.apiTokenRequired');
    } else if (!/^[A-Za-z0-9]{30}$/.test(trimmedApiToken)) {
      fieldErrors.apiToken = t('errors.apiTokenInvalid');
    }

    if (fieldErrors.userKey || fieldErrors.apiToken) {
      setErrors(fieldErrors);
      return;
    }

    onSave({ userKey: trimmedUserKey, apiToken: trimmedApiToken });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
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
                if (errors.userKey) setErrors((prev) => ({ ...prev, userKey: undefined }));
              }}
              className={errors.userKey ? 'border-destructive' : ''}
              disabled={isPending}
            />
            {errors.userKey && <p className='text-destructive text-sm'>{errors.userKey}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='pushover-api-token'>{t('apiTokenLabel')}</Label>
            <Input
              id='pushover-api-token'
              placeholder={t('apiTokenPlaceholder')}
              value={apiToken}
              onChange={(e) => {
                setApiToken(e.target.value);
                if (errors.apiToken) setErrors((prev) => ({ ...prev, apiToken: undefined }));
              }}
              className={errors.apiToken ? 'border-destructive' : ''}
              disabled={isPending}
            />
            {errors.apiToken && <p className='text-destructive text-sm'>{errors.apiToken}</p>}
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
