'use client';

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { resendVerificationEmailAction } from '@/app/actions/verification';
import { toast } from 'sonner';
import { ShieldCheck, Mail, CheckCircle } from 'lucide-react';

interface VerificationRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName?: string;
}

export function VerificationRequiredModal({
  isOpen,
  onClose,
  userEmail,
  userName,
}: VerificationRequiredModalProps) {
  const [isPending, startTransition] = useTransition();
  const [emailSent, setEmailSent] = useState(false);

  const handleResendVerification = () => {
    startTransition(async () => {
      try {
        const result = await resendVerificationEmailAction({ email: userEmail });

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

  const displayName = userName || userEmail.split('@')[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <div className='mb-2 flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
              <ShieldCheck className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <DialogTitle className='text-lg'>Email Verification Required</DialogTitle>
              <DialogDescription>Please verify your email to upgrade your plan</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='rounded-lg bg-blue-50 p-4'>
            <h3 className='mb-2 font-medium text-blue-900'>Why verify your email?</h3>
            <ul className='space-y-1 text-sm text-blue-700'>
              <li className='flex items-start gap-2'>
                <CheckCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500' />
                <span>Secure billing and payment confirmations</span>
              </li>
              <li className='flex items-start gap-2'>
                <CheckCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500' />
                <span>Important account notifications and alerts</span>
              </li>
              <li className='flex items-start gap-2'>
                <CheckCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500' />
                <span>Enhanced account security and recovery</span>
              </li>
            </ul>
          </div>

          <div className='text-center'>
            <p className='text-muted-foreground mb-4 text-sm'>
              Hi {displayName}, we need to verify your email address <strong>{userEmail}</strong> before you can
              upgrade to a paid plan.
            </p>

            {!emailSent ? (
              <Button onClick={handleResendVerification} disabled={isPending} className='w-full' size='lg'>
                <Mail className='mr-2 h-4 w-4' />
                {isPending ? 'Sending...' : 'Resend Verification Email'}
              </Button>
            ) : (
              <div className='space-y-3'>
                <div className='flex items-center justify-center gap-2 text-green-600'>
                  <CheckCircle className='h-4 w-4' />
                  <span className='text-sm font-medium'>Verification email sent!</span>
                </div>
                <p className='text-muted-foreground text-xs'>
                  Please check your inbox and spam folder. The verification link will expire in 24 hours.
                </p>
              </div>
            )}
          </div>

          <div className='flex'>
            <Button variant='outline' onClick={onClose} className='flex-1'>
              Cancel
            </Button>
            {emailSent && (
              <Button onClick={onClose} className='flex-1'>
                Continue to Dashboard
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
