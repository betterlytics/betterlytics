# text-fit

Pixel-accurate mid-ellipsis text fitting. Replaces character-count truncation budgets
(`formatString(v, 25)`) with fitting against real measured widths, which also removes the
Latin-width assumption blocking non-Latin localization.

## Layers

- `fit-mid-ellipsis.ts` - pure algorithm. Binary search over code-point cuts measuring the
  composed candidate, walk-back for non-monotonic widths (ligatures, ZWJ), boundary nudge for
  combining marks / ZWJ / variation selectors / skin tones / flag pairs. The measure function is
  injected; SVG or DOM engines can call this directly.
- `text-measurer.ts` - singleton hidden-canvas measurer. Font-first width cache, `ctx.font`
  assigned only on change, fonts composed from computed-style longhands (the `.font` shorthand is
  empty in Firefox) with read-back validation. Invalidation bus bumps an epoch and clears all
  caches on `document.fonts` `loadingdone`/`ready` and on `devicePixelRatio` change.
- `resize-store.ts` - one shared `ResizeObserver` for the whole app; per-element subscriptions
  with refcounted observe/unobserve; dispatches rounded `contentBoxSize` inline sizes.
- `use-element-width.ts` / `use-mid-ellipsis.ts` - the React bridge. Width is the only state;
  the fitted string is derived in render.
- `MidEllipsisText.tsx` - the adoption surface.

## Usage

```tsx
<MidEllipsisText value={label} />
```

The component must sit in a width-constrained chain: every flex/grid ancestor between it and the
element that owns the width needs `min-w-0` (flex items refuse to shrink below content size
otherwise), and shrink-to-fit containers (badges, pills) need `max-w-full`. If the chain is
broken the component silently no-ops to CSS end-ellipsis - check the chain first when a value
does not mid-truncate.

While truncated: `aria-label` and `title` expose the full value (caller-supplied values win),
and copy events yield the full value.

## Known limitations

- Fonts are re-resolved per element on epoch bumps only; a style-driven font change on the
  element itself (e.g. responsive `text-xs` to `text-sm`) re-fits with stale metrics until the
  next epoch. The CSS backstop bounds the damage.
- `letter-spacing` and `font-feature-settings` are not replicated in canvas measurement; do not
  apply them to fitted text.
- Cluster handling is code-point + nudge, not full grapheme segmentation (`Intl.Segmenter` was
  deliberately excluded); the nudge covers marks, ZWJ, variation selectors, skin tones and flags.

## Follow-ups

Pill +N collapse consumes the cached widths; tables/charts adopt `MidEllipsisText` or call
`fitMidEllipsis` directly (SVG); `hooks/use-resize-observer.ts` should eventually fold into
`resize-store.ts`.
