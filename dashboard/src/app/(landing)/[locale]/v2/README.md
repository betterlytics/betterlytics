# Landing page

The marketing landing page, served at `/v2` until it replaces `/`. Everything it needs lives in this folder;
import from it with the `@/landing/*` alias.

## How it is served

- **Its own root layout** (`layout.tsx`), with its own `<html>`, fonts, providers and stylesheet, apart from
  the app's. It reads nothing from the request: the locale comes from the URL (`setRequestLocale`) and the
  session is fetched by the client.
- **Static, rendered on first request.** `generateStaticParams` returns no locales because builds run
  against placeholder environment variables. Each locale renders once, on its first request with the real
  environment, and is then served from the cache like a static page.
- Only the translations it uses reach the browser (`pricingCards`). The copy itself lives in `content/`
  while the wording settles.

## Styling

- `landing.css` is the page's **own Tailwind entry**, compiled apart from the app's `globals.css`. Its
  `@theme` holds only the landing's tokens (colours, type, breakpoints, easing), so `bg-canvas`,
  `text-muted`, `border-rule`, `text-display-2` or `max-lg:` mean the landing's values and nothing leaks either
  way. It also holds the base layer and a few custom utilities (`bg-hatch`, `bleed-rule`, `transition-ink`).
- **Utilities in the markup** for layout, spacing, type and colour. **A CSS module beside the component**
  (`*.module.css`, rules inside `@layer components`) for keyframes, masks, layered gradients, pseudo-element
  art and state selectors; the journey illustrations mostly live there. Name module keyframes specifically.
- Use `cn` from `@/landing/lib/cn`, not the app's: it knows the landing's token names, where the app's would
  silently drop `text-display-2` next to `text-muted`.
- State that CSS reads goes in data attributes (`data-in`, `data-live`, `data-state`), not class names.
- The design is desktop-first: components use the `max-*` breakpoints.
- Prettier sorts classes against `landing.css` (see the override in `dashboard/.prettierrc.json`).

## Building blocks

| File                            | What it gives you                                                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `components/ui/text.tsx`        | `Heading` (outline level and look chosen apart), `Lede`, `Label`, `TEXT_STYLES`                                               |
| `components/ui/button.ts`       | `buttonStyles()` for links and buttons                                                                                        |
| `components/ui/frame.tsx`       | `Section` (with its title and lede), `Panel` (on phones full width, or `framed` for card-like content), `Corners`             |
| `components/ui/inkFrame.tsx`    | frames whose rules draw in as the reader arrives; undrawn, they blank the rule tokens inside, so inner rules wait for the pen |
| `components/ui/voltCard.tsx`    | the blue card behind the hero and the closing call to action, and `VoltCardActions` for its buttons                           |
| `components/ui/trackedLink.tsx` | calls to action that report a `landing-cta` event (`lib/analytics.ts`)                                                        |
| `components/ui/inView.tsx`      | a `div` that sets `data-in` and `data-live` for its CSS, so a server component's loop can rest off screen                     |
| `components/page/band.tsx`      | the middle band and its hatched walls, inked as the reader scrolls                                                            |
| `hooks/useInView.ts`            | scroll triggers as named presets: `enter`, `draw`, `read`, `near`, `onScreen`                                                 |
| `lib/rovingTabs.ts`             | the keyboard half of the tabs pattern (arrows, Home, End)                                                                     |
| `lib/easing.ts`                 | the curves motion transitions use, matching the theme's easing tokens                                                         |

## Motion and runtime

- Motion is loaded lazily (`LazyMotion` with `domAnimation`, `strict`): use `m.*`, never `motion.*`.
- Reduced motion: CSS animations and transitions finish at once (base layer), motion stills transforms
  (`MotionConfig`), and anything else checks `useReducedMotion()` from `motion/react`, without rendering
  different markup for it.
- Loops (canvas, timers, infinite CSS) run only while their card is live or on screen, and per-frame work
  writes to the DOM through refs or motion values rather than React state.
- The journey illustrations share a contract (`components/illustrations/types.ts`): `entered` latches on
  first sight, and `live` holds for the active card only while the stack is on screen.
- Each illustration is one image to assistive tech: `role='img'` with its description from
  `COPY.illustrations`, and the art inside `aria-hidden` (Chrome still exposes an image's children).
  Replay and Traffic are the exceptions, since they hold real controls.
- The copy is English under every locale for now (`COPY_LOCALE`), so the page's `lang` and number formats
  follow it rather than the URL.
