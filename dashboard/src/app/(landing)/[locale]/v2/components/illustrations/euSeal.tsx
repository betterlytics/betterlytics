/**
 * The EU ring of twelve stars with a checkmark inside, drawn as a faint
 * watermark bleeding off the volt cell's bottom-right corner. Monoline, no
 * fill, in the on-volt colour at watermark opacity. On hover the ring turns
 * one star over the still checkmark (see .seal__ring in landing-v2.css).
 */

const STAR_POINTS = 12;

function Star({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  // five-point star from an outer and inner radius, drawn about its own origin so
  // it can counter-rotate in place and stay upright while the ring turns
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${(Math.cos(a) * rr).toFixed(2)},${(Math.sin(a) * rr).toFixed(2)}`);
  }
  return (
    <g transform={`translate(${cx.toFixed(2)} ${cy.toFixed(2)})`}>
      <polygon className='seal__star' points={pts.join(' ')} />
    </g>
  );
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

export function EuSeal() {
  // 200px box, bottom-right, clipped by the cell
  return (
    <svg className='seal seal--lock' viewBox='0 0 200 206' width='200' height='206' aria-hidden>
      <g className='seal__ring' fill='currentColor' stroke='none'>
        <Stars cx={100} cy={106} radius={84} size={8} />
      </g>
      <g fill='none' stroke='currentColor' strokeWidth='7' strokeLinecap='round' strokeLinejoin='round'>
        {/* checkmark, visually centred: the long stroke's weight sits right of centre so the shape starts a little left */}
        <path d='M70 106l20 20 40-44' />
      </g>
    </svg>
  );
}
