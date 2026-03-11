# Scroll Gradient Text Design

Date: 2026-03-08
Branch: motion/scroll
Status: Approved

---

## Goal

Apple-style scroll-linked gradient text reveal on landing page section headings. The blue-highlighted text starts as the same color as the rest of the heading, then fills left-to-right with a multi-color gradient as the user scrolls. Fully reversible — scrolling back un-fills.

## Component

### `ScrollGradientText`

**Location:** `dashboard/src/components/animations/ScrollGradientText.tsx`

```tsx
type ScrollGradientTextProps = {
  children: ReactNode;
  className?: string;
};
```

**How it works:**
- Renders a `<motion.span>` with `background-clip: text` and `-webkit-text-fill-color: transparent`
- Gradient: `linear-gradient(90deg, var(--gt-gradient), var(--gt-color-base) 50%)`
- `background-size: 200% 100%` — gradient is twice as wide as text
- `useScroll({ target, offset: ["start 0.85", "start 0.6"] })` tracks element scroll progress
- `useTransform(progress, [0, 1], ["100%", "0%"])` maps to `backgroundPositionX`
- At progress=0: position 100% shows base color (right half of gradient)
- At progress=1: position 0% shows colorful gradient (left half)
- Reduced motion: renders gradient fully visible immediately (no scroll linking)

## CSS Variables

Added to `globals.css`:

```css
:root {
  --gt-gradient: #0090f7, #ba62fc, #f2416b, #f55600;
  --gt-color-base: var(--foreground);
}
```

Same values in `.dark` — gradient colors are vivid enough for both themes, and `--foreground` already adapts per theme.

## Integration

Replace in 5 section headings:
```tsx
/* Before */
<span className='text-blue-600 dark:text-blue-400'>{t('titleEmphasis')}</span>

/* After */
<ScrollGradientText>{t('titleEmphasis')}</ScrollGradientText>
```

**Target headings:**
- PrinciplesSection
- FeatureShowcase
- IntegrationSection
- PricingSection
- OpenSourceCallout

## Scroll Range

Fill starts at 85% viewport (element just entered), completes at 60% viewport.
Offset: `["start 0.85", "start 0.6"]`
