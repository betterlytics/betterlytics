'use client';

import { HexColorInput, HexColorPicker } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type ColorPickerPopoverProps = {
  value: string;
  onChange: (hex: string) => void;
  /** Highlight the trigger as the active choice (e.g. when the value isn't one of the preset swatches) */
  selected?: boolean;
  ariaLabel: string;
};

/** A "custom color" swatch (rainbow ring) opening a react-colorful hex picker in a popover. */
export function ColorPickerPopover({ value, onChange, selected = false, ariaLabel }: ColorPickerPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type='button'
          aria-label={ariaLabel}
          className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition ${
            selected ? 'ring-offset-background ring-primary ring-2 ring-offset-2' : 'border-border'
          }`}
          style={{
            background: 'conic-gradient(from 180deg, #ef4444, #f59e0b, #22c55e, #0ea5e9, #8b5cf6, #ef4444)',
          }}
        >
          {selected && <span className='h-4 w-4 rounded-full border border-white/60' style={{ backgroundColor: value }} />}
        </button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-auto p-3'>
        <HexColorPicker color={value} onChange={onChange} />
        <HexColorInput
          color={value}
          onChange={onChange}
          prefixed
          aria-label={ariaLabel}
          className='border-input bg-background mt-3 w-full rounded-md border px-2.5 py-1.5 font-mono text-sm'
        />
      </PopoverContent>
    </Popover>
  );
}
