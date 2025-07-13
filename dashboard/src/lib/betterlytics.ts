export const betterlytics = (window &&
  (window as unknown as { betterlytics: { event: (eventName: string, customProps?: object) => void } })
    .betterlytics) ?? { event: () => {} };
