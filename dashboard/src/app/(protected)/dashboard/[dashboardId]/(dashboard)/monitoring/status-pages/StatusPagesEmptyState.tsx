'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { STATUS_PAGE_DEFAULT_ACCENT_COLOR } from '@/entities/analytics/statusPage.entities';

const TICK_OK = '#10b981';
const TICK_WARN = '#f5b40a';

/** Tiny status-page vignette built from the public page's actual visual language (accent band + uptime bars). */
function StatusPageVignette() {
  const rows = [
    [TICK_OK, TICK_OK, TICK_OK, TICK_OK, TICK_OK, TICK_WARN, TICK_OK, TICK_OK, TICK_OK, TICK_OK],
    [TICK_OK, TICK_OK, TICK_OK, TICK_OK, TICK_OK, TICK_OK, TICK_OK, TICK_OK, TICK_OK, TICK_OK],
    [TICK_OK, TICK_OK, TICK_WARN, TICK_OK, TICK_OK, TICK_OK, TICK_OK, TICK_OK, TICK_OK, TICK_OK],
  ];

  return (
    <div className='border-border w-[180px] overflow-hidden rounded-xl border shadow-xl'>
      <div
        className='flex h-11 items-center justify-center'
        style={{ backgroundColor: STATUS_PAGE_DEFAULT_ACCENT_COLOR }}
      >
        <span className='flex h-5 w-5 items-center justify-center rounded-full bg-white'>
          <Check className='h-3.5 w-3.5' strokeWidth={4} style={{ color: STATUS_PAGE_DEFAULT_ACCENT_COLOR }} />
        </span>
      </div>
      <div className='flex flex-col gap-2 bg-white p-3.5 dark:bg-[#16191d]'>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className='flex gap-[2px]'>
            {row.map((color, index) => (
              <span key={index} className='h-2 min-w-0 flex-1 rounded-[2px]' style={{ backgroundColor: color }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatusPagesEmptyState({ createButton }: { createButton: ReactNode }) {
  const t = useTranslations('statusPagesPage.empty');

  return (
    <div className='relative mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-8'>
      <StatusPageVignette />
      <div className='mt-8 space-y-3 text-center'>
        <h2 className='text-2xl font-semibold tracking-tight'>{t('title')}</h2>
        <p className='text-muted-foreground mx-auto max-w-md text-sm leading-relaxed'>{t('description')}</p>
      </div>
      <div className='mt-6 flex justify-center'>{createButton}</div>
    </div>
  );
}
