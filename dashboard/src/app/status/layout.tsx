import '@/app/globals.css';
import BaseProviders from '@/app/BaseProviders';
import { appFontVariables } from '@/app/appFonts';

/**
 * Status pages get their own minimal document instead of the app's: it reads nothing from the
 * request, so the pages can be cached for their revalidate window. No app Providers (status pages
 * bring their own theming), no Betterlytics tracking, structured data or loading bar. English
 * only, like their copy.
 */
export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <meta name='theme-color' content='#fff' />
      </head>
      <body className={`${appFontVariables} antialiased`}>
        <BaseProviders>{children}</BaseProviders>
      </body>
    </html>
  );
}
