import { Inter, Inter_Tight } from 'next/font/google';

const robotoSans = Inter({
  variable: '--font-roboto-sans',
  subsets: ['latin'],
  weight: '400',
});

const robotoMono = Inter_Tight({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
});

/** The app's font variables, shared by the app document and the status page document. */
export const appFontVariables = `${robotoSans.variable} ${robotoMono.variable}`;
