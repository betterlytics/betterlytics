/**
 * A button label that rolls on hover: two copies stacked in a window one line
 * tall, and hovering the button slides the stack up a line so the visible copy
 * leaves through the top as its twin arrives from below. Each character has
 * its own small delay, growing from right to left, so the end of the word lifts
 * first and the rest follows as if dragged. Motion lives in the `.roll` rules.
 */
export function RollLabel({ text }: { text: string }) {
  const chars = Array.from(text);
  const row = (hidden: boolean) => (
    <span className='roll__row' aria-hidden={hidden || undefined}>
      {chars.map((char, i) => (
        <span key={i} style={{ '--i': chars.length - 1 - i } as React.CSSProperties}>
          {char}
        </span>
      ))}
    </span>
  );
  return (
    <span className='roll'>
      {row(false)}
      {row(true)}
    </span>
  );
}
