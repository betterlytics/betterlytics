'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { forgotPasswordAction } from '@/app/actions/auth/passwordReset';
import { ForgotPasswordSchema } from '@/entities/auth/passwordReset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('public.auth.forgotPassword');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const validatedData = ForgotPasswordSchema.parse({ email });

      startTransition(async () => {
        const result = await forgotPasswordAction(validatedData);

        if (result) {
          setSuccess(t('successMessage'));
          setEmail('');
          toast.success(t('successMessage'));
        } else {
          setError(t('errorMessage'));
        }
      });
    } catch (error) {
      setError(t('errorMessageInvalidEmail'));
    }
  };

  return (
    <form className='space-y-6' onSubmit={handleSubmit}>
      {error && (
        <div
          className='bg-destructive/10 border-destructive/20 text-destructive rounded-md border px-4 py-3'
          role='alert'
        >
          <span className='block sm:inline'>{error}</span>
        </div>
      )}

      {success && (
        <div className='rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800' role='alert'>
          <span className='block sm:inline'>{success}</span>
        </div>
      )}

      <div className='space-y-2'>
        <Label htmlFor='email' className='text-foreground text-sm font-medium'>
          {t('emailField')}
        </Label>
        <Input
          id='email'
          name='email'
          type='email'
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='h-10 w-full rounded-md'
          placeholder={t('emailFieldPlaceholder')}
          disabled={isPending}
        />
        <p className='text-muted-foreground pt-1 text-sm'>{t('emailFieldDescription')}</p>
      </div>

      <Button type='submit' disabled={isPending || !email.trim()} className='h-10 w-full'>
        {isPending ? t('cta.sending') : t('cta.sendResetLink')}
      </Button>
    </form>
  );
}
