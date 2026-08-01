import betterlytics, { type GlobalProperties } from '@betterlytics/tracker';

export function baEvent(eventName: string, eventProps?: object) {
  betterlytics.event(eventName, eventProps);
}

export function baSetGlobalProperties(props: GlobalProperties) {
  betterlytics.setGlobalProperties(props);
}
