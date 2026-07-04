'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LabeledTextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  hintPosition?: 'top' | 'bottom';
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  error?: string | null;
  disabled?: boolean;
  labelAdornment?: React.ReactNode;
};

export function LabeledTextField({
  id,
  label,
  value,
  onChange,
  hint,
  hintPosition = 'bottom',
  placeholder,
  type = 'text',
  error,
  disabled = false,
  labelAdornment,
}: LabeledTextFieldProps) {
  const hintEl = hint ? <p className='text-muted-foreground text-xs'>{hint}</p> : null;
  return (
    <div className='space-y-1.5'>
      <div className='flex items-center gap-2'>
        <Label htmlFor={id}>{label}</Label>
        {labelAdornment}
      </div>
      {hintPosition === 'top' && hintEl}
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <p className='text-destructive text-xs'>{error}</p> : hintPosition === 'bottom' && hintEl}
    </div>
  );
}
