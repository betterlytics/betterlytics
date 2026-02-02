'use client';

import { useRef, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import NumberFlow from '@number-flow/react';

import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type SliderMark = { idx: number; label: string };

export type LabeledSliderProps = {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  marks: SliderMark[];
  onValueChange: (value: number) => void;
  formatValue: (value: number) => string;
  valueParts?: { value: number; intlUnit?: 'second' | 'minute' | 'hour' | 'day'; suffix?: string };
  recommendedValue?: number;
  disabled?: boolean;
  minAllowed?: number;
};

export function LabeledSlider({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  marks,
  onValueChange,
  formatValue,
  valueParts,
  recommendedValue,
  disabled,
  minAllowed,
}: LabeledSliderProps) {
  const t = useTranslations('components.slider');
  const tProFeature = useTranslations('components.proFeature');
  const isRecommended = recommendedValue !== undefined && value === recommendedValue;
  const totalSteps = max - min;

  const lastToastRef = useRef<number>(0);
  const TOAST_DEBOUNCE_MS = 2000;

  const showLockedToast = useCallback(() => {
    const now = Date.now();
    if (now - lastToastRef.current > TOAST_DEBOUNCE_MS) {
      lastToastRef.current = now;
      toast.info(tProFeature('upgradeRequired'), {
        duration: 3000,
      });
    }
  }, [tProFeature]);

  const handleValueChange = (newValue: number) => {
    if (minAllowed !== undefined && newValue < minAllowed) {
      showLockedToast();
      return;
    }
    onValueChange(newValue);
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-end justify-between'>
        <div className='space-y-0.5'>
          <Label className='text-sm font-medium'>{label}</Label>
          {description && <p className='text-muted-foreground text-xs'>{description}</p>}
        </div>
        <Badge
          variant='secondary'
          className='ring-border mb-1 grid items-baseline text-xs font-medium ring-1 transition-[grid-template-columns] duration-300 ease-out'
          style={{ gridTemplateColumns: isRecommended ? 'auto 1fr' : 'auto 0fr' }}
        >
          {valueParts ? (
            <NumberFlow
              value={valueParts.value}
              format={
                valueParts.intlUnit
                  ? { style: 'unit', unit: valueParts.intlUnit, unitDisplay: 'narrow' }
                  : undefined
              }
              suffix={valueParts.suffix ? ` ${valueParts.suffix}` : undefined}
              willChange
              className='tabular-nums'
            />
          ) : (
            formatValue(value)
          )}
          <span className='text-muted-foreground min-w-0 overflow-hidden font-thin whitespace-nowrap'>{` (${t('recommended')})`}</span>
        </Badge>
      </div>

      <div className='space-y-3'>
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={([val]) => handleValueChange(val)}
          disabled={disabled}
          className='cursor-pointer dark:[&_[role=slider]]:bg-white'
        />
        <div className='relative h-4 w-full'>
          {marks.map(({ idx, label: markLabel }) => {
            const percent = ((idx - min) / totalSteps) * 100;
            const isLocked = minAllowed !== undefined && idx < minAllowed;
            const leftPosition = `calc(0.5rem + (100% - 1rem) * ${percent / 100})`;
            return (
              <span
                key={idx}
                className={cn(
                  'absolute flex h-4 items-end text-xs',
                  isLocked ? 'text-amber-500 dark:text-amber-400' : 'text-muted-foreground',
                )}
                style={{
                  left: leftPosition,
                  transform: 'translateX(-50%)',
                }}
              >
                {isLocked ? <Lock className='h-3 w-3' aria-label={markLabel} /> : markLabel}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
