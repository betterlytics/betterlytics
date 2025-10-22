import { generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { redirect } from 'next/navigation';
import { env } from '@/lib/env';
import { getTranslations, getLocale } from 'next-intl/server';
import type { SupportedLanguages } from '@/constants/i18n';
import { StructuredData } from '@/components/StructuredData';

export async function generateMetadata({ params }: { params: Promise<{ locale: SupportedLanguages }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public.privacy.seo' });
  const seoConfig = {
    ...SEO_CONFIGS.privacy,
    title: t('title'),
    description: t('description'),
    keywords: t.raw('keywords') as string[],
  } as const;
  return generateSEO(seoConfig, { locale });
}

export default async function PrivacyPage() {
  if (!env.IS_CLOUD) {
    redirect('/');
  }

  const t = await getTranslations('public.privacy');
  const locale = await getLocale();
  const seoConfig = { ...SEO_CONFIGS.privacy, title: t('title') } as const;

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
            <p className='text-muted-foreground mt-2 text-sm'>{t('translationDisclaimer')}</p>
          </div>

          <div className='space-y-8 px-6 py-8'>
            <section className='border-primary bg-accent rounded-r-lg border-l-4 p-6'>
              <h2 className='text-accent-foreground mb-3 text-xl font-semibold'>{t('tldr.title')}</h2>
              <p className='text-accent-foreground'>{t('tldr.body')}</p>
            </section>

            <section className='border-primary bg-accent rounded-r-lg border-l-4 p-6'>
              <h2 className='text-accent-foreground mb-3 text-xl font-semibold'>{t('scope.title')}</h2>
              <p className='text-accent-foreground'>{t('scope.body')}</p>
            </section>

            <section>
              <p className='text-foreground leading-relaxed'>{t('intro.p1')}</p>
              <p className='text-foreground mt-4 leading-relaxed'>{t('intro.p2')}</p>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('visitor.title')}</h2>
              <p className='text-foreground mb-4'>{t('visitor.lead')}</p>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>{t('visitor.li1')}</li>
                <li>{t('visitor.li2')}</li>
                <li>{t('visitor.li3')}</li>
                <li>{t('visitor.li4')}</li>
                <li>{t('visitor.li5')}</li>
                <li>{t('visitor.li6')}</li>
              </ul>
              <p className='text-foreground pt-4'>{t('visitor.finalRemarks1')}</p>
              <p className='text-foreground pt-4'>{t('visitor.finalRemarks2')}</p>
              <p className='text-foreground pt-4'>{t('visitor.finalRemarks3')}</p>
            </section>

            <section>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>{t('anonymous.title')}</h3>
              <div className='space-y-4'>
                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>{t('anonymous.pageViews.title')}</h4>
                  <p className='text-muted-foreground text-sm'>{t('anonymous.pageViews.body')}</p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>{t('anonymous.deviceBrowser.title')}</h4>
                  <p className='text-muted-foreground text-sm'>{t('anonymous.deviceBrowser.body')}</p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>{t('anonymous.geographic.title')}</h4>
                  <p className='text-muted-foreground text-sm'>{t('anonymous.geographic.body')}</p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>{t('anonymous.anonymousId.title')}</h4>
                  <p className='text-muted-foreground text-sm'>{t('anonymous.anonymousId.body')}</p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>{t('anonymous.sessionTracking.title')}</h4>
                  <p className='text-muted-foreground text-sm'>{t('anonymous.sessionTracking.body')}</p>
                </div>
              </div>
              <p className='text-foreground pt-4'>{t('anonymous.finalRemarks')}</p>
            </section>

            <section>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>{t('processStore.title')}</h3>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>{t('processStore.li1')}</li>
                <li>{t('processStore.li2')}</li>
                <li>{t('processStore.li3')}</li>
                <li>{t('processStore.li4')}</li>
                <li>{t('processStore.li5')}</li>
              </ul>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('customer.title')}</h2>
              <p className='text-foreground mb-4'>{t('customer.lead')}</p>

              <div className='space-y-4'>
                <div>
                  <h4 className='text-foreground mb-2 font-semibold'>{t('customer.whatWeCollect.title')}</h4>
                  <ul className='text-foreground list-disc space-y-2 pl-6'>
                    <li>{t('customer.whatWeCollect.email')}</li>
                    <li>{t('customer.whatWeCollect.auth')}</li>
                    <li>{t('customer.whatWeCollect.websiteConfig')}</li>
                    <li>{t('customer.whatWeCollect.usage')}</li>
                  </ul>
                </div>

                <div>
                  <h4 className='text-foreground mb-2 font-semibold'>{t('customer.thirdParty.title')}</h4>
                  <p className='text-foreground mb-2'>{t('customer.thirdParty.intro')}</p>
                  <ul className='text-foreground list-disc space-y-1 pl-6'>
                    <li>{t('customer.thirdParty.li1')}</li>
                    <li>{t('customer.thirdParty.li2')}</li>
                  </ul>
                  <p className='text-foreground mt-2'>{t('customer.thirdParty.outro')}</p>
                </div>
              </div>
              <p className='text-foreground mt-4'>{t('customer.cookieUse')}</p>
              <p className='text-foreground mt-4'>{t('customer.responsibility')}</p>
            </section>

            <section>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>{t('dataRetention.title')}</h3>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>{t('dataRetention.li1')}</li>
                <li>{t('dataRetention.li2')}</li>
                <li>{t('dataRetention.li3')}</li>
              </ul>
              <p className='text-foreground mt-4'>{t('dataRetention.footer')}</p>
            </section>

            <section>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>{t('rights.title')}</h3>
              <p className='text-foreground mb-4'>{t('rights.intro')}</p>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>{t('rights.li1')}</li>
                <li>{t('rights.li2')}</li>
                <li>{t('rights.li3')}</li>
                <li>{t('rights.li4')}</li>
                <li>{t('rights.li5')}</li>
                <li>{t('rights.li6')}</li>
                <li>{t('rights.li7')}</li>
              </ul>
              <p className='text-foreground mt-4'>{t('rights.contact')}</p>
            </section>

            <section className='border-primary bg-secondary rounded-r-lg border-l-4 p-6'>
              <h3 className='text-secondary-foreground mb-4 text-xl font-semibold'>{t('noCookies.title')}</h3>
              <p className='text-secondary-foreground'>{t('noCookies.body')}</p>
            </section>

            <section>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>{t('security.title')}</h3>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>{t('security.li1')}</li>
                <li>{t('security.li2')}</li>
                <li>{t('security.li3')}</li>
                <li>{t('security.li4')}</li>
              </ul>
            </section>

            <section>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>{t('changes.title')}</h3>
              <p className='text-foreground'>{t('changes.body')}</p>
            </section>

            <section className='bg-muted rounded-lg p-6'>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>{t('contact.title')}</h3>
              <p className='text-foreground mb-4'>{t('contact.lead')}</p>
              <div className='text-foreground space-y-2'>
                <p>
                  <strong>{t('contact.email')}</strong> privacy@betterlytics.io
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
