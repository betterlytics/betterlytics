'use client';

import { Fragment } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STEPS, type Step } from './steps';

type WizardStepperProps = {
  current: number;
  labels: Record<Step, string>;
  onJump: (index: number) => void;
};

export function WizardStepper({ current, labels, onJump }: WizardStepperProps) {
  return (
    <div className='flex items-center gap-3'>
      {STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        // The connector leading into this step is filled once we've reached it.
        const connectorFilled = index <= current;
        return (
          <Fragment key={step}>
            {index > 0 && (
              <span className='bg-border relative h-0.5 w-8 overflow-hidden rounded-full' aria-hidden>
                <span
                  className={cn(
                    'absolute inset-0 origin-left bg-emerald-500 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out',
                    connectorFilled ? 'scale-x-100' : 'scale-x-0',
                  )}
                />
              </span>
            )}
            <button
              type='button'
              disabled={!done}
              aria-current={active ? 'step' : undefined}
              onClick={() => done && onJump(index)}
              className={cn('group flex items-center gap-2', done ? 'cursor-pointer' : 'cursor-default')}
            >
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold motion-safe:transition-all motion-safe:duration-300',
                  done || active
                    ? 'bg-emerald-500 text-emerald-950'
                    : 'border-border text-muted-foreground border',
                  active && 'ring-offset-background ring-2 ring-emerald-500/30 ring-offset-2',
                )}
              >
                {done ? <Check className='h-3.5 w-3.5' strokeWidth={3} /> : index + 1}
              </span>
              <span className='grid text-xs'>
                <span aria-hidden className='invisible col-start-1 row-start-1 font-semibold'>
                  {labels[step]}
                </span>
                <span
                  className={cn(
                    'col-start-1 row-start-1 whitespace-nowrap transition-colors',
                    active
                      ? 'text-foreground font-semibold'
                      : done
                        ? 'text-muted-foreground group-hover:text-foreground'
                        : 'text-muted-foreground',
                  )}
                >
                  {labels[step]}
                </span>
              </span>
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}
