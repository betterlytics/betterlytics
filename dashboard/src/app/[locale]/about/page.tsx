import { generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { StructuredData } from '@/components/StructuredData';
import { Button } from '@/components/ui/button';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import Link from 'next/link';
import ExternalLink from '@/components/ExternalLink';
import { getMessages } from 'next-intl/server';

export const metadata = generateSEO(SEO_CONFIGS.about);

export default async function AboutPage() {
  const dict = await getMessages();

  return (
    <>
      <StructuredData config={SEO_CONFIGS.about} />
      <div className='container mx-auto max-w-4xl px-4 py-32'>
        <div className='mb-12 text-center'>
          <h1 className='mb-6 text-4xl font-bold tracking-tight'>{dict.public.about.aboutUs}</h1>
          <p className='text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed'>
            We're building the future of web analytics: privacy-first, open source, and designed for the modern
            web. No more choosing between powerful insights and respecting your visitors' privacy.
          </p>
        </div>

        <div className='prose prose-gray dark:prose-invert max-w-none'>
          <section className='mb-12'>
            <h2 className='mb-6 text-2xl font-bold'>How We Started</h2>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              Betterlytics was born out of real frustration. Our team was developing a Vendor Management System
              when we hit a wall with web analytics. Every solution we evaluated forced us into the same impossible
              choice: either compromise our users' privacy or settle for inadequate insights.
            </p>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              Traditional analytics tools force you to choose between comprehensive insights and user privacy. We
              believe that's a false choice. Betterlytics proves you can have powerful, actionable analytics while
              being completely privacy-compliant and respectful of your visitors.
            </p>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              What started as a solution for our own needs became something much bigger: a mission to build
              analytics tools that respect both website owners and their visitors. Every feature is designed with
              privacy and performance as equal priorities.
            </p>
          </section>

          <section className='mb-12'>
            <h2 className='mb-6 text-2xl font-bold'>Why Privacy-First Analytics Matter</h2>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              The web analytics industry has been dominated by surveillance capitalism for too long. Major
              analytics providers collect vast amounts of personal data, track users across websites, and use this
              information to build detailed behavioral profiles for advertising purposes.
            </p>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              We don't believe website owners should have to compromise their visitors' privacy to understand how
              their site performs. Betterlytics collects only the essential metrics you need: no cookies, no
              personal data, no cross-site tracking. Your visitors' privacy is respected by default.
            </p>
          </section>

          <section className='mb-12'>
            <h2 className='mb-6 text-2xl font-bold'>Built in the Open</h2>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              Betterlytics is completely open source under the AGPL-3.0 license. This isn't just about
              transparency, it's about accountability. Anyone can inspect our code, verify our privacy claims, and
              contribute to making the platform better.
            </p>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              Open source also means freedom. You can self-host Betterlytics on your own infrastructure, ensuring
              complete control over your data. No vendor lock-in, no surprise policy changes, no sudden price
              increases.
            </p>
          </section>

          <section className='mb-12'>
            <h2 className='mb-6 text-2xl font-bold'>Privacy and Performance in Perfect Balance</h2>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              We obsess over both privacy and performance equally because your website's speed matters just as much
              as your visitors' privacy. Our tracking script weighs less than 2KB. Compare that to Google
              Analytics' bloated 45KB+ payload. Built with modern web standards and optimized for speed,
              Betterlytics won't slow down your site.
            </p>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              Under the hood, we use cutting-edge technology: Rust for high-performance data processing, ClickHouse
              for lightning-fast analytical queries, and Next.js 15 for a modern, responsive dashboard experience.
              Every technical decision prioritizes both user privacy and system performance.
            </p>
          </section>

          <section className='mb-12'>
            <h2 className='mb-6 text-2xl font-bold'>Built for Everyone</h2>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              Whether you're running a personal blog, a growing SaaS platform, an e-commerce store, or an
              enterprise website, Betterlytics is designed to meet your needs. We understand that different
              organizations have different requirements, from simple traffic insights to complex user journey
              analysis.
            </p>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              Integration takes minutes, not hours. Our dashboard is intuitive and well-documented, showing you
              what you need to know without drowning you in unnecessary complexity. While we don't have a public
              API yet, every dashboard feature is thoroughly documented to help you get the most out of your
              analytics.
            </p>
          </section>

          <section className='mb-12'>
            <h2 className='mb-6 text-2xl font-bold'>Privacy Regulations Made Simple</h2>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              GDPR, CCPA, PECR compliant. Privacy regulations shouldn't be a compliance nightmare. Because
              Betterlytics doesn't collect personal data or use cookies, you're compliant by default. No cookie
              banners required, no consent management needed.
            </p>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              This simplicity extends to your users too. They can focus on your content instead of being
              interrupted by privacy notices and consent forms. Better experience for everyone.
            </p>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              We're based in the European Union and all data processing occurs within EU boundaries. Your data
              never leaves the EU, ensuring full compliance with GDPR requirements. For detailed information about
              how we handle your data, see our{' '}
              <Link href='/privacy' className='text-primary hover:underline'>
                privacy policy
              </Link>
              .
            </p>
          </section>

          <section className='mb-12'>
            <h2 className='mb-6 text-2xl font-bold'>Community-Driven Development</h2>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              Betterlytics grows through community feedback and contributions. We listen to developers, implement
              requested features, and maintain the platform based on real user needs; not investor demands or
              advertising revenue requirements. We want to deeply thank our community for their feedback and
              contributions.
            </p>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              Our sustainable business model means we can focus on building the best analytics platform possible.
              We're funded by our users, not by selling their data. This alignment of incentives ensures we'll
              always prioritize privacy and performance and never compromise on either.
            </p>
          </section>

          <section className='mb-12'>
            <h2 className='mb-6 text-2xl font-bold'>The Future of Web Analytics</h2>
            <blockquote className='border-primary mb-6 border-l-4 pl-6'>
              <p className='text-muted-foreground text-lg leading-relaxed italic'>
                "We believe businesses should be able to understand their audience without sacrificing privacy or
                making needless compromises on ethics. Analytics can be both powerful and respectful by design."
              </p>
            </blockquote>
            <p className='text-muted-foreground mb-6 text-lg leading-relaxed'>
              This vision drives everything we build. Every feature, every optimization, every decision is guided
              by our commitment to privacy-first analytics that everyone can trust and use.
            </p>
          </section>

          <section className='py-8 text-center'>
            <h2 className='mb-6 text-2xl font-bold'>Ready to Get Started?</h2>
            <p className='text-muted-foreground mb-8 text-lg leading-relaxed'>
              Join the growing community of businesses who refuse to compromise on privacy.
            </p>
            <div className='flex justify-center gap-4'>
              <Button asChild size='lg'>
                <Link href='/register'>Get Started Free</Link>
              </Button>
              <Button asChild variant='outline' size='lg'>
                <ExternalLink
                  href='/docs'
                  className='flex items-center gap-2'
                  title='Complete Betterlytics Documentation'
                >
                  View Documentation
                  <ExternalLinkIcon className='h-4 w-4' />
                </ExternalLink>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
