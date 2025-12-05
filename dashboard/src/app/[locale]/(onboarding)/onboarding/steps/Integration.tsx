'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Code, Clipboard, Check } from 'lucide-react';
import { CodeBlock } from '@/components/integration/CodeBlock';
import { usePublicEnvironmentVariablesContext } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { useSessionRefresh } from '@/hooks/use-session-refresh';
import { useTrackingVerificationWithId } from '@/hooks/use-tracking-verification';
import { useBARouter } from '@/hooks/use-ba-router';
import { LiveIndicator } from '@/components/live-indicator';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'motion/react';
import { useOnboarding } from '../OnboardingProvider';
import ExternalLink from '@/components/ExternalLink';
import { baEvent } from '@/lib/ba-event';
import { useClientFeatureFlags } from '@/hooks/use-client-feature-flags';

import './Integration.css';

export default function Integration() {
  const { dashboard } = useOnboarding();

  if (!dashboard) {
    throw Error('Dashboard is required for integration');
  }

  const t = useTranslations('onboarding.integration');
  const [copiedIdentifier, setCopiedIdentifier] = useState<string | null>(null);
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
    });
    try {
      await refreshSession();
    } catch {}
    baRouter.push(`/dashboard/${dashboard.id}`);
  }, [dashboard, baRouter, refreshSession]);

  const handleSkipForNow = useCallback(async () => {
    baEvent('onboarding-integration', {
      kind: 'skipped',
    });
    try {
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

  const trackingScript = `<script async
    src="${PUBLIC_ANALYTICS_BASE_URL}/analytics.js"
    data-site-id="${dashboard.siteId}"${!IS_CLOUD ? `\n  data-server-url="${PUBLIC_TRACKING_SERVER_ENDPOINT}/track"` : ''}>
  </script>`;

  const htmlExample = `<!DOCTYPE html>
<html>
<head>
  <title>Your Website</title>
  ${trackingScript}
</head>
<body>
  <!-- Your website content -->
</body>
</html>`;

  const nextJsExample = `import Script from 'next/script'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <Script
          async
          src="${PUBLIC_ANALYTICS_BASE_URL}/analytics.js"
          data-site-id="${dashboard.siteId}"${!IS_CLOUD ? `\n          data-server-url="${PUBLIC_TRACKING_SERVER_ENDPOINT}/track"` : ''}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}`;

  const nodeExample = `import betterlytics from "@betterlytics/tracker";

betterlytics.init("${dashboard.siteId}");
`;

  const reactExample = `import React, { useEffect } from 'react';

function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = "${PUBLIC_ANALYTICS_BASE_URL}/analytics.js";
    script.setAttribute('data-site-id', "${dashboard.siteId}");${!IS_CLOUD ? `\n    script.setAttribute('data-server-url', "${PUBLIC_TRACKING_SERVER_ENDPOINT}/track");` : ''}
    document.head.appendChild(script);

    return () => {
      // Optional: Remove script when component unmounts
      // document.head.removeChild(script);
    };
  }, []);

  return (
    // Your App content
  );
}

export default App;`;

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
        <CardDescription className='text-sm'>{t('instructions.description')}</CardDescription>
      </CardHeader>
      <CardContent className='p-0'>
        <Tabs defaultValue='html' className='w-full gap-4'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='html' className='cursor-pointer'>
              {t('instructions.htmlTab')}
            </TabsTrigger>
            <TabsTrigger value='nextjs' className='cursor-pointer'>
              {t('instructions.nextjsTab')}
            </TabsTrigger>
            <TabsTrigger value='react' className='cursor-pointer'>
              {t('instructions.reactTab')}
            </TabsTrigger>
            <TabsTrigger value='npm' className='cursor-pointer'>
              {t('instructions.npmTab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value='html'>
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Code className='text-muted-foreground h-4 w-4' />
                <span className='text-sm font-medium'>
                  {t('instructions.htmlDescription', { head: '<head>' })}
                </span>
              </div>
              <CodeBlock code={htmlExample} language='html' />
            </div>
          </TabsContent>

          <TabsContent value='nextjs'>
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Code className='text-muted-foreground h-4 w-4' />
                <span className='text-sm font-medium'>{t('instructions.nextjsDescription')}</span>
              </div>
              <CodeBlock code={nextJsExample} language='javascript' />
            </div>
          </TabsContent>

          <TabsContent value='react'>
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Code className='text-muted-foreground h-4 w-4' />
                <span className='text-sm font-medium'>{t('instructions.reactDescription')}</span>
              </div>
              <CodeBlock code={reactExample} language='javascript' />
            </div>
          </TabsContent>

          <TabsContent value='npm'>
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <Code className='text-muted-foreground h-4 w-4' />
                <span className='text-sm font-medium'>{t('instructions.npmDescription')}</span>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <p className='text-muted-foreground text-sm'>{t('instructions.npmInstallFirst')}</p>
                  <ExternalLink
                    href='https://www.npmjs.com/package/@betterlytics/tracker'
                    className='text-primary hover:text-primary/80 text-sm font-medium underline'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    View on npm
                  </ExternalLink>
                </div>
                <CodeBlock code='npm install @betterlytics/tracker' language='html' />
              </div>

              <div className='space-y-2'>
                <p className='text-muted-foreground text-sm'>{t('instructions.npmThenInitialize')}</p>
                <CodeBlock code={nodeExample} language='javascript' />
              </div>
            </div>
          </TabsContent>
        </Tabs>
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
