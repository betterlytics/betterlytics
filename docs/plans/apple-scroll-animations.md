# Apple Scroll Animation Analysis

Reverse-engineered from apple.com/dk/macbook-neo (March 2026).

Source: `head.built.js`, `main.built.js`, `overview.built.css`, `ac-films` library.

---

## Architecture

Apple built a fully custom stack. No GSAP ScrollTrigger, no motion.dev.

| Layer | Name | Role |
|-------|------|------|
| Core | **AnimSystem** | Single scroll listener, rAF loop, viewport metrics |
| Grouping | **ScrollGroup** | Each section gets its own scroll range mapped to 0-1 progress |
| Binding | **addKeyframe()** | Declaratively maps scroll progress → CSS property values |
| Orchestration | **PageExperienceManager (PEM)** | Component lifecycle, breakpoints, reduced-motion |
| Physics | **Spring engine** | Custom spring system for interactive elements (not CSS transitions) |

### DOM conventions

```html
<section data-anim-scroll-group="Design">
<div data-component-list="TextOverMedia">
<div data-component-list="StaggeredFadeIn">
<div data-component-list="VideoScrub WillChange">
```

### Core scroll-to-progress pipeline

```
scroll event
  → AnimSystem updates pageMetrics.scrollY
  → each ScrollGroup calculates its own tValue (0-1)
      via: convertScrollPositionToTValue(scrollPos) = map(scrollPos, viewableRange.a, viewableRange.d, 0, 1)
  → keyframe controllers interpolate CSS values from tValue
  → DOM writes batched in single requestAnimationFrame
```

---

## Pattern 1: Clip-Path Scroll Reveal (TextOverMedia)

The signature effect: full-bleed image crops inward with rounded corners as you scroll,
while a scrim darkens and text fades in over it.

### The trick: tall container + sticky media

The container is much taller than the viewport. The media stays pinned via `position: sticky`.
Scrolling through the "empty" height is what drives the animation.

**CSS variables found in Apple's stylesheet:**

```css
.section-tom {
  overflow: clip;
  --tom-scroll-height: 170vh;
  --tom-garage-door: 100vh;           /* extra scroll distance for the reveal */
  --tom-scrim-opacity: 0.5;
  --tom-scrim-color: black;
  --tom-crop-corner-radius: 40px;     /* 36px on medium, 28px on small */
}

.scroll-container {
  height: calc(var(--tom-scroll-height) + var(--tom-garage-door));  /* ~270vh */
}

.media-container {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: clip;
}
```

### Clip-path animation (from Apple's JS)

The keyframe system maps scroll progress to `clip-path: inset()` values:

```js
// Actual keyframe registration found in main.built.js
scrollGroup.addKeyframe(this._els.mediaContainer, {
  start: "css(--tom-frame-anim-kf-start, a0)",   // resolves to: a0b - 100vh
  end:   "css(--tom-frame-anim-kf-end, a0)",     // resolves to: a0b - 40vh
  _topBottom: [0, 6.25],                          // inset percentage
  _leftRight: [0, "max(6.25, ...)"],
  anchors: [this._els.scrollContainer]
});

// Applied to the element as:
el.style.clipPath = `inset(${top}% ${right}% round ${cornerRadius}px)`;
```

Result: image goes from `inset(0%)` (full bleed) to `inset(6.25% round 40px)` (cropped with rounded corners).

### Scrim (dark overlay)

A pseudo-element whose opacity is scroll-driven. Fades in when text appears, fades out when text leaves:

```js
// Scrim fade IN
scrollGroup.addKeyframe(mediaContainer, {
  start: "css(--tom-scrim-fade-in-kf-start)",    // a0t - 110vh
  end:   "css(--tom-scrim-fade-in-kf-end)",      // a0t - 90vh
  "--tom-css-scrim-opacity": [0, 0.5],
});

// Scrim fade OUT
scrollGroup.addKeyframe(mediaContainer, {
  start: "css(--tom-scrim-fade-out-kf-start)",   // a0b - 25vh
  end:   "css(--tom-scrim-fade-out-kf-end)",     // a0b - 5vh
  "--tom-css-scrim-opacity": [0.5, 0],
});
```

```css
.media-container::after {
  content: "";
  position: absolute;
  inset: 0;
  background-color: var(--tom-scrim-color);
  opacity: var(--tom-css-scrim-opacity, 0);
  pointer-events: none;
}
```

### Staggered text fade-in over the media

```js
scrollGroup.addKeyframe(this.copyHeadline, {
  start: "a0t - 52vh", end: "a0t - 32vh",
  opacity: [0, 1], easing: 0.5,
  anchors: [".sticky-container"]
});

scrollGroup.addKeyframe(this.copyElParagraphs[0], {
  start: "a0t - 47vh", end: "a0t - 27vh",    // 5vh stagger
  opacity: [0, 1], easing: 0.5,
  anchors: [".sticky-container"]
});
```

Text fades out + parallaxes upward as you scroll past:

```js
scrollGroup.addKeyframe(this.headlineContainer, {
  start: "a0t", end: "a0t + 100vh",
  y: [null, "-150vh"],
  breakpointMask: ["xlarge", "large", "medium"]
});
```

### Visual summary

