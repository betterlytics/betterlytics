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

interface CreateDashboardDialogProps {
  dashboardStatsPromise: ReturnType<typeof getUserDashboardStatsAction>;
}

export function CreateDashboardDialog({ dashboardStatsPromise }: CreateDashboardDialogProps) {
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const router = useBARouter();

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
      setValidationError(result.error.errors[0]?.message || 'Invalid domain');
      return;
    }

    startTransition(async () => {
      const newDashboard = await createDashboardAction(result.data);

      if (!newDashboard.success) {
        toast.error('Failed to create dashboard.');
        return;
      }

      toast.success('Dashboard created! Setting up integration...');
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

  const createButton = (
    <Button variant='outline' className='gap-2' disabled={!canCreateMore}>
      {canCreateMore ? (
        <>
          <Plus className='h-4 w-4' />
          Create Dashboard
        </>
      ) : (
        <>
          <Lock className='h-4 w-4' />
          Create Dashboard
        </>
      )}
    </Button>
  );

  const triggerElement = canCreateMore ? (
    createButton
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>{createButton}</TooltipTrigger>
      <TooltipContent>
        <p>You've reached your dashboard limit. Upgrade your plan to create more dashboards.</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{triggerElement}</DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Create New Dashboard</DialogTitle>
          <DialogDescription>Enter your website domain to start tracking analytics.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='domain' className='font-medium'>
              Website Domain
            </Label>
            <Input
              id='domain'
              type='text'
              value={domain}
              onChange={(evt) => handleDomainChange(evt.target.value)}
              placeholder='example.com'
              className={`w-full ${validationError ? 'border-destructive' : ''}`}
              disabled={isPending}
            />
            {validationError ? (
              <p className='text-destructive text-xs'>{validationError}</p>
            ) : (
              <p className='text-muted-foreground text-xs'>Enter your domain without https:// or www.</p>
            )}
          </div>

          <div className='flex justify-end space-x-2 pt-4'>
            <Button type='button' variant='outline' onClick={() => handleOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type='submit' disabled={isPending || !isFormValid}>
              {isPending ? 'Creating...' : 'Create Dashboard'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
