'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clipboard, Check, Code } from 'lucide-react';
import { CodeBlock } from '@/components/integration/CodeBlock';
import { usePublicEnvironmentVariablesContext } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { useSessionRefresh } from '@/hooks/use-session-refresh';
import { useTrackingVerificationWithId } from '@/hooks/use-tracking-verification';
import { useBARouter } from '@/hooks/use-ba-router';
import { LiveIndicator } from '@/components/live-indicator';
import { Separator } from '@/components/ui/separator';
import { useTranslations, useMessages } from 'next-intl';
import { AnimatePresence, motion } from 'motion/react';
import { useOnboarding } from '../OnboardingProvider';
import ExternalLink from '@/components/ExternalLink';
import { baEvent } from '@/lib/ba-event';
import { useClientFeatureFlags } from '@/hooks/use-client-feature-flags';
import { FrameworkGrid, FrameworkId } from '@/components/integration/FrameworkGrid';
import { getFrameworkCode, IntegrationTranslations } from '@/components/integration/frameworkCodes';
import { cn } from '@/lib/utils';

import './Integration.css';
import { setOnboardingCompletedAction } from '@/app/actions/account/onboarding.action';

export default function Integration() {
  const { dashboard } = useOnboarding();

  if (!dashboard) {
    throw Error('Dashboard is required for integration');
  }

  const t = useTranslations('onboarding.integration');
  const messages = useMessages();
  const integrationTranslations = (messages as Record<string, unknown>).integration as IntegrationTranslations;

  const [copiedIdentifier, setCopiedIdentifier] = useState<string | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<FrameworkId>('html');
  const { PUBLIC_ANALYTICS_BASE_URL, PUBLIC_TRACKING_SERVER_ENDPOINT } = usePublicEnvironmentVariablesContext();
  const IS_CLOUD = useClientFeatureFlags().isFeatureFlagEnabled('isCloud');

  const { isVerified, verifySilently } = useTrackingVerificationWithId(dashboard.id);
  const baRouter = useBARouter();
  const { refreshSession } = useSessionRefresh();

  useEffect(() => {
    if (!isVerified) {
      const interval = setInterval(() => {
        verifySilently();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [isVerified, verifySilently]);

  const handleCopy = useCallback(async (text: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdentifier(identifier);
      setTimeout(() => setCopiedIdentifier(null), 2000);
    } catch {}
  }, []);

  const handleFinishOnboarding = useCallback(async () => {
    baEvent('onboarding-integration', {
      kind: 'completed',
      framework: selectedFramework,
    });
    try {
      await setOnboardingCompletedAction();
      await refreshSession();
    } catch {}
    baRouter.push(`/dashboard/${dashboard.id}`);
  }, [dashboard, baRouter, refreshSession, selectedFramework]);

  const handleSkipForNow = useCallback(async () => {
    baEvent('onboarding-integration', {
      kind: 'skipped',
    });
    try {
      await setOnboardingCompletedAction();
      await refreshSession();
    } catch {}
    baRouter.push(`/dashboard/${dashboard.id}?showIntegration=true`);
  }, [baRouter, dashboard, refreshSession]);

  const totalCountdownSeconds = 5;
  const [secondsLeft, setSecondsLeft] = useState<number>(totalCountdownSeconds);

  useEffect(() => {
    if (isVerified) {
      setSecondsLeft(totalCountdownSeconds);
      const intervalId = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(intervalId);
    } else {
      setSecondsLeft(totalCountdownSeconds);
    }
  }, [isVerified]);

  useEffect(() => {
    if (isVerified) {
      const timeout = setTimeout(() => {
        handleFinishOnboarding();
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [isVerified, handleFinishOnboarding]);

  if (!dashboard.siteId) {
    return (
      <div className='py-8 text-center'>
        <p className='text-muted-foreground'>{t('noSiteId')}</p>
      </div>
    );
  }

  const frameworkCode = getFrameworkCode(
    selectedFramework,
    {
      siteId: dashboard.siteId,
      analyticsUrl: PUBLIC_ANALYTICS_BASE_URL,
      serverUrl: PUBLIC_TRACKING_SERVER_ENDPOINT,
      isCloud: IS_CLOUD,
    },
    integrationTranslations,
  );

  return (
    <Card className='p-3 py-4 pb-5 shadow-sm sm:p-6'>
      <CardHeader className='p-0'>
        <CardTitle className='flex justify-between text-base font-medium'>
          {t('siteId.title')}{' '}
          <div className='flex justify-center'>
            <AnimatePresence mode='wait'>
              {isVerified ? (
                <motion.div
                  key='success'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className='relative inline-block'
                >
                  <Badge className='rounded-xl bg-green-600/20 px-3 py-1 text-green-500 dark:bg-green-500/30 dark:text-green-400'>
                    {t('siteId.installationVerified')}
                  </Badge>
                </motion.div>
              ) : (
                <motion.div
                  key='pending'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className='relative'
                >
                  <Badge className='rounded-xl bg-orange-600/20 px-3 py-1 text-orange-500 dark:bg-orange-500/30 dark:text-orange-400'>
                    {t('siteId.waitingForInstallation')}
                  </Badge>
                  <LiveIndicator color='orange' />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardTitle>
        <CardDescription className='text-sm'>{t('siteId.description')}</CardDescription>
      </CardHeader>
      <CardContent className='p-0'>
        <div className='bg-muted flex items-center justify-between rounded-md border p-3'>
          <code className='font-mono text-sm'>{dashboard.siteId}</code>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => handleCopy(dashboard.siteId, 'siteId')}
            className='h-8 cursor-pointer px-2'
          >
            {copiedIdentifier === 'siteId' ? <Check className='h-4 w-4' /> : <Clipboard className='h-4 w-4' />}
          </Button>
        </div>
      </CardContent>

      <Separator />

      <CardHeader className='p-0'>
        <CardTitle className='flex items-center justify-between text-base font-medium'>
          <span>{t('instructions.title')}</span>
          <ExternalLink
            href='https://betterlytics.io/docs/installation/cloud-hosting#step-3-install-your-tracking-script'
            className='text-muted-foreground hover:text-foreground text-sm underline'
            target='_blank'
            rel='noopener noreferrer'
          >
            View docs
          </ExternalLink>
        </CardTitle>
        <CardDescription className='text-sm'>
          Select your framework to see installation instructions
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-4 p-0'>
        {/* Framework Selection Grid */}
        <FrameworkGrid selectedFramework={selectedFramework} onSelectFramework={setSelectedFramework} />

        {/* Framework-specific Installation Instructions */}
        <motion.div
          key={selectedFramework}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className='space-y-0'>
            {frameworkCode.steps.map((step, index) => {
              const isLast = index === frameworkCode.steps.length - 1 && !frameworkCode.note;
              return (
                <div key={index} className='relative flex gap-4'>
                  {/* Circle and Line */}
                  <div className='flex flex-col items-center'>
                    <div className='bg-muted border-border text-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium'>
                      {index + 1}
                    </div>
                    {!isLast && <div className='bg-border mt-2 w-px flex-1' />}
                  </div>

                  {/* Content */}
                  <div className={cn('flex-1', !isLast ? 'pb-6' : 'pb-0')}>
                    <h4 className='text-foreground mb-1 text-sm font-medium'>{step.title}</h4>
                    {step.description && (
                      <p
                        className='text-muted-foreground mb-3 text-sm'
                        dangerouslySetInnerHTML={{
                          __html: step.description
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                            .replace(
                              /`(.*?)`/g,
                              '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>',
                            ),
                        }}
                      />
                    )}
                    {step.code && <CodeBlock code={step.code} language={step.language || 'html'} />}
                  </div>
                </div>
              );
            })}

            {/* Note at the end */}
            {frameworkCode.note && (
              <div className='relative flex gap-4'>
                <div className='flex flex-col items-center'>
                  <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm'>
                    ⚠️
                  </div>
                </div>
                <div className='flex-1'>
                  <p className='text-muted-foreground text-sm leading-relaxed'>{frameworkCode.note}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </CardContent>

      <CardFooter className='gap-4 p-0'>
        <div className='relative flex w-full justify-end'>
          <AnimatePresence mode='wait'>
            {isVerified ? (
              <motion.div
                key='success'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='relative inline-flex items-center gap-3'
              >
                <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                  <span>{t('redirectingIn', { seconds: secondsLeft })}</span>
                </div>
                <Button
                  variant='default'
                  onClick={handleFinishOnboarding}
                  className='h-10 cursor-pointer rounded-md'
                >
                  {t('buttons.continueToDashboard')}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key='pending'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='relative inline-block'
              >
                <Button variant='outline' onClick={handleSkipForNow} className='h-10 cursor-pointer rounded-md'>
                  {t('buttons.skipForNow')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardFooter>
    </Card>
  );
}
