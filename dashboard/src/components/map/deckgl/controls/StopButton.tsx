'use client';
import { Button } from '@/components/ui/button';

//! TODO: Rewrite to icon component
export function StopButton({ onStop }: { onStop: () => void }) {
  return (
    <Button size='sm' variant='secondary' onClick={onStop}>
      Stop
    </Button>
  );
}
