import { useTranslations } from 'next-intl';
import { LandingFooter } from '@/landing/components/footer/footer';
import { Nav } from '@/landing/components/nav/nav';
import { Band } from '@/landing/components/page/band';
import { CtaSection } from '@/landing/components/sections/ctaSection';
import { CustomersSection } from '@/landing/components/sections/customersSection';
import { DemoSection } from '@/landing/components/sections/demoSection';
import { HeroSection } from '@/landing/components/sections/heroSection';
import { JourneySection } from '@/landing/components/sections/journeySection';
import { McpSection } from '@/landing/components/sections/mcpSection';
import { NetworkSection } from '@/landing/components/sections/networkSection';
import { PricingSection } from '@/landing/components/sections/pricingSection';
import { TestimonialsSection } from '@/landing/components/sections/testimonialsSection';
import { BrandMarkDefs } from '@/landing/components/ui/brandMark';
import { cn } from '@/landing/lib/cn';
import { IDS } from '@/landing/lib/ids';

export function LandingPage() {
  const t = useTranslations('landing.nav');
  return (
    // clips the 100vw bleed rules (100vw includes a classic scrollbar); not on body, whose
    // overflow passes to the viewport, which touch browsers still let the reader pan
    <div className='overflow-x-clip'>
      <BrandMarkDefs />
      <a
        className='absolute -top-20 left-4 z-200 bg-fg px-4 py-2.5 text-label text-canvas transition-[top] duration-200 ease-out-expo focus:top-4'
        href={`#${IDS.main}`}
      >
        {t('skip')}
      </a>
      <div
        className={cn(
          'relative mx-auto max-w-[1480px]',
          'before:pointer-events-none before:absolute before:inset-y-0 before:left-(--pad) before:z-30 before:w-px before:bg-rule max-sm:before:hidden',
          'after:pointer-events-none after:absolute after:inset-y-0 after:right-(--pad) after:z-30 after:w-px after:bg-rule max-sm:after:hidden',
        )}
      >
        <Nav />
        <main id={IDS.main} className='relative'>
          <div className='relative before:bleed-rule before:top-0 before:z-2 before:bg-rule max-sm:before:hidden'>
            <HeroSection />
          </div>
          <Band>
            <DemoSection />
            <CustomersSection />
            <JourneySection />
            <McpSection />
            <NetworkSection />
            <TestimonialsSection />
            <PricingSection />
          </Band>
          <CtaSection />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}
