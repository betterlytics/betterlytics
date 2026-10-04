window.betterlytics = window.betterlytics || {
  event: (...args: unknown[]) => {
    (window.betterlytics!.q = window.betterlytics!.q || []).push(args as unknown as IArguments);
  },
  setGlobalProperties: (...args: unknown[]) => {
    (window.betterlytics!.gq = window.betterlytics!.gq || []).push(args as unknown as IArguments);
  },
};
