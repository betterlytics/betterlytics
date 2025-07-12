import { getGravatarUrl, GetGravatarUrlProps } from '@/lib/gravatar';
import { useEffect, useState } from 'react';

export type UseGravatarUrlProps = GetGravatarUrlProps;

export function useGravatarUrl(email?: string, props?: UseGravatarUrlProps) {
  const [src, setSrc] = useState<string>();

  useEffect(() => {
    getGravatarUrl(email, props).then(setSrc);
  }, [email, props]);

  return src;
}
