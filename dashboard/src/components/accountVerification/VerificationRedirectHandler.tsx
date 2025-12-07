'use client';

import { useEffect, useState } from 'react';
import { useBARouter } from '@/hooks/use-ba-router';
import { useSessionRefresh } from '@/hooks/use-session-refresh';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Logo from '@/components/logo';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

interface VerificationRedirectHandlerProps {
  hasSession: boolean;
}

function AnimatedCheckmark() {
  return (
    <div className='relative mx-auto mb-4 h-16 w-16'>
      <div className='bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-xl' />

      <svg className='relative h-16 w-16' viewBox='0 0 52 52' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <circle
          className='animate-[draw-circle_0.6s_ease-out_forwards]'
          cx='26'
          cy='26'
          r='23'
          stroke='currentColor'
          strokeWidth='2'
          fill='none'
          strokeLinecap='round'
          style={{
            strokeDasharray: 166,
            strokeDashoffset: 166,
            color: 'hsl(var(--primary))',
          }}
        />
        <path
          className='animate-[draw-check_0.4s_ease-out_0.5s_forwards]'
          d='M16 27l7 7 13-13'
          stroke='currentColor'
          strokeWidth='3'
          fill='none'
          strokeLinecap='round'
          strokeLinejoin='round'
          style={{
            strokeDasharray: 36,
            strokeDashoffset: 36,
            color: 'hsl(var(--primary))',
          }}
        />
      </svg>
    </div>
  );
}

function AnimatedBorderCard({ children }: { children: React.ReactNode }) {
  return (
    <div className='relative overflow-hidden rounded-xl p-[2px]'>
      <div
        className='absolute inset-0 animate-[spin_3s_linear_infinite]'
        style={{
          background:
            'conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.1), hsl(var(--primary)))',
        }}
      />

      <div className='bg-background relative rounded-[10px] p-6'>{children}</div>
    </div>
  );
}

export function VerificationRedirectHandler({ hasSession }: VerificationRedirectHandlerProps) {
  const { refreshSession } = useSessionRefresh();
  const router = useBARouter();
  const { status } = useSession();
  const t = useTranslations('public.auth.verifyEmail');
  const [redirectState, setRedirectState] = useState<'celebrating' | 'redirecting' | 'error'>('celebrating');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const targetUrl = hasSession ? '/dashboards' : '/signin';
  const targetLabel = hasSession ? t('buttons.returnToDashboard') : t('buttons.backToSignIn');

  useEffect(() => {
    if (status === 'loading') return;

    let celebrationTimeout: NodeJS.Timeout;
    let safetyTimeout: NodeJS.Timeout;

    const handleRedirect = async () => {
      try {
        celebrationTimeout = setTimeout(async () => {
          setRedirectState('redirecting');

          if (hasSession) {
            const success = await refreshSession();
            if (!success) {
              console.warn('Session refresh failed, continuing with redirect anyway');
            }
          }

          router.push(targetUrl);

          safetyTimeout = setTimeout(() => {
            setRedirectState('error');
            setErrorMessage(t('success.errors.redirectTimeout'));
          }, 5000);
        }, 2000);
      } catch (error) {
        console.error('Redirect failed:', error);
        setRedirectState('error');
        setErrorMessage(t('success.errors.redirectFailed'));
      }
    };

    handleRedirect();

    return () => {
      if (celebrationTimeout) clearTimeout(celebrationTimeout);
      if (safetyTimeout) clearTimeout(safetyTimeout);
    };
  }, [hasSession, refreshSession, router, status, targetUrl]);

  return (
    <div className='bg-background flex min-h-[60vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8'>
      <style jsx>{`
        @keyframes draw-circle {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes draw-check {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className='w-full max-w-md space-y-8'>
        <div className='text-center'>
          <div
            className='mb-8 flex justify-center opacity-0'
            style={{ animation: 'fade-up 0.5s ease-out forwards' }}
          >
            <Logo variant='full' width={200} height={60} priority />
          </div>

          <div className='opacity-0' style={{ animation: 'fade-up 0.5s ease-out 0.2s forwards' }}>
            <AnimatedBorderCard>
              <AnimatedCheckmark />

              <h2
                className='text-foreground mb-2 text-2xl font-semibold opacity-0'
                style={{ animation: 'fade-up 0.4s ease-out 0.7s forwards' }}
              >
                {t('success.title')}
              </h2>

              <p
                className='text-muted-foreground mb-5 text-sm opacity-0'
                style={{ animation: 'fade-up 0.4s ease-out 0.9s forwards' }}
              >
                {t('success.description')}
              </p>

              <div className='opacity-0' style={{ animation: 'fade-up 0.4s ease-out 1.1s forwards' }}>
                {redirectState === 'error' ? (
                  <div className='space-y-3'>
                    <div className='bg-destructive/10 text-destructive rounded-md p-3 text-sm'>
                      <AlertCircle className='mr-2 inline h-4 w-4' />
                      {errorMessage}
                    </div>
                    <Link href={targetUrl}>
                      <Button className='w-full'>{targetLabel}</Button>
                    </Link>
                  </div>
                ) : (
                  <div className='text-muted-foreground flex items-center justify-center gap-2 text-sm'>
                    {redirectState === 'celebrating' ? (
                      <span className='text-primary font-medium'>{t('success.celebration')} 🎉</span>
                    ) : (
                      <>
                        <Loader2 className='h-4 w-4 animate-spin' />
                        <span>{hasSession ? t('success.redirecting') : t('success.redirectingToSignin')}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </AnimatedBorderCard>
          </div>

          {redirectState !== 'error' && (
            <div className='mt-6 opacity-0' style={{ animation: 'fade-up 0.4s ease-out 1.5s forwards' }}>
              <Link href={targetUrl}>
                <Button variant='ghost' className='text-muted-foreground cursor-pointer text-sm'>
                  {t('success.clickHere')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
