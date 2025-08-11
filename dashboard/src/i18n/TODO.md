# TODO NextI18N Dashboard change

- [MiddleWare] Adjust how locale is loaded inside i18n/request.ts
- [StrongTyping] Add strong typing of 't' by extending the 'next-intl' module ( See example below)
- [Migrate] Migrate all uses of useDictionary to use nexti18n

## Middleware

From previous [PR #110](https://github.com/betterlytics/betterlytics/pull/110):

```ts
import { NextResponse, NextRequest } from 'next/server';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, SupportedLanguages } from '@/app/[lang]/dictionaries';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const hasLocale = SUPPORTED_LANGUAGES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (hasLocale) {
    return NextResponse.next();
  }

  const acceptLanguage = request.headers.get('accept-language');
  const headerLang = acceptLanguage?.split(',')[0].split('-')[0] ?? DEFAULT_LANGUAGE;

  const locale = SUPPORTED_LANGUAGES.includes(headerLang as SupportedLanguages)
    ? (headerLang as SupportedLanguages)
    : DEFAULT_LANGUAGE;

  request.nextUrl.pathname = `/${locale}${pathname}`;

  const response = NextResponse.redirect(request.nextUrl);
  response.headers.set('Vary', 'Accept-Language');
  return response;
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\..*|api).*)'],
};
```

## Strong typing of 't' according to ChatGPT

Got it — you basically went from your own strongly-typed `t` implementation (which used a fully inferred `DictionaryKeys` union) to `next-intl`’s `useTranslations`, which, by default, returns a completely untyped translation function (`(key: string) => string`).

That’s why you’ve lost the autocomplete magic.

---

## Why this happened

In your old solution:

- You had **typed dictionaries** (`RawDictionary`) loaded from JSON.
- You used `NestedDictKeyOf` to flatten the nested keys into a literal union type like:

  ```ts
  type DictionaryKeys = "sections.geography" | "tabs.topCountries" | ...;
  ```

- Your `t` function explicitly accepted `DictionaryKeys` — so the editor _had to_ offer completion.

In `next-intl`:

- Unless you tell it otherwise, it has **no idea** what your keys are.
- `useTranslations` just gives you:

  ```ts
  (key: string, ...args: any[]) => string;
  ```

  — so TypeScript can’t infer or constrain keys.

---

## How to get your autocomplete back

You’ll need to **tell `next-intl` about your dictionary type** by defining a custom type for `useTranslations`.

`next-intl` supports this via module augmentation:

### 1️⃣ Create a type from your JSON dictionary

You can reuse your existing approach:

```ts
import en from '@/dictionaries/en.json';

type Messages = typeof en;
```

If you want deep key paths like before, reuse your `NestedDictKeyOf`:

```ts
type MessagesKeys = NestedDictKeyOf<Messages>;
```

---

### 2️⃣ Augment `next-intl` types

In a `.d.ts` file (e.g. `next-intl.d.ts` in your `src/types` folder):

```ts
import type en from '@/dictionaries/en.json';

declare module 'next-intl' {
  type Messages = typeof en;

  // You can be more specific per namespace if you want, but this makes all keys available
  interface IntlMessages extends Messages {}
}
```

`next-intl` will then use your `IntlMessages` type for autocomplete in `useTranslations`.

---

### 3️⃣ Use namespaced typing

If you want autocompletion **only for the namespace you pass**, you can do:

```ts
const t = useTranslations<'dashboard'>();

t('sections.geography'); // autocomplete works
```

Where `'dashboard'` is a key of the top-level of your `en.json`.

---

### 4️⃣ Bonus — keep deep key paths

If your JSON is nested and you want `"sections.geography"` style completions, you can define:

```ts
type NestedKeyOf<T> = {
  [K in keyof T & string]: T[K] extends Record<string, any> ? `${K}` | `${K}.${NestedKeyOf<T[K]>}` : `${K}`;
}[keyof T & string];

type DashboardKeys = NestedKeyOf<Messages['dashboard']>;
```

Then:

```ts
const t = useTranslations<'dashboard'>();
const key: DashboardKeys = 'sections.geography';
t(key);
```

---
