import { ChevronRight, Github, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitHubStats } from './githubStats';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export async function HeroSection() {
  const t = await getTranslations('public.landing.hero');
  return (
    <section className='relative overflow-hidden py-20 sm:py-32'>
      <div className='absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/10' />

      <div className='absolute -top-40 -right-32 h-80 w-80 animate-pulse rounded-full bg-gradient-to-br from-blue-400/20 to-purple-600/20 blur-3xl' />
      <div className='absolute -bottom-40 -left-32 h-80 w-80 animate-pulse rounded-full bg-gradient-to-tr from-purple-400/20 to-blue-600/20 blur-3xl' />

      <div className='relative container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center'>
          <Badge variant='secondary' className='mb-4'>
            <Star className='mr-1 h-3 w-3' />
            {t('badge')}
          </Badge>
          <h1 className='mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl'>
            <span className='text-blue-600 dark:text-blue-400'>{t('titleTop')}</span> <br />
            {t('titleBottom')}
          </h1>
          <p className='text-muted-foreground mx-auto mb-8 max-w-3xl text-xl'>{t('description')}</p>
          <div className='flex flex-col justify-center gap-4 sm:flex-row'>
            <Button size='lg' className='bg-primary px-8 text-lg' asChild>
              <Link href='/onboarding'>
                {t('ctaPrimary')}
                <ChevronRight className='ml-1 h-5 w-5' />
              </Link>
            </Button>
            <Button size='lg' variant='outline' className='text-lg' asChild>
              <a href='https://github.com/betterlytics/betterlytics' target='_blank' rel='noopener noreferrer'>
                <Github className='mr-2 h-5 w-5' />
                {t('ctaGithub')}
              </a>
            </Button>
          </div>
          <GitHubStats />
        </div>
      </div>
    </section>
  );
}
