import { getLocale, getMessages } from 'next-intl/server';
import PublicTopBar from '@/components/topbar/PublicTopBar';
import { Footer } from '@/components/footer/Footer';
import ThemeToggleFab from '@/components/ThemeToggleFab';
import { StatusNotFoundContent } from './components/StatusNotFoundContent';
import { StatusNotFoundShell } from './components/StatusNotFoundShell';

/**
 * Rendered when a `/status/[slug]` page calls `notFound()` (unknown slug or the feature is off).
 *
 * The status route lives outside the `(app)/[locale]` group, so it only has the root layout —
 * StatusNotFoundShell re-adds the intl + session providers so the shared public top bar and footer
 * render the same way they do everywhere else, with the 404 message wrapped between them.
 */
export default async function StatusNotFound() {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <StatusNotFoundShell
      locale={locale}
      // Only client component that reads messages is PublicTopBar (`public.nav`); the footer and
      // 404 body are Server Components that resolve their own strings via `getTranslations`.
      messages={{ public: { nav: messages.public.nav } }}
    >
      <div className='flex min-h-screen flex-col justify-between'>
        <PublicTopBar />
        <StatusNotFoundContent />
        <Footer />
        <ThemeToggleFab />
      </div>
    </StatusNotFoundShell>
  );
}
