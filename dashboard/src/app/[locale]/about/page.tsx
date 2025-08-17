import { generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { StructuredData } from '@/components/StructuredData';
import { Button } from '@/components/ui/button';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import ExternalLink from '@/components/ExternalLink';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public.about' });
  const seoConfig = { ...SEO_CONFIGS.about, title: t('aboutUs') } as const;
  return generateSEO(seoConfig, { locale });
}

export default async function AboutPage() {
  const t = await getTranslations('public.about');
  const seoConfig = { ...SEO_CONFIGS.about, title: t('aboutUs') } as const;

  return (
    <>
      <StructuredData config={seoConfig} />
      <div className='container mx-auto max-w-4xl px-4 py-32'>
        <div className='mb-12 text-center'>
          <h1 className='mb-6 text-4xl font-bold tracking-tight'>{t('aboutUs')}</h1>
          <p className='text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed'>{t('intro')}</p>
        </div>

        <div className='prose prose-gray dark:prose-invert max-w-none'>
          <section className='mb-12'>
            <h2 className='mb-6 text-2xl font-bold'>{t('sections.howWeStarted.title')}</h2>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>{t('sections.howWeStarted.p1')}</p>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>{t('sections.howWeStarted.p2')}</p>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>{t('sections.howWeStarted.p3')}</p>
          </section>

          <section className='mb-12'>
            <h2 className='mb-6 text-2xl font-bold'>{t('sections.whyPrivacyFirst.title')}</h2>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              {t('sections.whyPrivacyFirst.p1')}
            </p>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              {t('sections.whyPrivacyFirst.p2')}
            </p>
          </section>

          <section className='mb-12'>
            <h2 className='mb-6 text-2xl font-bold'>{t('sections.builtInOpen.title')}</h2>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>{t('sections.builtInOpen.p1')}</p>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>{t('sections.builtInOpen.p2')}</p>
          </section>

          <section className='mb-12'>
            <h2 className='mb-6 text-2xl font-bold'>{t('sections.privacyPerformance.title')}</h2>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              {t('sections.privacyPerformance.p1')}
            </p>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              {t('sections.privacyPerformance.p2')}
            </p>
          </section>

          <section className='mb-12'>
            <h2 className='mb-6 text-2xl font-bold'>{t('sections.builtForEveryone.title')}</h2>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              {t('sections.builtForEveryone.p1')}
            </p>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              {t('sections.builtForEveryone.p2')}
            </p>
          </section>

          <section className='mb-12'>
            <h2 className='mb-6 text-2xl font-bold'>{t('sections.privacyRegulations.title')}</h2>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              {t('sections.privacyRegulations.p1')}
            </p>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              {t('sections.privacyRegulations.p2')}
            </p>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              {t('sections.privacyRegulations.p3Prefix')}{' '}
              <Link href='/privacy' className='text-primary hover:underline'>
                {t('sections.privacyRegulations.privacyPolicyLabel')}
              </Link>
              .
            </p>
          </section>

          <section className='mb-12'>
            <h2 className='mb-6 text-2xl font-bold'>{t('sections.communityDriven.title')}</h2>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              {t('sections.communityDriven.p1')}
            </p>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              {t('sections.communityDriven.p2')}
            </p>
          </section>

          <section className='mb-12'>
            <h2 className='mb-6 text-2xl font-bold'>{t('sections.future.title')}</h2>
            <blockquote className='border-primary mb-6 border-l-4 pl-6'>
              <p className='text-muted-foreground text-lg leading-relaxed italic'>{t('sections.future.quote')}</p>
            </blockquote>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>{t('sections.future.p1')}</p>
          </section>

          <section className='py-8 text-center'>
            <h2 className='mb-6 text-2xl font-bold'>{t('cta.title')}</h2>
            <p className='text-muted-foreground mb-8 text-lg leading-relaxed'>{t('cta.lead')}</p>
            <div className='flex justify-center gap-4'>
              <Button asChild size='lg'>
                <Link href='/register'>{t('cta.getStarted')}</Link>
              </Button>
              <Button asChild variant='outline' size='lg'>
                <ExternalLink href='/docs' className='flex items-center gap-2' title={t('cta.docsTitle')}>
                  {t('cta.viewDocs')}
                  <ExternalLinkIcon className='h-4 w-4' />
                </ExternalLink>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
