import { HeroSection } from './components/heroSection';
import { FrameworkCompatibility } from './components/frameworkCompatibility';
import { PrinciplesSection } from './components/principlesSection';
import { FeatureShowcase } from './components/featureShowcase';
import { IntegrationSection } from './components/integrationSection';
import { PricingSection } from './components/pricingSection';
import { OpenSourceCallout } from './components/openSourceCallout';
import { Footer } from '@/components/footer/Footer';

export const revalidate = 3600;

export default function LandingPage() {
  return (
    <div className='bg-background text-foreground'>
      <HeroSection />
      <FrameworkCompatibility />
      <PrinciplesSection />
      <FeatureShowcase />
      <IntegrationSection />
      <PricingSection />
      <OpenSourceCallout />
      <Footer />
    </div>
  );
}
