import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { AnimatedCarousel } from '@/components/animations/AnimatedCarousel';

const frameworks = [
  { name: 'Next.js', logo: '/framework-logos/nextjs-icon.svg' },
  { name: 'React', logo: '/framework-logos/react-icon.svg' },
  { name: 'Vue.js', logo: '/framework-logos/vue-icon.svg' },
  { name: 'Angular', logo: '/framework-logos/angular-icon.svg' },
  { name: 'Svelte', logo: '/framework-logos/svelte-icon.svg' },
  { name: 'Nuxt.js', logo: '/framework-logos/nuxtjs-icon.svg' },
  { name: 'Gatsby', logo: '/framework-logos/gatsby-icon.svg' },
  { name: 'Laravel', logo: '/framework-logos/laravel-icon.svg' },
  { name: 'WordPress', logo: '/framework-logos/wordpress-icon.svg' },
  { name: 'Shopify', logo: '/framework-logos/shopify-icon.svg' },
  { name: 'GTM', logo: '/framework-logos/gtm-icon.svg' },
  { name: 'Webflow', logo: '/framework-logos/webflow-icon.svg' },
  { name: 'Remix', logo: '/framework-logos/remix-icon.svg' },
  { name: 'Solid.js', logo: '/framework-logos/solidjs-icon.svg' },
  { name: 'Astro', logo: '/framework-logos/astro-icon.svg' },
  { name: 'Wix', logo: '/framework-logos/wix-icon.svg' },
  { name: 'Squarespace', logo: '/framework-logos/squarespace-icon.svg' },
];

function FrameworkItem({ name, logo }: { name: string; logo: string }) {
  return (
    <div className='hover:bg-card flex min-w-[120px] flex-shrink-0 flex-col items-center space-y-2 rounded-lg p-4 transition-colors'>
      <div className='flex h-8 w-8 items-center justify-center'>
        <Image src={logo} alt={`${name} logo`} width={32} height={32} className='h-8 w-8' />
      </div>
      <span className='text-center text-sm font-medium'>{name}</span>
    </div>
  );
}

export async function FrameworkCompatibility() {
  const t = await getTranslations('public.landing.framework');
  return (
    <section className='overflow-visible py-16'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-12 text-center'>
          <h2 className='mb-4 text-2xl font-bold'>{t('title')}</h2>
          <p className='text-muted-foreground'>{t('subtitle')}</p>
        </div>

        <div className='relative'>
          <AnimatedCarousel className='gap-3 sm:gap-6 lg:gap-8' speed={40}>
            {frameworks.map((framework) => (
              <FrameworkItem key={framework.name} name={framework.name} logo={framework.logo} />
            ))}
          </AnimatedCarousel>

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
