'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, CreditCard, ShieldCheck, ChartBar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  autoCloseDelay?: number;
}

export function VerificationCelebrationModal({
  isOpen,
  onClose,
  userName,
  autoCloseDelay = 8000,
}: VerificationCelebrationModalProps) {
  const [showContent, setShowContent] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShowContent(true), 100);

      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remainingProgress = Math.max(0, 100 - (elapsed / autoCloseDelay) * 100);
        setProgress(remainingProgress);

        if (remainingProgress <= 0) {
          clearInterval(interval);
          handleClose();
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isOpen, autoCloseDelay]);

  const handleClose = () => {
    setShowContent(false);
    setTimeout(() => onClose(), 200);
  };

  const displayName = userName || 'there';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className='max-w-md border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='relative overflow-hidden'>
          <div className='absolute top-0 right-0 left-0 px-6 pt-4'>
            <Progress value={progress} className='h-1' color='var(--primary)' />
          </div>

          <div className='flex flex-col items-center px-6 py-8 pt-12 text-center'>
            <div
              className={cn(
                'relative mb-6 transition-all duration-700 ease-out',
                showContent ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-45 opacity-0',
              )}
            >
              <CheckCircle className='h-16 w-16 text-blue-600' />
            </div>

            <div
              className={cn(
                'space-y-4 transition-all delay-200 duration-700',
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              )}
            >
              <h2 className='text-2xl font-bold text-blue-900'>Email Verified Successfully, {displayName}!</h2>

              <div className='space-y-4 pt-2'>
                <div className='text-sm font-medium text-blue-700'>
                  Your account is now fully verified. You can now:
                </div>
                <div className='space-y-3 text-sm text-blue-600'>
                  <div className='flex items-center gap-3'>
                    <CreditCard className='h-4 w-4 text-blue-500' />
                    <span>Manage billing and upgrade to paid plans</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <ShieldCheck className='h-4 w-4 text-blue-500' />
                    <span>Enjoy enhanced account security and reliability</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <ChartBar className='h-4 w-4 text-blue-500' />
                    <span>Access your analytics dashboard</span>
                  </div>
                </div>
                <div className='pt-4 text-sm text-blue-700'>
                  Stay tuned, more exciting features are on their way!
                </div>
              </div>
            </div>

            <div
              className={cn(
                'mt-6 transition-all delay-500 duration-700',
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              )}
            >
              <Button onClick={handleClose} className='bg-blue-600 px-6 py-2 text-sm text-white hover:bg-blue-700'>
                Continue to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
