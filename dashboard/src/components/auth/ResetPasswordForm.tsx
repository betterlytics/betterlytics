'use client';

import { useState, useTransition } from 'react';
import { useBARouter } from '@/hooks/use-ba-router';
import { toast } from 'sonner';
import { resetPasswordAction } from '@/app/actions/auth/passwordReset';
import { ResetPasswordSchema } from '@/entities/passwordReset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useBARouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const validatedData = ResetPasswordSchema.parse({
        token,
        newPassword,
        confirmPassword,
      });

      startTransition(async () => {
        const result = await resetPasswordAction(validatedData);

        if (result) {
          toast.success('Password reset successful!');
          router.push('/signin');
        } else {
          setError('Failed to reset password');
        }
      });
    } catch (error) {
      setError('Please check your password requirements');
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

      <div className='space-y-4'>
        <div>
          <Label htmlFor='newPassword' className='text-foreground mb-2 block text-sm font-medium'>
            New Password
          </Label>
          <Input
            id='newPassword'
            name='newPassword'
            type='password'
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className='w-full'
            placeholder='Enter your new password'
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor='confirmPassword' className='text-foreground mb-2 block text-sm font-medium'>
            Confirm New Password
          </Label>
          <Input
            id='confirmPassword'
            name='confirmPassword'
            type='password'
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className='w-full'
            placeholder='Confirm your new password'
            disabled={isPending}
          />
        </div>
      </div>

      <div className='text-muted-foreground text-sm'>
        <p>Password requirements:</p>
        <ul className='mt-1 list-inside list-disc space-y-1'>
          <li>At least 8 characters long</li>
          <li>At least one lowercase letter</li>
          <li>At least one uppercase letter</li>
        </ul>
      </div>

      <Button
        type='submit'
        disabled={isPending || !newPassword.trim() || !confirmPassword.trim()}
        className='w-full'
      >
        {isPending ? 'Resetting Password...' : 'Reset Password'}
      </Button>
    </form>
  );
}
