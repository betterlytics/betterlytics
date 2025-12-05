'use server';

import { Dashboard } from '@/entities/dashboard';
import { withUserAuth } from '@/auth/auth-actions';
import { completeOnboardingAndCreateDashboard } from '@/services/dashboard/dashboard';
import { acceptUserTerms } from '@/services/auth/user.service';
import { CURRENT_TERMS_VERSION } from '@/constants/legal';
import { UserException } from '@/lib/exceptions';
import { User } from 'next-auth';
import { getTranslations } from 'next-intl/server';
import { SupportedLanguages } from '@/constants/i18n';

export const completeOnboardingAndCreateDashboardAction = withUserAuth(
  async (
    user: User,
    payload: { domain: string; acceptTerms?: boolean; language: SupportedLanguages },
  ): Promise<Dashboard> => {
    const { domain, acceptTerms, language } = payload;

    const mustAcceptTerms = Boolean(!user.termsAcceptedAt);
    if (mustAcceptTerms && acceptTerms !== true) {
      const t = await getTranslations('validation');
      throw new UserException(t('termsOfServiceRequired'));
    }

    if (mustAcceptTerms && acceptTerms === true) {
      await acceptUserTerms(user.id, CURRENT_TERMS_VERSION);
    }

    return completeOnboardingAndCreateDashboard(domain, user.id, language);
  },
);
