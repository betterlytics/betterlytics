import { generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { buildSEOConfig } from '@/lib/seo';
import { StructuredData } from '@/components/StructuredData';
import { CtaStrip } from '@/components/public/ctaStrip';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import type { SupportedLanguages } from '@/constants/i18n';
import { env } from '@/lib/env';
import { redirect } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: SupportedLanguages }> }) {
  const { locale } = await params;
  return generateSEO(await buildSEOConfig(SEO_CONFIGS.about), { locale });
}

export default async function AboutPage() {
  if (!env.IS_CLOUD) {
    redirect('/');
  }

  const t = await getTranslations('public.about');
  const seoConfig = await buildSEOConfig(SEO_CONFIGS.about);

  return (
    <>
      <StructuredData config={seoConfig} />
      <div className='relative'>
        <div
          className='pointer-events-none absolute inset-x-0 -top-20 h-[500px] bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.08),_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.12),_transparent_60%)]'
          aria-hidden
        />

        <div className='relative container mx-auto max-w-5xl px-4 py-16 sm:py-24'>
          <div className='mb-16 text-center sm:mb-20'>
            <h1 className='mb-4 text-4xl font-bold tracking-[-0.02em] sm:text-5xl'>{t('aboutUs')}</h1>
            <p className='text-muted-foreground mx-auto max-w-xl text-lg'>{t('intro')}</p>
          </div>

          <div className='space-y-16'>
            <section>
              <h2 className='mb-4 text-2xl font-bold'>{t('sections.howWeStarted.title')}</h2>
              <div className='space-y-4'>
                <p className='text-muted-foreground text-sm leading-relaxed'>{t('sections.howWeStarted.p1')}</p>
                <p className='text-muted-foreground text-sm leading-relaxed'>{t('sections.howWeStarted.p2')}</p>
                <p className='text-muted-foreground text-sm leading-relaxed'>{t('sections.howWeStarted.p3')}</p>
              </div>
            </section>

            <section>
              <h2 className='mb-4 text-2xl font-bold'>{t('sections.whyPrivacyFirst.title')}</h2>
              <div className='space-y-4'>
                <p className='text-muted-foreground text-sm leading-relaxed'>{t('sections.whyPrivacyFirst.p1')}</p>
                <p className='text-muted-foreground text-sm leading-relaxed'>{t('sections.whyPrivacyFirst.p2')}</p>
              </div>
            </section>

            <section>
              <h2 className='mb-4 text-2xl font-bold'>{t('sections.builtInOpen.title')}</h2>
              <div className='space-y-4'>
                <p className='text-muted-foreground text-sm leading-relaxed'>{t('sections.builtInOpen.p1')}</p>
                <p className='text-muted-foreground text-sm leading-relaxed'>{t('sections.builtInOpen.p2')}</p>
              </div>
            </section>

            <section>
              <h2 className='mb-4 text-2xl font-bold'>{t('sections.privacyPerformance.title')}</h2>
              <div className='space-y-4'>
                <p className='text-muted-foreground text-sm leading-relaxed'>
                  {t('sections.privacyPerformance.p1')}
                </p>
                <p className='text-muted-foreground text-sm leading-relaxed'>
                  {t('sections.privacyPerformance.p2')}
                </p>
              </div>
            </section>

            <section>
              <h2 className='mb-4 text-2xl font-bold'>{t('sections.builtForEveryone.title')}</h2>
              <div className='space-y-4'>
                <p className='text-muted-foreground text-sm leading-relaxed'>
                  {t('sections.builtForEveryone.p1')}
                </p>
                <p className='text-muted-foreground text-sm leading-relaxed'>
                  {t('sections.builtForEveryone.p2')}
                </p>
              </div>
            </section>

            <section>
              <h2 className='mb-4 text-2xl font-bold'>{t('sections.privacyRegulations.title')}</h2>
              <div className='space-y-4'>
                <p className='text-muted-foreground text-sm leading-relaxed'>
                  {t('sections.privacyRegulations.p1')}
                </p>
                <p className='text-muted-foreground text-sm leading-relaxed'>
                  {t('sections.privacyRegulations.p2')}
                </p>
                <p className='text-muted-foreground text-sm leading-relaxed'>
                  {t('sections.privacyRegulations.p3Prefix')}{' '}
                  <Link href='/privacy' className='text-primary hover:underline'>
                    {t('sections.privacyRegulations.privacyPolicyLabel')}
                  </Link>
                  .
                </p>
              </div>
            </section>

            <section>
              <h2 className='mb-4 text-2xl font-bold'>{t('sections.communityDriven.title')}</h2>
              <div className='space-y-4'>
                <p className='text-muted-foreground text-sm leading-relaxed'>{t('sections.communityDriven.p1')}</p>
                <p className='text-muted-foreground text-sm leading-relaxed'>{t('sections.communityDriven.p2')}</p>
              </div>
            </section>

            <section>
              <h2 className='mb-4 text-2xl font-bold'>{t('sections.future.title')}</h2>
              <blockquote className='border-primary mb-4 border-l-4 pl-6'>
                <p className='text-muted-foreground text-sm leading-relaxed italic'>
                  {t('sections.future.quote')}
                </p>
              </blockquote>
              <p className='text-muted-foreground text-sm leading-relaxed'>{t('sections.future.p1')}</p>
            </section>

            <div className='border-border/40 border-t pt-8 sm:pt-12'>
              <CtaStrip
                eyebrow={t('cta.eyebrow')}
                title={t('cta.title')}
                subtitle={t('cta.lead')}
                buttonText={t('cta.getStarted')}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
