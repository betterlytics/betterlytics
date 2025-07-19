import { generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { StructuredData } from '@/components/StructuredData';
import { HeroSection } from './components/heroSection';
import { FrameworkCompatibility } from './components/frameworkCompatibility';
import { PrinciplesSection } from './components/principlesSection';
import { FeatureShowcase } from './components/featureShowcase';
import { IntegrationSection } from './components/integrationSection';
import { PricingSection } from './components/pricingSection';
import { OpenSourceCallout } from './components/openSourceCallout';
import { getDictionary } from '../actions/dictionary';

export const metadata = generateSEO(SEO_CONFIGS.landing);

export default async function LandingPage() {
  const test = await getDictionary();

  return (
    <>
      <StructuredData config={SEO_CONFIGS.landing} />
      <div className='bg-background text-foreground'>
        {test.dictionary.charts.tooltip.currentPeriod}
        {test.language}
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
