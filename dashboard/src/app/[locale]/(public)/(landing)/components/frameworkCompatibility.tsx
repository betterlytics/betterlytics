import { getTranslations } from 'next-intl/server';
import { FrameworkCarousel } from './FrameworkCarousel';

export async function FrameworkCompatibility() {
  const t = await getTranslations('public.landing.framework');
  return (
    <section className='overflow-visible py-16'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-12 text-center'>
          <h2 className='mb-4 text-2xl font-bold'>{t('title')}</h2>
          <p className='text-muted-foreground'>{t('subtitle')}</p>
        </div>
        <FrameworkCarousel />
        <div className='mt-8 text-center'>
          <p className='text-muted-foreground text-sm'>{t('footer')}</p>
        </div>
      </div>
    </section>
  );
}
