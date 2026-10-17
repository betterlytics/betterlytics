import { Card } from '@/components/ui/card';

function GhostBar({ className }: { className: string }) {
  return <div className={`bg-muted-foreground/15 rounded-full ${className}`} />;
}

export function MonitorDetailGhost() {
  return (
    <div className='space-y-4'>
      <div className='space-y-3 pt-1'>
        <GhostBar className='h-3 w-24' />
        <div className='flex items-center gap-3'>
          <GhostBar className='h-6 w-16' />
          <GhostBar className='h-6 w-40 sm:w-56' />
        </div>
      </div>
      <div className='grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-4'>
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className='border-border/40 bg-card/50 space-y-3 p-4'>
            <GhostBar className='h-2.5 w-20' />
            <GhostBar className='h-6 w-28' />
          </Card>
        ))}
      </div>
      <Card className='border-border/40 bg-card/50 space-y-3 p-4'>
        <GhostBar className='h-2.5 w-32' />
        <div className='flex gap-[2px]'>
          {Array.from({ length: 90 }, (_, i) => (
            <span
              key={i}
              className={`bg-muted-foreground/15 h-8 flex-1 rounded-[2px] ${i < 45 ? 'hidden sm:block' : ''}`}
            />
          ))}
        </div>
      </Card>
      <Card className='border-border/40 bg-card/50 space-y-3 p-4'>
        <GhostBar className='h-2.5 w-28' />
        <svg viewBox='0 0 400 80' className='h-40 w-full' preserveAspectRatio='none'>
          <polyline
            points='0,60 30,55 60,58 90,40 120,45 150,30 180,42 210,38 240,50 270,35 300,44 330,28 360,36 400,32'
            fill='none'
            className='stroke-muted-foreground/25'
            strokeWidth='2'
            vectorEffect='non-scaling-stroke'
          />
        </svg>
      </Card>
    </div>
  );
}
