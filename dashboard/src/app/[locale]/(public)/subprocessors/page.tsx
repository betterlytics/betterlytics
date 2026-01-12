import { redirect } from 'next/navigation';
import { env } from '@/lib/env';
import { getTranslations, getLocale } from 'next-intl/server';
import { buildSEOConfig, generateSEO, SEO_CONFIGS } from '@/lib/seo';
import type { SupportedLanguages } from '@/constants/i18n';
import { StructuredData } from '@/components/StructuredData';
import { Link } from '@/i18n/navigation';
import { ExternalLink } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: SupportedLanguages }> }) {
  const { locale } = await params;
  return generateSEO(await buildSEOConfig(SEO_CONFIGS.subprocessors), { locale });
}

const UPDATED_AT = new Date('2025-01-12');

const subprocessors = [
  {
    key: 'hetzner',
    website: 'https://www.hetzner.com/legal/privacy-policy',
  },
  {
    key: 'stripe',
    website: 'https://stripe.com/privacy',
  },
  {
    key: 'mailersend',
    website: 'https://www.mailersend.com/legal/privacy-policy',
  },
  {
    key: 'cloudflareR2',
    website: 'https://www.cloudflare.com/privacypolicy/',
  },
] as const;

export default async function SubprocessorsPage() {
  if (!env.IS_CLOUD) {
    redirect('/');
  }

  const t = await getTranslations('public.subprocessors');
  const locale = await getLocale();
  const seoConfig = await buildSEOConfig(SEO_CONFIGS.subprocessors);

  return (
    <div className='bg-background min-h-screen py-12'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        <div className='bg-card border-border overflow-hidden rounded-lg border shadow-sm'>
          <div className='border-border border-b px-6 py-8'>
            <StructuredData config={seoConfig} />
            <h1 className='text-foreground text-3xl font-bold'>{t('title')}</h1>
            <p className='text-muted-foreground mt-2 text-lg'>
              {t('lastUpdated')}{' '}
              {UPDATED_AT.toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className='text-muted-foreground mt-2 text-sm'>{t('translationDisclaimer')}</p>
          </div>

          <div className='space-y-8 px-6 py-8'>
            <section>
              <p className='text-foreground leading-relaxed'>{t('intro')}</p>
            </section>

            <section className='border-primary bg-accent rounded-r-lg border-l-4 p-6'>
              <h2 className='text-accent-foreground mb-3 text-xl font-semibold'>{t('commitment.title')}</h2>
              <p className='text-accent-foreground'>{t('commitment.body')}</p>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('list.title')}</h2>
              <p className='text-foreground mb-6'>{t('list.intro')}</p>

              <div className='overflow-x-auto'>
                <table className='w-full border-collapse'>
                  <thead>
                    <tr className='border-border border-b'>
                      <th className='text-foreground px-4 py-3 text-left font-semibold'>{t('table.name')}</th>
                      <th className='text-foreground px-4 py-3 text-left font-semibold'>{t('table.purpose')}</th>
                      <th className='text-foreground px-4 py-3 text-left font-semibold'>{t('table.location')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subprocessors.map((sp) => (
                      <tr key={sp.key} className='border-border border-b last:border-b-0'>
                        <td className='px-4 py-4'>
                          <a
                            href={sp.website}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-primary hover:text-primary/80 inline-flex items-center gap-1 font-medium'
                          >
                            {t(`processors.${sp.key}.name`)}
                            <ExternalLink className='h-3.5 w-3.5' />
                          </a>
                        </td>
                        <td className='text-foreground px-4 py-4'>{t(`processors.${sp.key}.purpose`)}</td>
                        <td className='text-muted-foreground px-4 py-4'>{t(`processors.${sp.key}.location`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('changes.title')}</h2>
              <p className='text-foreground leading-relaxed'>{t('changes.body')}</p>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>{t('dataProtection.title')}</h2>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>{t('dataProtection.li1')}</li>
                <li>{t('dataProtection.li2')}</li>
                <li>{t('dataProtection.li3')}</li>
              </ul>
            </section>

            <section className='bg-muted rounded-lg p-6'>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>{t('contact.title')}</h3>
              <p className='text-foreground mb-4'>{t('contact.lead')}</p>
              <div className='text-foreground space-y-2'>
                <p>
                  <strong>{t('contact.email')}</strong> legal@betterlytics.io
                </p>
              </div>
            </section>

            <section className='border-border border-t py-6'>
              <p className='text-muted-foreground text-center text-sm'>
                {t('footer.p1')}
                <br />
                <Link href='/dpa' className='text-primary hover:text-primary/80'>
                  {t('footer.dpaLink')}
                </Link>
                {' · '}
                <Link href='/privacy' className='text-primary hover:text-primary/80'>
                  {t('footer.privacyLink')}
                </Link>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
