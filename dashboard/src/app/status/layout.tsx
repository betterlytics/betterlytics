import { AppDocument } from '@/app/AppDocument';

/** No app Providers: status pages bring their own theming. English only, like their copy. */
export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return <AppDocument lang='en'>{children}</AppDocument>;
}
