'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Theme } from '@prisma/client';

interface UserThemeInitializerProps {
  theme: Theme | undefined;
}

export default function UserThemeInitializer({ theme: userTheme }: UserThemeInitializerProps) {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (userTheme) {
      setTheme(userTheme);
    }
  }, []);

  return null;
}
