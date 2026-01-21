'use client';

import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { CodeTabs } from './CodeTabs';
import { useVariantTabs } from './VariantTabs';
import { cn } from '@/lib/utils';
import type { FrameworkCode, FrameworkStep } from './frameworkCodes';
import type { FrameworkId } from './FrameworkGrid';

function StepItem({ step, stepNumber, isLast }: { step: FrameworkStep; stepNumber: number; isLast: boolean }) {
  return (
    <div className='relative flex gap-4'>
      <div className='flex flex-col items-center'>
        <div className='bg-muted border-border text-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium'>
          {stepNumber}
        </div>
        {!isLast && <div className='bg-border mt-2 w-px flex-1' />}
      </div>

      <div className={cn('flex-1', !isLast ? 'pb-6' : 'pb-0')}>
        <h4 className='text-foreground mb-1 text-sm font-medium'>{step.title}</h4>
        {step.description && <p className='text-muted-foreground mb-3 text-sm'>{step.description}</p>}

        {step.codeTabs ? (
          <CodeTabs tabs={step.codeTabs} />
        ) : step.code ? (
          <CodeBlock code={step.code} language={step.language || 'html'} />
        ) : null}
      </div>
    </div>
  );
}

interface FrameworkInstructionsProps {
  frameworkCode: FrameworkCode;
  selectedFramework: FrameworkId;
}

export function FrameworkInstructions({ frameworkCode, selectedFramework }: FrameworkInstructionsProps) {
  const { activeVariant, renderTabs } = useVariantTabs(frameworkCode.variants || []);

  const steps = frameworkCode.variants ? activeVariant?.steps || [] : frameworkCode.steps || [];

  return (
    <motion.div
      key={`${selectedFramework}-${activeVariant?.id || 'default'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {frameworkCode.variants && frameworkCode.variants.length > 0 && renderTabs()}

      <div className='space-y-0'>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1 && !frameworkCode.note;
          return <StepItem key={index} step={step} stepNumber={index + 1} isLast={isLast} />;
        })}

        {frameworkCode.note && (
          <div className='relative flex gap-4'>
            <div className='flex flex-col items-center'>
              <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20'>
                <AlertTriangle className='h-4 w-4 text-amber-500' />
              </div>
            </div>
            <div className='flex-1'>
              <p className='text-muted-foreground text-sm leading-relaxed'>{frameworkCode.note}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
