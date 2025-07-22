'use client';

import { cn } from '@/lib/utils';
import * as OneTimePasswordField from '@radix-ui/react-one-time-password-field';
import * as React from 'react';

const OtpInput = React.forwardRef<
  HTMLInputElement,
  {
    length?: number;
    inputProps?:
      | OneTimePasswordField.OneTimePasswordFieldInputProps
      | ((index: number) => OneTimePasswordField.OneTimePasswordFieldInputProps);
  } & OneTimePasswordField.OneTimePasswordFieldProps
>(({ length = 6, className, inputProps: _inputProps = {}, ...props }, ref) => {
  return (
    <OneTimePasswordField.Root
      className={cn('space-between flex w-full flex-nowrap items-center gap-2', className)}
      {...props}
    >
      {Array.from({ length }).map((_, index) => {
        const resolvedInputProps = typeof _inputProps === 'function' ? _inputProps(index) : _inputProps;
        const { className: inputClassName, ...inputProps } = resolvedInputProps;
        return (
          <OneTimePasswordField.Input
            key={index}
            className={cn(
              'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-center text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
              'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
              'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
              inputClassName,
            )}
            {...(!index && { ref })}
            {...inputProps}
          />
        );
      })}
      <OneTimePasswordField.HiddenInput />
    </OneTimePasswordField.Root>
  );
});

OtpInput.displayName = 'OtpInput';

export default OtpInput;
