import { generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { StructuredData } from '@/components/StructuredData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import { GitHubIcon, DiscordIcon, BlueskyIcon } from '@/components/icons/SocialIcons';
import ExternalLink from '@/components/ExternalLink';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public.contact' });
  const seoConfig = { ...SEO_CONFIGS.contact, title: t('title') } as const;
  return generateSEO(seoConfig, { locale });
}

export default async function ContactPage() {
  const t = await getTranslations('public.contact');
  const seoConfig = { ...SEO_CONFIGS.contact, title: t('title') } as const;

  const contactMethods = [
    {
      icon: Mail,
      title: t('methods.email.title'),
      description: t('methods.email.description'),
      href: 'mailto:hello@betterlytics.io',
    },
    {
      icon: GitHubIcon,
      title: t('methods.github.title'),
      description: t('methods.github.description'),
      href: 'https://github.com/betterlytics/betterlytics',
    },
    {
      icon: DiscordIcon,
      title: t('methods.discord.title'),
      description: t('methods.discord.description'),
      href: 'https://discord.gg/vwqSvPn6sP',
    },
    {
      icon: BlueskyIcon,
      title: t('methods.bluesky.title'),
      description: t('methods.bluesky.description'),
      href: 'https://bsky.app/profile/betterlytics.bsky.social',
    },
  ];

  const faqItems = [
    {
      question: t('faq.items.integrate.question'),
      answer: t('faq.items.integrate.answer'),
    },
    {
      question: t('faq.items.gdpr.question'),
      answer: t('faq.items.gdpr.answer'),
    },
    {
      question: t('faq.items.migrate.question'),
      answer: t('faq.items.migrate.answer'),
    },
    {
      question: t('faq.items.freePlan.question'),
      answer: t('faq.items.freePlan.answer'),
    },
    {
      question: t('faq.items.cloud.question'),
      answer: t('faq.items.cloud.answer'),
    },
    {
      question: t('faq.items.support.question'),
      answer: t('faq.items.support.answer'),
    },
  ];

  return (
    <>
      <StructuredData config={seoConfig} />
      <div className='container mx-auto max-w-6xl px-4 py-8'>
        <div className='mb-12 text-center'>
          <h1 className='mb-4 text-3xl font-bold tracking-tight'>{t('title')}</h1>
          <p className='text-muted-foreground text-xl'>{t('intro')}</p>
        </div>

        <div className='mb-16'>
          <Card>
            <CardHeader>
              <CardTitle>{t('getInTouch.title')}</CardTitle>
              <CardDescription>{t('getInTouch.description')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {contactMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <div key={method.title} className='flex items-center gap-4'>
                    <div className='bg-primary/10 text-primary flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg'>
                      <Icon className='h-6 w-6' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='text-lg font-semibold'>{method.title}</h3>
                      <ExternalLink
                        href={method.href}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-muted-foreground hover:text-primary text-sm transition-colors'
                      >
                        {method.description}
                      </ExternalLink>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className='mb-8'>
          <div className='mb-8 text-center'>
            <h2 className='mb-4 text-2xl font-bold'>{t('faq.title')}</h2>
          </div>

          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {faqItems.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className='text-base'>{item.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground text-sm leading-relaxed'>{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className='text-center'>
          <p className='text-muted-foreground mb-4'>
            {t('cta.lead')}{' '}
            <ExternalLink
              href='/docs'
              className='text-primary hover:text-primary/80 font-medium underline'
              title={t('cta.docsLinkTitle')}
            >
              {t('cta.docsLinkText')}
            </ExternalLink>
          </p>
        </div>
      </div>
    </>
  );
}
