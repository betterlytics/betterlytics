import { generateSEO, buildSEOConfig, SEO_CONFIGS } from '@/lib/seo';
import { StructuredData } from '@/components/StructuredData';
import { Mail, MessageCircle, FileText, ArrowRight, ArrowUpRight } from 'lucide-react';
import { GitHubIcon, DiscordIcon, BlueskyIcon } from '@/components/icons/SocialIcons';
import ExternalLink from '@/components/ExternalLink';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import type { SupportedLanguages } from '@/constants/i18n';
import type { ReactNode } from 'react';

export async function generateMetadata({ params }: { params: Promise<{ locale: SupportedLanguages }> }) {
  const { locale } = await params;
  return generateSEO(await buildSEOConfig(SEO_CONFIGS.contact), { locale });
}

interface PrimaryContactCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
  external?: boolean;
}

function PrimaryContactCard({ icon, title, description, href, cta, external }: PrimaryContactCardProps) {
  return (
    <Card className='group hover:bg-accent/50 justify-between transition-colors'>
      <CardHeader>
        <div className='flex items-center gap-3'>
          {icon}
          <CardTitle className='text-xl'>{title}</CardTitle>
        </div>
        <CardDescription className='leading-relaxed'>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button variant='outline' size='sm' className='group/btn' asChild>
          <ExternalLink href={href}>
            {cta}
            {external ? (
              <ArrowUpRight className='ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5' />
            ) : (
              <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5' />
            )}
          </ExternalLink>
        </Button>
      </CardFooter>
    </Card>
  );
}

interface SecondaryContactItemProps {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
  showArrow?: boolean;
}

function SecondaryContactItem({
  icon,
  title,
  description,
  href,
  cta,
  showArrow = true,
}: SecondaryContactItemProps) {
  return (
    <div className='border-border/40 flex flex-col border-b pt-6 pb-6 first:pt-0 last:border-0 last:pb-0 sm:border-0 sm:pb-0'>
      <div className='text-muted-foreground mb-3 sm:block'>{icon}</div>
      <h3 className='mb-1.5 font-semibold'>{title}</h3>
      <p className='text-muted-foreground mb-3 flex-1 text-sm leading-relaxed'>{description}</p>
      <ExternalLink
        href={href}
        className='text-foreground hover:text-primary inline-flex items-center gap-1 text-sm font-medium'
      >
        {cta}
        {showArrow && <ArrowUpRight className='h-3.5 w-3.5' />}
      </ExternalLink>
    </div>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  return (
    <div className='space-y-3'>
      <h4 className='font-semibold'>{question}</h4>
      <p className='text-muted-foreground text-sm leading-relaxed'>{answer}</p>
    </div>
  );
}

export default async function ContactPage() {
  const t = await getTranslations('public.contact');
  const seoConfig = await buildSEOConfig(SEO_CONFIGS.contact);

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
            <PrimaryContactCard
              icon={<MessageCircle className='text-foreground/80 h-6 w-6 shrink-0' strokeWidth={1.25} />}
              title={t('getInTouch.title')}
              description={t('getInTouch.description')}
              href='mailto:hello@betterlytics.io'
              cta={t('methods.email.title')}
            />
            <PrimaryContactCard
              icon={<FileText className='text-foreground/80 h-6 w-6 shrink-0' strokeWidth={1.25} />}
              title={t('secondary.docs.title')}
              description={t('secondary.docs.description')}
              href='/docs'
              cta={t('secondary.docs.cta')}
            />
          </div>

          <div className='mb-16 flex flex-col gap-1 px-6 sm:mb-20 sm:grid sm:grid-cols-2 sm:gap-8 sm:px-0 lg:grid-cols-4'>
            <SecondaryContactItem
              icon={<GitHubIcon className='h-5 w-5' />}
              title={t('methods.github.title')}
              description={t('methods.github.description')}
              href='https://github.com/betterlytics/betterlytics'
              cta={t('secondary.github.cta')}
            />
            <SecondaryContactItem
              icon={<BlueskyIcon className='h-5 w-5' />}
              title={t('methods.bluesky.title')}
              description={t('methods.bluesky.description')}
              href='https://bsky.app/profile/betterlytics.bsky.social'
              cta={t('secondary.bluesky.cta')}
            />
            <SecondaryContactItem
              icon={<DiscordIcon className='h-5 w-5' />}
              title={t('methods.discord.title')}
              description={t('methods.discord.description')}
              href='https://discord.gg/vwqSvPn6sP'
              cta={t('secondary.discord.cta')}
            />
            <SecondaryContactItem
              icon={<Mail className='h-5 w-5' />}
              title={t('secondary.email.title')}
              description={t('secondary.email.description')}
              href='mailto:hello@betterlytics.io'
              cta='hello@betterlytics.io'
              showArrow={false}
            />
          </div>

          <div className='border-border/40 border-t pt-16 sm:pt-20'>
            <div className='mb-12 text-center'>
              <h2 className='text-2xl font-bold'>{t('faq.title')}</h2>
            </div>

            <div className='grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3'>
              <FAQItem question={t('faq.items.integrate.question')} answer={t('faq.items.integrate.answer')} />
              <FAQItem question={t('faq.items.gdpr.question')} answer={t('faq.items.gdpr.answer')} />
              <FAQItem question={t('faq.items.migrate.question')} answer={t('faq.items.migrate.answer')} />
              <FAQItem question={t('faq.items.freePlan.question')} answer={t('faq.items.freePlan.answer')} />
              <FAQItem question={t('faq.items.cloud.question')} answer={t('faq.items.cloud.answer')} />
              <FAQItem question={t('faq.items.support.question')} answer={t('faq.items.support.answer')} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
