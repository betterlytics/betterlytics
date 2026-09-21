/**
 * Small monoline pictures for the bento stat cards, one per number, drawn in
 * the current text colour so they sit on canvas or on the volt cell alike.
 */

/** The script tag as a chip: the whole install, literally. */
export function ScriptArt() {
  return (
    <div className='sart sart--chip' aria-hidden>
      <code>
        <span className='tag'>&lt;script</span> async src=<span className='str'>&quot;…/analytics.js&quot;</span>
        <span className='tag'>&gt;</span>
      </code>
      <b>4.9 kB</b>
    </div>
  );
}

/** A click on the left, the dashboard on the right, and the time between them. */
export function LagArt() {
  return (
    <svg className='sart' viewBox='0 0 260 84' width='260' height='84' aria-hidden>
      <g fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
        {/* cursor */}
        <path d='M30 26l8 20 3-8 8-3z' />
        {/* the wire, ticked every 0.2 s */}
        <path d='M60 42h140' opacity='0.5' />
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d={`M${60 + i * 20} 39v6`} opacity={i === 7 ? 1 : 0.35} />
        ))}
        {/* dashboard tile with a bar that has just moved */}
        <rect x='208' y='24' width='32' height='36' rx='4' />
        <path d='M215 52v-10M224 52v-18M233 52v-6' />
      </g>
      <circle cx='200' cy='42' r='3' fill='currentColor' />
      <text x='200' y='70' textAnchor='middle' fontSize='10' fill='currentColor' opacity='0.7' fontFamily='var(--mono)'>
        1.4 s
      </text>
    </svg>
  );
}

/** Every visit as a dot, all of them recorded. */
export function CaptureArt() {
  const cols = 12;
  const rows = 3;
  return (
    <svg className='sart' viewBox='0 0 260 84' width='260' height='84' aria-hidden>
      <g fill='currentColor'>
        {Array.from({ length: cols * rows }, (_, i) => {
          const x = 34 + (i % cols) * 17.5;
          const y = 24 + Math.floor(i / cols) * 18;
          return <circle key={i} cx={x} cy={y} r='3.2' opacity={i === 29 ? 0.25 : 0.85} />;
        })}
      </g>
    </svg>
  );
}
