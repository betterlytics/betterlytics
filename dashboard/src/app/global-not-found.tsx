import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { AppDocument } from '@/app/AppDocument';
import { BASE_METADATA } from '@/app/baseMetadata';
import { NotFoundView } from '@/components/NotFoundView';

export const metadata: Metadata = {
  ...BASE_METADATA,
  title: 'Betterlytics',
};

export default function GlobalNotFound() {
  return (
    <AppDocument>
      <NextIntlClientProvider>
        <NotFoundView />
      </NextIntlClientProvider>
    </AppDocument>
  );
}
