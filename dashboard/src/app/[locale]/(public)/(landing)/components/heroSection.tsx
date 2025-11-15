import { ArrowUpRight, ChevronRight, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GitHubStats } from './githubStats';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { env } from '@/lib/env';
import { DemoDashboardPreview } from './demoDashboardSection';

export async function HeroSection() {
  const t = await getTranslations('public.landing.hero');
  const demoDashboardPath = env.DEMO_DASHBOARD_ID ? `/public/${env.DEMO_DASHBOARD_ID}` : null;

  return (
    <section className='relative overflow-visible pt-20 pb-24 sm:pt-32 sm:pb-32'>
      <div className='relative container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center'>
          <h1 className='mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl'>
            {t('titleNonHighlight')}
            <span className='text-blue-600 dark:text-blue-400'>{t('titleHighlight')}</span>
          </h1>
          <p className='text-muted-foreground mx-auto mb-10 max-w-4xl text-lg sm:text-lg'>{t('description')}</p>
          <div className='flex flex-col justify-center gap-6 sm:flex-row'>
            <Button
              size='lg'
              className='group bg-primary relative overflow-hidden px-8 text-lg shadow-lg transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl focus-visible:-translate-y-0.5 focus-visible:shadow-xl motion-reduce:transform-none motion-reduce:transition-none'
              asChild
            >
              <Link className='flex items-center justify-center gap-1' href='/onboarding'>
                {t('ctaPrimary')}
                <ChevronRight className='ml-1 h-5 w-5' />
              </Link>
            </Button>
            {demoDashboardPath ? (
              <Button
                size='lg'
                variant='outline'
                className='group relative overflow-hidden text-lg shadow-lg transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl focus-visible:-translate-y-0.5 focus-visible:shadow-xl motion-reduce:transform-none motion-reduce:transition-none'
                asChild
              >
                <Link
                  className='flex items-center justify-center gap-2'
                  href={demoDashboardPath}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  {t('ctaDemo')}
                  <ArrowUpRight className='ml-2 h-5 w-5' />
                </Link>
              </Button>
            ) : (
              <Button
                size='lg'
                variant='outline'
                className='group relative overflow-hidden text-lg transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:-translate-y-0.5 focus-visible:shadow-lg motion-reduce:transform-none motion-reduce:transition-none'
                asChild
              >
                <a
                  className='flex items-center justify-center gap-2'
                  href='https://github.com/betterlytics/betterlytics'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <Github className='mr-2 h-5 w-5' />
                  {t('ctaGithub')}
                </a>
              </Button>
            )}
          </div>
          <GitHubStats />
          {demoDashboardPath ? (
            <div className='max-w-8xl mx-auto mt-16 w-full sm:mt-18'>
              <p className='text-muted-foreground mb-6 hidden text-xs font-semibold tracking-[0.3em] uppercase sm:block'>
                {t('eyebrow')}
              </p>
              <DemoDashboardPreview />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
