import type { ComponentProps } from 'react';
import { Link } from '@/i18n/navigation';

/** For pages under the app's root layout: following one is a full page load, so a prefetch would be thrown away. */
export function AppLink(props: ComponentProps<typeof Link>) {
  return <Link prefetch={false} {...props} />;
}
