import betterlytics from '@betterlytics/tracker';

export function baEvent(eventName: string, eventProps?: object) {
  betterlytics.event(eventName, eventProps);
}
