'use client';

import { Check, Loader2, User, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { User as SessionUser } from 'next-auth';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ZodError } from 'zod';
import { updateUserAction } from '@/app/actions/userSettings';
import SettingsCard from '@/components/SettingsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UpdateUserData, UpdateUserSchema } from '@/entities/user';
import useIsChanged from '@/hooks/use-is-changed';

export default function UserProfileSettings() {
  const [isPending, startTransition] = useTransition();
  const { data: session, update: setSession } = useSession();
  const [name, setName] = useState(session?.user?.name || '');
  const [email] = useState(session?.user?.email || '');
  const [emailVerified] = useState(session?.user?.emailVerified);
  const [user, setUser] = useState<UpdateUserData>();
  const [errors, setErrors] = useState<Partial<Record<keyof UpdateUserData, string>>>({});
  const isFormChanged = useIsChanged({ name } as Partial<SessionUser>, session?.user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = UpdateUserSchema.parse(user);

      startTransition(async () => {
        try {
          await updateUserAction(validatedData);
          await setSession(validatedData);

          toast.success('Profile updated successfully');
        } catch (error) {
          toast.error('Failed to update profile. Please try again.');
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Partial<Record<keyof UpdateUserData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof UpdateUserData] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  useEffect(() => {
    setUser((prev) => ({
      ...prev,
      name: name.trim(),
    }));
  }, [name]);

  return (
    <div className='space-y-6'>
      <SettingsCard icon={User} title='Profile' description='Change your personal information'>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? 'border-destructive' : ''}
              disabled={isPending}
              placeholder='Enter your name'
            />
            {errors.name && <p className='text-destructive text-sm'>{errors.name}</p>}
            <p className='text-muted-foreground text-xs'>Optional</p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='email'>
              Email
              {emailVerified ? (
                <div className='flex items-center gap-1 text-sm text-green-600'>
                  <Check className='h-3 w-3' />
                  <span>Verified</span>
                </div>
              ) : (
                <div className='flex items-center gap-1 text-sm text-red-600'>
                  <X className='h-3 w-3' />
                  <span>Unverified</span>
                </div>
              )}
            </Label>
            <Input id='email' type='email' value={email} disabled readOnly />
          </div>

          <Button type='submit' disabled={isPending || !isFormChanged} className='w-full sm:w-auto' tabIndex={4}>
            {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Update Profile
          </Button>
        </form>
      </SettingsCard>
    </div>
  );
}
