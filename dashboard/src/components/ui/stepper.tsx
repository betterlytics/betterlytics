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
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all duration-200',
                    {
                      'bg-primary text-primary-foreground': isCompleted,
                      'bg-primary text-primary-foreground ring-primary/40 ring-4': isCurrent,
                      'bg-muted text-muted-foreground': isUpcoming,
                    },
                  )}
                >
                  {isCompleted ? <Check className='h-3.5 w-3.5' /> : <span>{stepNumber}</span>}
                </div>
                <div className='mt-2 text-center'>
                  <div
                    className={cn('text-sm transition-colors duration-200', {
                      'text-muted-foreground font-normal': isCompleted || isUpcoming,
                      'text-foreground font-medium': isCurrent,
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
                <div className='mx-3 mb-7 flex-1'>
                  <div
                    className={cn('h-px w-full transition-colors duration-200', {
                      'bg-primary': stepNumber < currentStep,
                      'bg-border': stepNumber >= currentStep,
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
