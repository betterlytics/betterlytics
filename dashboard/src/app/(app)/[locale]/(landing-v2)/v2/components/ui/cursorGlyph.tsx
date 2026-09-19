/**
 * The pointer drawn inside the replay and error illustrations.
 * `outline` draws the rounded notched arrow as a hollow blue stroke;
 * otherwise it is a filled arrow, light on dark or dark on light.
 */
export function CursorGlyph({ dark = false, outline = false }: { dark?: boolean; outline?: boolean }) {
  if (outline) {
    return (
      // the rounded notched arrow; the viewBox is offset to where the path was drawn
      <svg viewBox='243.3 91.6 20 20' aria-hidden>
        <path
          d='M261.377 99.9778C261.994 99.7378 262.303 99.6179 262.389 99.4483C262.464 99.3013 262.462 99.1269 262.383 98.9819C262.292 98.8147 261.981 98.7028 261.358 98.4792L245.468 92.7752C244.958 92.5922 244.704 92.5007 244.537 92.5584C244.392 92.6086 244.278 92.7224 244.228 92.8673C244.17 93.0339 244.262 93.2887 244.445 93.7984L250.149 109.688C250.372 110.311 250.484 110.623 250.652 110.714C250.796 110.793 250.971 110.795 251.118 110.72C251.288 110.633 251.407 110.325 251.647 109.708L254.244 103.03C254.291 102.909 254.315 102.849 254.351 102.798C254.383 102.753 254.423 102.714 254.468 102.681C254.519 102.645 254.579 102.622 254.7 102.575L261.377 99.9778Z'
          fill='none'
          stroke='#4a5cff'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    );
  }
  return (
    <svg viewBox='0 0 20 20' aria-hidden>
      <path
        d='M4 2.5 15.5 11 10 11.6 12.6 17 10.6 17.9 8 12.5 4 16Z'
        fill={dark ? '#1A1918' : '#F2F5FF'}
        stroke={dark ? '#F2F5FF' : '#12100F'}
        strokeWidth='1.1'
        strokeLinejoin='round'
      />
    </svg>
  );
}
