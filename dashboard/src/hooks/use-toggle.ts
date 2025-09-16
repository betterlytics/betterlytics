import { useCallback, useState } from 'react';

export function useToggle(initialValue?: boolean) {
  const [isOn, set] = useState(initialValue ?? false);

  const toggle = useCallback(() => set((prev) => !prev), []);
  const setOn = useCallback(() => set(() => true), []);
  const setOff = useCallback(() => set(() => false), []);

  return { isOn, toggle, setOn, setOff, set };
}
