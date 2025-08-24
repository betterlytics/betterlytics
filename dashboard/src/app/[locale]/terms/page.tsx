import { generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { env } from '@/lib/env';
import { getTranslations, getLocale } from 'next-intl/server';
import type { SupportedLanguages } from '@/constants/i18n';
import { StructuredData } from '@/components/StructuredData';

export async function generateMetadata({ params }: { params: Promise<{ locale: SupportedLanguages }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public.terms' });
  const seoConfig = { ...SEO_CONFIGS.terms, title: t('title') } as const;
  return generateSEO(seoConfig, { locale });
}

export default async function TermsPage() {
  if (!env.IS_CLOUD) {
    redirect('/');
  }

  const t = await getTranslations('public.terms');
  const locale = await getLocale();
  const seoConfig = { ...SEO_CONFIGS.terms, title: t('title') } as const;

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

            <section>
              <p className='text-foreground leading-relaxed'>{t('intro.p1')}</p>
              <p className='text-foreground mt-4 leading-relaxed'>{t('intro.p2')}</p>
              <p className='text-foreground mt-4 leading-relaxed'>{t('intro.p3')}</p>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('account.title')}</h2>
              <ul className='text-foreground list-disc space-y-3 pl-6'>
                <li>{t('account.li1')}</li>
                <li>{t('account.li2')}</li>
                <li>{t('account.li3')}</li>
                <li>{t('account.li4')}</li>
                <li>{t('account.li5')}</li>
                <li>{t('account.li6')}</li>
                <li>{t('account.li7')}</li>
              </ul>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('acceptableUse.title')}</h2>
              <div className='space-y-4'>
                <p className='text-foreground'>{t('acceptableUse.intro')}</p>
                <ul className='text-foreground list-disc space-y-2 pl-6'>
                  <li>{t('acceptableUse.li1')}</li>
                  <li>{t('acceptableUse.li2')}</li>
                  <li>{t('acceptableUse.li3')}</li>
                  <li>{t('acceptableUse.li4')}</li>
                  <li>{t('acceptableUse.li5')}</li>
                  <li>{t('acceptableUse.li6')}</li>
                  <li>{t('acceptableUse.li7')}</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('payment.title')}</h2>
              <div className='space-y-4'>
                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>{t('payment.freeTierTitle')}</h4>
                  <p className='text-muted-foreground text-sm'>{t('payment.freeTierBody')}</p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>{t('payment.billingTitle')}</h4>
                  <p className='text-muted-foreground text-sm'>{t('payment.billingBody')}</p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>{t('payment.limitsTitle')}</h4>
                  <p className='text-muted-foreground text-sm'>{t('payment.limitsBody')}</p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>{t('payment.planChangesTitle')}</h4>
                  <p className='text-muted-foreground text-sm'>{t('payment.planChangesBody')}</p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>{t('payment.refundsTitle')}</h4>
                  <p className='text-muted-foreground text-sm'>{t('payment.refundsBody')}</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('cancellation.title')}</h2>
              <div className='space-y-4'>
                <div className='border-primary bg-accent rounded-r-lg border-l-4 p-4'>
                  <h4 className='text-accent-foreground mb-2 font-semibold'>{t('cancellation.importantTitle')}</h4>
                  <ul className='text-accent-foreground list-disc space-y-1 pl-4 text-sm'>
                    <li>{t('cancellation.li1')}</li>
                    <li>{t('cancellation.li2')}</li>
                  </ul>
                </div>

                <h4 className='text-foreground font-semibold'>{t('cancellation.howToTitle')}</h4>
                <p className='text-foreground'>{t('cancellation.howToBody')}</p>

                <h4 className='text-foreground font-semibold'>{t('cancellation.whatHappensTitle')}</h4>
                <ul className='text-foreground list-disc space-y-2 pl-6'>
                  <li>{t('cancellation.whLi1')}</li>
                  <li>{t('cancellation.whLi2')}</li>
                </ul>

                <h4 className='text-foreground font-semibold'>{t('cancellation.ourRightTitle')}</h4>
                <p className='text-foreground'>{t('cancellation.ourRightBody')}</p>
              </div>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('serviceMods.title')}</h2>
              <ul className='text-foreground list-disc space-y-3 pl-6'>
                <li>{t('serviceMods.li1')}</li>
                <li>{t('serviceMods.li2')}</li>
                <li>{t('serviceMods.li3')}</li>
              </ul>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('dataOwnership.title')}</h2>
              <div className='space-y-4'>
                <div className='bg-secondary border-primary rounded-r-lg border-l-4 p-4'>
                  <h4 className='text-secondary-foreground mb-2 font-semibold'>
                    {t('dataOwnership.yourRightsTitle')}
                  </h4>
                  <p className='text-secondary-foreground text-sm'>{t('dataOwnership.yourRightsBody')}</p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>{t('dataOwnership.dpaTitle')}</h4>
                  <p className='text-muted-foreground text-sm'>
                    {t('dataOwnership.dpaBodyPrefix')}{' '}
                    <Link href='/dpa' className='text-primary hover:underline'>
                      /dpa
                    </Link>
                    {t('dataOwnership.dpaBodySuffix')}
                  </p>
                </div>

                <h4 className='text-foreground font-semibold'>{t('dataOwnership.whatWeCollectTitle')}</h4>
                <p className='text-foreground'>{t('dataOwnership.whatWeCollectBody')}</p>

                <h4 className='text-foreground font-semibold'>{t('dataOwnership.yourResponsibilitiesTitle')}</h4>
                <ul className='text-foreground list-disc space-y-2 pl-6'>
                  <li>{t('dataOwnership.yrLi1')}</li>
                  <li>{t('dataOwnership.yrLi2')}</li>
                  <li>{t('dataOwnership.yrLi3')}</li>
                  <li>{t('dataOwnership.yrLi4')}</li>
                </ul>

                <h4 className='text-foreground font-semibold'>{t('dataOwnership.ourCommitmentsTitle')}</h4>
                <ul className='text-foreground list-disc space-y-2 pl-6'>
                  <li>{t('dataOwnership.ocLi1')}</li>
                  <li>{t('dataOwnership.ocLi2')}</li>
                  <li>{t('dataOwnership.ocLi3')}</li>
                  <li>{t('dataOwnership.ocLi4')}</li>
                  <li>{t('dataOwnership.ocLi5')}</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('sla.title')}</h2>
              <div className='space-y-4'>
                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>{t('sla.availabilityTitle')}</h4>
                  <p className='text-muted-foreground text-sm'>{t('sla.availabilityBody')}</p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>{t('sla.supportTitle')}</h4>
                  <p className='text-muted-foreground text-sm'>{t('sla.supportBody')}</p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>{t('sla.bugsTitle')}</h4>
                  <p className='text-muted-foreground text-sm'>{t('sla.bugsBody')}</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('liability.title')}</h2>
              <div className='space-y-4'>
                <p className='text-foreground'>{t('liability.p1')}</p>
                <ul className='text-foreground list-disc space-y-2 pl-6'>
                  <li>{t('liability.li1')}</li>
                  <li>{t('liability.li2')}</li>
                  <li>{t('liability.li3')}</li>
                  <li>{t('liability.li4')}</li>
                  <li>{t('liability.li5')}</li>
                </ul>

                <div className='bg-muted rounded-lg p-4'>
                  <p className='text-muted-foreground text-sm'>{t('liability.note')}</p>
                </div>

                <p className='text-foreground'>{t('liability.p2')}</p>
              </div>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('ip.title')}</h2>
              <ul className='text-foreground list-disc space-y-3 pl-6'>
                <li>{t('ip.li1')}</li>
                <li>{t('ip.li2')}</li>
                <li>{t('ip.li3')}</li>
                <li>{t('ip.li4')}</li>
                <li>{t('ip.li5')}</li>
              </ul>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('updates.title')}</h2>
              <p className='text-foreground mb-4'>{t('updates.p1')}</p>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>{t('updates.li1')}</li>
                <li>{t('updates.li2')}</li>
                <li>{t('updates.li3')}</li>
                <li>{t('updates.li4')}</li>
              </ul>
            </section>

            <section className='bg-muted rounded-lg p-6'>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>{t('contact.title')}</h3>
              <p className='text-foreground mb-4'>{t('contact.lead')}</p>
              <div className='text-foreground space-y-2'>
                <p>
                  <strong>{t('contact.email')}</strong> legal@betterlytics.io
                </p>
                <p>
                  <strong>{t('contact.support')}</strong> support@betterlytics.io
                </p>
                <p>
                  <strong>{t('contact.address')}</strong> Betterlytics, EU
                </p>
              </div>
            </section>

            <section className='border-border border-t py-6 text-center'>
              <p className='text-muted-foreground text-sm'>
                {t('contact.footer1')}
                <br />
                {t('contact.footer2')}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
