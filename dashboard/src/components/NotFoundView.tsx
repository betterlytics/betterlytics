import { Schibsted_Grotesk } from 'next/font/google';
import NextLink from 'next/link';
import { getTranslations } from 'next-intl/server';
import Logo from '@/components/logo';
import { GoBackButton } from '@/components/notFound/GoBackButton';
import { InkedNumerals } from '@/components/notFound/InkedNumerals';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const heavy = Schibsted_Grotesk({ subsets: ['latin'], weight: '800' });

export async function NotFoundView() {
  const t = await getTranslations('public.notFound');

  return (
    <div className='bg-background text-foreground flex min-h-screen flex-col'>
      {/* unlocalized: the signed-in app has no /da/dashboards */}
      <header className='flex h-16 items-center px-6'>
        <NextLink href='/dashboards' className='flex items-center'>
          <Logo variant='simple' showText textSize='md' />
        </NextLink>
      </header>
      <main className='flex flex-1 flex-col items-center justify-center px-4 pb-16 text-center'>
        <h1 className='sr-only'>{t('title')}</h1>
        <InkedNumerals
          className={cn(
            heavy.className,
            '[--numeral-ink:var(--primary)] [--numeral-lens:var(--primary)] [--numeral-tint:var(--primary)] dark:[--numeral-ink:color-mix(in_oklch,var(--primary),white_30%)] dark:[--numeral-lens:color-mix(in_oklch,var(--primary),white_50%)]',
          )}
        />
        <p className='mt-12 max-w-[46ch] text-lg text-balance md:text-xl'>{t('description')}</p>
        <div className='mt-8 flex flex-wrap justify-center gap-3 max-sm:w-full max-sm:flex-col'>
          <NextLink href='/dashboards' className={buttonVariants({ size: 'lg' })}>
            {t('goToDashboards')}
          </NextLink>
          <GoBackButton label={t('goBack')} className={buttonVariants({ variant: 'outline', size: 'lg' })} />
        </div>
      </main>
    </div>
  );
}
