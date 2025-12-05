'use client';

import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { Lock, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { ChangePasswordData, ChangePasswordSchema } from '@/entities/password';
import { changePasswordAction } from '@/app/actions/account/userSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ZodError } from 'zod';
import SettingsCard from '@/components/SettingsCard';
import UserSecurityTotpSettings from '@/components/userSettings/UserSecurityTotpSettings';
import { useTranslations } from 'next-intl';

const INITIAL_PASSWORD_STATE: ChangePasswordData = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

interface PasswordFieldProps {
  id: keyof ChangePasswordData;
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleVisibility: () => void;
  error?: string;
  disabled: boolean;
  tabIndex: number;
  autoComplete: string;
  helpText?: string;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  showPassword,
  onToggleVisibility,
  error,
  disabled,
  tabIndex,
  autoComplete,
  helpText,
}: PasswordFieldProps) {
  return (
    <div className='space-y-2'>
      <Label htmlFor={id}>{label}</Label>
      <div className='relative'>
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={error ? 'border-destructive' : ''}
          disabled={disabled}
          tabIndex={tabIndex}
          autoComplete={autoComplete}
        />
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 cursor-pointer p-0'
          onClick={onToggleVisibility}
          disabled={disabled}
          tabIndex={-1}
          aria-label={`Toggle ${label.toLowerCase()} visibility`}
        >
          {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
        </Button>
      </div>
      {error && <p className='text-destructive text-sm'>{error}</p>}
      {helpText && <p className='text-muted-foreground text-xs'>{helpText}</p>}
    </div>
  );
}

export default function UserSecuritySettings() {
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();
  const hasPassword = Boolean(session?.user?.hasPassword);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwords, setPasswords] = useState<ChangePasswordData>(INITIAL_PASSWORD_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof ChangePasswordData, string>>>({});
  const t = useTranslations('components.userSettings.security');

  const resetForm = () => {
    setPasswords(INITIAL_PASSWORD_STATE);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = ChangePasswordSchema.parse(passwords);

      startTransition(async () => {
        const result = await changePasswordAction({
          currentPassword: validatedData.currentPassword,
          newPassword: validatedData.newPassword,
        });

        if (result.success) {
          toast.success(t('toast.success'));
          resetForm();
        } else {
          toast.error(result.error.message);
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Partial<Record<keyof ChangePasswordData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof ChangePasswordData] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handlePasswordChange = (field: keyof ChangePasswordData, value: string) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const isFormFilled =
    passwords.currentPassword &&
    passwords.newPassword &&
    passwords.newPassword.length >= 8 &&
    passwords.confirmPassword &&
    passwords.confirmPassword === passwords.newPassword;

  const showPasswordsMatch = Boolean(
    passwords.confirmPassword && passwords.newPassword === passwords.confirmPassword && !errors.confirmPassword,
  );

  return (
    <div className='space-y-6'>
      <SettingsCard icon={Lock} title={t('title')} description={t('description')}>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <PasswordField
            id='currentPassword'
            label={t('currentPassword')}
            value={passwords.currentPassword}
            onChange={(value) => handlePasswordChange('currentPassword', value)}
            showPassword={showPasswords.current}
            onToggleVisibility={() => togglePasswordVisibility('current')}
            error={errors.currentPassword}
            disabled={isPending || !hasPassword}
            tabIndex={1}
            autoComplete='current-password'
          />

          <PasswordField
            id='newPassword'
            label={t('newPassword')}
            value={passwords.newPassword}
            onChange={(value) => handlePasswordChange('newPassword', value)}
            showPassword={showPasswords.new}
            onToggleVisibility={() => togglePasswordVisibility('new')}
            error={errors.newPassword}
            disabled={isPending || !hasPassword}
            tabIndex={2}
            autoComplete='new-password'
            helpText={t('passwordHelp')}
          />

          <PasswordField
            id='confirmPassword'
            label={t('confirmNewPassword')}
            value={passwords.confirmPassword}
            onChange={(value) => handlePasswordChange('confirmPassword', value)}
            showPassword={showPasswords.confirm}
            onToggleVisibility={() => togglePasswordVisibility('confirm')}
            error={errors.confirmPassword}
            disabled={isPending || !hasPassword}
            tabIndex={3}
            autoComplete='new-password'
          />

          {showPasswordsMatch && (
            <div className='flex items-center gap-1 text-sm text-green-600'>
              <Check className='h-3 w-3' />
              <span>{t('passwordsMatch')}</span>
            </div>
          )}

          <Button
            type='submit'
            disabled={isPending || !isFormFilled || !hasPassword}
            className='w-full cursor-pointer sm:w-auto'
            tabIndex={4}
          >
            {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {hasPassword ? t('changePassword') : t('passwordManagedByOAuth')}
          </Button>
        </form>
      </SettingsCard>
      <UserSecurityTotpSettings />
    </div>
  );
}
