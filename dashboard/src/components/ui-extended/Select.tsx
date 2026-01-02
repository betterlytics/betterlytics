'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem as ShadcnSelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger as ShadcnSelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

function SelectTrigger({ className, ...props }: ComponentProps<typeof ShadcnSelectTrigger>) {
  return <ShadcnSelectTrigger className={cn('cursor-pointer', className)} {...props} />;
}

function SelectItem({ className, ...props }: ComponentProps<typeof ShadcnSelectItem>) {
  return <ShadcnSelectItem className={cn('cursor-pointer', className)} {...props} />;
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
