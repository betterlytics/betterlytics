'use server';

import { Dashboard } from '@/entities/dashboard/dashboard.entities';
import { withUserAuth } from '@/auth/auth-actions';
import { completeOnboardingAndCreateDashboard } from '@/services/dashboard/dashboard.service';
import { acceptUserTerms, setOnboardingCompleted } from '@/services/auth/user.service';
import { CURRENT_TERMS_VERSION } from '@/constants/legal';
import { UserException } from '@/lib/exceptions';
import type { User } from '@/entities/auth/session.entities';
import { getTranslations } from 'next-intl/server';
import { SupportedLanguages } from '@/constants/i18n';
import { env } from '@/lib/env';
import { getUserCapabilities } from '@/lib/billing/capabilityAccess';
import { dashboardValidator } from '@/lib/billing/validators';

export const completeOnboardingAndCreateDashboardAction = withUserAuth(
  async (
    user: User,
    payload: { domain: string; acceptTerms?: boolean; language: SupportedLanguages },
  ): Promise<Dashboard> => {
    const { domain, acceptTerms, language } = payload;

    const mustAcceptTerms = Boolean(!user.termsAcceptedAt) && env.IS_CLOUD;
    if (mustAcceptTerms && acceptTerms !== true) {
      const t = await getTranslations('validation');
      throw new UserException(t('termsOfServiceRequired'));
    }

    if (mustAcceptTerms && acceptTerms === true) {
      await acceptUserTerms(user.id, CURRENT_TERMS_VERSION);
    }

    const caps = await getUserCapabilities();
    const validator = await dashboardValidator(caps.dashboards);

    return completeOnboardingAndCreateDashboard(domain, user.id, language, (ownedCount) =>
      validator.dashboardLimit(ownedCount).validate(),
    );
  },
);

export const setOnboardingCompletedAction = withUserAuth(async (user: User): Promise<void> => {
  await setOnboardingCompleted(user.id);
});
