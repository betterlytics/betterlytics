'use client';

import { Label } from '@/components/ui/label';

type ColorSwatchPickerProps<T extends string> = {
  options: ReadonlyArray<{ value: T; hex: string }>;
  value: T;
  onChange: (value: T) => void;
  label?: string;
  ariaLabelForValue?: (value: T) => string;
  children?: React.ReactNode;
};

export function ColorSwatchPicker<T extends string>({
  options,
  value,
  onChange,
  label,
  ariaLabelForValue,
  children,
}: ColorSwatchPickerProps<T>) {
  return (
    <div className='grid gap-2'>
      {label ? <Label className='text-sm font-medium'>{label}</Label> : null}
      <div className='flex flex-wrap items-center gap-2'>
        {options.map((option) => (
          <button
            key={option.value}
            type='button'
            onClick={() => onChange(option.value)}
            className={`h-8 w-8 cursor-pointer rounded-full border transition ${
              value === option.value ? 'ring-offset-background ring-primary ring-2 ring-offset-2' : 'border-border'
            }`}
            style={{ backgroundColor: option.hex }}
            aria-label={ariaLabelForValue ? ariaLabelForValue(option.value) : `Select color ${option.value}`}
          />
        ))}
        {children}
      </div>
    </div>
  );
}
