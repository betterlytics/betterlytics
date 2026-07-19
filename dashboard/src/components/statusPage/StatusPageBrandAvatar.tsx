import { cn } from '@/lib/utils';
import { accentForeground } from '@/utils/colorUtils';

type StatusPageBrandAvatarProps = {
  name: string;
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
