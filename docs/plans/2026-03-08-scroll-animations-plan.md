# Scroll Animations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Apple-inspired scroll-triggered staggered fade-in animations to 6 lower sections of the public landing page.

**Architecture:** Single reusable `ScrollReveal` client component wraps server-rendered content. Uses motion.dev's `whileInView` (IntersectionObserver) for viewport detection. Stagger controlled by caller via `delay` prop. Reduced motion respected via `useReducedMotion()`.

**Tech Stack:** motion.dev v12 (`motion/react`), Next.js 15 server components, React 19, Tailwind CSS v4

**Design doc:** `docs/plans/2026-03-08-scroll-animations-design.md`

---

## Task 1: Create ScrollReveal component

**Files:**
- Create: `dashboard/src/components/animations/ScrollReveal.tsx`

**Step 1: Create the component**

```tsx
'use client';

import { type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 24,
  duration = 0.5,
  threshold = 0.15,
  once = true,
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: threshold }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
```

**Step 2: Verify build passes**

Run: `cd dashboard && npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add dashboard/src/components/animations/ScrollReveal.tsx
git commit -m "feat: add ScrollReveal animation component using motion.dev"
```

---

## Task 2: Add scroll reveal to PrinciplesSection

**Files:**
- Modify: `dashboard/src/app/[locale]/(public)/(landing)/components/principlesSection.tsx`

**Step 1: Add import and wrap heading + cards**

Add import at top:
```tsx
import { ScrollReveal } from '@/components/animations/ScrollReveal';
```

Wrap the heading block (lines 53-58) in `<ScrollReveal>`:
```tsx
<ScrollReveal className='mb-16 text-center'>
  <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
    <span className='text-blue-600 dark:text-blue-400'>{t('titleEmphasis')}</span> {t('titleRest')}
  </h2>
  <p className='text-muted-foreground mx-auto max-w-2xl text-xl'>{t('subtitle')}</p>
</ScrollReveal>
```

Replace the card grid (lines 59-74). Move `hidden sm:flex` from Card to ScrollReveal wrapper. Remove the wrapping `<div className='grid ...'>` and place the grid classes on individual ScrollReveal items won't work — keep the grid wrapper and wrap each Card:
```tsx
<div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
  {featureItems.map((feature, index) => (
    <ScrollReveal
      key={index}
      delay={index * 0.08}
      className={feature.isHiddenOnMobile ? 'hidden sm:block' : undefined}
    >
      <Card
        className='bg-card/70 border-border/70 dark:border-border/60 before:via-primary/40 relative h-full overflow-hidden border shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent before:content-[""]'
      >
        <CardHeader className='pb-2'>
          <div className='text-primary mb-2'>{feature.icon}</div>
          <CardTitle className='text-lg font-semibold tracking-tight'>{feature.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className='text-base'>{feature.description}</CardDescription>
        </CardContent>
      </Card>
    </ScrollReveal>
  ))}
</div>
```

Note: `hidden sm:flex` on the Card becomes `hidden sm:block` on the ScrollReveal wrapper. The Card loses the conditional class and gets `h-full` to fill the wrapper.

**Step 2: Verify build passes**

Run: `cd dashboard && npx tsc --noEmit`
Expected: No type errors

**Step 3: Visual check**

Run: `cd dashboard && npm run dev`
Open the landing page, scroll to the Principles section. Cards should fade up with stagger.

**Step 4: Commit**

```bash
git add dashboard/src/app/\[locale\]/\(public\)/\(landing\)/components/principlesSection.tsx
git commit -m "feat: add scroll reveal animations to PrinciplesSection"
```

---

## Task 3: Add scroll reveal to FeatureShowcase

**Files:**
- Modify: `dashboard/src/app/[locale]/(public)/(landing)/components/featureShowcase.tsx`

**Step 1: Add import and wrap elements**

Add import at top:
```tsx
import { ScrollReveal } from '@/components/animations/ScrollReveal';
```

Wrap the section heading (lines 62-66):
```tsx
<ScrollReveal className='mb-16 text-center'>
  <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
    <span className='text-blue-600 dark:text-blue-400'>{t('titleEmphasis')}</span> {t('titleRest')}
  </h2>
  <p className='text-muted-foreground mx-auto max-w-2xl text-xl'>{t('subtitle')}</p>
</ScrollReveal>
```

