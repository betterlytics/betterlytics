import { getChangelogEntriesForLocale } from '@/content/whats-new';
import { ChangelogFeed } from '@/components/changelog/ChangelogFeed';
import { ChangelogEntryCard } from '@/components/changelog/ChangelogEntryCard';
import { StructuredData } from '@/components/StructuredData';
import { buildSEOConfig, generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { getLocale, getTranslations } from 'next-intl/server';
import type { SupportedLanguages } from '@/constants/i18n';
import { CtaStrip } from '../(landing)/components/ctaStrip';

export async function generateMetadata({ params }: { params: Promise<{ locale: SupportedLanguages }> }) {
  const { locale } = await params;
  return generateSEO(await buildSEOConfig(SEO_CONFIGS.changelog), { locale });
}

export default async function ChangelogPage() {
  const t = await getTranslations('public.changelog');
  const seoConfig = await buildSEOConfig(SEO_CONFIGS.changelog);
  const locale = await getLocale();
  const changelogEntries = getChangelogEntriesForLocale(locale as SupportedLanguages);

  return (
    <>
      <StructuredData config={seoConfig} />

      <section className='from-background via-muted/20 to-background border-border/60 bg-gradient-to-b pt-16 pb-16 text-center md:pt-24 md:pb-20'>
        <div className='container mx-auto max-w-3xl space-y-6 px-4'>
          <p className='text-primary/70 text-xs font-semibold tracking-[0.45em] uppercase'>{t('hero.eyebrow')}</p>
          <div className='space-y-4'>
            <h1 className='text-foreground text-4xl font-semibold tracking-tight md:text-5xl'>
              {t('hero.title')}
            </h1>
            <p className='text-muted-foreground text-lg leading-relaxed md:text-xl'>{t('hero.lead')}</p>
          </div>
        </div>
      </section>

      <section className='container mx-auto max-w-4xl space-y-10 px-4 pb-16'>
        <div className='text-muted-foreground/80 mx-auto max-w-2xl text-center text-sm'>{t('feed.subhead')}</div>

        <ChangelogFeed loadMoreLabel={t('feed.loadMore')} endLabel={t('feed.end')}>
          {changelogEntries.map((entry) => (
            <ChangelogEntryCard key={entry.version} entry={entry} locale={locale} />
          ))}
        </ChangelogFeed>
      </section>

      <div className='pb-24'>
        <CtaStrip />
      </div>
    </>
  );
}
