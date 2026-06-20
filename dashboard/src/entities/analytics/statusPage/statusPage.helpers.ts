import {
  STATUS_PAGE_LIMITS,
  StatusPageCustomDomainSchema,
  StatusPageHomepageUrlSchema,
} from './statusPage.entities';

export function isValidHomepageUrl(value: string): boolean {
  return value.trim() === '' || StatusPageHomepageUrlSchema.safeParse(value).success;
}

export function isValidCustomDomain(value: string): boolean {
  return value.trim() === '' || StatusPageCustomDomainSchema.safeParse(value).success;
}

/** Default public label for a monitor: its name, or the URL hostname when unnamed. */
export function defaultPublicMonitorName(monitor: { name?: string | null; url: string }): string {
  return (monitor.name ?? new URL(monitor.url).hostname).slice(0, STATUS_PAGE_LIMITS.PUBLIC_NAME_MAX);
}

/**
 * Admin-facing label for a monitor in the dashboard's own lists (selection / reorder rows): its
 * name, or the raw URL when unnamed so owners can tell rows apart.
 */
export function monitorRowLabel(monitor: { name?: string | null; url: string }): string {
  return monitor.name ?? monitor.url;
}
