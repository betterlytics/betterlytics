'use client';

import { useState, useCallback, useEffect } from 'react';
import { useOnboarding } from '@/contexts/OnboardingProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Code, Clipboard, Check, RefreshCw } from 'lucide-react';
import { CodeBlock } from '@/components/integration/CodeBlock';
import { usePublicEnvironmentVariablesContext } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { useTrackingVerificationWithId } from '@/hooks/use-tracking-verification';
import { useBARouter } from '@/hooks/use-ba-router';

export function IntegrationStep() {
  const { state, updateIntegration, completeOnboarding } = useOnboarding();
  const [copiedIdentifier, setCopiedIdentifier] = useState<string | null>(null);
  const { PUBLIC_ANALYTICS_BASE_URL, PUBLIC_TRACKING_SERVER_ENDPOINT } = usePublicEnvironmentVariablesContext();

  const { isVerifying, isVerified, verify, verifySilently } = useTrackingVerificationWithId(state.dashboardId);
  const router = useBARouter();

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
    router.push(`/dashboard/${state.dashboardId}`);
  }, [completeOnboarding, router, state.dashboardId]);

  const handleSkipForNow = useCallback(() => {
    completeOnboarding();
    router.push(`/dashboard/${state.dashboardId}?showIntegration=true`);
  }, [completeOnboarding, router, state.dashboardId]);

  if (!siteId) {
    return (
      <div className='py-8 text-center'>
        <p className='text-muted-foreground'>No site ID found. Please go back and create your dashboard first.</p>
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
    <div className='space-y-6'>
      <div className='text-center'>
        <h2 className='text-2xl font-semibold'>Install tracking code</h2>
        <p className='text-muted-foreground mt-2'>Add this code to your website to start collecting analytics</p>
      </div>

      <div className='flex justify-center'>
        {isVerified ? (
          <Badge className='bg-green-600/20 px-3 py-1 text-green-500 dark:bg-green-500/30 dark:text-green-400'>
            ✓ Installation Verified
          </Badge>
        ) : (
          <Badge className='bg-orange-600/20 px-3 py-1 text-orange-500 dark:bg-orange-500/30 dark:text-orange-400'>
            Waiting for Installation
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-base font-medium'>Your Site ID</CardTitle>
          <CardDescription className='text-sm'>
            This unique identifier connects your website to your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='bg-muted flex items-center justify-between rounded-md border p-3'>
            <code className='font-mono text-sm'>{siteId}</code>
            <Button variant='ghost' size='sm' onClick={() => handleCopy(siteId, 'siteId')} className='h-8 px-2'>
              {copiedIdentifier === 'siteId' ? <Check className='h-4 w-4' /> : <Clipboard className='h-4 w-4' />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base font-medium'>Installation Instructions</CardTitle>
          <CardDescription className='text-sm'>Choose the method that matches your website setup</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='html' className='w-full'>
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='html'>HTML</TabsTrigger>
              <TabsTrigger value='nextjs'>Next.js</TabsTrigger>
              <TabsTrigger value='react'>React</TabsTrigger>
              <TabsTrigger value='npm'>npm</TabsTrigger>
            </TabsList>

            <TabsContent value='html' className='mt-4'>
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <Code className='text-muted-foreground h-4 w-4' />
                  <span className='text-sm font-medium'>Add to your HTML &lt;head&gt; section</span>
                </div>
                <CodeBlock code={htmlExample} language='html' />
              </div>
            </TabsContent>

            <TabsContent value='nextjs' className='mt-4'>
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <Code className='text-muted-foreground h-4 w-4' />
                  <span className='text-sm font-medium'>Add to your root layout</span>
                </div>
                <CodeBlock code={nextJsExample} language='javascript' />
              </div>
            </TabsContent>

            <TabsContent value='react' className='mt-4'>
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <Code className='text-muted-foreground h-4 w-4' />
                  <span className='text-sm font-medium'>Add to your main App component</span>
                </div>
                <CodeBlock code={reactExample} language='javascript' />
              </div>
            </TabsContent>

            <TabsContent value='npm' className='mt-4'>
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Code className='text-muted-foreground h-4 w-4' />
                  <span className='text-sm font-medium'>Install the npm package</span>
                </div>

                <div className='space-y-2'>
                  <p className='text-muted-foreground text-sm'>First, install the package:</p>
                  <CodeBlock code='npm install @betterlytics/tracker' language='html' />
                </div>

                <div className='space-y-2'>
                  <p className='text-muted-foreground text-sm'>Then initialize it in your code:</p>
                  <CodeBlock code={nodeExample} language='javascript' />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base font-medium'>Installation Status</CardTitle>
          <CardDescription className='text-sm'>
            We'll automatically detect when tracking is working
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center gap-3'>
            <CheckCircle className='h-5 w-5 text-green-500' />
            <div>
              <p className='text-sm font-medium'>Dashboard created</p>
              <p className='text-muted-foreground text-xs'>Your analytics dashboard is ready</p>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <CheckCircle className='h-5 w-5 text-green-500' />
            <div>
              <p className='text-sm font-medium'>Site ID generated</p>
              <p className='text-muted-foreground text-xs'>Unique identifier created for your website</p>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            {isVerified ? (
              <CheckCircle className='h-5 w-5 text-green-500' />
            ) : (
              <Circle className='text-muted-foreground h-5 w-5' />
            )}
            <div>
              <p className='text-sm font-medium'>Data receiving</p>
              <p className='text-muted-foreground text-xs'>
                {isVerified ? 'Analytics data is flowing!' : 'Waiting for first pageview...'}
              </p>
            </div>
          </div>

          <div className='pt-2'>
            <Button variant='outline' onClick={verify} disabled={isVerifying} size='sm' className='w-full'>
              {isVerifying ? (
                <>
                  <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Check Installation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className='flex flex-col gap-3 pt-4 sm:flex-row'>
        {isVerified ? (
          <Button onClick={handleFinishOnboarding} className='flex-1'>
            🎉 Go to Dashboard
          </Button>
        ) : (
          <>
            <Button variant='outline' onClick={handleSkipForNow} className='flex-1'>
              Skip for Now
            </Button>
            <Button onClick={handleFinishOnboarding} className='flex-1'>
              Continue to Dashboard
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
