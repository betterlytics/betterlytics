import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';

/**
 * A button label that rolls on hover: two copies stacked in a window one line
 * tall, and hovering the button (which carries `group`) slides the stack up a
 * line so the visible copy leaves through the top as its twin arrives from below.
 * Each character has its own small delay, growing from right to left, so the end
 * of the word lifts first and the rest follows as if dragged. Readers get the
 * text once, whole: split into characters it would be read letter by letter.
 */
export function RollLabel({ text }: { text: string }) {
  const chars = Array.from(text);
  const row = (offset: string) => (
    <span className='flex [grid-area:1/1]' aria-hidden>
      {chars.map((char, i) => (
        <span
          key={i}
          className={cn(
            'block whitespace-pre transition-transform delay-[calc(var(--i)*9ms)] duration-320 ease-[cubic-bezier(0.76,0,0.24,1)] motion-reduce:transition-none',
            offset,
          )}
          style={vars({ '--i': chars.length - 1 - i })}
        >
          {char}
        </span>
      ))}
    </span>
  );
  return (
    <span className='inline-grid overflow-hidden leading-tight'>
      <span className='sr-only'>{text}</span>
      {row('group-hover:-translate-y-full')}
      {row('translate-y-full group-hover:translate-y-0')}
    </span>
  );
}
