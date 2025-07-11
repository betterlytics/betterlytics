import { AvatarImage } from '@/components/ui/avatar';
import { UseGravatarUrlProps, useGravatarUrl } from '@/hooks/use-gravatar-url';

export type GravatarImageProps = {
  email?: string;
} & UseGravatarUrlProps &
  React.ComponentProps<typeof AvatarImage>;

export function GravatarImage({ email, alt, ...props }: GravatarImageProps) {
  const src = useGravatarUrl(email, props);
  return <AvatarImage src={src} alt={alt} {...props} />;
}
