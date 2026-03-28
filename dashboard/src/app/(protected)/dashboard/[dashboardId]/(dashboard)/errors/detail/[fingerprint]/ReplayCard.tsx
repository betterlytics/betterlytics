'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { useDashboardNavigation } from '@/contexts/DashboardNavigationContext';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { PermissionGate } from '@/components/tooltip/PermissionGate';

type ReplayCardProps = {
  replaySessionId: string;
};

export function ReplayCard({ replaySessionId }: ReplayCardProps) {
  const t = useTranslations('errors.detail.sidebar');
  const { resolveHref } = useDashboardNavigation();
  const { isDemo } = useDashboardAuth();

  const content = (
    <div className='flex flex-col items-center gap-2 text-center'>
      <div className='bg-primary/15 flex h-8 w-8 items-center justify-center rounded-full'>
        <Play className='text-primary h-3.5 w-3.5 translate-x-[1px]' />
      </div>
      <div>
        <p className='text-sm font-medium'>
          {t('watchReplay')}
        </p>
        <p className='text-muted-foreground text-xs'>{t('watchReplayDescription')}</p>
      </div>
    </div>
  );

  return (
    <PermissionGate allowViewer>
      {() => (
        <Card className='border-primary/30 bg-primary/10'>
          <CardContent className='px-4 py-3'>
            {isDemo ? content : (
              <Link href={resolveHref(`/replay?sessionId=${replaySessionId}`)}>{content}</Link>
            )}
          </CardContent>
        </Card>
      )}
    </PermissionGate>
  );
}
