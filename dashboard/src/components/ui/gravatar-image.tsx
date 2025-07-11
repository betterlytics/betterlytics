import { AvatarImage } from '@/components/ui/avatar';
import { UseGravatarUrlProps, useGravatarUrl } from '@/hooks/use-gravatar-url';

export type GravatarImageProps = {
  email?: string;
  alt?: string;
} & UseGravatarUrlProps &
  React.ComponentProps<typeof AvatarImage>;

export function GravatarImage({ email, alt, ...useGravatarUrlProps }: GravatarImageProps) {
  const src = useGravatarUrl(email, useGravatarUrlProps);
  return <AvatarImage src={src} alt={alt} />;
}
