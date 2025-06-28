import { Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function OpenSourceCallout() {
  return (
    <section className='py-20'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center'>
          <Github className='text-primary mx-auto mb-6 h-16 w-16' />
          <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
            <span className='text-blue-600 dark:text-blue-400'>Open Source</span> &amp; Community Driven
          </h2>
          <p className='text-muted-foreground mx-auto mb-8 max-w-2xl text-xl'>
            Transparent, community-driven development. Join our contributors, request features, or adapt the
            platform to your unique requirements.
          </p>
          <div className='flex flex-col justify-center gap-4 sm:flex-row'>
            <Button size='lg' variant='outline' asChild>
              <a href='https://github.com/betterlytics/betterlytics' target='_blank' rel='noopener noreferrer'>
                <Github className='mr-2 h-5 w-5' />
                Star on GitHub
              </a>
            </Button>
            <Button size='lg' variant='outline' asChild>
              <a href='/docs' title='Complete Betterlytics Documentation'>
                View Documentation
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
