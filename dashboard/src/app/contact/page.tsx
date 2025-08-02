import { generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { StructuredData } from '@/components/StructuredData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import { GitHubIcon, DiscordIcon, BlueskyIcon } from '@/components/icons/SocialIcons';
import ExternalLink from '@/components/ExternalLink';

export const metadata = generateSEO(SEO_CONFIGS.contact);

export default function ContactPage() {
  return (
    <>
      <StructuredData config={SEO_CONFIGS.contact} />
      <div className='container mx-auto max-w-6xl px-4 py-8'>
        <div className='mb-12 text-center'>
          <h1 className='mb-4 text-3xl font-bold tracking-tight'>Contact Us</h1>
          <p className='text-muted-foreground text-xl'>
            Questions about Betterlytics? Need support with your analytics setup? Our team is ready to assist you.
          </p>
        </div>

        <div className='mb-16'>
          <Card>
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
              <CardDescription>
                Whether you need technical support, have questions about our features, or want to discuss
                enterprise solutions, we're here to help. Choose the method that works best for you:
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {CONTACT_METHODS.map((method) => {
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
            <h2 className='mb-4 text-2xl font-bold'>Frequently Asked Questions</h2>
          </div>

          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {FAQ_ITEMS.map((item, index) => (
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
            Can't find what you're looking for?{' '}
            <ExternalLink
              href='/docs'
              className='text-primary hover:text-primary/80 font-medium underline'
              title='Complete Betterlytics Documentation'
            >
              Check our full documentation →
            </ExternalLink>
          </p>
        </div>
      </div>
    </>
  );
}

const CONTACT_METHODS = [
  {
    icon: Mail,
    title: 'Email',
    description: 'hello@betterlytics.io',
    href: 'mailto:hello@betterlytics.io',
  },
  {
    icon: GitHubIcon,
    title: 'GitHub',
    description: 'github.com/betterlytics/betterlytics',
    href: 'https://github.com/betterlytics/betterlytics',
  },
  {
    icon: DiscordIcon,
    title: 'Discord',
    description: 'Join our Discord Server',
    href: 'https://discord.gg/vwqSvPn6sP',
  },
  {
    icon: BlueskyIcon,
    title: 'Bluesky',
    description: '@betterlytics.bsky.social',
    href: 'https://bsky.app/profile/betterlytics.bsky.social',
  },
];

const FAQ_ITEMS = [
  {
    question: 'How do I integrate Betterlytics with my website?',
    answer:
      'Integration is simple! Just add our lightweight script tag to your website or install our NPM package. Check our documentation for detailed setup guides for all major frameworks.',
  },
  {
    question: 'Is Betterlytics really GDPR compliant?',
    answer:
      "Yes, absolutely! We don't use cookies, don't collect personal data, and all data processing is done in compliance with GDPR, CCPA, and other privacy regulations.",
  },
  {
    question: 'Can I migrate from Google Analytics?',
    answer:
      "Not yet! But we're working hard to implement this feature and will provide a migration guide and tools to help you transition from Google Analytics.",
  },
  {
    question: "What's included in the free plan?",
    answer:
      'The free self-hosted plan includes up to 10,000 tracked events, full dashboard access and community support. Perfect for getting started! No credit card required, no strings attached.',
  },
  {
    question: 'How does the cloud hosting work?',
    answer:
      'Our cloud hosting provides a fully managed Betterlytics instance with automatic updates, backups, and 99.9% uptime SLA. No server management required!',
  },
  {
    question: 'Do you offer support for self-hosted instances?',
    answer:
      'Partially! We provide community support through GitHub and Discord for self-hosted instances, but our priority is to support our cloud hosting customers.',
  },
];
