'use client';

import { useState, useTransition } from 'react';
import { useBARouter } from '@/hooks/use-ba-router';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { registerUserAction } from '@/app/actions';
import { RegisterUserSchema } from '@/entities/auth/user';
import { ZodError } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useBARouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const validatedData = RegisterUserSchema.parse({
        email,
        password,
        name: name.trim() || undefined,
      });

      startTransition(async () => {
        const result = await registerUserAction(validatedData);

        if (!result.success) {
          setError(result.error.message);
          return;
        }

        const signInResult = await signIn('credentials', {
          email: validatedData.email,
          password: validatedData.password,
          redirect: false,
        });

        if (signInResult?.error) {
          toast.success('Registration successful! Please sign in.');
          router.push('/signin');
        } else {
          toast.success(
            'Welcome! Your account has been created. A verification email has been sent to your email address.',
          );
          router.push('/dashboards');
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        setError(error.errors[0]?.message || 'Please check your input');
      } else {
        setError('Please check your input');
      }
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
        <div className='space-y-2'>
          <Label htmlFor='name'>Name (optional)</Label>
          <Input
            id='name'
            name='name'
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Enter your name'
            disabled={isPending}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            name='email'
            type='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='Enter your email'
            disabled={isPending}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='password'>Password</Label>
          <Input
            id='password'
            name='password'
            type='password'
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='Enter your password (min. 8 characters)'
            disabled={isPending}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='confirmPassword'>Confirm Password</Label>
          <Input
            id='confirmPassword'
            name='confirmPassword'
            type='password'
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder='Confirm your password'
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <Button type='submit' disabled={isPending} className='w-full'>
          {isPending ? 'Creating account...' : 'Create account'}
        </Button>
      </div>
    </form>
  );
}