Wrap each category divider (lines 76-81):
```tsx
<ScrollReveal className='flex flex-col items-center gap-4 text-center'>
  <span className='from-primary/40 via-primary to-primary/40 h-[1.5px] w-16 bg-gradient-to-r' />
  <h3 className='text-muted-foreground text-xs font-semibold tracking-[0.35em] uppercase sm:text-sm'>
    {category.title}
  </h3>
</ScrollReveal>
```

Wrap each card in the grid (lines 82-86). Note: index resets per category:
```tsx
<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
  {category.cards.map(({ id, element }, cardIndex) => (
    <ScrollReveal key={id} delay={cardIndex * 0.08}>
      {element}
    </ScrollReveal>
  ))}
</div>
```

Wrap the "View all features" button (lines 92-104):
```tsx
<ScrollReveal className='mt-8 flex justify-center'>
  <Button
    variant='outline'
    size='lg'
    className='group transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:-translate-y-0.5 focus-visible:shadow-lg motion-reduce:transform-none motion-reduce:transition-none'
    asChild
  >
    <Link href='/features' title={t('featuresTitle')}>
      {t('featuresButton')}
      <ChevronRight className='ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none' />
    </Link>
  </Button>
</ScrollReveal>
```

**Step 2: Verify build passes**

Run: `cd dashboard && npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add dashboard/src/app/\[locale\]/\(public\)/\(landing\)/components/featureShowcase.tsx
git commit -m "feat: add scroll reveal animations to FeatureShowcase"
```

---

## Task 4: Add scroll reveal to IntegrationSection

**Files:**
- Modify: `dashboard/src/app/[locale]/(public)/(landing)/components/integrationSection.tsx`

**Step 1: Add import and wrap elements**

Add import at top:
```tsx
import { ScrollReveal } from '@/components/animations/ScrollReveal';
```

Wrap the heading (lines 41-46):
```tsx
<ScrollReveal className='mb-16 text-center'>
  <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
    {t('titleStart')} <span className='text-blue-600 dark:text-blue-400'>{t('titleEmphasis')}</span>
  </h2>
  <p className='text-muted-foreground mx-auto max-w-2xl text-xl'>{t('subtitle')}</p>
</ScrollReveal>
```

Wrap each method card (lines 49-70):
```tsx
<div className='mx-auto grid max-w-6xl gap-8 md:grid-cols-3'>
  {integrationMethods.map((method, index) => (
    <ScrollReveal key={index} delay={index * 0.08}>
      <Card
        className='bg-card/70 border-border/70 dark:border-border/60 before:via-primary/40 flex h-full flex-col border text-center shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent before:content-[""] supports-[backdrop-filter]:backdrop-blur-[2px]'
      >
        <CardHeader className='flex flex-col items-center'>
          <div className='text-primary mx-auto mb-4'>{method.icon}</div>
          <CardTitle className='text-xl'>{method.title}</CardTitle>
          <CardDescription>{method.description}</CardDescription>
        </CardHeader>
        <CardContent className='mt-auto'>
          <ul className='text-muted-foreground space-y-2 text-sm'>
            {method.features.map((feature, featureIndex) => (
              <li key={featureIndex} className='flex items-center justify-start pl-2'>
                <span className='text-primary mr-2'>✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </ScrollReveal>
  ))}
</div>
```

Wrap the CTA area (lines 73-84):
```tsx
<ScrollReveal className='mt-12 text-center'>
  <Button
    size='lg'
    className='group mb-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:-translate-y-0.5 focus-visible:shadow-lg motion-reduce:transform-none motion-reduce:transition-none'
    asChild
  >
    <ExternalLink href='https://betterlytics.io/docs/installation/cloud-hosting' title={t('guideTitle')}>
      {t('guideButton')}
    </ExternalLink>
  </Button>
  <p className='text-muted-foreground text-sm'>{t('footer')}</p>
</ScrollReveal>
```

**Step 2: Verify build passes**

Run: `cd dashboard && npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add dashboard/src/app/\[locale\]/\(public\)/\(landing\)/components/integrationSection.tsx
git commit -m "feat: add scroll reveal animations to IntegrationSection"
```

---

## Task 5: Add scroll reveal to PricingSection

**Files:**
- Modify: `dashboard/src/app/[locale]/(public)/(landing)/components/pricingSection.tsx`

**Step 1: Add import and wrap elements**

Add import at top:
```tsx
import { ScrollReveal } from '@/components/animations/ScrollReveal';
```

