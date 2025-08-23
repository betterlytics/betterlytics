'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Info, Clipboard, Check, Code, RefreshCw, Circle } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useQuery } from '@tanstack/react-query';
import { fetchSiteId } from '@/app/actions';
import { useTrackingVerification } from '@/hooks/use-tracking-verification';
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { usePublicEnvironmentVariablesContext } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { useDictionary } from '@/contexts/DictionaryContextProvider';
import ExternalLink from '@/components/ExternalLink';

interface IntegrationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface IntegrationStatus {
  accountCreated: boolean;
  siteIdGenerated: boolean;
  dataReceiving: boolean;
}

export function IntegrationSheet({ open, onOpenChange }: IntegrationSheetProps) {
  const [copiedIdentifier, setCopiedIdentifier] = useState<string | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({
    accountCreated: true,
    siteIdGenerated: true,
    dataReceiving: false,
  });
  const { dictionary } = useDictionary();

  const { PUBLIC_ANALYTICS_BASE_URL, PUBLIC_TRACKING_SERVER_ENDPOINT } = usePublicEnvironmentVariablesContext();

  const dashboardId = useDashboardId();
  const { isVerifying, isVerified, verify } = useTrackingVerification();

  const { data: siteId, isLoading } = useQuery({
    queryKey: ['siteId', dashboardId],
    queryFn: () => fetchSiteId(dashboardId),
  });

  React.useEffect(() => {
    setIntegrationStatus((prev) => ({
      ...prev,
      dataReceiving: isVerified,
    }));
  }, [isVerified]);

  const trackingScript = siteId
    ? `<script async src="${PUBLIC_ANALYTICS_BASE_URL}/analytics.js" data-site-id="${siteId}" data-server-url="${PUBLIC_TRACKING_SERVER_ENDPOINT}/track"></script>`
    : '';

  const handleVerifyInstallation = async () => {
    await verify();
  };

  const handleCopy = async (text: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdentifier(identifier);
      setTimeout(() => setCopiedIdentifier(null), 2000);
    } catch {
      toast.error(dictionary.t('components.integration.failedToCopy'));
    }
  };

  const nodeExample = `import betterlytics from "@betterlytics/tracker";

betterlytics.init("${siteId}");
`;

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

  const reactExample = `import React, { useEffect } from 'react';

function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = "${PUBLIC_ANALYTICS_BASE_URL}/analytics.js";
    script.setAttribute('data-site-id', "${siteId}");
    script.setAttribute('data-server-url', "${PUBLIC_TRACKING_SERVER_ENDPOINT}/track")
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

export default App;
`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full max-w-2xl overflow-y-auto p-0 lg:max-w-3xl xl:max-w-4xl'>
        <div className='flex h-full flex-col'>
          <SheetHeader className='border-border space-y-1.5 border-b p-6'>
            <div className='flex items-center justify-between'>
              <SheetTitle className='text-xl'>{dictionary.t('components.integration.title')}</SheetTitle>
              <div className='flex items-center'>
                {integrationStatus.accountCreated &&
                integrationStatus.siteIdGenerated &&
                integrationStatus.dataReceiving ? (
                  <Badge className='mr-3 rounded bg-green-600/20 px-2 py-1 text-xs font-medium text-green-500 dark:bg-green-500/30 dark:text-green-400'>
                    {dictionary.t('components.integration.fullyIntegrated')}
                  </Badge>
                ) : (
                  <Badge className='mr-3 rounded bg-red-600/20 px-2 py-1 text-xs font-medium text-red-500 dark:bg-red-500/30 dark:text-red-400'>
                    {dictionary.t('components.integration.notFullyIntegrated')}
                  </Badge>
                )}
              </div>
            </div>
            <SheetDescription className='text-muted-foreground text-sm'>
              {dictionary.t('components.integration.description')}
            </SheetDescription>
          </SheetHeader>

          <div className='flex-grow space-y-6 overflow-y-auto p-6'>
            {isLoading ? (
              <div className='flex items-center justify-center py-8'>
                <RefreshCw className='text-muted-foreground h-6 w-6 animate-spin' />
                <span className='text-muted-foreground ml-2'>
                  {dictionary.t('components.integration.loadingDetails')}
                </span>
              </div>
            ) : !siteId ? (
              <div className='flex items-center justify-center py-8'>
                <span className='text-muted-foreground'>
                  {dictionary.t('components.integration.unableToLoadSiteId')}
                </span>
              </div>
            ) : (
              <>
                <Card className='bg-card border-border'>
                  <CardHeader className='flex flex-row items-start space-x-3'>
                    <Info className='mt-1 h-5 w-5 flex-shrink-0 text-blue-500 dark:text-blue-400' />
                    <div>
                      <CardTitle className='text-card-foreground text-base font-medium'>
                        {dictionary.t('components.integration.important')}
                      </CardTitle>
                      <CardDescription className='text-muted-foreground text-sm'>
                        {dictionary.t('components.integration.headSectionNote').replace('{head}', '<head>')}
                      </CardDescription>
                      <CardDescription className='text-muted-foreground text-sm'>
                        {dictionary
                          .t('components.integration.npmPackageNote')
                          .replace('{npm}', 'npm')
                          .replace('{package}', '@betterlytics/tracker')}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                <div className='space-y-2'>
                  <div className='mb-1 flex items-center justify-between'>
                    <label htmlFor='siteIdDisplay' className='text-muted-foreground text-sm font-medium'>
                      {dictionary.t('components.integration.yourSiteId')}
                    </label>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-muted-foreground hover:text-foreground h-8 gap-1.5 text-xs'
                      onClick={() => handleCopy(siteId, 'siteId')}
                    >
                      {copiedIdentifier === 'siteId' ? (
                        <>
                          <Check className='h-3.5 w-3.5' />
                          {dictionary.t('components.integration.copied')}
                        </>
                      ) : (
                        <>
                          <Clipboard className='h-3.5 w-3.5' />
                          {dictionary.t('components.integration.copy')}
                        </>
                      )}
                    </Button>
                  </div>
                  <div
                    id='siteIdDisplay'
                    className='bg-input border-border text-foreground w-full rounded-md border p-2 text-sm'
                    aria-readonly='true'
                  >
                    {siteId}
                  </div>
                </div>
                <Separator />
                <div className='space-y-2'>
                  <div className='mb-1 flex items-center justify-between'>
                    <label htmlFor='trackingScriptDisplay' className='text-muted-foreground text-sm font-medium'>
                      {dictionary.t('components.integration.trackingScript')}
                    </label>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-muted-foreground hover:text-foreground h-8 gap-1.5 text-xs'
                      onClick={() => handleCopy(trackingScript, 'trackingScript')}
                    >
                      {copiedIdentifier === 'trackingScript' ? (
                        <>
                          <Check className='h-3.5 w-3.5' />
                          {dictionary.t('components.integration.copied')}
                        </>
                      ) : (
                        <>
                          <Clipboard className='h-3.5 w-3.5' />
                          {dictionary.t('components.integration.copy')}
                        </>
                      )}
                    </Button>
                  </div>
                  <div
                    id='trackingScriptDisplay'
                    className='bg-input border-border text-foreground w-full overflow-x-auto rounded-md border p-2 text-sm'
                  >
                    {trackingScript}
                  </div>
                </div>

                <Tabs defaultValue='html' className='w-full'>
                  <TabsList className='bg-muted border-border grid w-full grid-cols-3'>
                    <TabsTrigger
                      value='html'
                      className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground'
                    >
                      HTML
                    </TabsTrigger>
                    <TabsTrigger
                      value='nextjs'
                      className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground'
                    >
                      Next.js
                    </TabsTrigger>
                    <TabsTrigger
                      value='react'
                      className='data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground'
                    >
                      React
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value='html' className='bg-card border-border rounded-md p-4'>
                    <h3 className='text-card-foreground mb-2 flex items-center text-sm font-medium'>
                      <Code className='text-muted-foreground mr-2 h-4 w-4' />{' '}
                      {dictionary.t('components.integration.htmlInstallation')}
                    </h3>
                    <CodeBlock code={htmlExample} language='html' />
                  </TabsContent>
                  <TabsContent value='nextjs' className='bg-card border-border rounded-md p-4'>
                    <h3 className='text-card-foreground mb-2 flex items-center text-sm font-medium'>
                      <Code className='text-muted-foreground mr-2 h-4 w-4' />{' '}
                      {dictionary.t('components.integration.nextjsInstallation')}
                    </h3>
                    <CodeBlock code={nextJsExample} language='javascript' />
                  </TabsContent>
                  <TabsContent value='react' className='bg-card border-border rounded-md p-4'>
                    <h3 className='text-card-foreground mb-2 flex items-center text-sm font-medium'>
                      <Code className='text-muted-foreground mr-2 h-4 w-4' />{' '}
                      {dictionary.t('components.integration.reactInstallation')}
                    </h3>
                    <CodeBlock code={reactExample} language='javascript' />
                  </TabsContent>
                </Tabs>
                <Separator />
                <div className='space-y-2'>
                  <div className='mb-1 flex items-center justify-between'>
                    <label htmlFor='siteIdDisplay' className='text-muted-foreground text-sm font-medium'>
                      {dictionary.t('components.integration.initializeNpmPackage').replace('{npm}', 'npm')}
                    </label>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-muted-foreground hover:text-foreground h-8 gap-1.5 text-xs'
                      onClick={() => handleCopy(siteId, 'siteId')}
                    >
                      {copiedIdentifier === 'siteId' ? (
                        <>
                          <Check className='h-3.5 w-3.5' />
                          {dictionary.t('components.integration.copied')}
                        </>
                      ) : (
                        <>
                          <Clipboard className='h-3.5 w-3.5' />
                          {dictionary.t('components.integration.copy')}
                        </>
                      )}
                    </Button>
                  </div>
                  <Tabs defaultValue='npm' className='mb-2 w-full'>
                    <TabsList className='bg-muted border-border mb-2 grid w-full grid-cols-4'>
                      <TabsTrigger value='npm'>npm</TabsTrigger>
                      <TabsTrigger value='pnpm'>pnpm</TabsTrigger>
                      <TabsTrigger value='yarn'>yarn</TabsTrigger>
                      <TabsTrigger value='bun'>bun</TabsTrigger>
                    </TabsList>
                    <TabsContent value='npm'>
                      <CodeBlock code='npm install @betterlytics/tracker' language='html' />
                    </TabsContent>
                    <TabsContent value='pnpm'>
                      <CodeBlock code='pnpm add @betterlytics/tracker' language='html' />
                    </TabsContent>
                    <TabsContent value='yarn'>
                      <CodeBlock code='yarn add @betterlytics/tracker' language='html' />
                    </TabsContent>
                    <TabsContent value='bun'>
                      <CodeBlock code='bun add @betterlytics/tracker' language='html' />
                    </TabsContent>
                  </Tabs>
                  <CodeBlock code={nodeExample} language='javascript' />
                </div>
                <Separator />
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <Card className='bg-card border-border'>
                    <CardHeader>
                      <CardTitle className='text-card-foreground text-base font-medium'>
                        {dictionary.t('components.integration.integrationStatus')}
                      </CardTitle>
                      <CardDescription className='text-muted-foreground text-sm'>
                        {dictionary.t('components.integration.trackProgress')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <StatusItem
                        label={dictionary.t('components.integration.accountCreated')}
                        description={dictionary.t('components.integration.accountReady')}
                        isComplete={integrationStatus.accountCreated}
                      />
                      <StatusItem
                        label={dictionary.t('components.integration.siteIdGenerated')}
                        description={dictionary.t('components.integration.uniqueIdentifier')}
                        isComplete={integrationStatus.siteIdGenerated}
                      />
                      <StatusItem
                        label={dictionary.t('components.integration.dataReceiving')}
                        description={dictionary.t('components.integration.analyticsDataFlowing')}
                        isComplete={integrationStatus.dataReceiving}
                      />
                    </CardContent>
                  </Card>

                  <Card className='bg-card border-border'>
                    <CardHeader>
                      <CardTitle className='text-card-foreground text-base font-medium'>
                        {dictionary.t('components.integration.needHelp')}
                      </CardTitle>
                      <CardDescription className='text-muted-foreground text-sm'>
                        {dictionary.t('components.integration.resourcesToGetStarted')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-2'>
                      <ExternalLink
                        href='/docs'
                        className='flex items-center text-sm text-blue-500 hover:text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300'
                      >
                        <Info className='mr-2 h-4 w-4' /> {dictionary.t('components.integration.documentation')}
                      </ExternalLink>
                      <ExternalLink
                        href='/docs/troubleshooting'
                        className='flex items-center text-sm text-blue-500 hover:text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300'
                      >
                        <Info className='mr-2 h-4 w-4' /> {dictionary.t('components.integration.troubleshooting')}
                      </ExternalLink>
                      <ExternalLink
                        href='/contact'
                        className='flex items-center text-sm text-blue-500 hover:text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300'
                      >
                        <Info className='mr-2 h-4 w-4' /> {dictionary.t('components.integration.contactSupport')}
                      </ExternalLink>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>

          <div className='border-border bg-background sticky mt-auto flex justify-end border-t p-6'>
            <Button
              variant='outline'
              onClick={handleVerifyInstallation}
              disabled={isVerifying || !siteId}
              size='sm'
            >
              {isVerifying ? (
                <>
                  <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                  {dictionary.t('components.integration.verifying')}
                </>
              ) : (
                <>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  {dictionary.t('components.integration.verifyInstallation')}
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

const StatusItem: React.FC<{ label: string; description: string; isComplete: boolean }> = ({
  label,
  description,
  isComplete,
}) => {
  return (
    <div className={`flex items-center ${isComplete ? '' : 'opacity-60'}`}>
      {isComplete ? (
        <CheckCircle className='mr-3 h-5 w-5 flex-shrink-0 text-green-500' />
      ) : (
        <Circle className='text-muted-foreground mr-3 h-5 w-5 flex-shrink-0'></Circle>
      )}
      <div>
        <p className='text-foreground text-sm font-medium'>{label}</p>
        <p className='text-muted-foreground text-xs'>{description}</p>
      </div>
    </div>
  );
};
