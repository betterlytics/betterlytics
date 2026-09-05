import { LandingFooter } from './components/footer/footer';
import { Nav } from './components/nav/nav';
import { CtaSection } from './components/sections/ctaSection';
import { CustomersSection } from './components/sections/customersSection';
import { DemoSection } from './components/sections/demoSection';
import { FrameworksSection } from './components/sections/frameworksSection';
import { HeroSection } from './components/sections/heroSection';
import { JourneySection } from './components/sections/journeySection';
import { McpSection } from './components/sections/mcpSection';
import { NetworkSection } from './components/sections/networkSection';
import { PricingSection } from './components/sections/pricingSection';
import { TestimonialsSection } from './components/sections/testimonialsSection';
import { BrandMarkDefs } from './components/ui/brandMark';
import { COPY } from './content/copy';
import { IDS } from './lib/ids';

/**
 * The page frame: a sticky nav, the hero bleeding past the wall, then one
 * band whose hatched wall columns run from the demo through pricing, closed
 * by the CTA card and the footer. The nav reads the band's top edge to know
 * when to join the grid.
 */
export function LandingV2() {
  return (
    <>
      <BrandMarkDefs />
      <a className='skip' href={`#${IDS.main}`}>
        {COPY.nav.skip}
      </a>
      <div className='page'>
        <Nav />
        <main id={IDS.main}>
          <div className='tophead'>
            <HeroSection />
          </div>
          <div className='band' id={IDS.band}>
            <div className='wall wall--l' aria-hidden />
            <div className='wall wall--r' aria-hidden />
            <DemoSection />
            <CustomersSection />
            <JourneySection />
            <McpSection />
            <FrameworksSection />
            <NetworkSection />
            <TestimonialsSection />
            <PricingSection />
          </div>
          <CtaSection />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
