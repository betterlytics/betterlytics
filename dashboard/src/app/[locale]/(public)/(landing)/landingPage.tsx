import type { ReactNode } from 'react';

import { StructuredData } from '@/components/StructuredData';
import { HeroSection } from './components/heroSection';
import { FrameworkCompatibility } from './components/frameworkCompatibility';
import { PrinciplesSection } from './components/principlesSection';
import { FeatureShowcase } from './components/featureShowcase';
import { IntegrationSection } from './components/integrationSection';
import { PricingSection } from './components/pricingSection';
import { OpenSourceCallout } from './components/openSourceCallout';
import { buildSEOConfig, SEO_CONFIGS } from '@/lib/seo';
import { CtaStrip } from '@/components/public/ctaStrip';

export default async function LandingPage() {
  const seoConfig = await buildSEOConfig(SEO_CONFIGS.landing);
  const gradientClassName = (orientation: 'left' | 'right' | 'center') => {
    if (orientation === 'left') {
      return 'pointer-events-none absolute inset-y-8 left-1/2 -z-10 block h-[120%] w-[110%] max-w-4xl -translate-x-[62%] rounded-full bg-gradient-to-r from-blue-500/18 via-blue-500/10 to-transparent opacity-60 blur-3xl sm:h-[125%] sm:w-[105%] sm:-translate-x-[56%] lg:-translate-x-[80%] dark:from-blue-900/30 dark:via-blue-900/15';
    }

    if (orientation === 'right') {
      return 'pointer-events-none absolute inset-y-8 left-1/2 -z-10 block h-[120%] w-[95%] max-w-4xl translate-x-[24%] rounded-full bg-gradient-to-l from-blue-400/18 via-sky-400/12 to-transparent opacity-55 blur-3xl sm:h-[125%] sm:w-[90%] sm:translate-x-[20%] lg:translate-x-[-10%] dark:from-blue-900/28 dark:via-sky-900/15';
    }

    return 'pointer-events-none absolute inset-y-8 left-1/2 -z-10 block h-[120%] w-[88%] max-w-4xl -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.18),_rgba(59,130,246,0.08)_45%,_transparent_78%)] opacity-60 blur-[110px] sm:h-[125%] sm:w-[80%] dark:bg-[radial-gradient(circle_at_center,_rgba(30,64,175,0.5),_rgba(30,64,175,0.2)_45%,_transparent_78%)]';
  };

  const landingSections: ReadonlyArray<{
    id: string;
    orientation: 'left' | 'right' | 'center';
    content: ReactNode;
    showGradient?: boolean;
  }> = [
    {
      id: 'hero',
      orientation: 'left',
      content: <HeroSection />,
      showGradient: false,
    },
    {
      id: 'framework-compatibility',
      orientation: 'right',
      showGradient: false,
      content: <FrameworkCompatibility />,
    },
    {
      id: 'principles',
      orientation: 'left',
      content: <PrinciplesSection />,
    },
    {
      id: 'feature-showcase',
      orientation: 'right',
      content: <FeatureShowcase />,
    },
    {
      id: 'integration',
      orientation: 'left',
      showGradient: false,
      content: <IntegrationSection />,
    },
    {
      id: 'pricing',
      orientation: 'center',
      content: <PricingSection />,
    },
    {
      id: 'cta-ready',
      orientation: 'center',
      showGradient: false,
      content: <CtaStrip />,
    },
    {
      id: 'open-source',
      orientation: 'left',
      showGradient: false,
      content: <OpenSourceCallout />,
    },
  ];

  return (
    <>
      <StructuredData config={seoConfig} />
      <div className='bg-background text-foreground relative overflow-x-clip'>
        <div className='flex flex-col'>
          {landingSections.map((section) => {
            const { id, orientation, content, showGradient = true } = section;

            return (
              <section key={id} id={id} className='relative isolate overflow-visible'>
                {showGradient ? <div className={gradientClassName(orientation)} aria-hidden /> : null}
                {content}
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
