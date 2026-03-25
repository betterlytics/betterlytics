'use client';

import { useEffect } from 'react';

export function ErrorTestScript() {
  useEffect(() => {
    function throwTestError() {
      setTimeout(() => {
        throw new Error('Test error from errors page');
      }, 0);
    }

    throwTestError();
    const interval = setInterval(throwTestError, 30000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
