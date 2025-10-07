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

  const Heading = ({ num, children }: { num: number; children: React.ReactNode }) => (
    <h2 className='text-foreground mb-4 text-2xl font-semibold'>
      <span className='mr-2'>{num}.</span>
      {children}
    </h2>
  );

  const Subheading = ({ num, children }: { num: string; children: React.ReactNode }) => (
    <h4 className='text-foreground font-semibold'>
      <span className='mr-2'>{num}</span>
      {children}
    </h4>
  );

  const NumberedP = ({ num, children }: { num: string; children: React.ReactNode }) => (
    <p className='text-foreground leading-relaxed'>
      <span className='mr-2'>{num}</span>
      {children}
    </p>
  );

  const NumberedLi = ({ num, children }: { num: string; children: React.ReactNode }) => (
    <li className='text-foreground'>
      <span className='mr-2'>{num}</span>
      {children}
    </li>
  );

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
            <section className='space-y-4'>
              <Heading num={1}>{t('scope.title')}</Heading>
              <NumberedP num='1.1'>{t('scope.body')}</NumberedP>
              <NumberedP num='1.2'>{t('intro.p1')}</NumberedP>
              <NumberedP num='1.3'>{t('intro.p2')}</NumberedP>
              <NumberedP num='1.4'>{t('intro.p3')}</NumberedP>
              <NumberedP num='1.5'>{t('intro.p4')}</NumberedP>
            </section>

            <section>
              <Heading num={2}>{t('account.title')}</Heading>
              <ul className='list-none space-y-3'>
                <NumberedLi num='2.1'>{t('account.li1')}</NumberedLi>
                <NumberedLi num='2.2'>{t('account.li2')}</NumberedLi>
                <NumberedLi num='2.3'>{t('account.li3')}</NumberedLi>
                <NumberedLi num='2.4'>{t('account.li4')}</NumberedLi>
                <NumberedLi num='2.5'>{t('account.li5')}</NumberedLi>
                <NumberedLi num='2.6'>{t('account.li6')}</NumberedLi>
                <NumberedLi num='2.7'>{t('account.li7')}</NumberedLi>
              </ul>
            </section>

            <section>
              <Heading num={3}>{t('acceptableUse.title')}</Heading>
              <div className='space-y-4'>
                <NumberedP num='3.1'>{t('acceptableUse.intro')}</NumberedP>
                <ul className='list-disc space-y-2 pl-6'>
                  <li className='text-foreground'>{t('acceptableUse.li1')}</li>
                  <li className='text-foreground'>{t('acceptableUse.li2')}</li>
                  <li className='text-foreground'>{t('acceptableUse.li3')}</li>
                  <li className='text-foreground'>{t('acceptableUse.li4')}</li>
                  <li className='text-foreground'>{t('acceptableUse.li5')}</li>
                  <li className='text-foreground'>{t('acceptableUse.li6')}</li>
                  <li className='text-foreground'>{t('acceptableUse.li7')}</li>
                  <li className='text-foreground'>{t('acceptableUse.li8')}</li>
                </ul>
              </div>
            </section>

            <section>
              <Heading num={4}>{t('payment.title')}</Heading>
              <div className='space-y-4'>
                <Subheading num='4.1'>{t('payment.freeTierTitle')}</Subheading>
                <NumberedP num='4.1'>{t('payment.freeTierBody')}</NumberedP>

                <Subheading num='4.2'>{t('payment.billingTitle')}</Subheading>
                <NumberedP num='4.2'>{t('payment.billingBody')}</NumberedP>

                <Subheading num='4.3'>{t('payment.limitsTitle')}</Subheading>
                <NumberedP num='4.3'>{t('payment.limitsBody')}</NumberedP>

                <Subheading num='4.4'>{t('payment.planChangesTitle')}</Subheading>
                <NumberedP num='4.4'>{t('payment.planChangesBody')}</NumberedP>

                <Subheading num='4.5'>{t('payment.overdueTitle')}</Subheading>
                <NumberedP num='4.5'>{t('payment.overdueBody')}</NumberedP>

                <Subheading num='4.6'>{t('payment.refundsTitle')}</Subheading>
                <NumberedP num='4.6'>{t('payment.refundsBody')}</NumberedP>
              </div>
            </section>

            <section>
              <Heading num={5}>{t('cancellation.title')}</Heading>
              <div className='space-y-4'>
                <div className='border-primary bg-accent rounded-r-lg border-l-4 p-4'>
                  {t('cancellation.importantTitle')}
                  <ul className='text-accent-foreground list-none space-y-1 text-sm'>
                    <li>{t('cancellation.li1')}</li>
                    <li>{t('cancellation.li2')}</li>
                  </ul>
                </div>

                <Subheading num='5.2'>{t('cancellation.howToTitle')}</Subheading>
                <NumberedP num='5.2'>{t('cancellation.howToBody')}</NumberedP>

                <Subheading num='5.3'>{t('cancellation.whatHappensTitle')}</Subheading>
                <ul className='list-none space-y-2'>
                  <NumberedLi num='5.3.1'>{t('cancellation.whLi1')}</NumberedLi>
                  <NumberedLi num='5.3.2'>{t('cancellation.whLi2')}</NumberedLi>
                </ul>

                <div className='border-primary bg-accent rounded-r-lg border-l-4 p-4'>
                  <ul className='text-accent-foreground list-none space-y-1 text-sm'>
                    <li>{t('cancellation.residualCopies')}</li>
                  </ul>
                </div>

                <Subheading num='5.4'>{t('cancellation.ourRightTitle')}</Subheading>
                <NumberedP num='5.4'>{t('cancellation.ourRightBody')}</NumberedP>
              </div>
            </section>

            <section>
              <Heading num={6}>{t('serviceMods.title')}</Heading>
              <ul className='list-none space-y-3'>
                <NumberedLi num='6.1'>{t('serviceMods.li1')}</NumberedLi>
                <NumberedLi num='6.2'>{t('serviceMods.li2')}</NumberedLi>
                <NumberedLi num='6.3'>{t('serviceMods.li3')}</NumberedLi>
                <NumberedLi num='6.4'>{t('serviceMods.li4')}</NumberedLi>
              </ul>
            </section>

            <section>
              <Heading num={7}>{t('dataOwnership.title')}</Heading>
              <div className='space-y-4'>
                <Subheading num='7.1'>{t('dataOwnership.yourRightsTitle')}</Subheading>
                <NumberedP num='7.1'>{t('dataOwnership.yourRightsBody')}</NumberedP>

                <Subheading num='7.2'>{t('dataOwnership.anonymousDataTitle')}</Subheading>
                <NumberedP num='7.2'>{t('dataOwnership.anonymousDataBody')}</NumberedP>

                <Subheading num='7.3'>{t('dataOwnership.dpaTitle')}</Subheading>
                <NumberedP num='7.3'>
                  {t('dataOwnership.dpaBodyPrefix')}{' '}
                  <Link href='/dpa' className='text-primary hover:underline'>
                    /dpa
                  </Link>
                  {t('dataOwnership.dpaBodySuffix')}
                </NumberedP>

                <Subheading num='7.4'>{t('dataOwnership.yourResponsibilitiesTitle')}</Subheading>
                <ul className='list-none space-y-2'>
                  <NumberedLi num='7.4.1'>{t('dataOwnership.yrLi1')}</NumberedLi>
                  <NumberedLi num='7.4.2'>{t('dataOwnership.yrLi2')}</NumberedLi>
                  <NumberedLi num='7.4.3'>{t('dataOwnership.yrLi3')}</NumberedLi>
                  <NumberedLi num='7.4.4'>{t('dataOwnership.yrLi4')}</NumberedLi>
                </ul>

                <Subheading num='7.5'>{t('dataOwnership.ourCommitmentsTitle')}</Subheading>
                <ul className='list-none space-y-2'>
                  <NumberedLi num='7.5.1'>{t('dataOwnership.ocLi1')}</NumberedLi>
                  <NumberedLi num='7.5.2'>{t('dataOwnership.ocLi2')}</NumberedLi>
                  <NumberedLi num='7.5.3'>{t('dataOwnership.ocLi3')}</NumberedLi>
                  <NumberedLi num='7.5.4'>{t('dataOwnership.ocLi4')}</NumberedLi>
                  <NumberedLi num='7.5.5'>{t('dataOwnership.ocLi5')}</NumberedLi>
                </ul>
                <NumberedP num='7.6'>{t('dataOwnership.finalRemarks')}</NumberedP>
              </div>
            </section>

            <section>
              <Heading num={8}>{t('sla.title')}</Heading>
              <div className='space-y-4'>
                <NumberedP num='8.1'>{t('sla.availabilityBody')}</NumberedP>
                <NumberedP num='8.2'>{t('sla.availabilityBodySuffix')}</NumberedP>

                <NumberedP num='8.3'>{t('sla.supportBody')}</NumberedP>

                <NumberedP num='8.4'>{t('sla.bugsBody')}</NumberedP>
              </div>
            </section>

            <section>
              <Heading num={9}>{t('liability.title')}</Heading>
              <div className='space-y-4'>
                <NumberedP num='9.1'>{t('liability.p1')}</NumberedP>
                <ul className='list-disc space-y-2 pl-6'>
                  <li className='text-foreground'>{t('liability.li1')}</li>
                  <li className='text-foreground'>{t('liability.li2')}</li>
                  <li className='text-foreground'>{t('liability.li3')}</li>
                  <li className='text-foreground'>{t('liability.li4')}</li>
                  <li className='text-foreground'>{t('liability.li5')}</li>
                </ul>

                <div className='bg-muted rounded-lg p-4'>
                  <p className='text-foreground'>{t('liability.note')}</p>
                </div>

                <NumberedP num='9.3'>{t('liability.p2')}</NumberedP>
                <NumberedP num='9.4'>{t('liability.p3')}</NumberedP>
                <NumberedP num='9.5'>{t('liability.p4')}</NumberedP>
                <NumberedP num='9.6'>{t('liability.p5')}</NumberedP>
                <NumberedP num='9.7'>{t('liability.p6')}</NumberedP>
                <NumberedP num='9.8'>{t('liability.p7')}</NumberedP>
                <NumberedP num='9.9'>{t('liability.p8')}</NumberedP>
              </div>
            </section>

            <section>
              <Heading num={10}>{t('ip.title')}</Heading>
              <ul className='list-none space-y-3'>
                <NumberedLi num='10.1'>{t('ip.li1')}</NumberedLi>
                <NumberedLi num='10.2'>{t('ip.li2')}</NumberedLi>
                <NumberedLi num='10.3'>{t('ip.li3')}</NumberedLi>
                <NumberedLi num='10.4'>{t('ip.li4')}</NumberedLi>
                <NumberedLi num='10.5'>{t('ip.li5')}</NumberedLi>
              </ul>
            </section>

            <section>
              <Heading num={11}>{t('updates.title')}</Heading>
              <ul className='list-none space-y-2'>
                <NumberedLi num='11.1'>{t('updates.p1')}</NumberedLi>
                <NumberedLi num='11.2'>{t('updates.li1')}</NumberedLi>
                <NumberedLi num='11.3'>{t('updates.li2')}</NumberedLi>
                <NumberedLi num='11.4'>{t('updates.li3')}</NumberedLi>
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
