import { cn } from '@/lib/utils';

type BrandHeaderProps = {
  name: string;
  logoUrl: string | null;
  homepageUrl: string | null;
  /** Deep band: extends behind the combined card's whole status hero so its edge cuts
      into the first monitor row. Off for pages without monitor rows, where that same
      depth would spill past the card and under the incidents section. */
  tall: boolean;
};

/** Brand band at the top of the page. Always the owner's accent color — incident
    state never bleeds into it, so the logo is never stranded on a warning color. */
export function BrandHeader({ name, logoUrl, homepageUrl, tall }: BrandHeaderProps) {
  const brand = logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- served from our image route, or a client-side blob preview in the editor; already a small resized WebP, so next/image adds nothing
    <img src={logoUrl} alt={name} className='h-16 w-auto max-w-[60cqw] object-contain @min-[640px]:max-w-xs' />
  ) : (
    <span className='truncate text-xl font-bold tracking-tight'>{name}</span>
  );

  return (
    <header style={{ backgroundColor: 'var(--sp-accent)', color: 'var(--sp-accent-foreground)' }}>
      <div
        className={cn(
          'mx-auto flex w-full max-w-3xl items-center px-4 pt-7 @min-[640px]:px-8',
          tall ? 'pb-64' : 'pb-16',
        )}
      >
        {homepageUrl ? (
          <a
            href={homepageUrl}
            className='min-w-0 rounded-sm transition-opacity outline-none hover:opacity-80 focus-visible:opacity-80'
          >
            {brand}
          </a>
        ) : (
          brand
        )}
      </div>
    </header>
  );
}
