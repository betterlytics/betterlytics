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
import { COPY } from '@/landing/content/copy';
import { cn } from '@/landing/lib/cn';
import { IDS } from '@/landing/lib/ids';

/**
 * The page frame: a sticky nav, the hero bleeding past the wall, then one band whose
 * hatched wall columns run from the demo through pricing, closed by the CTA card and
 * the footer. The wall's outer edge is a full-height rule down the whole document,
 * through the sticky nav and on through the footer.
 */
export function LandingPage() {
  return (
    // full-bleed rules are 100vw wide (which includes a classic scrollbar) and escape the
    // capped frame; clipped here rather than on body, whose overflow would pass to the
    // viewport, which touch browsers still let the reader pan
    <div className='overflow-x-clip'>
      <BrandMarkDefs />
      <a
        className='absolute -top-20 left-4 z-200 bg-fg px-4 py-2.5 text-label text-canvas transition-[top] duration-200 ease-out-expo focus:top-4'
        href={`#${IDS.main}`}
      >
        {COPY.nav.skip}
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
          {/* the full-bleed rule under the nav closes the top of the page the way the footer closes the bottom */}
          <div className='relative before:bleed-rule before:top-0 before:z-2 before:bg-rule'>
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
