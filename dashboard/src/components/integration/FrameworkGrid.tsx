'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Code } from 'lucide-react';

export type FrameworkId =
  | 'html'
  | 'react'
  | 'nextjs'
  | 'vue'
  | 'nuxt'
  | 'svelte'
  | 'astro'
  | 'remix'
  | 'gatsby'
  | 'angular'
  | 'npm'
  | 'wordpress'
  | 'shopify'
  | 'webflow'
  | 'gtm'
  | 'laravel'
  | 'solidjs';

export interface FrameworkOption {
  id: FrameworkId;
  name: string;
  logo?: string; // Path to /public/framework-logos/
  description?: string;
}

export const FRAMEWORKS: FrameworkOption[] = [
  { id: 'html', name: 'HTML', description: 'Script tag' },
  { id: 'nextjs', name: 'Next.js', logo: '/framework-logos/nextjs-icon.svg', description: 'App Router' },
  { id: 'react', name: 'React', logo: '/framework-logos/react-icon.svg', description: 'Create React App' },
  { id: 'vue', name: 'Vue', logo: '/framework-logos/vue-icon.svg', description: 'Vue 3' },
  { id: 'nuxt', name: 'Nuxt', logo: '/framework-logos/nuxtjs-icon.svg', description: 'Nuxt 3' },
  { id: 'svelte', name: 'Svelte', logo: '/framework-logos/svelte-icon.svg', description: 'SvelteKit' },
  { id: 'astro', name: 'Astro', description: 'Astro' },
  { id: 'remix', name: 'Remix', logo: '/framework-logos/remix-icon.svg', description: 'Remix' },
  { id: 'gatsby', name: 'Gatsby', logo: '/framework-logos/gatsby-icon.svg', description: 'Gatsby' },
  { id: 'angular', name: 'Angular', logo: '/framework-logos/angular-icon.svg', description: 'Angular 17+' },
  { id: 'solidjs', name: 'Solid.js', logo: '/framework-logos/solidjs-icon.svg', description: 'SolidJS' },
  { id: 'laravel', name: 'Laravel', logo: '/framework-logos/laravel-icon.svg', description: 'PHP' },
  { id: 'wordpress', name: 'WordPress', logo: '/framework-logos/wordpress-icon.svg', description: 'Plugin' },
  { id: 'shopify', name: 'Shopify', logo: '/framework-logos/shopify-icon.svg', description: 'Theme' },
  { id: 'webflow', name: 'Webflow', logo: '/framework-logos/webflow-icon.svg', description: 'CMS' },
  { id: 'gtm', name: 'GTM', logo: '/framework-logos/gtm-icon.svg', description: 'Tag Manager' },
  { id: 'npm', name: 'npm', description: 'Node.js' },
];

interface FrameworkGridProps {
  selectedFramework: FrameworkId;
  onSelectFramework: (framework: FrameworkId) => void;
}

export function FrameworkGrid({ selectedFramework, onSelectFramework }: FrameworkGridProps) {
  return (
    <div className='grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'>
      {FRAMEWORKS.map((framework) => {
        const isSelected = selectedFramework === framework.id;

        return (
          <button
            key={framework.id}
            type='button'
            onClick={() => onSelectFramework(framework.id)}
            className={cn(
              'group relative flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border p-3 transition-all duration-200',
              'hover:border-primary/50 hover:bg-accent/50',
              isSelected ? 'border-primary bg-primary/10 ring-primary/20 ring-2' : 'border-border bg-card',
            )}
          >
            {framework.logo ? (
              <Image
                src={framework.logo}
                alt={`${framework.name} logo`}
                width={28}
                height={28}
                className={cn(
                  'h-7 w-7 transition-opacity',
                  isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100',
                )}
              />
            ) : (
              <Code
                className={cn(
                  'h-7 w-7 transition-colors',
                  isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                )}
              />
            )}
            <span
              className={cn(
                'text-xs font-medium transition-colors',
                isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
              )}
            >
              {framework.name}
            </span>
            {isSelected && (
              <div className='bg-primary absolute -top-1 -right-1 h-3 w-3 rounded-full'>
                <svg
                  className='text-primary-foreground h-3 w-3'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={3}
                >
                  <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
