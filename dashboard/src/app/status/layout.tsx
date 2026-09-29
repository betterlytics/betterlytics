import { AppDocument } from '@/app/AppDocument';

/** Root layout for the public status pages, which bring their own theming. */
export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return <AppDocument>{children}</AppDocument>;
}
