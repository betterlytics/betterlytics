import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Maximize2, MoreVertical, Pause } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function SessionReplayCard() {
  const t = await getTranslations('public.landing.cards.sessionReplay');
  return (
    <Card className='bg-card/70 border-border/70 dark:border-border/60 before:via-primary/40 relative gap-4 overflow-hidden border shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent before:content-[""]'>
      <CardHeader className='pb-0'>
        <CardTitle className='text-xl'>{t('title')}</CardTitle>
        <CardDescription className='text-base'>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex w-full justify-center'>
          <SessionReplayIllustration />
        </div>
      </CardContent>
    </Card>
  );
}

async function SessionReplayIllustration() {
  const t = await getTranslations('public.landing.cards.sessionReplay');

  const timelineMarkers = [{ left: '8%' }, { left: '32%' }, { left: '54%' }, { left: '76%' }];
  const animationStyles = `
    @keyframes sr-card-cursor-path {
      0%, 18% {
        transform: translate3d(18%, 22%, 0);
      }
      24% {
        transform: translate3d(48%, 26%, 0);
      }
      32%, 40% {
        transform: translate3d(68%, 46%, 0);
      }
      50%, 58% {
        transform: translate3d(36%, 58%, 0);
      }
      68%, 76% {
        transform: translate3d(74%, 36%, 0);
      }
      100% {
        transform: translate3d(18%, 22%, 0);
      }
    }

    @keyframes sr-card-click {
      0%, 26% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.25);
      }
      30% {
        opacity: 0.6;
        transform: translate(-50%, -50%) scale(1);
      }
      34% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(1.85);
      }
      62% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.25);
      }
      68% {
        opacity: 0.55;
        transform: translate(-50%, -50%) scale(1);
      }
      72% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(1.75);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.25);
      }
    }

    @keyframes sr-card-tooltip {
      0%, 26% {
        opacity: 0;
        transform: translateY(-8px) scale(0.95);
      }
      30%, 38% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      42%, 62% {
        opacity: 0;
        transform: translateY(-8px) scale(0.95);
      }
      68%, 76% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      80%, 100% {
        opacity: 0;
        transform: translateY(-8px) scale(0.95);
      }
    }

    .sr-card__cursor {
      position: absolute;
      top: 6%;
      left: 6%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.4rem;
      transform-origin: top left;
      will-change: transform;
      animation: sr-card-cursor-path 9s ease-in-out infinite;
    }

    .sr-card__cursor-icon-wrapper {
      position: relative;
    }

    .sr-card__cursor-icon {
      width: 18px;
      height: 18px;
      color:rgb(33, 35, 38);
      filter: drop-shadow(0 6px 10px rgba(15, 23, 42, 0.18));
    }

    .sr-card__pulse {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 28px;
      height: 28px;
      border-radius: 9999px;
      background: rgba(56, 189, 248, 0.35);
      transform: translate(-50%, -50%) scale(0.25);
      opacity: 0;
      animation: sr-card-click 9s ease-in-out infinite;
    }

    .sr-card__tooltip {
      border-radius: 0.75rem;
      background: rgba(15, 23, 42, 0.9);
      padding: 0.35rem 0.75rem;
      font-size: 0.7rem;
      font-weight: 600;
      color: #e2e8f0;
      box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
      border: 1px solid rgba(15, 23, 42, 0.08);
      backdrop-filter: blur(6px);
      opacity: 0;
      transform: translateY(-8px) scale(0.95);
      animation: sr-card-tooltip 9s ease-in-out infinite;
    }
  `;

  return (
    <div className='relative w-full max-w-[300px] sm:max-w-[380px]'>
      <style>{animationStyles}</style>
      <div className='relative overflow-hidden rounded-t-2xl bg-white dark:border dark:border-neutral-900/60'>
        {/* BROWSER TOPBAR */}
        <div className='flex items-center gap-3 border-b border-neutral-900/60 bg-neutral-800/95 px-4 py-2 text-xs text-neutral-300'>
          <div className='flex items-center gap-1'>
            <span className='h-2.5 w-2.5 rounded-full bg-[#ff5f57]' />
            <span className='h-2.5 w-2.5 rounded-full bg-[#febc2e]' />
            <span className='h-2.5 w-2.5 rounded-full bg-[#27c93f]' />
          </div>
          <div className='flex-1'>
            <div className='truncate rounded-md border border-neutral-800 bg-neutral-600/90 px-3 py-1.5 text-left text-[11px] font-medium text-neutral-200 shadow-inner'>
              https://example.com
            </div>
          </div>
          <div className='flex items-center'>
            <MoreVertical className='h-4 w-4 text-neutral-500' />
          </div>
        </div>

        {/* BROWSER CONTENT*/}
        <div className='relative px-4 py-2'>
          <div className='grid gap-4 lg:gap-5'>
            <div className='relative overflow-hidden rounded-2xl border border-white bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.1)]'>
              <div className='absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-100' />
              <div className='relative space-y-3'>
                <div className='h-12 rounded-2xl border border-slate-200 bg-white shadow-sm' />
                <div className='space-y-1'>
                  <div className='h-2.5 w-3/4 rounded-full bg-slate-200' />
                  <div className='h-2.5 w-1/2 rounded-full bg-slate-200/70' />
                </div>

                <div className='grid grid-cols-3 gap-3'>
                  <div className='h-12 rounded-xl border border-slate-200 bg-white shadow-sm' />
                  <div className='h-12 rounded-xl border border-slate-200 bg-white shadow-sm' />
                  <div className='h-12 rounded-xl border border-slate-200 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.12)]' />
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='h-8 rounded-lg border border-slate-200 bg-white shadow-sm' />
                  <div className='h-8 rounded-lg border border-slate-200 bg-white shadow-sm' />
                </div>
              </div>

              <div className='sr-card__cursor pointer-events-none absolute top-0 left-0'>
                <div className='sr-card__cursor-icon-wrapper'>
                  <span className='sr-card__pulse' />
                  <svg viewBox='0 0 16 24' className='sr-card__cursor-icon'>
                    <path d='M2.5 1.5L13.5 13.2H8.8L11.6 22.5 8.9 23.5 6.1 14.4 2.5 17.1Z' fill='currentColor' />
                  </svg>
                </div>
                <div className='sr-card__tooltip'>{t('cursorClick')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PLAYBACK CONTROLS */}
      <div className='relative flex flex-col gap-3 rounded-b-2xl border border-neutral-900/60 bg-neutral-800/90 px-2 py-4 text-neutral-200 shadow-[0_6px_18px_rgba(15,23,42,0.58)] ring-1 ring-black/40 backdrop-blur-md sm:px-7 dark:border-white/10 dark:text-slate-100 dark:ring-white/15'>
        <div className='flex items-center justify-between text-[10px] font-semibold tracking-[0.32em] text-neutral-400 uppercase dark:text-slate-300'>
          <span>{t('sessionPlayback')}</span>
          <span className='inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-100 shadow-[0_10px_24px_rgba(15,23,42,0.4)] dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100'>
            <span className='inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_0_2px_rgba(52,211,153,0.35)]' />
            {t('playing')}
          </span>
        </div>

        <div className='relative h-2 rounded-full bg-neutral-800/80 dark:bg-slate-700/80'>
          <div className='absolute top-0 left-0 h-full w-2/5 rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-violet-500 shadow-[0_4px_12px_rgba(56,189,248,0.35)]' />
          <div
            className='absolute top-1/2 left-[40%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80 bg-slate-200 shadow-[0_6px_16px_rgba(15,23,42,0.45)] dark:border-slate-200'
            aria-hidden='true'
          />
          {timelineMarkers.map((marker, idx) => (
            <div
              key={`marker-overlay-${idx}`}
              className='absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-white/80 bg-white/90 shadow-[0_4px_12px_rgba(148,163,184,0.4)] dark:border-slate-200 dark:bg-slate-100'
              style={{ left: marker.left }}
            />
          ))}
        </div>

        <div className='flex items-center gap-3 text-[11px] leading-none text-neutral-200 dark:text-slate-200'>
          <Pause className='h-3.5 w-3.5' />
          <div className='font-medium text-neutral-100 dark:text-slate-100'>03:21</div>
          <div className='text-neutral-500/80 dark:text-slate-400'>/</div>
          <div className='font-medium text-neutral-100 dark:text-slate-100'>12:44</div>
          <div className='ml-auto inline-flex items-center'>
            <Maximize2 className='h-3.5 w-3.5' />
          </div>
        </div>
      </div>
    </div>
  );
}
