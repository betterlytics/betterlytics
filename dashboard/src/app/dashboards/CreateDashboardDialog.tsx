'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { Plus } from 'lucide-react';
import { createDashboardAction } from '@/app/actions/dashboard';
import { domainValidation } from '@/entities/dashboard';

export function CreateDashboardDialog() {
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
      try {
        const newDashboard = await createDashboardAction(result.data);
        toast.success('Dashboard created! Setting up integration...');
        setOpen(false);
        setDomain('');
        setValidationError('');

        router.push(`/dashboard/${newDashboard.id}?showIntegration=true`);
      } catch (err) {
        console.error(err);
        toast.error('Failed to create dashboard.');
      }
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant='outline' className='gap-2'>
          <Plus className='h-4 w-4' />
          Create Dashboard
        </Button>
      </DialogTrigger>
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
