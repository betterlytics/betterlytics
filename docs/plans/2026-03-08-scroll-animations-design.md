# Scroll Animations Design — Apple-Inspired Staggered Reveals

Date: 2026-03-08
Branch: motion/scroll
Status: Approved

---

## Goal

Add Apple-inspired scroll-triggered fade-in animations to the lower sections of the public landing page using motion.dev. Incremental first step — staggered reveals only, no clip-path bleed (reserved for hero in a future increment).

## Approach

**Approach A: ScrollReveal Wrapper** — a single reusable `'use client'` component that wraps server-rendered content and animates it into view on scroll. Existing server components stay unchanged architecturally.

## Core Component

### `ScrollReveal`

**Location:** `dashboard/src/components/animations/ScrollReveal.tsx`

```tsx
type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;      // seconds — caller computes from index for stagger
  y?: number;          // initial translateY in px (default: 24)
  duration?: number;   // animation duration (default: 0.5)
  threshold?: number;  // viewport amount 0-1 (default: 0.15)
  once?: boolean;      // one-shot animation (default: true)
};
```

**Behavior:**
- Starts at `opacity: 0, translateY(24px)`
- Animates to `opacity: 1, translateY(0)` when viewport threshold met
- Apple-inspired easing: `cubic-bezier(0.25, 0.1, 0.25, 1)`
- `useReducedMotion()` from motion.dev — if true, renders children immediately
- One-shot by default — observer disconnects after first trigger
- Stagger handled by caller: `delay={index * 0.08}`

**Usage:**
```tsx
// Staggered grid
<div className="grid gap-8 md:grid-cols-3">
  {items.map((item, i) => (
    <ScrollReveal key={i} delay={i * 0.08}>
      <Card>...</Card>
    </ScrollReveal>
  ))}
</div>

// Single element
<ScrollReveal>
  <h2>Section Title</h2>
</ScrollReveal>
```

## Per-Section Integration

### PrinciplesSection (server component)
- Section heading (h2 + subtitle) -> `<ScrollReveal>`
- Each Card -> `<ScrollReveal delay={i * 0.08}>`
- `isHiddenOnMobile` class moves to ScrollReveal wrapper

### FeatureShowcase (server component)
- Section heading -> `<ScrollReveal>`
- Per category (3 categories x 3 cards):
  - Category divider + title -> `<ScrollReveal>`
  - Each card -> `<ScrollReveal delay={i * 0.08}>` (index resets per category)
- "View all features" button -> `<ScrollReveal>`

### IntegrationSection (server component)
- Section heading -> `<ScrollReveal>`
- Each method card -> `<ScrollReveal delay={i * 0.08}>`
- CTA + footer -> `<ScrollReveal>`

### PricingSection (client component)
- Section heading -> `<ScrollReveal>`
- PricingComponent -> `<ScrollReveal>`
- Footer links -> `<ScrollReveal>`

### OpenSourceCallout (server component)
- Entire centered block -> single `<ScrollReveal>`

### CtaStrip
- Wrap content in `<ScrollReveal>`

## Performance

- **IntersectionObserver-based** — no scroll listener (motion.dev whileInView uses IO)
- **One-shot** — observer disconnects after animation fires
- **will-change auto-managed** — motion.dev sets during animation, cleans up after
- **Below the fold** — all target sections are below fold, no FOIC concern
- **No extra scroll listeners** — existing `useIsScrollingMotionRef` hook unaffected

## Accessibility

- `useReducedMotion()` -> content renders immediately, zero animation
- Animations are decorative (opacity + transform) — no content hidden permanently
- No scroll hijacking — natural scrolling preserved
- Existing `motion-reduce:` Tailwind classes on hover effects unchanged

## SSR Safety

- `ScrollReveal` is `'use client'` — imported into server components as boundary
- Server-rendered children pass through unchanged
- Content renders server-side with initial animation state
- Below-fold placement means no visible flash before hydration

## Future Increments

1. **Hero clip-path reveal** — Pattern 1 from Apple analysis (full-bleed -> inset with rounded corners)
2. **Scroll-linked progression** — upgrade select sections from one-shot to scroll-driven
3. **Scroll gallery** — Pattern 4 for feature showcase categories
