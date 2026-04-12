'use client';
import { Button } from '@/components/ui/button';

export function ThrowErrorsTest() {
  const consoleError = () => {
    console.error('This is a console error');
  };

  const throwString = () => {
    throw 'Thrown string';
  };

  const unhandledError = () => {
    throw new Error('Some unhandled error');
  };

  return (
    <div className='flex w-full gap-2'>
      <Button onClick={consoleError}>Console Error</Button>
      <Button onClick={throwString}>Throw String</Button>
      <Button onClick={unhandledError}>Unhandled Error</Button>
    </div>
  );
}
