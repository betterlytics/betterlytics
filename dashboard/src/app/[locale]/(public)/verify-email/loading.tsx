import Logo from '@/components/logo';

function AnimatedVerifyingIcon() {
  return (
    <div className='relative mx-auto mb-4 h-16 w-16'>
      <div className='bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-xl' />

      <svg className='relative h-16 w-16 animate-spin' viewBox='0 0 52 52' fill='none'>
        <circle
          cx='26'
          cy='26'
          r='23'
          stroke='currentColor'
          strokeWidth='2'
          fill='none'
          strokeLinecap='round'
          strokeDasharray='80 60'
          style={{ color: 'hsl(var(--primary))' }}
        />
      </svg>
    </div>
  );
}

function AnimatedBorderCard({ children }: { children: React.ReactNode }) {
  return (
    <div className='relative overflow-hidden rounded-xl p-[2px]'>
      <div
        className='absolute inset-0 animate-spin'
        style={{
          background:
            'conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.1), hsl(var(--primary)))',
          animationDuration: '3s',
        }}
      />

      <div className='bg-background relative rounded-[10px] p-6'>{children}</div>
    </div>
  );
}

export default function VerifyEmailLoading() {
  return (
    <div className='bg-background flex min-h-[60vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        <div className='text-center'>
          <div className='mb-8 flex justify-center'>
            <Logo variant='full' width={200} height={60} priority />
          </div>

          <AnimatedBorderCard>
            <AnimatedVerifyingIcon />

            <h2 className='text-foreground mb-2 text-2xl font-semibold'>Verifying...</h2>

            <p className='text-muted-foreground text-sm'>Please wait a moment</p>
          </AnimatedBorderCard>
        </div>
      </div>
    </div>
  );
}
