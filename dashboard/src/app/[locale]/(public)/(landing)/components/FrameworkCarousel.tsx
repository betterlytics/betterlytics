'use client';

import { useTheme } from 'next-themes';
import { FrameworkCard } from './FrameworkCard';

type Framework = {
  name: string;
  logo: string;
  brandColor: string | { light: string; dark: string };
};

const frameworks: Framework[] = [
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
  {
    name: 'Squarespace',
    logo: '/framework-logos/squarespace-icon.svg',
    brandColor: { light: '#4a4a4a', dark: '#ffffff' },
  },
  { name: 'Remix', logo: '/framework-logos/remix-icon.svg', brandColor: '#3992FF' },
];

function FrameworkList({ resolvedTheme }: { resolvedTheme: string | undefined }) {
  return frameworks.map((fw) => (
    <FrameworkCard
      key={fw.name}
      name={fw.name}
      logo={fw.logo}
      color={
        typeof fw.brandColor === 'string'
          ? fw.brandColor
          : resolvedTheme === 'dark'
            ? fw.brandColor.dark
            : fw.brandColor.light
      }
    />
  ));
}

export function FrameworkCarousel() {
  const { resolvedTheme } = useTheme();

  return (
    <div className='flex w-max animate-[scroll_20s_linear_infinite] gap-3 will-change-transform focus-within:[animation-play-state:paused] hover:[animation-play-state:paused] sm:gap-6 lg:animate-[scroll_40s_linear_infinite] lg:gap-8'>
      <FrameworkList resolvedTheme={resolvedTheme} />
      <FrameworkList resolvedTheme={resolvedTheme} />
    </div>
  );
}
