import { Globe } from 'lucide-react';
import { useLocale } from 'next-intl';
import type { SupportedLanguages } from '@/constants/i18n';
import { Link } from '@/i18n/navigation';
import { cn } from '@/landing/lib/cn';

/**
 * `href` in each language. Plain links rather than a menu, so crawlers can follow them; following one also updates
 * the locale cookie `/` redirects on. `languages` comes from the server: `@/constants/i18n` would pull the date-fns
 * locales into a client bundle.
 */
export function LanguageLinks({
  href,
  label,
  languages,
}: {
  href: string;
  label: string;
  languages: { code: SupportedLanguages; name: string }[];
}) {
  const locale = useLocale();
  return (
    <div className='flex items-center gap-2.5 text-caption'>
      <Globe aria-hidden className='size-3.5 flex-none text-muted' />
      <ul aria-label={label} className='flex flex-wrap gap-x-4'>
        {languages.map(({ code, name }) => (
          <li key={code}>
            <Link
              className={cn(
                'inline-block py-1 transition-colors duration-180 ease-out-expo',
                code === locale ? 'text-fg' : 'text-muted hover:text-fg',
              )}
              href={href}
              locale={code}
              lang={code}
              prefetch={false}
              aria-current={code === locale ? 'page' : undefined}
            >
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
