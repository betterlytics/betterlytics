import { cn } from '@/lib/utils';

export function accentForeground(accentHex: string): string {
  const channel = (offset: number) => {
    const c = parseInt(accentHex.slice(offset, offset + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return luminance > 0.45 ? '#16181c' : '#ffffff';
}

type StatusPageBrandAvatarProps = {
  name: string;
  /** Owner-provided brand image (logo or favicon); falls back to a monogram when null. */
  imageUrl: string | null;
  accentColor: string;
  /** Favicons are square (cover); logos are "wordmarks" (contain). */
  imageFit?: 'cover' | 'contain';
  className?: string;
};

export function StatusPageBrandAvatar({
  name,
  imageUrl,
  accentColor,
  imageFit = 'contain',
  className,
}: StatusPageBrandAvatarProps) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- owner-provided image (arbitrary origin / data URI), not optimizable via next/image
      <img
        src={imageUrl}
        alt=''
        className={cn('flex-none', imageFit === 'cover' ? 'object-cover' : 'object-contain', className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn('flex flex-none items-center justify-center font-extrabold', className)}
      style={{ backgroundColor: accentColor, color: accentForeground(accentColor) }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
