import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('public.notFound');

  return (
    <div className='bg-background text-foreground flex min-h-screen flex-col items-center justify-center pb-12'>
      <div className='container mx-auto flex flex-col items-center justify-center space-y-12 px-4 text-center'>
        <Image
          src='/betterlytics-logo-full-dark-4098x2500.png'
          alt='Betterlytics Logo - Light Mode'
          width={300}
          height={100}
          className='object-contain dark:hidden'
        />
        <Image
          src='/betterlytics-logo-full-light-4098x2500.png'
          alt='Betterlytics Logo - Dark Mode'
          width={300}
          height={100}
          className='hidden object-contain dark:block'
        />
        <div className='space-y-4'>
          <h1 className='text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl'>{t('title')}</h1>
          <p className='text-muted-foreground mx-auto max-w-[700px] md:text-xl'>{t('description')}</p>
        </div>
        <Link
          href='/'
          className='bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium shadow transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'
        >
          {t('goHome')}
        </Link>
      </div>
    </div>
  );
}
