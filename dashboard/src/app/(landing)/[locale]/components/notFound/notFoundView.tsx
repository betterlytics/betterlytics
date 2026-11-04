import { useTranslations } from 'next-intl';
import { InkedNumerals } from '@/components/notFound/InkedNumerals';
import { Link } from '@/i18n/navigation';
import { PageShell } from '@/landing/components/page/pageShell';
import { AppLink } from '@/landing/components/ui/appLink';
import { buttonStyles } from '@/landing/components/ui/button';
import { Lede } from '@/landing/components/ui/text';

type NotFoundViewProps = {
  lede?: string;
  action?: { label: string; href: string };
};

export function NotFoundView({ lede, action }: NotFoundViewProps) {
  const t = useTranslations('landing.notFound');
  return (
    <>
      <title>{`${t('title')} | Betterlytics`}</title>
      <PageShell
        hero={
          // 72px and 56px: the nav
          <section
            aria-labelledby='not-found-title'
            className='relative flex min-h-[calc(100svh-72px)] flex-col items-center justify-center px-(--inset) py-20 text-center after:bleed-rule after:bottom-0 after:bg-rule max-sm:min-h-[calc(100svh-56px)] max-sm:px-(--pad) max-sm:py-14'
          >
            <h1 id='not-found-title' className='sr-only'>
              {t('title')}
            </h1>
            <InkedNumerals className='[--numeral-ink:var(--color-volt-text)] [--numeral-lens:var(--color-volt-soft)] [--numeral-tint:var(--color-volt)]' />
            <Lede className='mt-14 max-w-[46ch] max-sm:mt-10'>{lede ?? t('lede')}</Lede>
            <div className='mt-9 flex flex-wrap justify-center gap-2.5 max-sm:mt-8 max-sm:w-full max-sm:flex-col'>
              <Link href={action?.href ?? '/'} className={buttonStyles({ variant: 'volt', size: 'lg' })}>
                {action?.label ?? t('action')}
              </Link>
              <AppLink href='/features' className={buttonStyles({ variant: 'line', size: 'lg' })}>
                {t('secondary')}
              </AppLink>
            </div>
          </section>
        }
      />
    </>
  );
}
