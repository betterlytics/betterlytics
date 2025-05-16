Yes, you can implement a **typed localization system in Next.js** similar to your Vue 3 setup using libraries like `next-i18next`, `react-i18next`, or even manually with `i18next`. While React doesn't have a built-in DI system like Vue, you can use React Context for providing a translation function with type safety.

Here’s how to **translate your Vue-style setup into Next.js** using `i18next` with a **strongly typed custom hook** (inspired by your `$l` function):

---

## ✅ Step-by-Step Next.js i18n Setup (Typed Like Vue)

### 1. **Install Dependencies**

```bash
npm install i18next react-i18next next-i18next
```

---

### 2. **Define Your Translations and Types**

#### `/locales/da.ts`

```ts
export const danish = {
  greeting: {
    hello: "Hej",
    welcome: "Velkommen"
  }
};
```

#### `/locales/en.ts`

```ts
export const english = {
  greeting: {
    hello: "Hello",
    welcome: "Welcome"
  }
};
```

#### `/types/i18n.d.ts`

```ts
import { danish } from "../locales/da";

// Recursive key type generator
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type MessageSchema = typeof danish;
export type LocalizationKeys = NestedKeyOf<MessageSchema>;
```

---

### 3. **Setup i18n (i18next)**

#### `/i18n.ts`

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { danish } from './locales/da';
import { english } from './locales/en';

const resources = {
  da: { translation: danish },
  en: { translation: english }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'da',
  fallbackLng: 'da',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
```

Then import this in your `_app.tsx`:

```ts
import '../i18n'; // make sure i18n is initialized before app loads
```

---

### 4. **Create a Typed Wrapper Hook**

#### `/hooks/useLocalization.ts`

```ts
import { useTranslation } from 'react-i18next';
import { LocalizationKeys } from '../types/i18n';

const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search.toLowerCase()) : null;
const isDisableLocalization = urlParams?.get("disablelocalization") === "true";

/**
 * Custom hook like `$l` in Vue
 */
export const useLocalization = () => {
  const { t } = useTranslation();

  const l = (key: LocalizationKeys, options?: Record<string, unknown>) => {
    if (isDisableLocalization) return key;
    return t(key, options);
  };

  return { l };
};
```

---

### 5. **Usage in Components**

```tsx
import { useLocalization } from '../hooks/useLocalization';

export default function HomePage() {
  const { l } = useLocalization();

  return <h1>{l('greeting.hello')}</h1>; // Output: Hej
}
```

---

## ✅ Advantages of This Setup

* Strongly typed translation keys (`l('greeting.hello')`)
* Optional disabling of localization for debugging
* Fully compatible with SSR (Next.js)
* Easily extendable with `LanguageSwitcher`, `getStaticProps`, etc.

---

If you're interested, I can also help you add:

* Automatic locale detection
* Language switching
* SSR-compatible loading via `next-i18next`

Let me know how far you want to go.
