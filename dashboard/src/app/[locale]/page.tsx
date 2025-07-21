import { StructuredData } from '@/components/StructuredData';
import { SEO_CONFIGS } from '@/lib/seo';
import LandingPage from '../(landing)/landingPage';

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocalizedLandingPage({ params }: LocalePageProps) {
  return (
    <>
      <StructuredData config={SEO_CONFIGS.landing} />
      <div className='bg-background text-foreground'>
        <LandingPage />
      </div>
    </>
  );
}
