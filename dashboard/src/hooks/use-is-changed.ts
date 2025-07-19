import { useEffect, useState } from 'react';

export default function useIsChanged<T extends Record<string, any>>(
  currentData: T | null | undefined,
  originalData: T | null | undefined,
): boolean {
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    if (!originalData || !currentData) {
      setIsChanged(false);
      return;
    }

    const keys = Object.keys(currentData) as (keyof T)[];
    const changes = keys.some((key) => currentData[key] !== originalData[key]);
    setIsChanged(changes);
  }, [currentData, originalData]);

  return isChanged;
}
