export function DashboardsGridSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
      {[...Array(3)].map((_, i) => (
        <div key={i} className='bg-card h-[156px] animate-pulse rounded-xl border p-6'>
          <div className='flex items-start justify-between pb-4'>
            <div className='flex items-center gap-3'>
              <div className='bg-muted h-10 w-10 rounded-md' />
              <div className='space-y-2'>
                <div className='bg-muted h-5 w-32 rounded' />
                <div className='bg-muted h-4 w-24 rounded' />
              </div>
            </div>
          </div>
          <div className='flex items-center gap-3 pt-0'>
            <div className='bg-muted h-3 w-3 rounded' />
            <div className='bg-muted h-3 w-40 rounded' />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyDashboardsStateSkeleton() {
  return (
    <div className='py-16 text-center'>
      <div className='mx-auto max-w-md'>
        <div className='bg-muted mx-auto mb-2 h-6 w-48 animate-pulse rounded' />
        <div className='bg-muted mx-auto mb-6 h-4 w-64 animate-pulse rounded' />
        <div className='bg-muted mx-auto h-10 w-36 animate-pulse rounded' />
      </div>
    </div>
  );
}
