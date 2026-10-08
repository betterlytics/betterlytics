import { AppDocument } from '@/app/AppDocument';

/** No app Providers: status pages bring their own theming. */
export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return <AppDocument>{children}</AppDocument>;
}
