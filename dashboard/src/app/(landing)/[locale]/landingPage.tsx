import { PageShell } from '@/landing/components/page/pageShell';
import { CtaSection } from '@/landing/components/sections/ctaSection';
import { CustomersSection } from '@/landing/components/sections/customersSection';
import { DemoSection } from '@/landing/components/sections/demoSection';
import { HeroSection } from '@/landing/components/sections/heroSection';
import { JourneySection } from '@/landing/components/sections/journeySection';
import { McpSection } from '@/landing/components/sections/mcpSection';
import { NetworkSection } from '@/landing/components/sections/networkSection';
import { PricingSection } from '@/landing/components/sections/pricingSection';
import { TestimonialsSection } from '@/landing/components/sections/testimonialsSection';

export function LandingPage() {
  return (
    <PageShell hero={<HeroSection />} after={<CtaSection />}>
      <DemoSection />
      <CustomersSection />
      <JourneySection />
      <McpSection />
      <NetworkSection />
      <TestimonialsSection />
      <PricingSection />
    </PageShell>
  );
}
