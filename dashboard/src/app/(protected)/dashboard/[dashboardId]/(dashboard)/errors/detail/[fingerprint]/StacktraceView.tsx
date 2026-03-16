'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { StackFrame } from '@/entities/analytics/errors.entities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const INITIAL_FRAMES = 3;

type StacktraceViewProps = {
  errorType: string;
  errorMessage: string;
  frames: StackFrame[];
  mechanism?: string;
};

export function StacktraceView({ errorType, errorMessage, frames, mechanism }: StacktraceViewProps) {
  const [expanded, setExpanded] = useState(false);

  const visibleFrames = expanded ? frames : frames.slice(0, INITIAL_FRAMES);
  const hiddenCount = frames.length - INITIAL_FRAMES;

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <p className='text-sm font-medium'>Stacktrace</p>
        <div className='flex items-center gap-2'>
          {mechanism && (
            <Badge variant='secondary' className='border-border border text-xs font-normal shadow-xs'>
              {mechanism}
            </Badge>
          )}
          <Badge variant='secondary' className='border-border border text-xs font-normal tabular-nums shadow-xs'>
            {frames.length} {frames.length === 1 ? 'frame' : 'frames'}
          </Badge>
        </div>
      </div>

      <div className='border-border overflow-hidden rounded-lg border font-mono text-xs'>
        <div className='border-border bg-destructive/10 border-b px-4 py-2.5'>
          <span className='text-destructive font-semibold'>{errorType}</span>
          <span className='text-destructive/70 ml-2'>{errorMessage}</span>
        </div>

        {visibleFrames.map((frame, i) => (
          <StackFrameRow key={i} frame={frame} />
        ))}
      </div>

      {hiddenCount > 0 && (
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setExpanded((v) => !v)}
          className='text-muted-foreground hover:text-foreground h-auto px-0 py-0 text-xs'
        >
          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          {expanded ? 'Show less' : `Show ${hiddenCount} more frames`}
        </Button>
      )}
    </div>
  );
}

function StackFrameRow({ frame }: { frame: StackFrame }) {
  const isCulprit = frame.inApp;
  return (
    <div
      className={`border-border flex items-center gap-3 border-b px-4 py-2 last:border-0 ${
        isCulprit ? 'bg-background' : 'bg-muted/30'
      }`}
    >
      <span className='text-muted-foreground/60 w-10 shrink-0 select-none text-right tabular-nums'>
        {frame.line ?? ''}
      </span>
      <span className='flex min-w-0 flex-1 items-center gap-2'>
        <span className='text-muted-foreground/60 shrink-0'>at</span>
        <span className={`shrink-0 font-semibold ${isCulprit ? 'text-foreground' : 'text-muted-foreground/50'}`}>
          {frame.fn}
        </span>
        <span className={`min-w-0 truncate ${isCulprit ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>
          ({frame.file}:{frame.col})
        </span>
      </span>
      {frame.inApp && (
        <span className='border-border text-muted-foreground shrink-0 rounded border px-1.5 py-0.5 text-[10px]'>
          in app
        </span>
      )}
    </div>
  );
}
