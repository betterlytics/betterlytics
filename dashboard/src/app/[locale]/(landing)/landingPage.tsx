import { generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { StructuredData } from '@/components/StructuredData';
import { HeroSection } from './components/heroSection';
import { FrameworkCompatibility } from './components/frameworkCompatibility';
import { PrinciplesSection } from './components/principlesSection';
import { FeatureShowcase } from './components/featureShowcase';
import { IntegrationSection } from './components/integrationSection';
import { PricingSection } from './components/pricingSection';
import { OpenSourceCallout } from './components/openSourceCallout';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return generateSEO(SEO_CONFIGS.landing, { locale });
}

export default function LandingPage() {
  return (
    <>
      <StructuredData config={SEO_CONFIGS.landing} />
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
