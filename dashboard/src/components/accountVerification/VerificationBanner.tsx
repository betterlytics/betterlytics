'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { resendVerificationEmailAction } from '@/app/actions/verification';
import { toast } from 'sonner';
import { Mail, X, AlertCircle, RotateCcw } from 'lucide-react';
import { getDisplayName } from '@/utils/userUtils';

interface VerificationBannerProps {
  email: string;
  userName?: string;
  onDismiss?: () => void;
  showDismiss?: boolean;
  className?: string;
}

export function VerificationBanner({
  email,
  userName,
  onDismiss,
  showDismiss = true,
  className = '',
}: VerificationBannerProps) {
  const [isPending, startTransition] = useTransition();
  const [emailSent, setEmailSent] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleResendVerification = async () => {
    startTransition(async () => {
      try {
        const result = await resendVerificationEmailAction({ email });

        if (result.success) {
          toast.success('Verification email sent! Please check your inbox.');
          setEmailSent(true);
        } else {
          toast.error(result.error);
        }
      } catch (error) {
        toast.error('Failed to send verification email');
      }
    });
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) return null;

  return (
    <div className={`rounded-lg border border-blue-200 bg-blue-50 p-4 ${className}`}>
      <div className='flex items-start gap-3'>
        <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600' />

        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex-1'>
              <h3 className='text-sm font-medium text-blue-900'>Please verify your email address</h3>
              <p className='mt-1 text-sm text-blue-700'>
                Hi {getDisplayName(userName, email)}! We sent a verification email to{' '}
                <span className='font-medium'>{email}</span>. Please click the link in the email to verify your
                account.
              </p>
            </div>

            {showDismiss && (
              <Button
                variant='ghost'
                size='sm'
                onClick={handleDismiss}
                className='h-8 w-8 flex-shrink-0 p-0 text-blue-600 hover:text-blue-800'
              >
                <X className='h-4 w-4' />
                <span className='sr-only'>Dismiss</span>
              </Button>
            )}
          </div>

          <div className='mt-3 flex flex-wrap items-center gap-3'>
            {!emailSent ? (
              <Button
                variant='outline'
                size='sm'
                onClick={handleResendVerification}
                disabled={isPending}
                className='flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100'
              >
                <Mail className='h-4 w-4' />
                {isPending ? 'Sending...' : 'Resend verification email'}
              </Button>
            ) : (
              <div className='flex items-center gap-2 text-sm text-blue-600'>
                <RotateCcw className='h-4 w-4' />
                <span>Email sent! Please check your inbox.</span>
              </div>
            )}
          </div>

          <p className='mt-2 text-xs text-blue-600'>
            Can't find the email? Check your spam folder or wait a few minutes for delivery.
          </p>
        </div>
      </div>
    </div>
  );
}
