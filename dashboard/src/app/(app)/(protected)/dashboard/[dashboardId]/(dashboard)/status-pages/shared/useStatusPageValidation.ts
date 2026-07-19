'use client';

import { useTranslations } from 'next-intl';
import { type SlugStatus } from './constants';
import { type StatusPageFormState } from './useStatusPageFormState';

type StatusPageValidationOptions = {
  monitorsMessage?: string;
};

/**
 * Single source for the status-page form's validation predicates
 */
export function useStatusPageValidation(
  form: Pick<StatusPageFormState, 'includedCount' | 'isNameEmpty' | 'isHomepageUrlValid' | 'isCustomDomainValid'>,
  slugStatus: SlugStatus,
  { monitorsMessage }: StatusPageValidationOptions = {},
) {
  const t = useTranslations('statusPagesPage.editor');

  const noMonitors = form.includedCount === 0;
  const slugBlocked = slugStatus === 'taken' || slugStatus === 'invalid';
  const slugNotSaveable = slugStatus === 'checking' || slugBlocked;
  const pageInvalid =
    noMonitors || form.isNameEmpty || slugNotSaveable || !form.isHomepageUrlValid || !form.isCustomDomainValid;

  const tabIssues = {
    monitors: noMonitors,
    branding: form.isNameEmpty || !form.isHomepageUrlValid,
    publish: slugBlocked || !form.isCustomDomainValid,
  };

  // First failure, in the order the studio tabs present the fields.
  const firstBlockedReason = (): string | null => {
    if (noMonitors) return monitorsMessage ?? t('minMonitorsHint');
    if (form.isNameEmpty) return t('nameRequired');
    if (slugNotSaveable) return t(`slugStatus.${slugStatus}`);
    if (!form.isHomepageUrlValid) return t('homepageUrlInvalid');
    if (!form.isCustomDomainValid) return t('customDomainInvalid');
    return null;
  };

  return { noMonitors, slugBlocked, slugNotSaveable, pageInvalid, tabIssues, blockedReason: firstBlockedReason() };
}