Wrap the heading (lines 13-18):
```tsx
<ScrollReveal className='mb-16 text-center'>
  <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
    <span className='text-blue-600 dark:text-blue-400'>{t('titleEmphasis')}</span> {t('titleRest')}
  </h2>
  <p className='text-muted-foreground text-xl'>{t('subtitle')}</p>
</ScrollReveal>
```

Wrap the PricingComponent (line 20):
```tsx
<ScrollReveal>
  <PricingComponent />
</ScrollReveal>
```

Wrap footer area (lines 22-35):
```tsx
<ScrollReveal>
  <div className='mt-4 ml-2 flex justify-center text-center sm:mt-10 sm:gap-2'>
    <CheckCircle className='text-muted-foreground h-5 w-4' />
    <p className='text-muted-foreground max-w-2xl text-sm'>{t('footer')}</p>
  </div>

  <div className='mt-6 flex justify-center'>
    <Link
      href='/pricing#comparison'
      className='text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-sm transition-colors'
    >
      {t('compareLink')}
      <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5' />
    </Link>
  </div>
</ScrollReveal>
```

**Step 2: Verify build passes**

Run: `cd dashboard && npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add dashboard/src/app/\[locale\]/\(public\)/\(landing\)/components/pricingSection.tsx
git commit -m "feat: add scroll reveal animations to PricingSection"
```

---

## Task 6: Add scroll reveal to OpenSourceCallout and CtaStrip

**Files:**
- Modify: `dashboard/src/app/[locale]/(public)/(landing)/components/openSourceCallout.tsx`
- Modify: `dashboard/src/components/public/ctaStrip.tsx`

**Step 1: OpenSourceCallout — wrap content block**

Add import at top:
```tsx
import { ScrollReveal } from '@/components/animations/ScrollReveal';
```

Wrap the inner `<div className='text-center'>` (lines 11-45):
```tsx
<ScrollReveal className='text-center'>
  <Github className='text-primary mx-auto mb-6 h-16 w-16' />
  <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
    <span className='text-blue-600 dark:text-blue-400'>{t('titleEmphasis')}</span> &amp; {t('titleRest')}
  </h2>
  <p className='text-muted-foreground mx-auto mb-8 max-w-2xl text-xl'>{t('subtitle')}</p>
  <div className='flex flex-col justify-center gap-4 sm:flex-row'>
    {/* ...buttons unchanged... */}
  </div>
</ScrollReveal>
```

**Step 2: CtaStrip — wrap content block**

Add import at top:
```tsx
import { ScrollReveal } from '@/components/animations/ScrollReveal';
```

Wrap the outer `<div>` content. Replace the outermost `<div className='container...'>` with `<ScrollReveal className='container...'>`:
```tsx
<ScrollReveal className='container mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
  <div className='relative flex w-full flex-col gap-6 overflow-hidden rounded-2xl ...'>
    {/* ...content unchanged... */}
  </div>
</ScrollReveal>
```

**Step 3: Verify build passes**

Run: `cd dashboard && npx tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add dashboard/src/app/\[locale\]/\(public\)/\(landing\)/components/openSourceCallout.tsx dashboard/src/components/public/ctaStrip.tsx
git commit -m "feat: add scroll reveal animations to OpenSourceCallout and CtaStrip"
```

---

## Task 7: Full visual review and final build check

**Step 1: Run full build**

Run: `cd dashboard && npm run build`
Expected: Build succeeds with no errors

**Step 2: Visual review checklist**

Run dev server and manually scroll through the entire landing page:

- [ ] PrinciplesSection: heading fades in, then 6 cards stagger in
- [ ] FeatureShowcase: heading, category titles, and card grids all animate per category
- [ ] IntegrationSection: heading, 3 cards stagger, CTA fades in
- [ ] PricingSection: heading, pricing component, footer all animate
- [ ] OpenSourceCallout: entire block fades in
- [ ] CtaStrip: entire block fades in
- [ ] Reduced motion: enable "Reduce motion" in OS settings, verify all sections render immediately without animation
- [ ] Mobile: check on narrow viewport, animations still work (no mobile-specific disabling for these lightweight fade-ins)
- [ ] No layout shift: content doesn't jump or shift during animations
- [ ] CoreWebVitalsCard: existing gauge animations still work (not broken by ScrollReveal wrapping)

**Step 3: Commit any fixes**

If any visual issues found, fix and commit individually.
