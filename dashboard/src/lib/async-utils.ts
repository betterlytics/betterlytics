export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  interval: number,
  options: { leading?: boolean; trailing?: boolean } = { leading: true, trailing: true },
) {
  let lastTime = 0;
  let timeout: number | undefined;
  let lastArgs: Parameters<T> | null = null;

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();

    if (!lastTime && options.leading === false) {
      lastTime = now;
    }

    const remaining = interval - (now - lastTime);
    lastArgs = args;

    if (remaining <= 0 || remaining > interval) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }
      lastTime = now;
      fn(...args);
      lastArgs = null;
    } else if (!timeout && options.trailing !== false) {
      timeout = window.setTimeout(() => {
        lastTime = options.leading === false ? 0 : Date.now();
        timeout = undefined;
        if (lastArgs) {
          fn(...(lastArgs as Parameters<T>));
          lastArgs = null;
        }
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timeout) clearTimeout(timeout);
    timeout = undefined;
    lastArgs = null;
    lastTime = 0;
  };

  return throttled as T & { cancel: () => void };
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timeout: number | undefined;
  const debounced = (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = window.setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => timeout && clearTimeout(timeout);
  return debounced as T & { cancel: () => void };
}
