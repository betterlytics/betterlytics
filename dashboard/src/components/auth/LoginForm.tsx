'use client';

import { useState, useTransition } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      try {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: true,
          callbackUrl: '/dashboards',
        });

        if (result?.error) {
          setError('Invalid email or password. Please check your credentials and try again.');
        }
      } catch {
        setError('An error occurred during sign in. Please try again.');
      }
    });
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
          <label htmlFor='email' className='text-foreground mb-2 block text-sm font-medium'>
            Email
          </label>
          <input
            id='email'
            name='email'
            type='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='border-input bg-background text-foreground focus:ring-ring placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:outline-none'
            placeholder='Enter your email'
          />
        </div>
        <div>
          <label htmlFor='password' className='text-foreground mb-2 block text-sm font-medium'>
            Password
          </label>
          <input
            id='password'
            name='password'
            type='password'
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='border-input bg-background text-foreground focus:ring-ring placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 focus:border-transparent focus:ring-2 focus:outline-none'
            placeholder='Enter your password'
          />
        </div>
      </div>

      <div>
        <button
          type='submit'
          disabled={isPending}
          className='text-primary-foreground bg-primary hover:bg-primary/90 focus:ring-ring flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
        >
          {isPending ? 'Signing in...' : 'Sign in'}
        </button>
      </div>

      <div className='text-center'>
        <a href='/forgot-password' className='text-primary hover:text-primary/80 text-sm font-medium underline'>
          Forgot your password?
        </a>
      </div>
    </form>
  );
}
