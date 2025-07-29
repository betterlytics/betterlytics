export function lazyCache<T>(fn: () => T): () => T {
  let instance: T | undefined;
  return () => {
    if (instance === undefined) {
      instance = fn();
    }
    return instance;
  };
}

export function lazyAsyncCache<T>(fn: () => Promise<T>): () => Promise<T> {
  let instance: Promise<T> | undefined;
  return () => {
    if (instance === undefined) {
      instance = fn();
    }
    return instance;
  };
}

export function lazyProxyCache<T extends object>(factory: () => T): T {
  let instance: T | null = null;
  return new Proxy(
    {},
    {
      get(_, prop) {
        if (!instance) {
          instance = factory();
        }
        return Reflect.get(instance, prop as keyof T);
      },
    },
  ) as T;
}