```
┌─────────────────────────────────────┐
│  Tall scroll container (~270vh)     │  ← scroll "fuel"
│  ┌───────────────────────────────┐  │
│  │  position: sticky; top: 0     │  │  ← media pinned in place
│  │                               │  │
│  │  clip-path: inset(%)          │──│──→ 0% → 6.25% inset with rounded corners
│  │  round var(--corner-radius)   │  │
│  │                               │  │
│  │  ::after (scrim)              │──│──→ opacity: 0 → 0.5 → 0
│  │                               │  │
│  │  text overlay                 │──│──→ opacity: 0 → 1, staggered per element
│  │                               │  │     then fade out + translateY upward
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## Pattern 2: Staggered Fade-In

Feature card grids fade in one by one as they enter the viewport.

Each element gets a staggered delay based on its index. Apple uses scroll-position-relative
start/end values with a fixed offset per item:

```js
items.forEach((item, index) => {
  scrollGroup.addKeyframe(item, {
    start: `t - 70vh + ${index * STAGGER_OFFSET}`,
    end:   `t - 50vh + ${index * STAGGER_OFFSET}`,
    opacity: [0, 1],
    y: [20, 0],
    easing: 0.5
  });
});
```

This is a one-shot animation — once revealed, elements stay visible.

---

## Pattern 3: Video Scrub

Video playback position is mapped directly to scroll progress. Apple calls this component `VideoScrub`.

The video is paused and its `currentTime` is set based on scroll position:

```js
// Simplified from main.built.js
const progress = scrollGroup.position.local;  // 0-1
video.currentTime = progress * video.duration;
```

The sticky container pattern is the same as Pattern 1 — tall container provides scroll fuel,
video stays pinned.

### Encoding requirements for smooth scrubbing

- Short clips (3-8s) with frequent keyframes (`ffmpeg -g 1`)
- WebM + MP4 `<source>` fallbacks
- `MediaSource` API for longer sequences
- Image sequence fallback for browsers with poor seeking

---

## Pattern 4: Scroll Gallery with Sticky Viewport

Vertical scroll drives horizontal content changes. Gallery items swap opacity
as the user scrolls through a tall container.

```css
.scroll-gallery {
  height: 400vh;                /* N items × viewport height */
}

.scroll-gallery-viewport {
  position: sticky;
  top: 0;
  height: 100vh;
}
```

Active item is determined by dividing scroll progress into equal segments:

```js
const activeIndex = Math.floor(progress * itemCount);
```

Apple's `FadeGallery` component uses `data-initial-index` to set the starting state
and creates its own ScrollGroup scoped to the gallery container.

---

## Performance Techniques

### 1. will-change toggling

Apple never leaves `will-change` on permanently. It is toggled via scroll keyframes
so GPU layers are only promoted during active animation:

```js
scrollGroup.addKeyframe(mediaContainer, {
  start: "css(--tom-will-change-start)",   // when section enters viewport
  end:   "css(--tom-will-change-end)",     // when section leaves viewport
  cssClass: "will-change",
  toggle: true
});
```

### 2. IntersectionObserver gating

Scroll computation only runs for sections currently near the viewport.
Off-screen sections are dormant.

### 3. Breakpoint-aware values

Different animation intensities per screen size:

```js
// Desktop: aggressive parallax
scrollGroup.addKeyframe(headline, { y: [null, "-150vh"], breakpointMask: ["xlarge", "large"] });

// Mobile: subtler
scrollGroup.addKeyframe(headline, { y: [null, "-80vh"],  breakpointMask: ["small"] });
```

Apple's CSS variables also change per breakpoint:

```css
/* Default (large) */  --tom-crop-corner-radius: 40px;
/* Medium */           --tom-crop-corner-radius: 36px;
/* Small */            --tom-crop-corner-radius: 28px;
```

### 4. Reduced motion

All components check `prefersReducedMotion` at initialization. When true,
content is shown immediately with no scroll-driven animation. Apple reads this from
a class on `<html>`:

```js
this.model.PrefersReducedMotion = document.documentElement.classList.contains("reduced-motion");
```

### 5. Spring physics for interactive elements

The Product Viewer uses a custom spring engine (not CSS transitions) for fluid, interruptible animations:

```js
spring.set("height", "bounce", 0.39);
spring.set("height", "duration", settings.cardMorphDuration);
spring.setTarget("opacity", 1);
spring.setTarget("scale", 1.2);
spring.snapValue("y", 0);   // instant jump, no animation
```

Properties animated via springs: `opacity`, `scale`, `x`, `y`, `height`, `--image-clip`, `--gradient-progress`.

---

## Apple's Keyframe DSL

The `start`/`end` values in `addKeyframe()` use a custom anchor-relative notation:

| Expression | Meaning |
|-----------|---------|
| `a0t` | Anchor[0] top edge |
| `a0b` | Anchor[0] bottom edge |
| `a0t - 52vh` | 52vh before anchor[0] top enters viewport |
| `a0b - 100vh` | When anchor[0] bottom is 100vh above scroll |
| `t` | Element's own top |
| `b` | Element's own bottom |
| `css(--var-name)` | Read value from CSS custom property |
| `css(--var, a0)` | CSS variable with anchor fallback |

This makes all animations responsive by default — positions are relative to elements, not pixels.

---

## Key Takeaways

1. **Sticky + tall container** is the universal pattern — it creates the scroll "fuel" that drives everything
2. **One scroll listener, one rAF loop** — components subscribe, they don't each manage their own
3. **Scroll progress (0-1)** is the universal input — all CSS property interpolation derives from it
4. **clip-path: inset(% round px)** is the signature reveal — not opacity fades, not scale transforms
5. **Scrim is a pseudo-element** driven by CSS custom properties, not direct style mutation
6. **will-change is temporary** — toggled on during animation, off after
7. **Reduced motion is not optional** — checked at init, animations skipped entirely
