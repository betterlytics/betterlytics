'use client';

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';

export type SliderMark = { idx: number; label: string };

export type LabeledSliderProps = {
  label: string;
  description?: string;
  badge?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  marks: SliderMark[];
  onValueChange: (value: number) => void;
  formatValue: (value: number) => string;
  recommendedValue?: number;
  disabled?: boolean;
};

export function LabeledSlider({
  label,
  description,
  badge,
  value,
  min,
  max,
  step = 1,
  marks,
  onValueChange,
  formatValue,
  recommendedValue,
  disabled,
}: LabeledSliderProps) {
  const t = useTranslations('monitoring.labels');
  const isRecommended = recommendedValue !== undefined && value === recommendedValue;
  const totalSteps = max - min;

  return (
    <div className='space-y-4'>
      <div className='flex items-baseline justify-between'>
        <div className='space-y-0.5'>
          <div className='flex items-center gap-2'>
            <Label className='text-sm font-medium'>{label}</Label>
            {badge && (
              <span className='rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-600 dark:text-amber-400'>
                {badge}
              </span>
            )}
          </div>
          {description && <p className='text-muted-foreground text-xs'>{description}</p>}
        </div>
        <span className='text-primary rounded bg-blue-500/10 px-2 py-0.5 text-sm dark:text-blue-300'>
          {formatValue(value)}
          {isRecommended && (
            <span className='ml-1.5 text-xs font-medium text-blue-500 dark:text-blue-300'>
              ({t('recommended')})
            </span>
          )}
        </span>
      </div>

      <div className='space-y-3'>
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={([val]) => onValueChange(val)}
          disabled={disabled}
          className='cursor-pointer dark:[&_[role=slider]]:bg-white'
        />
        <div className='relative h-4 w-full'>
          {marks.map(({ idx, label: markLabel }) => {
            const percent = ((idx - min) / totalSteps) * 100;
            return (
              <span
                key={idx}
                className='text-muted-foreground absolute text-[10px]'
                style={{
                  left: `${percent}%`,
                  transform: idx === min ? 'none' : idx === max ? 'translateX(-100%)' : 'translateX(-50%)',
                }}
              >
                {markLabel}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
