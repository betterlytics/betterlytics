import { ComparisonLocaleContent } from '../..';
import { googleAnalytics } from './google-analytics';
import { matomo } from './matomo';
import { posthog } from './posthog';
import { plausible } from './plausible';
import { fathom } from './fathom-analytics';
import { umami } from './umami';

export const da: Record<string, ComparisonLocaleContent> = {
  'google-analytics': googleAnalytics,
  matomo,
  umami,
  posthog,
  plausible,
  'fathom-analytics': fathom,
};
