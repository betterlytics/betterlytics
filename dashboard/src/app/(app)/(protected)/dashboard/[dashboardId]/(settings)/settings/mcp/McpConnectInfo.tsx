'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/CopyButton';
import ExternalLink from '@/components/ExternalLink';
import UserSettingsDialog from '@/components/userSettings/UserSettingsDialog';
import { MCP_SETUP_DOCS_URL } from '@/constants/mcp';

interface McpConnectInfoProps {
  endpointUrl: string;
}

export function McpConnectInfo({ endpointUrl }: McpConnectInfoProps) {
  const t = useTranslations('mcp.connect');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const docsLink = (chunks: React.ReactNode) => (
    <ExternalLink
      href={MCP_SETUP_DOCS_URL}
      target='_blank'
      rel='noopener noreferrer'
      className='text-primary underline underline-offset-2'
    >
      {chunks}
    </ExternalLink>
  );

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-muted-foreground text-sm'>{t.rich('body', { link: docsLink })}</p>
        <Button variant='outline' className='shrink-0 cursor-pointer' onClick={() => setIsSettingsOpen(true)}>
          <KeyRound className='size-4' />
          {t('manageTokens')}
        </Button>
      </div>

      <div className='space-y-1.5'>
        <Label className='text-muted-foreground'>{t('endpointLabel')}</Label>
        <div className='flex items-center gap-2'>
          <p className='border-border bg-background min-w-0 flex-1 rounded-md border px-3 py-2 font-mono text-xs break-all select-all'>
            {endpointUrl}
          </p>
          <CopyButton
            text={endpointUrl}
            ariaLabel={t('copyEndpoint')}
            copiedLabel={t('endpointCopied')}
            className='text-muted-foreground hover:text-foreground hover:bg-muted flex size-8 flex-none cursor-pointer items-center justify-center rounded-md transition-colors'
            iconClassName='size-4'
          />
        </div>
        <p className='text-muted-foreground text-xs'>{t('endpointHint')}</p>
      </div>

      <UserSettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} initialTab='aiAccess' />
    </div>
  );
}
