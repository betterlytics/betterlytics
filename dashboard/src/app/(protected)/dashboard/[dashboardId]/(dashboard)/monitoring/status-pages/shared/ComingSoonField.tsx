'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ComingSoonBadge() {
  const t = useTranslations('statusPagesPage.editor');
  return (
    <span className='bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase'>
      {t('comingSoon')}
    </span>
  );
}

type ComingSoonFieldProps = {
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  hintPosition?: 'top' | 'bottom';
};

export function ComingSoonField({
  id,
  label,
  hint,
  placeholder,
  type = 'text',
  hintPosition = 'bottom',
}: ComingSoonFieldProps) {
  const hintEl = hint ? <p className='text-muted-foreground text-xs'>{hint}</p> : null;
  return (
    <div className='space-y-1.5'>
      <div className='flex items-center gap-2'>
        <Label htmlFor={id} className='text-muted-foreground'>
          {label}
        </Label>
        <ComingSoonBadge />
      </div>
      {hintPosition === 'top' && hintEl}
      <Input id={id} type={type} placeholder={placeholder} disabled />
      {hintPosition === 'bottom' && hintEl}
    </div>
  );
}
