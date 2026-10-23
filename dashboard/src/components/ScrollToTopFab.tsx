'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ScrollToTopFab() {
  const t = useTranslations('components.scrollToTop');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > window.innerHeight);
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'instant' : 'smooth' });
  };

  // Sits 12px left of ThemeToggleFab (right-6, 78px wide)
  return (
    <div
      inert={!visible}
      className={`fixed right-[calc(1.5rem+78px+0.75rem)] bottom-6 z-50 transition-opacity duration-300 motion-reduce:transition-none ${
        visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <div className='bg-muted/70 supports-[backdrop-filter]:bg-muted/50 border-border text-muted-foreground hover:text-foreground inline-flex items-center rounded-full border p-1 shadow-lg backdrop-blur transition-colors'>
        <button
          type='button'
          aria-label={t('label')}
          className='inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors'
          onClick={scrollToTop}
        >
          <ArrowUp className='h-4 w-4' />
        </button>
      </div>
    </div>
  );
}
