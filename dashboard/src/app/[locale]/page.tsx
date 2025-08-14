import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import LandingPage from './(landing)/landingPage';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { generateSEO, SEO_CONFIGS } from '@/lib/seo';

export default async function HomePage() {
  if (!isClientFeatureEnabled('isCloud')) {
    const session = await getServerSession(authOptions);

    if (session) {
      redirect('/dashboards');
    } else {
      redirect('/signin');
    }
  }

  return <LandingPage />;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return generateSEO(SEO_CONFIGS.landing, { locale });
}
