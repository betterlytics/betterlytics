'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { forgotPasswordAction } from '@/app/actions/passwordReset';
import { ForgotPasswordSchema } from '@/entities/passwordReset';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const validatedData = ForgotPasswordSchema.parse({ email });

      startTransition(async () => {
        const result = await forgotPasswordAction(validatedData);

        if (result) {
          setSuccess('Password reset email sent!');
          setEmail('');
          toast.success('Password reset email sent!');
        } else {
          setError('Failed to send password reset email');
        }
      });
    } catch (error) {
      setError('Please enter a valid email address');
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

      <div>
        <Label htmlFor='email' className='text-foreground mb-2 block text-sm font-medium'>
          Email Address
        </Label>
        <Input
          id='email'
          name='email'
          type='email'
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='w-full'
          placeholder='Enter your email address'
          disabled={isPending}
        />
        <p className='text-muted-foreground mt-3 ml-1 text-sm'>
          Enter the email address associated with your account and we'll send you a password reset link.
        </p>
      </div>

      <Button type='submit' disabled={isPending || !email.trim()} className='w-full'>
        {isPending ? 'Sending...' : 'Send Password Reset Link'}
      </Button>
    </form>
  );
}
