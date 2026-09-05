/** The pointer drawn inside the replay and error illustrations. */
export function CursorGlyph({ dark = false }: { dark?: boolean }) {
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
