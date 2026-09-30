import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { AppDocument } from '@/app/AppDocument';
import { BASE_METADATA } from '@/app/baseMetadata';
import { NotFoundView } from '@/components/NotFoundView';

export const metadata: Metadata = {
  ...BASE_METADATA,
  title: 'Betterlytics',
};

/**
 * The 404 for URLs no root layout matches: the app and the landing page each have
 * their own root layout, so there is none above them to render a not-found in.
 */
export default function GlobalNotFound() {
  return (
    <AppDocument>
      <NextIntlClientProvider>
        <NotFoundView />
      </NextIntlClientProvider>
    </AppDocument>
  );
}
