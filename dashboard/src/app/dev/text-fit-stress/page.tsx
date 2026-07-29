'use client';

import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

import { MidEllipsisText } from '@/components/text-fit/MidEllipsisText';
import { getStats } from '@/components/text-fit/text-measurer';

const CORPUS = [
  'https://example.com/docs/getting-started/installation/prerequisites?utm_source=newsletter',
  '/dashboard/settings/integrations/webhooks/8f14e45f-ceea-467f-a1d4-2f0e6d9c1b7a/deliveries',
  'Custom event: checkout_completed_with_discount_code_applied',
  '日本語のとても長いページタイトルがここに入りますこれは省略のテストです',
  'Sønderborg Universitetsafdeling for Datalogi og Informationsvidenskab',
  'Family: 👨‍👩‍👧 flags: 🇩🇰🇯🇵 marks: aééé',
  'مرحبا بكم في لوحة التحكم التحليلية الخاصة بنا مع مسار طويل جدا',
];

export default function TextFitStressPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  const [n, setN] = useState(200);
  const [animate, setAnimate] = useState(false);
  const [churn, setChurn] = useState(false);
  const [salt, setSalt] = useState(0);
  const [mounted, setMounted] = useState(true);
  useEffect(() => {
    const fromQuery = Number(new URLSearchParams(window.location.search).get('n'));
    if (fromQuery > 0) setN(fromQuery);
  }, []);
  useEffect(() => {
    if (!churn) return;
    const id = setInterval(() => setSalt((s) => s + 1), 250);
    return () => clearInterval(id);
  }, [churn]);
  const stats = getStats();

  return (
    <div className='space-y-4 p-6'>
      <div className='flex flex-wrap items-center gap-4 text-sm'>
        <button className='cursor-pointer rounded border px-2 py-1' onClick={() => setAnimate((v) => !v)}>
          animate width: {String(animate)}
        </button>
        <button className='cursor-pointer rounded border px-2 py-1' onClick={() => setChurn((v) => !v)}>
          value churn: {String(churn)}
        </button>
        <button className='cursor-pointer rounded border px-2 py-1' onClick={() => setMounted((v) => !v)}>
          mounted: {String(mounted)}
        </button>
        <button
          className='cursor-pointer rounded border px-2 py-1'
          onClick={() => document.fonts.load('700 14px Arial')}
        >
          force font load
        </button>
        <span>
          measures {stats.measures} / hits {stats.cacheHits} / epoch {stats.epoch}
        </span>
      </div>
      {mounted && (
        <div
          className='grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2'
          style={animate ? { animation: 'text-fit-squeeze 3s ease-in-out infinite alternate' } : undefined}
        >
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className='min-w-0 rounded border p-1 text-sm'>
              <MidEllipsisText value={`${salt ? `${salt}-` : ''}${CORPUS[i % CORPUS.length]}`} />
            </div>
          ))}
        </div>
      )}
      <style>{'@keyframes text-fit-squeeze { from { width: 100%; } to { width: 38%; } }'}</style>
    </div>
  );
}
