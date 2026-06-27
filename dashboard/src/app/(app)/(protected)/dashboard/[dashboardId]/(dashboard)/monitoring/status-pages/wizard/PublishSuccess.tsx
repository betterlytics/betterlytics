'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FlowOverlayHeader } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/status-pages/shared/FlowOverlayHeader';

type PublishSuccessProps = {
  dashboardId: string;
  created: { id: string; slug: string };
  publicHost: string;
  publicBaseUrl: string;
};

export function PublishSuccess({ dashboardId, created, publicHost, publicBaseUrl }: PublishSuccessProps) {
  const t = useTranslations('statusPagesPage.editor');
  const router = useRouter();
  const publicUrl = `${publicBaseUrl}/status/${created.slug}`;

  return (
    <>
      <FlowOverlayHeader
        title={t('wizard.title')}
        closeAriaLabel={t('wizard.close')}
        onClose={() => router.push(`/dashboard/${dashboardId}/monitoring/status-pages`)}
      />
      <div className='flex-1 overflow-y-auto'>
        <div className='mx-auto flex w-full max-w-md flex-col items-center px-4 py-16 text-center'>
          <span className='flex h-13 w-13 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_0_8px_rgba(34,197,94,0.15)]'>
            <Check className='h-6 w-6 text-white' strokeWidth={3} aria-hidden />
          </span>
          <h2 className='mt-5 text-xl font-bold'>{t('publishSuccess.title')}</h2>
          <p className='text-muted-foreground mt-2 text-sm'>{t('publishSuccess.description')}</p>
          <div className='mt-6 flex w-full items-stretch gap-2'>
            <div className='border-input bg-muted text-foreground flex min-w-0 flex-1 items-center rounded-md border px-3 py-2 text-sm'>
              <span className='truncate'>{`${publicHost}/status/${created.slug}`}</span>
            </div>
            <Button
              variant='outline'
              className='flex-none cursor-pointer'
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                toast.success(t('publishSuccess.copied'));
              }}
            >
              <Copy className='mr-1 h-3.5 w-3.5' />
              {t('publishSuccess.copy')}
            </Button>
          </div>
          <div className='mt-6 flex gap-2'>
            <Button
              variant='outline'
              className='cursor-pointer'
              onClick={() => router.push(`/dashboard/${dashboardId}/monitoring/status-pages/${created.id}`)}
            >
              {t('publishSuccess.manage')}
            </Button>
            <Button asChild className='cursor-pointer'>
              <a href={publicUrl} target='_blank' rel='noopener noreferrer'>
                <ExternalLink className='mr-1 h-4 w-4' />
                {t('publishSuccess.view')}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
