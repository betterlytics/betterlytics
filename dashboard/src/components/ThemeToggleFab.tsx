'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggleFab() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : false;

  return (
    <div className='pointer-events-auto fixed right-6 bottom-6 z-50'>
      <div className='bg-muted/70 supports-[backdrop-filter]:bg-muted/50 border-border text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-full border p-1 shadow-lg backdrop-blur transition-colors'>
        <button
          type='button'
          aria-label='Switch to light mode'
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${!isDark ? 'bg-primary/30 text-foreground' : ''}`}
          onClick={() => setTheme('light')}
        >
          <Sun className='h-4 w-4' />
        </button>
        <button
          type='button'
          aria-label='Switch to dark mode'
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isDark ? 'bg-primary/60 text-foreground' : ''}`}
          onClick={() => setTheme('dark')}
        >
          <Moon className='h-4 w-4' />
        </button>
      </div>
    </div>
  );
}
