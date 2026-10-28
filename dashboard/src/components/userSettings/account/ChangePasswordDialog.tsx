'use client';

import { useState, useTransition } from 'react';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ZodIssue } from 'zod';
import { useTranslations } from 'next-intl';
import { ChangePasswordData, ChangePasswordSchema, PASSWORD_RULES } from '@/entities/auth/password.entities';
import { authClient } from '@/lib/auth-client';
import { PASSWORD_TOO_LONG_ERROR_CODE } from '@/lib/auth/auth-error';
import { cn } from '@/lib/utils';
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

const PASSWORD_RULE_KEYS = Object.keys(PASSWORD_RULES) as (keyof typeof PASSWORD_RULES)[];

type PasswordErrors = Partial<Record<keyof ChangePasswordData, string>>;

interface ChecklistRow {
  label: string;
  met: boolean;
}

interface Checklist {
  label?: string;
  rows: ChecklistRow[];
}

function ChecklistItem({ label, met }: ChecklistRow) {
  const t = useTranslations('public.auth.fields.rules');
  return (
    <li className={cn('flex items-center gap-1', met ? 'text-foreground' : 'text-muted-foreground')}>
      <Check aria-hidden className={cn('h-3 w-3', met ? 'text-green-600' : 'opacity-40')} />
      {label}
      <span className='sr-only'>, {met ? t('met') : t('unmet')}</span>
    </li>
  );
}

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
  checklist?: Checklist;
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
  checklist,
}: PasswordFieldProps) {
  const t = useTranslations('components.userSettings.security');
  const errorId = `${id}-error`;
  const checklistId = `${id}-checklist`;
  const describedBy = [error && errorId, checklist && checklistId].filter(Boolean).join(' ');
  return (
    <div className='space-y-2'>
      <Label htmlFor={id}>{label}</Label>
      <div className='relative'>
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy || undefined}
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
      {error && (
        <p id={errorId} className='text-destructive text-sm'>
          {error}
        </p>
      )}
      {checklist && (
        <ul id={checklistId} aria-label={checklist.label} className='flex flex-wrap gap-x-4 gap-y-1 text-xs'>
          {checklist.rows.map((row) => (
            <ChecklistItem key={row.label} {...row} />
          ))}
        </ul>
      )}
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
  const tFields = useTranslations('public.auth.fields');
  const tRules = useTranslations('public.auth.fields.rules');
  const [isPending, startTransition] = useTransition();
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [passwords, setPasswords] = useState<ChangePasswordData>(INITIAL_PASSWORD_STATE);
  const [errors, setErrors] = useState<PasswordErrors>({});

  const resetForm = () => {
    setPasswords(INITIAL_PASSWORD_STATE);
    setErrors({});
    setShowPasswords({ current: false, new: false, confirm: false });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  // The schema's messages are English only, so each failing check maps to a translated one
  const toFieldErrors = (issues: ZodIssue[]): PasswordErrors => {
    const fieldErrors: PasswordErrors = {};
    for (const issue of issues) {
      const field = issue.path[0] as keyof ChangePasswordData;
      if (fieldErrors[field]) continue;
      if (field === 'currentPassword') {
        fieldErrors.currentPassword = tFields('errors.passwordRequired');
      } else if (field === 'confirmPassword') {
        fieldErrors.confirmPassword =
          issue.code === 'too_small' ? tFields('errors.confirmRequired') : tFields('errors.passwordsDoNotMatch');
      } else if (issue.code !== 'custom') {
        // the custom check is "same as the current password", which already shows live under the field
        fieldErrors.newPassword = tFields('errors.weakPassword');
      }
    }
    return fieldErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = ChangePasswordSchema.safeParse(passwords);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      return;
    }

    setErrors({});
    startTransition(async () => {
      const { error } = await authClient.changePassword({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      });
      if (!error) {
        toast.success(t('toast.success'));
        resetForm();
        onOpenChange(false);
      } else if (error.code === 'INVALID_PASSWORD' || error.code === PASSWORD_TOO_LONG_ERROR_CODE) {
        setErrors({ currentPassword: t('invalidCurrentPassword') });
      } else if (error.code === 'WEAK_PASSWORD') {
        setErrors({ newPassword: tFields('errors.weakPassword') });
      } else if (error.status === 429) {
        toast.error(t('toast.tooManyAttempts'));
      } else {
        toast.error(tDialog('toast.error'));
      }
    });
  };

  const handlePasswordChange = (field: keyof ChangePasswordData, value: string) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
    // the confirmation is checked against the new password, so editing either clears its error
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      ...(field === 'newPassword' && { confirmPassword: undefined }),
    }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Gate only on filled fields so submit runs the schema and surfaces strength errors
  const isFormFilled = passwords.currentPassword && passwords.newPassword && passwords.confirmPassword;

  const isSameAsCurrent = passwords.newPassword !== '' && passwords.newPassword === passwords.currentPassword;
  const newPasswordError = errors.newPassword ?? (isSameAsCurrent ? t('newPasswordSameAsCurrent') : undefined);

  const passwordRules: Checklist = {
    label: tRules('label'),
    rows: PASSWORD_RULE_KEYS.map((rule) => ({
      label: tRules(rule),
      met: PASSWORD_RULES[rule](passwords.newPassword),
    })),
  };

  const passwordsMatch: Checklist = {
    rows: [
      {
        label: t('passwordsMatch'),
        met: passwords.confirmPassword !== '' && passwords.confirmPassword === passwords.newPassword,
      },
    ],
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('changePassword')}</DialogTitle>
          <DialogDescription>{t('dialogDescription')}</DialogDescription>
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
            error={newPasswordError}
            disabled={isPending}
            autoComplete='new-password'
            checklist={passwordRules}
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
            checklist={passwordsMatch}
          />

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
