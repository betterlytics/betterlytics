import { useMemo } from 'react';

export default function useIsChanged<T extends Record<string, any>>(
  currentData: T | null | undefined,
  originalData: T | null | undefined,
): boolean {
  return useMemo(() => {
    if (!originalData || !currentData) {
      return false;
    }

    const keys = Object.keys(currentData) as (keyof T)[];
    return keys.some((key) => currentData[key] !== originalData[key]);
  }, [currentData, originalData]);
}
