import { CountUp } from '@/landing/components/ui/countUp';
import { Panel } from '@/landing/components/ui/frame';
import { Reveal } from '@/landing/components/ui/reveal';
import { Label } from '@/landing/components/ui/text';
import { cn } from '@/landing/lib/cn';

export type Spec = { value: number; decimals?: number; unit?: string; label: string; body: string };

/** A row of figures under the hero; `lit` is the closing claim, set on volt. */
export function SpecStrip({ specs, lit }: { specs: Spec[]; lit?: Spec }) {
  const cells = lit ? [...specs, lit] : specs;
  return (
    <Panel flush className='max-sm:before:hidden'>
      <div
        className={cn(
          'grid max-xl:grid-cols-2 max-sm:-mx-(--pad) max-sm:grid-cols-1',
          cells.length === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3',
        )}
      >
        {cells.map((spec, i) => {
          const isLit = spec === lit;
          return (
            <div
              key={spec.label}
              className={cn(
                'relative border-rule-08 px-6.5 pt-6 pb-7 transition-ink max-sm:px-(--pad)',
                'not-last:border-r max-xl:even:border-r-0 max-xl:nth-[-n+2]:border-b max-sm:border-r-0 max-sm:not-last:border-b',
                isLit ? 'overflow-clip bg-volt text-on-volt' : 'bg-hatch',
              )}
            >
              <Reveal index={i}>
                <p className='flex items-baseline gap-1.5'>
                  <CountUp
                    className='text-[2.25rem] leading-10 font-medium tracking-[-1.2px]'
                    value={spec.value}
                    decimals={spec.decimals}
                  />
                  {spec.unit && (
                    <span className={cn('text-[17px] tracking-[-0.3px]', isLit ? 'opacity-80' : 'text-muted')}>
                      {spec.unit}
                    </span>
                  )}
                </p>
                <Label className={cn('mt-4 block font-medium', isLit ? 'text-on-volt' : 'text-fg')}>
                  {spec.label}
                </Label>
                <p
                  className={cn(
                    'mt-1 max-w-[34ch] text-label leading-[21px]',
                    isLit ? 'opacity-82' : 'text-muted',
                  )}
                >
                  {spec.body}
                </p>
              </Reveal>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
