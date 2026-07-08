import { type ReactNode } from 'react';

/** Section heading + description sit outside a lighter bordered box (Betterlytics settings pattern). */
export function Section({
  title,
  description,
  aside,
  children,
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className='mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h2 className='font-semibold'>{title}</h2>
          {description && <p className='text-muted-foreground mt-1 text-sm'>{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
