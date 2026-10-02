import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';

/** Rolls on hover of the parent `group`; the sr-only copy stops readers spelling it letter by letter. */
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
