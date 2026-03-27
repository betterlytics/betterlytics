import { getTranslations } from 'next-intl/server';
import { FrameworkCard } from './FrameworkCard';

// Ordered to spread brand colors evenly — no two similar hues adjacent
const frameworks = [
  { name: 'Next.js', logo: '/framework-logos/nextjs-icon.svg', brandColor: { light: '#4a4a4a', dark: '#ffffff' } },
  { name: 'Svelte', logo: '/framework-logos/svelte-icon.svg', brandColor: '#FF3E00' },
  { name: 'Vue.js', logo: '/framework-logos/vue-icon.svg', brandColor: '#4FC08D' },
  { name: 'GTM', logo: '/framework-logos/gtm-icon.svg', brandColor: '#4285F4' },
  { name: 'Laravel', logo: '/framework-logos/laravel-icon.svg', brandColor: '#FF2D20' },
  { name: 'Shopify', logo: '/framework-logos/shopify-icon.svg', brandColor: '#96BF48' },
  { name: 'Webflow', logo: '/framework-logos/webflow-icon.svg', brandColor: '#4353FF' },
  { name: 'Wix', logo: '/framework-logos/wix-icon.svg', brandColor: '#FAAD4D' },
  { name: 'Nuxt.js', logo: '/framework-logos/nuxtjs-icon.svg', brandColor: '#00DC82' },
  { name: 'Angular', logo: '/framework-logos/angular-icon.svg', brandColor: '#DD0031' },
  { name: 'Solid.js', logo: '/framework-logos/solidjs-icon.svg', brandColor: '#4F88C6' },
  { name: 'Gatsby', logo: '/framework-logos/gatsby-icon.svg', brandColor: '#663399' },
  { name: 'React', logo: '/framework-logos/react-icon.svg', brandColor: '#61DAFB' },
  { name: 'Astro', logo: '/framework-logos/astro-icon.svg', brandColor: '#FF5D01' },
  { name: 'WordPress', logo: '/framework-logos/wordpress-icon.svg', brandColor: '#21759B' },
  { name: 'Squarespace', logo: '/framework-logos/squarespace-icon.svg', brandColor: { light: '#4a4a4a', dark: '#ffffff' } },
  { name: 'Remix', logo: '/framework-logos/remix-icon.svg', brandColor: '#3992FF' },
];

export async function FrameworkCompatibility() {
  const t = await getTranslations('public.landing.framework');
  return (
    <section className='overflow-visible py-16'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-12 text-center'>
          <h2 className='mb-4 text-2xl font-bold'>{t('title')}</h2>
          <p className='text-muted-foreground'>{t('subtitle')}</p>
        </div>

        <div className='relative overflow-hidden'>
          <div className='flex w-max animate-[scroll_20s_linear_infinite] gap-3 will-change-transform hover:[animation-play-state:paused] sm:gap-6 lg:animate-[scroll_40s_linear_infinite] lg:gap-8'>
            {frameworks.map((framework) => (
              <FrameworkCard key={`first-${framework.name}`} framework={framework} />
            ))}

            {/* Duplicate set for seamless loop */}
            {frameworks.map((framework) => (
              <FrameworkCard key={`second-${framework.name}`} framework={framework} />
            ))}
          </div>

          {/* Left fade gradient */}
          <div className='from-background pointer-events-none absolute top-0 left-0 z-10 h-full w-32 bg-gradient-to-r to-transparent' />

          {/* Right fade gradient */}
          <div className='from-background pointer-events-none absolute top-0 right-0 z-10 h-full w-32 bg-gradient-to-l to-transparent' />
        </div>

        <div className='mt-8 text-center'>
          <p className='text-muted-foreground text-sm'>{t('footer')}</p>
        </div>
      </div>
    </section>
  );
}
