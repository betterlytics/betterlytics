'use client';

import { useEffect } from 'react';
import { useTheme } from '@wrksz/themes/client';
import { Theme } from '@prisma/client';

interface UserThemeInitializerProps {
  theme: Theme | undefined;
}

export default function UserThemeInitializer({ theme: userTheme }: UserThemeInitializerProps) {
  const { setTheme } = useTheme();

  useEffect(() => {
    if (userTheme) {
      setTheme(userTheme);
    }
  }, []);

  return null;
}
