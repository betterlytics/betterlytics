'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'simple' | 'full' | 'icon';
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg' | 'xl';
  textPlacement?: 'right' | 'left' | 'bottom' | 'top';
  spacing?: 'tight' | 'normal' | 'loose';
}

export default function Logo({
  variant = 'simple',
  className,
  width,
  height,
  priority = false,
  showText = false,
  textSize = 'md',
  textPlacement = 'right',
  spacing = 'normal',
}: LogoProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? resolvedTheme : 'light';
  const isDark = currentTheme === 'dark';

  const logoSources = {
    simple: {
      dark: '/betterlytics-logo-light-simple.svg',
      light: '/betterlytics-logo-dark-simple.svg',
    },
    full: {
      dark: '/logo-light-svg-full.svg',
      light: '/logo-dark-svg-full.svg',
    },
    icon: {
      dark: '/images/favicon-light.svg',
      light: '/images/favicon-dark.svg',
    },
  };

  const textSizeClasses = {
    sm: 'text-lg font-bold',
    md: 'text-xl font-bold',
    lg: 'text-2xl font-bold',
    xl: 'text-3xl font-bold',
  };

  const spacingClasses = {
    tight: 'gap-1',
    normal: 'gap-2',
    loose: 'gap-4',
  };

  const placementClasses = {
    right: 'flex-row items-center',
    left: 'flex-row-reverse items-center',
    bottom: 'flex-col items-center',
    top: 'flex-col-reverse items-center',
  };

  const defaultDimensions = {
    simple: { width: 32, height: 32 },
    full: { width: 150, height: 40 },
    icon: { width: 24, height: 24 },
  };

  const logoSrc = isDark ? logoSources[variant].dark : logoSources[variant].light;
  const dimensions = {
    width: width || defaultDimensions[variant].width,
    height: height || defaultDimensions[variant].height,
  };

  const logoImage = (
    <Image
      src={logoSrc}
      alt='Betterlytics'
      width={dimensions.width}
      height={dimensions.height}
      priority={priority}
      className='object-contain'
    />
  );

  if (!showText) {
    return <div className={cn('inline-block', className)}>{logoImage}</div>;
  }

  const logoText = showText && (
    <span className={cn(textSizeClasses[textSize], 'text-foreground')}>Betterlytics</span>
  );

  return (
    <div className={cn('flex', placementClasses[textPlacement], spacingClasses[spacing], className)}>
      {logoImage}
      {logoText}
    </div>
  );
}
