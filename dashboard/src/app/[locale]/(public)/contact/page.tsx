import { generateSEO, buildSEOConfig, SEO_CONFIGS } from '@/lib/seo';
import { StructuredData } from '@/components/StructuredData';
import { Mail, MessageCircle, FileText, ArrowRight, ArrowUpRight, LucideIcon } from 'lucide-react';
import { GitHubIcon, DiscordIcon, BlueskyIcon } from '@/components/icons/SocialIcons';
import ExternalLink from '@/components/ExternalLink';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import type { SupportedLanguages } from '@/constants/i18n';
import type { ComponentType, SVGProps } from 'react';

export async function generateMetadata({ params }: { params: Promise<{ locale: SupportedLanguages }> }) {
  const { locale } = await params;
  return generateSEO(await buildSEOConfig(SEO_CONFIGS.contact), { locale });
}

type IconComponent = LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;

interface PrimaryContactCard {
  icon: IconComponent;
  titleKey: string;
  descriptionKey: string;
  href: string;
  ctaKey: string;
  external?: boolean;
}

interface SecondaryContactItem {
  icon: IconComponent;
  titleKey: string;
  descriptionKey: string;
  href: string;
  ctaKey?: string;
  ctaText?: string;
}

interface FAQItem {
  questionKey: string;
  answerKey: string;
}

export default async function ContactPage() {
  const t = await getTranslations('public.contact');
  const seoConfig = await buildSEOConfig(SEO_CONFIGS.contact);

  const primaryContacts: PrimaryContactCard[] = [
    {
      icon: MessageCircle,
      titleKey: 'getInTouch.title',
      descriptionKey: 'getInTouch.description',
      href: 'mailto:hello@betterlytics.io',
      ctaKey: 'methods.email.title',
    },
    {
      icon: FileText,
      titleKey: 'secondary.docs.title',
      descriptionKey: 'secondary.docs.description',
      href: '/docs',
      ctaKey: 'secondary.docs.cta',
    },
  ];

  const secondaryContacts: SecondaryContactItem[] = [
    {
      icon: GitHubIcon,
      titleKey: 'methods.github.title',
      descriptionKey: 'methods.github.description',
      href: 'https://github.com/betterlytics/betterlytics',
      ctaKey: 'secondary.github.cta',
    },
    {
      icon: BlueskyIcon,
      titleKey: 'methods.bluesky.title',
      descriptionKey: 'methods.bluesky.description',
      href: 'https://bsky.app/profile/betterlytics.bsky.social',
      ctaKey: 'secondary.bluesky.cta',
    },
    {
      icon: DiscordIcon,
      titleKey: 'methods.discord.title',
      descriptionKey: 'methods.discord.description',
      href: 'https://discord.gg/vwqSvPn6sP',
      ctaKey: 'secondary.discord.cta',
    },
    {
      icon: Mail,
      titleKey: 'secondary.email.title',
      descriptionKey: 'secondary.email.description',
      href: 'mailto:hello@betterlytics.io',
      ctaText: 'hello@betterlytics.io',
    },
  ];

  const faqItems: FAQItem[] = [
    { questionKey: 'faq.items.integrate.question', answerKey: 'faq.items.integrate.answer' },
    { questionKey: 'faq.items.gdpr.question', answerKey: 'faq.items.gdpr.answer' },
    { questionKey: 'faq.items.migrate.question', answerKey: 'faq.items.migrate.answer' },
    { questionKey: 'faq.items.freePlan.question', answerKey: 'faq.items.freePlan.answer' },
    { questionKey: 'faq.items.cloud.question', answerKey: 'faq.items.cloud.answer' },
    { questionKey: 'faq.items.support.question', answerKey: 'faq.items.support.answer' },
  ];

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
            <h1 className='mb-4 text-4xl font-bold tracking-[-0.02em] sm:text-5xl'>{t('title')}</h1>
            <p className='text-muted-foreground mx-auto max-w-xl text-lg'>{t('intro')}</p>
          </div>

          <div className='mb-16 grid gap-6 sm:mb-20 sm:grid-cols-2'>
            {primaryContacts.map((contact) => {
              const Icon = contact.icon;
              return (
                <div
                  key={contact.titleKey}
                  className='group flex flex-col rounded-xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.04] sm:p-8 dark:border-white/[0.06] dark:hover:border-white/10'
                >
                  <div className='mb-3 flex items-center gap-3'>
                    <Icon className='text-foreground/80 h-6 w-6 shrink-0' strokeWidth={1.25} />
                    <h2 className='text-xl font-semibold'>{t(contact.titleKey)}</h2>
                  </div>
                  <p className='text-muted-foreground mb-4 text-sm leading-relaxed'>{t(contact.descriptionKey)}</p>
                  <div className='flex-1' />
                  <div>
                    <Button variant='outline' size='sm' className='group/btn' asChild>
                      <ExternalLink href={contact.href}>
                        {t(contact.ctaKey)}
                        {contact.external ? (
                          <ArrowUpRight className='ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5' />
                        ) : (
                          <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5' />
                        )}
                      </ExternalLink>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className='mb-16 grid gap-10 sm:mb-20 sm:grid-cols-2 lg:grid-cols-4'>
            {secondaryContacts.map((contact) => {
              const Icon = contact.icon;
              return (
                <div key={contact.titleKey} className='flex flex-col'>
                  <div className='text-muted-foreground mb-3'>
                    <Icon className='h-5 w-5' />
                  </div>
                  <h3 className='mb-1.5 font-semibold'>{t(contact.titleKey)}</h3>
                  <p className='text-muted-foreground mb-3 flex-1 text-sm leading-relaxed'>
                    {t(contact.descriptionKey)}
                  </p>
                  <ExternalLink
                    href={contact.href}
                    className='text-foreground hover:text-primary inline-flex items-center gap-1 text-sm font-medium'
                  >
                    {contact.ctaText ?? t(contact.ctaKey!)}
                    {!contact.ctaText && <ArrowUpRight className='h-3.5 w-3.5' />}
                  </ExternalLink>
                </div>
              );
            })}
          </div>

          <div className='border-border/40 border-t pt-16 sm:pt-20'>
            <div className='mb-12 text-center'>
              <h2 className='text-2xl font-bold'>{t('faq.title')}</h2>
            </div>

            <div className='grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3'>
              {faqItems.map((faq) => (
                <div key={faq.questionKey} className='space-y-3'>
                  <h4 className='font-semibold'>{t(faq.questionKey)}</h4>
                  <p className='text-muted-foreground text-sm leading-relaxed'>{t(faq.answerKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
