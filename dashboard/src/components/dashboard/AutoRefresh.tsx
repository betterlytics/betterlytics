'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type RefreshIntervalValue = 'off' | '30s' | '60s' | '120s';

const INTERVAL_MS_BY_VALUE: Record<Exclude<RefreshIntervalValue, 'off'>, number> = {
  '30s': 30_000,
  '60s': 60_000,
  '120s': 120_000,
};

export function AutoRefresh({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState<RefreshIntervalValue>('off');
  const intervalRef = useRef<number | null>(null);
  const isPageVisible = useRef<boolean>(true);

  const options = useMemo(
    () =>
      [
        { value: 'off', label: 'Off' },
        { value: '30s', label: '30s' },
        { value: '60s', label: '1m' },
        { value: '120s', label: '2m' },
      ] as const,
    [],
  );

  useEffect(() => {
    const onVisibility = () => {
      isPageVisible.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (value === 'off') return;

    const ms = INTERVAL_MS_BY_VALUE[value];
    intervalRef.current = window.setInterval(() => {
      if (!isPageVisible.current) return;
      router.refresh();
    }, ms);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [router, value]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Label className='text-muted-foreground hidden sm:inline' htmlFor='auto-refresh-select'>
        Auto refresh
      </Label>
      <Select value={value} onValueChange={(v) => setValue(v as RefreshIntervalValue)}>
        <SelectTrigger
          id='auto-refresh-select'
          className='bg-secondary border-border w-[120px] cursor-pointer border shadow-sm'
        >
          <SelectValue placeholder='Off' />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className='cursor-pointer'>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Label className='text-muted-foreground sm:hidden' htmlFor='auto-refresh-select'>
        Auto refresh
      </Label>
    </div>
  );
}

export default AutoRefresh;
