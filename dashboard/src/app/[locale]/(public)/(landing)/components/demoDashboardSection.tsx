import { env } from '@/lib/env';
import { getLocale } from 'next-intl/server';
import Image from 'next/image';

export async function DemoDashboardPreview() {
  if (!env.DEMO_DASHBOARD_ID) {
    return null;
  }

  const locale = await getLocale();
  const demoDashboardPath = `/${locale}/share/${env.DEMO_DASHBOARD_ID}`;

  return (
    <div className='relative w-full'>
      <div
        className='pointer-events-none absolute inset-x-4 -top-28 bottom-14 -z-10 rounded-[48px] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_transparent_75%)] opacity-70 blur-[100px] sm:inset-x-12 sm:-top-32 sm:bottom-16 md:inset-x-16 dark:bg-[radial-gradient(circle_at_top,_rgba(30,64,175,0.5),_transparent_75%)]'
        aria-hidden
      />

      {/* Mobile */}
      <div className='relative w-full md:hidden'>
        <div className='relative overflow-hidden rounded-xl'>
          <div className='relative aspect-[16/11] w-full'>
            <Image
              src='/images/demo-dashboard-desktop-light.webp'
              alt='Betterlytics dashboard preview'
              fill
              sizes='100vw'
              className='object-cover dark:hidden'
              loading='lazy'
            />
            <Image
              src='/images/demo-dashboard-desktop-dark.webp'
              alt='Betterlytics dashboard preview'
              fill
              sizes='100vw'
              className='hidden object-cover dark:block'
              loading='lazy'
            />
            <div
              className='to-background pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent'
              aria-hidden
            />
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className='relative hidden w-full rounded-[2rem] bg-white/10 p-2 shadow-[0_40px_120px_-45px_rgba(37,99,235,0.45)] ring-1 ring-white/20 backdrop-blur-xl supports-[backdrop-filter]:bg-white/10 sm:p-3 md:block md:p-4 dark:bg-white/5 dark:shadow-[0_40px_120px_-45px_rgba(59,130,246,0.25)] dark:ring-white/10'>
        <div
          className='pointer-events-none absolute inset-0 rounded-[2rem] border border-white/20 opacity-60 mix-blend-overlay dark:border-white/10'
          aria-hidden
        />
        <div className='border-border/40 bg-background/95 relative overflow-hidden rounded-[1.5rem] border shadow-inner shadow-blue-500/5'>
          <div className='relative aspect-[16/9] w-full'>
            <iframe
              allowFullScreen
              src={demoDashboardPath}
              title='Betterlytics live demo'
              loading='lazy'
              sandbox='allow-scripts allow-same-origin'
              referrerPolicy='no-referrer'
              className='absolute inset-0 h-full w-full border-0'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
