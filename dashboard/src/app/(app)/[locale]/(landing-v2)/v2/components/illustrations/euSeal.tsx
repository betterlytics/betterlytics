/**
 * The EU ring of twelve stars, drawn as a faint watermark on the volt cell.
 * Two placements to choose between:
 *  - 'ring': the ring sits behind the big "0" so the stat itself is the seal's centre.
 *  - 'lock': a larger ring with a closed lock inside, bleeding off the cell's bottom-right corner.
 * Monoline, no fill, in the on-volt colour at watermark opacity.
 */
export type SealVariant = 'ring' | 'lock';

const STAR_POINTS = 12;

function Star({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  // five-point star from an outer and inner radius
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)},${(cy + Math.sin(a) * rr).toFixed(2)}`);
  }
  return <polygon points={pts.join(' ')} />;
}

function Stars({ cx, cy, radius, size }: { cx: number; cy: number; radius: number; size: number }) {
  return (
    <>
      {Array.from({ length: STAR_POINTS }, (_, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / STAR_POINTS;
        return <Star key={i} cx={cx + Math.cos(a) * radius} cy={cy + Math.sin(a) * radius} r={size} />;
      })}
    </>
  );
}

export function EuSeal({ variant }: { variant: SealVariant }) {
  if (variant === 'ring') {
    // 80px box centred on the "0" glyph; stars at r=32 leave the digit clear
    return (
      <svg className='seal seal--ring' viewBox='0 0 80 80' width='80' height='80' aria-hidden>
        <g fill='currentColor' stroke='none'>
          <Stars cx={40} cy={40} radius={32} size={4} />
        </g>
      </svg>
    );
  }
  // 200px box, bottom-right, clipped by the cell
  return (
    <svg className='seal seal--lock' viewBox='0 0 200 206' width='200' height='206' aria-hidden>
      <g fill='currentColor' stroke='none'>
        <Stars cx={100} cy={106} radius={84} size={8} />
      </g>
      <g fill='none' stroke='currentColor' strokeWidth='7' strokeLinecap='round' strokeLinejoin='round'>
        {/* checkmark, visually centred: the long stroke's weight sits right of centre so the shape starts a little left */}
        <path d='M70 106l20 20 40-44' />
      </g>
    </svg>
  );
}
