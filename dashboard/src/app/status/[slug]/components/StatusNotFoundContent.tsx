import { CircleCheck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { env } from '@/lib/env';

// Decorative status-page mock behind the 404 copy. Each row's uptime history is drawn as discrete
// day bars; `down` is the contiguous [start, end) index range that reads as an outage, so the red
// bars sit on exactly the same grid as the green ones and every bar is uniformly rounded.
const UPTIME_BAR_COUNT = 44;
const MOCK_ROWS = [
  { label: 'w-28', down: [34, 38] },
  { label: 'w-24', down: [36, 39] },
  { label: 'w-32', down: [31, 34] },
];

export async function StatusNotFoundContent() {
  const t = await getTranslations('publicStatusPage.notFound');

  const homeUrl = env.PUBLIC_BASE_URL ?? 'https://betterlytics.io';
  const docsUrl = `${homeUrl.replace(/\/$/, '')}/docs`;

  return (
    <main className='relative flex min-h-176 flex-1 flex-col items-center justify-center px-6 py-24 text-center'>
      {/* Faded status-page mock behind the message. `overflow-hidden` lives here (not on <main>) so
          the mock stays clipped to the viewport while the foreground message can grow freely and
          scroll — rather than getting cut off — when the page is zoomed or the viewport is short. */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden mask-[radial-gradient(ellipse_60%_56%_at_50%_50%,transparent_28%,#000_76%)] opacity-50'
      >
        <div className='bg-card border-border w-215 max-w-[92vw] overflow-hidden rounded-xl border shadow-sm'>
          <div className='bg-emerald-500 px-6 py-6 text-center'>
            <div className='mx-auto mb-3 h-10 w-10 rounded-full bg-white/90' />
            <div className='mx-auto mb-2 h-3.5 w-56 rounded bg-white/85' />
            <div className='mx-auto h-2 w-40 rounded bg-white/55' />
          </div>
          <div className='px-6 pt-2 pb-5'>
            {MOCK_ROWS.map((row, i) => (
              <div key={i} className='border-border/60 border-b py-5 last:border-b-0'>
                <div className='mb-3.5 flex items-center justify-between gap-3'>
                  <div className='flex items-center gap-2'>
                    <CircleCheck className='size-4 text-emerald-500' aria-hidden />
                    <div className={`h-2.5 rounded ${row.label} bg-muted-foreground/30`} />
                  </div>
                  <div className='flex items-center gap-3'>
                    {/* uptime label placeholder + an "Operational" status pill, matching a real row */}
                    <div className='bg-muted-foreground/25 hidden h-2 w-14 rounded sm:block' />
                    <div className='flex h-5 items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2'>
                      <div className='h-1.5 w-9 rounded-full bg-emerald-600/50' />
                    </div>
                  </div>
                </div>
                <div className='flex h-8.5 items-stretch gap-0.75'>
                  {Array.from({ length: UPTIME_BAR_COUNT }, (_, b) => (
                    <div
                      key={b}
                      className={`flex-1 rounded-xs ${b >= row.down[0] && b < row.down[1] ? 'bg-red-500' : 'bg-emerald-500'}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Foreground message */}
      <div className='relative z-10 flex flex-col items-center'>
        <h1 className='text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl'>
          {t('title')} <span className='text-primary'>{t('code')}</span>
        </h1>
        <p className='text-muted-foreground mt-5 max-w-115 text-base leading-relaxed text-pretty'>
          {t('description')}
        </p>
        <div className='mt-9 flex flex-wrap justify-center gap-4'>
          <Button asChild size='lg'>
            <a href={homeUrl}>{t('goHome')}</a>
          </Button>
          <Button asChild size='lg' variant='outline'>
            <a href={docsUrl}>{t('viewDocs')}</a>
          </Button>
        </div>
      </div>
    </main>
  );
}
