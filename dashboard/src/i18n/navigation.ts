// i18n/navigation.tsx
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';
// import { UNLOCALIZED_REGEX, SupportedLanguages } from '@/constants/i18n';

const {
  Link, // : IntlLink
  redirect, // : intlRedirect
  usePathname,
  useRouter,
  getPathname,
} = createNavigation(routing);

//! TODO: Resolve types in below
// const unlocalizedPattern = new RegExp(UNLOCALIZED_REGEX);

// function extractPath(href: string | { pathname?: string }): string {
//   if (typeof href === 'string') return href;
//   return href?.pathname ?? '';
// }

// function isUnlocalized(href: string | { pathname?: string }) {
//   const path = extractPath(href);
//   return unlocalizedPattern.test(path);
// }

// // Now reuse this everywhere
// function Link(props: React.ComponentProps<typeof IntlLink>) {
//   const {href, locale, ...rest} = props;
//   return (
//     <IntlLink
//       {...rest}
//       href={href}
//       locale={isUnlocalized(href) ? false : locale}
//     />
//   );
// }

// function redirect(href: string, options?: {locale?: string | false}) {
//   return intlRedirect(href, {
//     ...options,
//     locale: isUnlocalized(href) ? false : options?.locale
//   });
// }

// function useRouter() {
//   const router = intlUseRouter();
//   return {
//     ...router,
//     push: (href: string, options?: {locale?: SupportedLanguages | false}) =>
//       router.push(href, {...options, locale: isUnlocalized(href) ? false : options?.locale}),
//     replace: (href: string, options?: {locale?: SupportedLanguages | false}) =>
//       router.replace(href, {...options, locale: isUnlocalized(href) ? false : options?.locale}),
//     back: router.back
//   };
// }

export { Link, redirect, usePathname, useRouter, getPathname };
