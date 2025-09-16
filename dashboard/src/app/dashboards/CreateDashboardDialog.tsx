'use client';

import { useState, useTransition, useMemo, use } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Plus, Lock } from 'lucide-react';
import { createDashboardAction, getUserDashboardStatsAction } from '@/app/actions/dashboard';
import { domainValidation } from '@/entities/dashboard';
import { useBARouter } from '@/hooks/use-ba-router';
import { useTranslations } from 'next-intl';

interface CreateDashboardDialogProps {
  dashboardStatsPromise: ReturnType<typeof getUserDashboardStatsAction>;
  trigger?: React.ReactElement;
}

export function CreateDashboardDialog({ dashboardStatsPromise, trigger }: CreateDashboardDialogProps) {
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const router = useBARouter();
  const t = useTranslations('components.dashboards.createDialog');

  const dashboardStats = use(dashboardStatsPromise);

  const isFormValid = useMemo(() => {
    if (!domain.trim()) return false;
    return domainValidation.safeParse(domain).success;
  }, [domain]);

  const handleDomainChange = (value: string) => {
    setDomain(value);
    if (validationError) {
      setValidationError('');
    }
  };

  const handleSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();

    const result = domainValidation.safeParse(domain);

    if (!result.success) {
      setValidationError(result.error.errors[0]?.message || t('errors.invalidDomain'));
      return;
    }

    startTransition(async () => {
      const newDashboard = await createDashboardAction(result.data);

      if (!newDashboard.success) {
        toast.error(t('toast.createFailed'));
        return;
      }

      toast.success(t('toast.createdInitializing'));
      setOpen(false);
      setDomain('');
      setValidationError('');

      router.push(`/dashboard/${newDashboard.data.id}?showIntegration=true`);
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isPending) {
      setOpen(newOpen);
      if (!newOpen) {
        setDomain('');
        setValidationError('');
      }
    }
  };

  const canCreateMore = dashboardStats.success && dashboardStats.data.canCreateMore;

  const defaultButton = (
    <Button variant='outline' className='gap-2' disabled={!canCreateMore}>
      {canCreateMore ? (
        <>
          <Plus className='h-4 w-4' />
          {t('buttons.create')}
        </>
      ) : (
        <>
          <Lock className='h-4 w-4' />
          {t('buttons.create')}
        </>
      )}
    </Button>
  );

  const triggerElement = trigger ?? defaultButton;

  const maybeWrappedTrigger = canCreateMore ? (
    triggerElement
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className='pointer-events-none opacity-60' aria-disabled='true'>
          {triggerElement}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t('limitTooltip')}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{maybeWrappedTrigger}</DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='domain' className='font-medium'>
              {t('label.domain')}
            </Label>
            <Input
              id='domain'
              type='text'
              value={domain}
              onChange={(evt) => handleDomainChange(evt.target.value)}
              placeholder={t('placeholder.domain')}
              className={`w-full ${validationError ? 'border-destructive' : ''}`}
              disabled={isPending}
            />
            {validationError ? (
              <p className='text-destructive text-xs'>{validationError}</p>
            ) : (
              <p className='text-muted-foreground text-xs'>{t('helper.domain')}</p>
            )}
          </div>

          <div className='flex justify-end space-x-2 pt-4'>
            <Button type='button' variant='outline' onClick={() => handleOpenChange(false)} disabled={isPending}>
              {t('buttons.cancel')}
            </Button>
            <Button type='submit' disabled={isPending || !isFormValid}>
              {isPending ? t('buttons.creating') : t('buttons.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
