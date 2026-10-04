import '@/app/status/[slug]/status.css';
import { getTranslations } from 'next-intl/server';

export { buildStatusPageNotFoundMetadata as generateMetadata } from '@/app/status/shared/statusPageShell';

/** Unknown or unpublished status pages. No link out: on a customer's own domain there is nowhere to send visitors. */
export default async function StatusPageNotFound() {
  const t = await getTranslations({ locale: 'en', namespace: 'publicStatusPage.notFound' });

  return (
    <main
      data-sp-theme='system'
      className='bl-status-page flex min-h-screen flex-col items-center justify-center gap-2 bg-[var(--sp-page-bg)] px-4 text-center font-sans antialiased'
    >
      <h1 className='text-xl font-semibold text-[var(--sp-heading)]'>{t('title')}</h1>
      <p className='text-sm text-[var(--sp-muted)]'>{t('description')}</p>
    </main>
  );
}
