import { AvatarImage } from '@/components/ui/avatar';
import { getGravatarUrl, GetGravatarUrlProps } from '@/lib/gravatar';
import { useEffect, useState } from 'react';

export type GravatarImageProps = {
  email?: string;
  alt?: string;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
} & GetGravatarUrlProps;

export function GravatarImage({ email, alt, onError, size, defaultImage }: GravatarImageProps) {
  const [src, setSrc] = useState<string>();

  useEffect(() => {
    getGravatarUrl(email, { size, defaultImage }).then(setSrc);
  }, [email]);

  return <AvatarImage src={src} alt={alt} onError={onError} />;
}
