import { Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExternalLink from '@/components/ExternalLink';
import { getTranslations } from 'next-intl/server';

export async function OpenSourceCallout() {
  const t = await getTranslations('public.landing.openSource');
  return (
    <section className='py-20'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center'>
          <Github className='text-primary mx-auto mb-6 h-16 w-16' />
          <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
            <span className='text-blue-600 dark:text-blue-400'>{t('titleEmphasis')}</span> &amp; {t('titleRest')}
          </h2>
          <p className='text-muted-foreground mx-auto mb-8 max-w-2xl text-xl'>{t('subtitle')}</p>
          <div className='flex flex-col justify-center gap-4 sm:flex-row'>
            <Button size='lg' variant='outline' asChild>
              <a href='https://github.com/betterlytics/betterlytics' target='_blank' rel='noopener noreferrer'>
                <Github className='mr-2 h-5 w-5' />
                {t('starOnGithub')}
              </a>
            </Button>
            <Button size='lg' variant='outline' asChild>
              <ExternalLink href='/docs' title={t('docsTitle')}>
                {t('viewDocs')}
              </ExternalLink>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
