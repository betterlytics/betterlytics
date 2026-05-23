'use client';

import { useState, useTransition } from 'react';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ZodError } from 'zod';
import { useTranslations } from 'next-intl';
import { ChangePasswordData, ChangePasswordSchema } from '@/entities/auth/password.entities';
import { changePasswordAction } from '@/app/actions/account/userSettings.action';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  autoComplete,
  helpText,
}: PasswordFieldProps) {
  const t = useTranslations('components.userSettings.security');
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
          aria-label={t('togglePasswordVisibility', { field: label })}
        >
          {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
        </Button>
      </div>
      {error && <p className='text-destructive text-sm'>{error}</p>}
      {helpText && <p className='text-muted-foreground text-xs'>{helpText}</p>}
    </div>
  );
}

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const t = useTranslations('components.userSettings.security');
  const tDialog = useTranslations('components.userSettings.dialog');
  const [isPending, startTransition] = useTransition();
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [passwords, setPasswords] = useState<ChangePasswordData>(INITIAL_PASSWORD_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof ChangePasswordData, string>>>({});

  const resetForm = () => {
    setPasswords(INITIAL_PASSWORD_STATE);
    setErrors({});
    setShowPasswords({ current: false, new: false, confirm: false });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validated = ChangePasswordSchema.parse(passwords);
      startTransition(async () => {
        const result = await changePasswordAction({
          currentPassword: validated.currentPassword,
          newPassword: validated.newPassword,
        });
        if (result.success) {
          toast.success(t('toast.success'));
          resetForm();
          onOpenChange(false);
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
      } else {
        toast.error(tDialog('toast.error'));
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('changePassword')}</DialogTitle>
          <DialogDescription>{t('passwordHelp')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <PasswordField
            id='currentPassword'
            label={t('currentPassword')}
            value={passwords.currentPassword}
            onChange={(v) => handlePasswordChange('currentPassword', v)}
            showPassword={showPasswords.current}
            onToggleVisibility={() => togglePasswordVisibility('current')}
            error={errors.currentPassword}
            disabled={isPending}
            autoComplete='current-password'
          />
          <PasswordField
            id='newPassword'
            label={t('newPassword')}
            value={passwords.newPassword}
            onChange={(v) => handlePasswordChange('newPassword', v)}
            showPassword={showPasswords.new}
            onToggleVisibility={() => togglePasswordVisibility('new')}
            error={errors.newPassword}
            disabled={isPending}
            autoComplete='new-password'
          />
          <PasswordField
            id='confirmPassword'
            label={t('confirmNewPassword')}
            value={passwords.confirmPassword}
            onChange={(v) => handlePasswordChange('confirmPassword', v)}
            showPassword={showPasswords.confirm}
            onToggleVisibility={() => togglePasswordVisibility('confirm')}
            error={errors.confirmPassword}
            disabled={isPending}
            autoComplete='new-password'
          />

          {showPasswordsMatch && (
            <div className='flex items-center gap-1 text-sm text-green-600'>
              <Check className='h-3 w-3' />
              <span>{t('passwordsMatch')}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
              className='cursor-pointer'
            >
              {t('cancel')}
            </Button>
            <Button type='submit' disabled={isPending || !isFormFilled} className='cursor-pointer'>
              {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {t('changePassword')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
