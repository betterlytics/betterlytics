window.betterlytics = window.betterlytics || {
  event: (...args: unknown[]) => {
    (window.betterlytics!.q = window.betterlytics!.q || []).push(args as unknown as IArguments);
  },
};
