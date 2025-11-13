import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export async function CtaStrip() {
  const t = await getTranslations('public.landing.ctaStrip');

  return (
    <div className='container mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
      <div className='relative flex w-full flex-col gap-6 overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-600/15 via-blue-500/10 to-blue-400/10 p-6 text-center shadow-md shadow-xl ring-1 shadow-blue-500/5 ring-white/30 backdrop-blur ring-inset sm:flex-row sm:items-center sm:justify-between sm:p-8 sm:text-left dark:border-blue-900/40 dark:from-blue-900/35 dark:via-blue-900/20 dark:to-blue-800/20 dark:ring-white/5'>
        <div className='space-y-2'>
          <p className='text-xs font-semibold tracking-[0.2em] text-blue-700/80 uppercase dark:text-blue-300/80'>
            {t('eyebrow')}
          </p>
          <h3 className='text-2xl font-semibold sm:text-3xl'>{t('title')}</h3>
          <p className='text-muted-foreground text-sm sm:text-base'>{t('subtitle')}</p>
        </div>
        <div className='flex flex-col justify-center gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4'>
          <Link
            href='/onboarding'
            className='group inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-md shadow-blue-600/20 transition-colors duration-150 hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none'
            aria-label={t('primaryCta')}
          >
            {t('primaryCta')}
            <ArrowRight
              className='ml-2 h-4 w-4 transition-transform duration-150 group-hover:translate-x-1 motion-reduce:transform-none'
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
