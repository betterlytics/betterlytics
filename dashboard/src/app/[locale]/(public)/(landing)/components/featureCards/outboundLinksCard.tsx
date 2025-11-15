import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Globe, Play, Twitter } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function OutboundLinksCard() {
  const t = await getTranslations('public.landing.cards.outboundLinks');

  return (
    <Card className='bg-card/70 border-border/70 dark:border-border/60 before:via-primary/40 relative overflow-hidden border shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent before:content-[""]'>
      <CardHeader className='pb-0'>
        <CardTitle className='text-xl'>{t('title')}</CardTitle>
        <CardDescription className='text-base'>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className='pt-4'>
        <div className='flex w-full items-center justify-center'>
          <OutboundLinkIllustration />
        </div>
      </CardContent>
    </Card>
  );
}

function OutboundLinkIllustration() {
  return (
    <div aria-hidden='true' className='relative mx-auto h-64 w-full max-w-[20rem] overflow-hidden'>
      <div className='absolute inset-0 flex items-center justify-center'>
        <div className='h-32 w-32 rounded-full' />
      </div>
      <ConnectionLines />
      <CentralBrowserCard />
      <ExternalSiteCard />
      <SocialPostCard />
      <PdfCard />
      <VideoCard />
    </div>
  );
}

function ConnectionLines() {
  return (
    <div className='pointer-events-none'>
      <LinkLine
        length={58}
        className='absolute top-1/2 left-1/2 origin-left -translate-x-[2.2rem] -translate-y-[2.2rem] -rotate-[146deg]'
        delay='0s'
      />
      <LinkLine
        length={58}
        className='absolute top-1/2 left-1/2 origin-left translate-x-[2.2rem] -translate-y-[2.2rem] -rotate-[34deg]'
        delay='0.6s'
      />
      <LinkLine
        length={58}
        className='absolute top-1/2 left-1/2 origin-left -translate-x-[2.0rem] translate-y-[1.8rem] rotate-[146deg]'
        delay='1.2s'
      />
      <LinkLine
        length={58}
        className='absolute top-1/2 left-1/2 origin-left translate-x-[2.0rem] translate-y-[1.8rem] rotate-[34deg]'
        delay='1.8s'
      />
    </div>
  );
}

function LinkLine({ className, length, delay = '0s' }: { className: string; length: number; delay: string }) {
  const duration = '3.4s';
  const baseStrokeColor = 'rgba(148, 163, 184, 0.45)';
  const glowStrokeColor = 'rgba(56, 136, 255, 0.82)';

  const glowLength = length * 0.2;

  return (
    <svg
      className={`absolute ${className}`}
      width={length}
      height={12}
      viewBox={`0 0 ${length} 12`}
      fill='none'
      aria-hidden='true'
    >
      <line x1='0' y1='6' x2={length} y2='6' stroke={baseStrokeColor} strokeWidth='1.6' strokeLinecap='round' />
      <line
        x1='0'
        y1='6'
        x2={length}
        y2='6'
        stroke={glowStrokeColor}
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeDasharray={`${glowLength} ${length}`}
        strokeDashoffset={length}
        opacity='0'
      >
        <animate
          attributeName='stroke-dashoffset'
          from={String(length)}
          to={String(-length)}
          dur={duration}
          begin={delay}
          repeatCount='indefinite'
        />
        <animate
          attributeName='opacity'
          values='0;0.78;0'
          keyTimes='0;0.35;1'
          dur={duration}
          begin={delay}
          repeatCount='indefinite'
        />
      </line>
    </svg>
  );
}

