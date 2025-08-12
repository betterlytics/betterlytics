import Image from 'next/image';

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
];

export function FrameworkCompatibility() {
  return (
    <section className='border-border/40 overflow-hidden border-t py-16'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-12 text-center'>
          <h2 className='mb-4 text-2xl font-bold'>Works with your favorite tools</h2>
          <p className='text-muted-foreground'>
            Universal compatibility - works with any website, framework, or platform
          </p>
        </div>

        <div className='relative overflow-hidden'>
          <div className='flex animate-[scroll_10s_linear_infinite] space-x-4 hover:[animation-play-state:paused] sm:space-x-6 lg:animate-[scroll_40s_linear_infinite] lg:space-x-8'>
            {frameworks.map((framework) => (
              <div
                key={`first-${framework.name}`}
                className='hover:bg-card flex min-w-[120px] flex-shrink-0 flex-col items-center space-y-2 rounded-lg p-4 transition-colors'
              >
                <div className='flex h-8 w-8 items-center justify-center'>
                  <Image
                    src={framework.logo}
                    alt={`${framework.name} logo`}
                    width={32}
                    height={32}
                    className='h-8 w-8'
                  />
                </div>
                <span className='text-center text-sm font-medium'>{framework.name}</span>
              </div>
            ))}

            {/* Duplicate set of frameworks to reduce the flickering when the loop reaches the end */}
            {frameworks.map((framework) => (
              <div
                key={`second-${framework.name}`}
                className='hover:bg-card flex min-w-[120px] flex-shrink-0 flex-col items-center space-y-2 rounded-lg p-4 transition-colors'
              >
                <div className='flex h-8 w-8 items-center justify-center'>
                  <Image
                    src={framework.logo}
                    alt={`${framework.name} logo`}
                    width={32}
                    height={32}
                    className='h-8 w-8'
                  />
                </div>
                <span className='text-center text-sm font-medium'>{framework.name}</span>
              </div>
            ))}
          </div>

          {/* Left fade gradient */}
          <div className='from-background pointer-events-none absolute top-0 left-0 z-10 h-full w-32 bg-gradient-to-r to-transparent'></div>

          {/* Right fade gradient */}
          <div className='from-background pointer-events-none absolute top-0 right-0 z-10 h-full w-32 bg-gradient-to-l to-transparent'></div>
        </div>

        <div className='mt-8 text-center'>
          <p className='text-muted-foreground text-sm'>
            And countless more... If it runs on the web, we support it!
          </p>
        </div>
      </div>
    </section>
  );
}
