'server-only';

import { acceptTermsForUser, findUserById } from '@/repositories/postgres/user.repository';
import { UserException } from '@/lib/exceptions';
import { getTranslations } from 'next-intl/server';
import { env } from '@/lib/env';

export async function acceptUserTerms(userId: string, version: number): Promise<void> {
  await acceptTermsForUser(userId, version);
}

export async function ensureTermsAccepted(userId: string): Promise<void> {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  const mustAcceptTerms = env.IS_CLOUD;
  const hasAcceptedTerms = Boolean(user.termsAcceptedAt);
  if (mustAcceptTerms && !hasAcceptedTerms) {
    const t = await getTranslations('validation');
    throw new UserException(t('termsOfServiceRequired'));
  }
}
