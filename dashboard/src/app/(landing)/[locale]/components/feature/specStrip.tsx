import { CountUp } from '@/landing/components/ui/countUp';
import { Panel } from '@/landing/components/ui/frame';
import { Reveal } from '@/landing/components/ui/reveal';
import ruled from '@/landing/components/ui/ruledGrid.module.css';
import { Label } from '@/landing/components/ui/text';
import { cn } from '@/landing/lib/cn';

export type Spec = { value: number; unit?: string; label: string; body: string };

export function SpecStrip({ specs, lit }: { specs: Spec[]; lit?: Spec }) {
  const cells = lit ? [...specs, lit] : specs;
  return (
    <Panel flush>
      <div className={cn(ruled.grid, cells.length === 4 ? ruled.cols4 : ruled.cols3)}>
        {cells.map((spec, i) => {
          const isLit = spec === lit;
          return (
            <div
              key={spec.label}
              className={cn(
                'relative px-6.5 pt-6 pb-7 transition-ink max-sm:px-(--pad)',
                isLit ? 'overflow-clip bg-volt text-on-volt' : 'bg-hatch',
              )}
            >
              <Reveal index={i}>
                <p className='flex items-baseline gap-1.5'>
                  <CountUp
                    className='text-[2.25rem] leading-10 font-medium tracking-[-1.2px]'
                    value={spec.value}
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
