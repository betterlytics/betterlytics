'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Code, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type FrameworkId =
  | 'html'
  | 'nextjs'
  | 'react'
  | 'vue'
  | 'nuxt'
  | 'svelte'
  | 'remix'
  | 'gatsby'
  | 'angular'
  | 'shopify'
  | 'wordpress'
  | 'webflow'
  | 'wix'
  | 'squarespace'
  | 'gtm'
  | 'laravel'
  | 'solidjs';

export interface FrameworkOption {
  id: FrameworkId;
  name: string;
  logo?: string;
  description?: string;
}

export const FRAMEWORKS: FrameworkOption[] = [
  { id: 'html', name: 'HTML', logo: '/framework-logos/html-icon.svg', description: 'Script tag' },
  { id: 'nextjs', name: 'Next.js', logo: '/framework-logos/nextjs-icon.svg', description: 'App Router' },
  { id: 'react', name: 'React', logo: '/framework-logos/react-icon.svg', description: 'Create React App' },
  { id: 'vue', name: 'Vue', logo: '/framework-logos/vue-icon.svg', description: 'Vue 3' },
  { id: 'nuxt', name: 'Nuxt', logo: '/framework-logos/nuxtjs-icon.svg', description: 'Nuxt 3' },
  { id: 'svelte', name: 'Svelte', logo: '/framework-logos/svelte-icon.svg', description: 'SvelteKit' },
  { id: 'angular', name: 'Angular', logo: '/framework-logos/angular-icon.svg', description: 'Angular 17+' },
  { id: 'remix', name: 'Remix', logo: '/framework-logos/remix-icon.svg', description: 'Remix' },
  { id: 'gatsby', name: 'Gatsby', logo: '/framework-logos/gatsby-icon.svg', description: 'Gatsby' },
  { id: 'solidjs', name: 'Solid.js', logo: '/framework-logos/solidjs-icon.svg', description: 'SolidJS' },
  { id: 'laravel', name: 'Laravel', logo: '/framework-logos/laravel-icon.svg', description: 'PHP' },
  { id: 'wordpress', name: 'WordPress', logo: '/framework-logos/wordpress-icon.svg', description: 'Plugin' },
  { id: 'shopify', name: 'Shopify', logo: '/framework-logos/shopify-icon.svg', description: 'Theme' },
  { id: 'webflow', name: 'Webflow', logo: '/framework-logos/webflow-icon.svg', description: 'CMS' },
  { id: 'wix', name: 'Wix', logo: '/framework-logos/wix-icon.svg', description: 'CMS' },
  { id: 'squarespace', name: 'Squarespace', logo: '/framework-logos/squarespace-icon.svg', description: 'CMS' },
  { id: 'gtm', name: 'GTM', logo: '/framework-logos/gtm-icon.svg', description: 'Tag Manager' },
];

const VISIBLE_COUNT = 12;

interface FrameworkGridProps {
  selectedFramework: FrameworkId;
  onSelectFramework: (framework: FrameworkId) => void;
}

export function FrameworkGrid({ selectedFramework, onSelectFramework }: FrameworkGridProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations('onboarding.integration.frameworkGrid');

  const visibleFrameworks = isExpanded ? FRAMEWORKS : FRAMEWORKS.slice(0, VISIBLE_COUNT);
  const hiddenCount = FRAMEWORKS.length - VISIBLE_COUNT;

  return (
    <div className='space-y-2'>
      <div className='grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'>
        {visibleFrameworks.map((framework) => {
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

      {hiddenCount > 0 && (
        <button
          type='button'
          onClick={() => setIsExpanded(!isExpanded)}
          className='text-muted-foreground hover:text-foreground flex w-full cursor-pointer items-center justify-center gap-1 py-1.5 text-xs transition-colors'
        >
          {isExpanded ? (
            <>
              <ChevronUp className='h-3.5 w-3.5' />
              <span>{t('showLess')}</span>
            </>
          ) : (
            <>
              <ChevronDown className='h-3.5 w-3.5' />
              <span>{t('showMore', { count: hiddenCount })}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
