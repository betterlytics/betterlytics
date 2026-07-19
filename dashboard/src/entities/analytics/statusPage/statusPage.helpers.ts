import { safeHostname } from '@/utils/domainValidation';
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

type StatusPageUrlParts = { slug: string; customDomain?: string | null };

export function statusPagePublicUrl(page: StatusPageUrlParts, publicBaseUrl: string): string {
  return page.customDomain ? `https://${page.customDomain}` : `${publicBaseUrl}/status/${page.slug}`;
}

export function statusPagePublicUrlLabel(page: StatusPageUrlParts): string {
  return page.customDomain ?? `/status/${page.slug}`;
}

export function defaultPublicMonitorName(monitor: { name?: string | null; url: string }): string {
  return monitorRowLabel(monitor).slice(0, STATUS_PAGE_LIMITS.PUBLIC_NAME_MAX);
}

export function monitorRowLabel(monitor: { name?: string | null; url: string }): string {
  return (monitor.name || '').trim() || safeHostname(monitor.url);
}
