import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { DEFAULT_LANGUAGE, SupportedLanguages, isLanguageSupported } from '@/dictionaries/dictionaries';

export default async function HomePage() {
  
  const headers = new Headers();
  const acceptLang = headers.get('accept-language');
  const browserLang = acceptLang?.split(',')[0]?.split('-')[0];

  const locale: SupportedLanguages = isLanguageSupported(browserLang || '')
    ? (browserLang as SupportedLanguages)
    : DEFAULT_LANGUAGE;

  // Cloud disabled → redirect to /dashboards or /signin
  if (!isClientFeatureEnabled('isCloud')) {
    const session = await getServerSession(authOptions);

    if (session) {
      redirect('/dashboards');
    } else {
      redirect(`/${locale}/signin`);
    }
  }

  // Cloud enabled → redirect to best-locale landing page
  redirect(`/${locale}`);
}