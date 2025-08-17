import { generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { redirect } from 'next/navigation';
import { env } from '@/lib/env';
import { getTranslations, getLocale } from 'next-intl/server';
import { StructuredData } from '@/components/StructuredData';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public.dpa' });
  const seoConfig = { ...SEO_CONFIGS.dpa, title: t('title') } as const;
  return generateSEO(seoConfig, { locale });
}

export default async function DPAPage() {
  if (!env.IS_CLOUD) {
    redirect('/');
  }

  const t = await getTranslations('public.dpa');
  const locale = await getLocale();
  const seoConfig = { ...SEO_CONFIGS.dpa, title: t('title') } as const;

  return (
    <div className='bg-background min-h-screen py-12'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        <div className='bg-card border-border overflow-hidden rounded-lg border shadow-sm'>
          <div className='border-border border-b px-6 py-8'>
            <StructuredData config={seoConfig} />
            <h1 className='text-foreground text-3xl font-bold'>{t('title')}</h1>
            <p className='text-muted-foreground mt-2 text-lg'>
              {t('lastUpdated')}{' '}
              {new Date().toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className='space-y-8 px-6 py-8'>
            <section className='border-primary bg-accent rounded-r-lg border-l-4 p-6'>
              <h2 className='text-accent-foreground mb-3 text-xl font-semibold'>{t('scope.title')}</h2>
              <p className='text-accent-foreground'>{t('scope.body')}</p>
            </section>

            <section className='border-primary bg-secondary rounded-r-lg border-l-4 p-6'>
              <h2 className='text-secondary-foreground mb-3 text-xl font-semibold'>{t('whyDifferent.title')}</h2>
              <p className='text-secondary-foreground'>{t('whyDifferent.body')}</p>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('intro.title')}</h2>
              <p className='text-foreground mb-4 leading-relaxed'>{t('intro.p1')}</p>
              <p className='text-foreground leading-relaxed'>{t('intro.p2')}</p>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('definitions.title')}</h2>
              <div className='space-y-4'>
                <div className='bg-muted rounded-lg p-4'>
                  <p className='text-foreground'>{t('definitions.controller')}</p>
                </div>
                <div className='bg-muted rounded-lg p-4'>
                  <p className='text-foreground'>{t('definitions.processor')}</p>
                </div>
                <div className='bg-muted rounded-lg p-4'>
                  <p className='text-foreground'>{t('definitions.processing')}</p>
                </div>
                <div className='bg-muted rounded-lg p-4'>
                  <p className='text-foreground'>{t('definitions.personalData')}</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('processingDetails.title')}</h2>

              <h3 className='text-foreground mb-3 text-lg font-semibold'>
                {t('processingDetails.naturePurposeTitle')}
              </h3>
              <ul className='text-foreground mb-6 list-disc space-y-2 pl-6'>
                <li>{t('processingDetails.npLi1')}</li>
                <li>{t('processingDetails.npLi2')}</li>
                <li>{t('processingDetails.npLi3')}</li>
              </ul>

              <h3 className='text-foreground mb-3 text-lg font-semibold'>
                {t('processingDetails.categoriesTitle')}
              </h3>
              <div className='bg-muted mb-6 rounded-lg p-4'>
                <p className='text-foreground mb-2'>{t('processingDetails.categoriesIntro')}</p>
                <ul className='text-muted-foreground list-disc space-y-1 pl-6 text-sm'>
                  <li>{t('processingDetails.catLi1')}</li>
                  <li>{t('processingDetails.catLi2')}</li>
                  <li>{t('processingDetails.catLi3')}</li>
                  <li>{t('processingDetails.catLi4')}</li>
                  <li>{t('processingDetails.catLi5')}</li>
                  <li>{t('processingDetails.catLi6')}</li>
                </ul>
              </div>

              <h3 className='text-foreground mb-3 text-lg font-semibold'>
                {t('processingDetails.subjectsTitle')}
              </h3>
              <p className='text-foreground mb-6'>{t('processingDetails.subjectsBody')}</p>

              <h3 className='text-foreground mb-3 text-lg font-semibold'>
                {t('processingDetails.locationTitle')}
              </h3>
              <p className='text-foreground'>{t('processingDetails.locationBody')}</p>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('instructions.title')}</h2>
              <p className='text-foreground mb-4'>{t('instructions.intro')}</p>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>{t('instructions.li1')}</li>
                <li>{t('instructions.li2')}</li>
                <li>{t('instructions.li3')}</li>
                <li>{t('instructions.li4')}</li>
                <li>{t('instructions.li5')}</li>
              </ul>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('security.title')}</h2>
              <p className='text-foreground mb-4'>{t('security.intro')}</p>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>{t('security.li1')}</li>
                <li>{t('security.li2')}</li>
                <li>{t('security.li3')}</li>
                <li>{t('security.li4')}</li>
                <li>{t('security.li5')}</li>
                <li>{t('security.li6')}</li>
              </ul>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('subprocessors.title')}</h2>
              <p className='text-foreground mb-4'>{t('subprocessors.intro')}</p>
              <div className='space-y-3'>
                <div className='bg-muted rounded-lg p-4'>
                  <p className='text-foreground'>{t('subprocessors.li1')}</p>
                </div>
              </div>
              <p className='text-foreground mt-4'>{t('subprocessors.notice')}</p>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('rights.title')}</h2>
              <div className='border-primary bg-accent rounded-r-lg border-l-4 p-4'>
                <p className='text-accent-foreground'>{t('rights.body')}</p>
              </div>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('breach.title')}</h2>
              <p className='text-foreground mb-4'>{t('breach.intro')}</p>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>{t('breach.li1')}</li>
                <li>{t('breach.li2')}</li>
                <li>{t('breach.li3')}</li>
                <li>{t('breach.li4')}</li>
              </ul>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('deletion.title')}</h2>
              <div className='space-y-4'>
                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>{t('deletion.accountTitle')}</h4>
                  <p className='text-muted-foreground text-sm'>{t('deletion.accountBody')}</p>
                </div>
                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>{t('deletion.subscriptionTitle')}</h4>
                  <p className='text-muted-foreground text-sm'>{t('deletion.subscriptionBody')}</p>
                </div>
                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>{t('deletion.exportTitle')}</h4>
                  <p className='text-muted-foreground text-sm'>{t('deletion.exportBody')}</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('compliance.title')}</h2>
              <p className='text-foreground mb-4'>{t('compliance.intro')}</p>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>{t('compliance.li1')}</li>
                <li>{t('compliance.li2')}</li>
                <li>{t('compliance.li3')}</li>
                <li>{t('compliance.li4')}</li>
              </ul>
            </section>

            <section className='bg-muted rounded-lg p-6'>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>{t('contact.title')}</h3>
              <p className='text-foreground mb-4'>{t('contact.lead')}</p>
              <div className='text-foreground space-y-2'>
                <p>
                  <strong>{t('contact.legal')}</strong> legal@betterlytics.io
                </p>
                <p>
                  <strong>{t('contact.technical')}</strong> support@betterlytics.io
                </p>
              </div>
            </section>

            <section className='border-border border-t py-6'>
              <p className='text-muted-foreground text-center text-sm'>{t('contact.footer')}</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
