'use client';

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

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
  recommendedValue?: number;
  disabled?: boolean;
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
          <Label className='text-sm font-medium'>{label}</Label>
          {description && <p className='text-muted-foreground text-xs'>{description}</p>}
        </div>
        <Badge variant='secondary' className='ring-border text-xs font-medium ring-1'>
          {formatValue(value)}
          {isRecommended && <span className='text-muted-foreground font-normal'>({t('recommended')})</span>}
        </Badge>
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
