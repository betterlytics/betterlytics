'use client';
import { Button } from '@/components/ui/button';

//! TODO: Rewrite this to icon based component
export function PlayButton({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <Button size='sm' onClick={onToggle}>
      {playing ? 'Pause' : 'Play'}
    </Button>
  );
}
