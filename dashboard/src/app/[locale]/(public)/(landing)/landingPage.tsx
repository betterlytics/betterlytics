import { StructuredData } from '@/components/StructuredData';
import { HeroSection } from './components/heroSection';
import { FrameworkCompatibility } from './components/frameworkCompatibility';
import { PrinciplesSection } from './components/principlesSection';
import { FeatureShowcase } from './components/featureShowcase';
import { IntegrationSection } from './components/integrationSection';
import { PricingSection } from './components/pricingSection';
import { OpenSourceCallout } from './components/openSourceCallout';
import { buildSEOConfig, SEO_CONFIGS } from '@/lib/seo';

export default async function LandingPage() {
  const seoConfig = await buildSEOConfig(SEO_CONFIGS.landing);

  return (
    <>
      <StructuredData config={seoConfig} />
      <div className='bg-background text-foreground'>
        <HeroSection />
        <FrameworkCompatibility />
        <PrinciplesSection />
        <FeatureShowcase />
        <IntegrationSection />
        <PricingSection />
        <OpenSourceCallout />
      </div>
    </>
  );
}