function CentralBrowserCard() {
  return (
    <div className='absolute top-1/2 left-1/2 z-20 flex h-[4.4rem] w-[4.4rem] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[1.15rem] bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)]'>
      <div className='flex items-center gap-1 px-3 py-1.5'>
        <div className='h-1.5 w-1.5 rounded-full bg-blue-200/80' />
        <div className='h-1.5 w-1.5 rounded-full bg-blue-200/70' />
        <div className='h-1.5 w-1.5 rounded-full bg-blue-200/60' />
      </div>
      <div className='relative mt-auto px-3 pb-2.5'>
        <div className='relative overflow-hidden rounded-xl border border-white/15 bg-white/10 px-2 pt-2 pb-1.5 shadow-[0_6px_12px_rgba(30,64,175,0.18)]'>
          <div className='absolute inset-x-2 top-2 h-px bg-white/10' />
          <div className='absolute inset-y-2 right-2 w-px bg-white/10' />
          <div className='relative flex h-6 items-end gap-1'>
            <div className='h-1.5 w-[3px] rounded-full bg-blue-200/70' />
            <div className='h-3.5 w-[3px] rounded-full bg-blue-200/80' />
            <div className='h-4.5 w-[3px] rounded-full bg-white/80' />
            <div className='h-2.5 w-[3px] rounded-full bg-sky-200/70' />
            <div className='relative flex flex-1 items-end'>
              <svg viewBox='0 0 42 16' className='h-9 w-full overflow-visible' aria-hidden='true'>
                <path
                  d='M1 13 L9 9 L15 11 L22 4 L30 6 L41 2'
                  className='stroke-blue-100/70'
                  strokeWidth='1.5'
                  fill='none'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M1 14 Q9 10 15 12 T30 7 T41 5'
                  className='stroke-emerald-200/80'
                  strokeWidth='1'
                  strokeDasharray='3 3'
                  fill='none'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExternalSiteCard() {
  return (
    <div className='absolute top-6 left-6 z-10 flex w-12 flex-col overflow-hidden rounded-2xl border border-emerald-400/70 bg-white shadow-[0_6px_16px_rgba(16,185,129,0.16)]'>
      <div className='flex items-center gap-1 bg-emerald-400/90 px-1.5 py-1'>
        <div className='h-1.5 w-1.5 rounded-full bg-white/90' />
        <div className='h-1.5 w-1.5 rounded-full bg-white/90' />
        <div className='h-1.5 w-1.5 rounded-full bg-white/90' />
      </div>
      <div className='relative flex flex-1 items-center justify-center py-1.5'>
        <div className='flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/70 bg-emerald-50'>
          <Globe className='h-3.5 w-3.5 text-emerald-500' strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
}

function SocialPostCard() {
  return (
    <div className='absolute top-6 right-6 z-10 flex w-12 flex-col gap-1 rounded-2xl border border-sky-400/70 bg-white px-1.5 py-1.5 shadow-[0_6px_16px_rgba(29,155,240,0.16)]'>
      <div className='flex items-center justify-end'>
        <div className='mr-2 flex h-4 w-4 items-center justify-center rounded-full text-sky-500'>
          <Twitter className='h-4 w-4' strokeWidth={2.2} />
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <div className='flex-1 space-y-1'>
          <div className='h-1.5 w-7 rounded-full bg-slate-300/80' />
          <div className='h-1.5 w-6 rounded-full bg-slate-200/80' />
        </div>
      </div>
    </div>
  );
}

function PdfCard() {
  return (
    <div className='absolute bottom-6 left-6 z-10 flex w-12 flex-col items-center gap-1 rounded-2xl border border-violet-500/70 bg-white px-1 py-1 pt-1.5 shadow-[0_6px_16px_rgba(139,92,246,0.16)]'>
      <div className='flex h-6 w-6 items-center justify-center rounded-xl border border-violet-500/60 bg-violet-50'>
        <FileText className='h-3.5 w-3.5 text-violet-500' strokeWidth={2.2} />
      </div>
      <span className='text-[8px] font-semibold tracking-wide text-violet-500'>PDF</span>
    </div>
  );
}

function VideoCard() {
  return (
    <div className='absolute right-6 bottom-4 z-10 flex w-12 flex-col items-center gap-0 rounded-2xl border border-pink-500/70 bg-white px-1 py-1 shadow-[0_6px_16px_rgba(236,72,153,0.16)]'>
      <div className='flex w-full items-center justify-center rounded-xl bg-pink-50 py-0.5'>
        <div className='flex h-6 w-6 items-center justify-center rounded-full bg-pink-500'>
          <Play className='h-3 w-3 text-white' strokeWidth={2.5} />
        </div>
      </div>
      <span className='text-[8px] font-semibold tracking-wide text-pink-500'>VIDEO</span>
    </div>
  );
}
