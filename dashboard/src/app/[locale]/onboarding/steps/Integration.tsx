'use client';

import { useState, useCallback, useEffect } from 'react';
import { useOnboarding } from '@/contexts/OnboardingProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Code, Clipboard, Check } from 'lucide-react';
import { CodeBlock } from '@/components/integration/CodeBlock';
import { usePublicEnvironmentVariablesContext } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { useTrackingVerificationWithId } from '@/hooks/use-tracking-verification';
import { useBARouter } from '@/hooks/use-ba-router';
import { LiveIndicator } from '@/components/live-indicator';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'motion/react';

export default function Integration() {
  const { state, updateIntegration, completeOnboarding } = useOnboarding();
  const t = useTranslations('onboarding.integration');
  const [copiedIdentifier, setCopiedIdentifier] = useState<string | null>(null);
  const { PUBLIC_ANALYTICS_BASE_URL, PUBLIC_TRACKING_SERVER_ENDPOINT } = usePublicEnvironmentVariablesContext();

  const { isVerified, verifySilently } = useTrackingVerificationWithId(state.dashboardId);
  const baRouter = useBARouter();

  const siteId = state.siteId;

  useEffect(() => {
    if (isVerified && !state.integration.installationComplete) {
      updateIntegration({ installationComplete: true });
    }
  }, [isVerified, updateIntegration, state.integration.installationComplete]);

  useEffect(() => {
    if (!isVerified && state.dashboardId) {
      const interval = setInterval(() => {
        verifySilently();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [isVerified, state.dashboardId, verifySilently]);

  const handleCopy = useCallback(async (text: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdentifier(identifier);
      setTimeout(() => setCopiedIdentifier(null), 2000);
    } catch {}
  }, []);

  const handleFinishOnboarding = useCallback(() => {
    completeOnboarding();
    baRouter.push(`/dashboard/${state.dashboardId}`);
  }, [completeOnboarding, baRouter, state.dashboardId]);

  const handleSkipForNow = useCallback(() => {
    completeOnboarding();
    baRouter.push(`/dashboard/${state.dashboardId}?showIntegration=true`);
  }, [completeOnboarding, baRouter, state.dashboardId]);

  useEffect(() => {
    if (isVerified) {
      const timeout = setTimeout(() => {
        handleFinishOnboarding();
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [isVerified, handleFinishOnboarding]);

  if (!siteId) {
    return (
      <div className='py-8 text-center'>
        <p className='text-muted-foreground'>{t('noSiteId')}</p>
      </div>
    );
  }

  const trackingScript = `<script async src="${PUBLIC_ANALYTICS_BASE_URL}/analytics.js" data-site-id="${siteId}" data-server-url="${PUBLIC_TRACKING_SERVER_ENDPOINT}/track"></script>`;

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
          data-site-id="${siteId}"
          data-server-url="${PUBLIC_TRACKING_SERVER_ENDPOINT}/track"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}`;

  const nodeExample = `import betterlytics from "@betterlytics/tracker";

betterlytics.init("${siteId}");
`;

  const reactExample = `import React, { useEffect } from 'react';

function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = "${PUBLIC_ANALYTICS_BASE_URL}/analytics.js";
    script.setAttribute('data-site-id', "${siteId}");
    script.setAttribute('data-server-url', "${PUBLIC_TRACKING_SERVER_ENDPOINT}/track");
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
    <Card>
      <CardHeader>
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
      <CardContent>
        <div className='bg-muted flex items-center justify-between rounded-md border p-3'>
          <code className='font-mono text-sm'>{siteId}</code>
          <Button variant='ghost' size='sm' onClick={() => handleCopy(siteId, 'siteId')} className='h-8 px-2'>
            {copiedIdentifier === 'siteId' ? <Check className='h-4 w-4' /> : <Clipboard className='h-4 w-4' />}
          </Button>
        </div>
      </CardContent>

      <Separator />

      <CardHeader>
        <CardTitle className='text-base font-medium'>{t('instructions.title')}</CardTitle>
        <CardDescription className='text-sm'>{t('instructions.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue='html' className='w-full gap-4'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='html'>{t('instructions.htmlTab')}</TabsTrigger>
            <TabsTrigger value='nextjs'>{t('instructions.nextjsTab')}</TabsTrigger>
            <TabsTrigger value='react'>{t('instructions.reactTab')}</TabsTrigger>
            <TabsTrigger value='npm'>{t('instructions.npmTab')}</TabsTrigger>
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
                <p className='text-muted-foreground text-sm'>{t('instructions.npmInstallFirst')}</p>
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
      <CardFooter className='gap-4'>
        <div className='relative flex w-full justify-end'>
          <AnimatePresence mode='wait'>
            {isVerified ? (
              <motion.div
                key='success'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='shadow-primary/25 relative inline-block overflow-hidden rounded-xl shadow-md'
              >
                <Button
                  variant='outline'
                  onClick={handleFinishOnboarding}
                  className='text-foreground z-10 h-10 overflow-hidden rounded-xl'
                >
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '0%' }}
                    transition={{ duration: 10, ease: 'linear' }}
                    className='absolute inset-0 z-0'
                  >
                    <div className='from-primary/40 via-primary/60 to-primary/40 h-full w-full bg-gradient-to-r' />
                  </motion.div>
                  <span className='relative z-10'>{t('buttons.goToDashboard')}</span>
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
                <Button variant='outline' onClick={handleSkipForNow} className='h-10 rounded-xl'>
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
