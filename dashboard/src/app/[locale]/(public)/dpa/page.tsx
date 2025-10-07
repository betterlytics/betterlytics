import { generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { redirect } from 'next/navigation';
import { env } from '@/lib/env';
import { getTranslations, getLocale } from 'next-intl/server';
import type { SupportedLanguages } from '@/constants/i18n';
import { StructuredData } from '@/components/StructuredData';

export async function generateMetadata({ params }: { params: Promise<{ locale: SupportedLanguages }> }) {
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
            <section className='space-y-3'>
              <Heading num={1}>{t('scope.title')}</Heading>
              <NumberedP num='1.1'>{t('scope.body')}</NumberedP>
              <NumberedP num='1.2'>{t('scope.appliesTo')}</NumberedP>
              <ul className='list-none space-y-2'>
                <NumberedLi num='1.3'>{t('scope.li1')}</NumberedLi>
                <NumberedLi num='1.4'>{t('scope.li2')}</NumberedLi>
              </ul>
            </section>

            <section>
              <Heading num={2}>{t('definitions.title')}</Heading>
              <ul className='list-none space-y-2'>
                <NumberedLi num='2.1'>{t('definitions.controller')}</NumberedLi>
                <NumberedLi num='2.2'>{t('definitions.processor')}</NumberedLi>
                <NumberedLi num='2.3'>{t('definitions.processing')}</NumberedLi>
                <NumberedLi num='2.4'>{t('definitions.personalData')}</NumberedLi>
                <NumberedLi num='2.5'>{t('definitions.subprocessor')}</NumberedLi>
              </ul>
            </section>

            <section className='space-y-4'>
              <Heading num={3}>{t('processingDetails.title')}</Heading>

              <Subheading num='3.1'>{t('processingDetails.naturePurposeTitle')}</Subheading>
              <ul className='list-none space-y-2'>
                <NumberedLi num='3.1.1'>{t('processingDetails.npLi1')}</NumberedLi>
                <NumberedLi num='3.1.2'>{t('processingDetails.npLi2')}</NumberedLi>
                <NumberedLi num='3.1.3'>{t('processingDetails.npLi3')}</NumberedLi>
              </ul>

              <Subheading num='3.2'>{t('processingDetails.categoriesTitle')}</Subheading>
              <NumberedP num='3.2.1'>{t('processingDetails.categoriesIntro')}</NumberedP>
              <ul className='text-foreground list-disc space-y-1 pl-6 text-sm'>
                <li>{t('processingDetails.catLi1')}</li>
                <li>{t('processingDetails.catLi2')}</li>
                <li>{t('processingDetails.catLi3')}</li>
                <li>{t('processingDetails.catLi4')}</li>
                <li>{t('processingDetails.catLi5')}</li>
                <li>{t('processingDetails.catLi6')}</li>
              </ul>

              <NumberedP num='3.2.2'>{t('processingDetails.personalDataTitle')}</NumberedP>
              <ul className='text-foreground list-disc space-y-1 pl-6 text-sm'>
                <li>{t('processingDetails.pdLi1')}</li>
                <li>{t('processingDetails.pdLi2')}</li>
                <li>{t('processingDetails.pdLi3')}</li>
                <li>{t('processingDetails.pdLi4')}</li>
              </ul>

              <Subheading num='3.3'>{t('processingDetails.subjectsTitle')}</Subheading>
              <ul className='list-none space-y-2'>
                <NumberedLi num='3.3.1'>{t('processingDetails.sLi1')}</NumberedLi>
                <NumberedLi num='3.3.2'>{t('processingDetails.sLi2')}</NumberedLi>
                <NumberedLi num='3.3.3'>{t('processingDetails.sLi3')}</NumberedLi>
              </ul>

              <Subheading num='3.4'>{t('processingDetails.locationTitle')}</Subheading>
              <NumberedP num='3.4.1'>{t('processingDetails.locationBody')}</NumberedP>
            </section>

            <section>
              <Heading num={4}>{t('dataController.title')}</Heading>
              <NumberedP num='4.1'>{t('dataController.intro')}</NumberedP>
              <ul className='list-disc space-y-2 pl-6'>
                <li className='text-foreground'>{t('dataController.li1')}</li>
                <li className='text-foreground'>{t('dataController.li2')}</li>
                <li className='text-foreground'>{t('dataController.li3')}</li>
                <li className='text-foreground'>{t('dataController.li4')}</li>
                <li className='text-foreground'>{t('dataController.li5')}</li>
              </ul>
            </section>
            <section>
              <Heading num={5}>{t('dataProcessor.title')}</Heading>
              <p className='text-foreground'>{t('dataProcessor.intro')}</p>
              <ul className='list-none space-y-2 pt-2'>
                <NumberedLi num='5.1'>{t('dataProcessor.li1')}</NumberedLi>
                <NumberedLi num='5.2'>{t('dataProcessor.li2')}</NumberedLi>
              </ul>
              <ul className='list-disc space-y-2 pl-6'>
                <li className='text-foreground'>{t('dataProcessor.li21')}</li>
                <li className='text-foreground'>{t('dataProcessor.li22')}</li>
                <li className='text-foreground'>{t('dataProcessor.li23')}</li>
                <li className='text-foreground'>{t('dataProcessor.li25')}</li>
                <li className='text-foreground'>{t('dataProcessor.li26')}</li>
              </ul>
              <ul className='list-none space-y-2 pt-2'>
                <NumberedLi num='5.3'>{t('dataProcessor.li3')}</NumberedLi>
                <NumberedLi num='5.4'>{t('dataProcessor.li4')}</NumberedLi>
              </ul>
            </section>

            <section>
              <Heading num={6}>{t('subprocessors.title')}</Heading>
              <NumberedP num='6.1'>{t('subprocessors.intro')}</NumberedP>
              <ul className='text-foreground list-disc space-y-1 pl-6 text-sm'>
                <li>{t('subprocessors.li1')}</li>
                <li>{t('subprocessors.li2')}</li>
                <li>{t('subprocessors.li3')}</li>
              </ul>
              <NumberedP num='6.2'>{t('subprocessors.notice')}</NumberedP>
            </section>

            <section>
              <Heading num={7}>{t('rights.title')}</Heading>
              <ul className='list-none space-y-2'>
                <NumberedLi num='7.1'>{t('rights.li1')}</NumberedLi>
                <NumberedLi num='7.2'>{t('rights.li2')}</NumberedLi>
              </ul>
            </section>

            <section>
              <Heading num={8}>{t('breach.title')}</Heading>
              <NumberedP num='8.1'>{t('breach.intro')}</NumberedP>
              <ul className='list-disc space-y-2 pl-6'>
                <li>{t('breach.li1')}</li>
                <li>{t('breach.li2')}</li>
              </ul>
            </section>

            <section>
              <Heading num={9}>{t('deletion.title')}</Heading>
              <div className='space-y-4'>
                <div>
                  <Subheading num='9.1'>{t('deletion.accountTitle')}</Subheading>
                  <p className='text-foreground'>{t('deletion.accountBody')}</p>
                </div>
                <div>
                  <Subheading num='9.2'>{t('deletion.subscriptionTitle')}</Subheading>
                  <p className='text-foreground'>{t('deletion.subscriptionBody')}</p>
                </div>
              </div>
            </section>

            <section>
              <Heading num={10}>{t('liability.title')}</Heading>
              <ul className='list-none space-y-2'>
                <NumberedLi num='10.1'>{t('liability.li1')}</NumberedLi>
                <NumberedLi num='10.2'>{t('liability.li2')}</NumberedLi>
                <NumberedLi num='10.3'>{t('liability.li3')}</NumberedLi>
              </ul>
            </section>

            <section>
              <Heading num={11}>{t('misc.title')}</Heading>
              <ul className='list-none space-y-2'>
                <NumberedLi num='11.1'>{t('misc.li1')}</NumberedLi>
                <NumberedLi num='11.2'>{t('misc.li2')}</NumberedLi>
                <NumberedLi num='11.3'>{t('misc.li3')}</NumberedLi>
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
