const STAR_POINTS = 12;

/** Turns with the ring under the pointer; every part eases the same way. */
const TURN = 'transition-[rotate] duration-1200 ease-out-expo';

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
      <polygon className={`${TURN} group-hover:-rotate-30`} points={pts.join(' ')} />
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

/**
 * The EU ring of twelve stars with a checkmark inside, a faint watermark bleeding off
 * the bottom-right corner of the cell that holds it (the cell clips it): monoline, no
 * fill, in the on-volt colour at watermark opacity. When the cell (a `group`) is
 * hovered, the ring turns one star, a twelfth of a turn, about the still checkmark
 * while each star counter-turns to stay upright, so it comes to rest looking exactly
 * as it started, and leaving turns it back just as quietly. The stars slide in and
 * out under the cell's clip.
 */
export function EuSeal() {
  return (
    <svg
      className='pointer-events-none absolute -right-[50px] -bottom-[72px] z-0 h-auto w-[190px] text-on-volt opacity-14'
      viewBox='0 0 200 206'
      width='200'
      height='206'
      aria-hidden
    >
      <g className={`${TURN} origin-[100px_106px] group-hover:rotate-30`} fill='currentColor'>
        <Stars cx={100} cy={106} radius={84} size={8} />
      </g>
      {/* checkmark, visually centred: the long stroke's weight sits right of centre so the shape starts a little left */}
      <path
        d='M70 106l20 20 40-44'
        fill='none'
        stroke='currentColor'
        strokeWidth='7'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}
