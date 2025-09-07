'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className='flex items-center justify-between'>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <React.Fragment key={index}>
              <div className='flex flex-col items-center'>
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                    {
                      'bg-primary border-primary text-primary-foreground': isCompleted,
                      'border-primary bg-primary text-primary-foreground': isCurrent,
                      'border-muted-foreground bg-background text-muted-foreground': isUpcoming,
                    },
                  )}
                >
                  {isCompleted ? <Check className='h-4 w-4' /> : <span>{stepNumber}</span>}
                </div>
                <div className='mt-2 text-center'>
                  <div
                    className={cn('text-sm font-medium', {
                      'text-primary': isCompleted || isCurrent,
                      'text-muted-foreground': isUpcoming,
                    })}
                  >
                    {step.label}
                  </div>
                  {step.description && (
                    <div className='text-muted-foreground mt-1 text-xs'>{step.description}</div>
                  )}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className='mx-4 mb-8 flex-1'>
                  <div
                    className={cn('h-0.5 w-full transition-colors', {
                      'bg-primary': stepNumber < currentStep,
                      'bg-muted': stepNumber >= currentStep,
                    })}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
