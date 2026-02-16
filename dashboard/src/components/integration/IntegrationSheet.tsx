'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Info, Clipboard, Check, RefreshCw, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useQuery } from '@tanstack/react-query';
import { fetchSiteId } from '@/app/actions/index.actions';
import { useTrackingVerification } from '@/hooks/use-tracking-verification';
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { usePublicEnvironmentVariablesContext } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import ExternalLink from '@/components/ExternalLink';
import { useTranslations, useMessages } from 'next-intl';
import { useClientFeatureFlags } from '@/hooks/use-client-feature-flags';
import { FrameworkGrid, FrameworkId } from './FrameworkGrid';
import { FrameworkInstructions } from './FrameworkInstructions';
import { getFrameworkCode, IntegrationTranslations } from './frameworkCodes';

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
  const [selectedFramework, setSelectedFramework] = useState<FrameworkId>('html');
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({
    accountCreated: true,
    siteIdGenerated: true,
    dataReceiving: false,
  });
  const t = useTranslations('components.integration');
  const messages = useMessages();
  const integrationTranslations = (messages as Record<string, unknown>).integration as IntegrationTranslations;

  const { PUBLIC_ANALYTICS_BASE_URL, PUBLIC_TRACKING_SERVER_ENDPOINT } = usePublicEnvironmentVariablesContext();

  const IS_CLOUD = useClientFeatureFlags().isFeatureFlagEnabled('isCloud');

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

  const handleVerifyInstallation = async () => {
    await verify();
  };

  const handleCopy = async (text: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdentifier(identifier);
      setTimeout(() => setCopiedIdentifier(null), 2000);
    } catch {
      toast.error(t('failedToCopy'));
    }
  };

  const frameworkCode = siteId
    ? getFrameworkCode(
        selectedFramework,
        {
          siteId,
          analyticsUrl: PUBLIC_ANALYTICS_BASE_URL,
          serverUrl: PUBLIC_TRACKING_SERVER_ENDPOINT,
          isCloud: IS_CLOUD,
        },
        integrationTranslations,
      )
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full max-w-2xl overflow-y-auto p-0 lg:max-w-3xl xl:max-w-4xl'>
        <div className='flex h-full flex-col'>
          <SheetHeader className='border-border space-y-1.5 border-b p-6'>
            <div className='flex items-center justify-between'>
              <SheetTitle className='text-xl'>{t('title')}</SheetTitle>
              <div className='flex items-center'>
                {integrationStatus.accountCreated &&
                integrationStatus.siteIdGenerated &&
                integrationStatus.dataReceiving ? (
                  <Badge className='mr-3 rounded bg-green-600/20 px-2 py-1 text-xs font-medium text-green-500 dark:bg-green-500/30 dark:text-green-400'>
                    {t('fullyIntegrated')}
                  </Badge>
                ) : (
                  <Badge className='mr-3 rounded bg-red-600/20 px-2 py-1 text-xs font-medium text-red-500 dark:bg-red-500/30 dark:text-red-400'>
                    {t('notFullyIntegrated')}
                  </Badge>
                )}
              </div>
            </div>
            <SheetDescription className='text-muted-foreground text-sm'>{t('description')}</SheetDescription>
          </SheetHeader>

          <div className='flex-grow space-y-6 overflow-y-auto p-6'>
            {isLoading ? (
              <div className='flex items-center justify-center py-8'>
                <RefreshCw className='text-muted-foreground h-6 w-6 animate-spin' />
                <span className='text-muted-foreground ml-2'>{t('loadingDetails')}</span>
              </div>
            ) : !siteId ? (
              <div className='flex items-center justify-center py-8'>
                <span className='text-muted-foreground'>{t('unableToLoadSiteId')}</span>
              </div>
            ) : (
              <>
                <div className='space-y-2'>
                  <div className='mb-1 flex items-center justify-between'>
                    <label htmlFor='siteIdDisplay' className='text-muted-foreground text-sm font-medium'>
                      {t('yourSiteId')}
                    </label>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-muted-foreground hover:text-foreground h-8 cursor-pointer gap-1.5 text-xs'
                      onClick={() => handleCopy(siteId, 'siteId')}
                    >
                      {copiedIdentifier === 'siteId' ? (
                        <>
                          <Check className='h-3.5 w-3.5' />
                          {t('copied')}
                        </>
                      ) : (
                        <>
                          <Clipboard className='h-3.5 w-3.5' />
                          {t('copy')}
                        </>
                      )}
                    </Button>
                  </div>
                  <div
                    id='siteIdDisplay'
                    className='dark:bg-input/30 border-border text-foreground w-full rounded-md border bg-transparent p-3 text-sm shadow-sm'
                    aria-readonly='true'
                  >
                    {siteId}
                  </div>
                </div>

                <Separator />

                <div className='space-y-3'>
                  <h3 className='text-foreground text-sm font-medium'>{t('selectFramework')}</h3>
                  <FrameworkGrid selectedFramework={selectedFramework} onSelectFramework={setSelectedFramework} />
                </div>

                {frameworkCode && (
                  <FrameworkInstructions frameworkCode={frameworkCode} selectedFramework={selectedFramework} />
                )}

                <Separator />

                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <Card className='bg-card border-border'>
                    <CardHeader>
                      <CardTitle className='text-card-foreground text-base font-medium'>
                        {t('integrationStatus')}
                      </CardTitle>
                      <CardDescription className='text-muted-foreground text-sm'>
                        {t('trackProgress')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <StatusItem
                        label={t('accountCreated')}
                        description={t('accountReady')}
                        isComplete={integrationStatus.accountCreated}
                      />
                      <StatusItem
                        label={t('siteIdGenerated')}
                        description={t('uniqueIdentifier')}
                        isComplete={integrationStatus.siteIdGenerated}
                      />
                      <StatusItem
                        label={t('dataReceiving')}
                        description={t('analyticsDataFlowing')}
                        isComplete={integrationStatus.dataReceiving}
                      />
                    </CardContent>
                  </Card>

                  <Card className='bg-card border-border'>
                    <CardHeader>
                      <CardTitle className='text-card-foreground text-base font-medium'>{t('needHelp')}</CardTitle>
                      <CardDescription className='text-muted-foreground text-sm'>
                        {t('resourcesToGetStarted')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-2'>
                      <ExternalLink
                        href='https://betterlytics.io/docs'
                        className='flex items-center text-sm text-blue-500 hover:text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300'
                      >
                        <Info className='mr-2 h-4 w-4' /> {t('documentation')}
                      </ExternalLink>
                      <ExternalLink
                        href='https://betterlytics.io/docs/troubleshooting'
                        className='flex items-center text-sm text-blue-500 hover:text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300'
                      >
                        <Info className='mr-2 h-4 w-4' /> {t('troubleshooting')}
                      </ExternalLink>
                      <ExternalLink
                        href='/contact'
                        className='flex items-center text-sm text-blue-500 hover:text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300'
                      >
                        <Info className='mr-2 h-4 w-4' /> {t('contactSupport')}
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
              className='cursor-pointer'
            >
              {isVerifying ? (
                <>
                  <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                  {t('verifying')}
                </>
              ) : (
                <>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  {t('verifyInstallation')}
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
