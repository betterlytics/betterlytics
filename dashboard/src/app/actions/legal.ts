'use server';

import { withUserAuth } from '@/auth/auth-actions';
import { acceptUserTerms } from '@/services/auth/user.service';
import { CURRENT_TERMS_VERSION } from '@/constants/legal';
import type { User } from 'next-auth';

export const acceptTermsAction = withUserAuth(async (user: User): Promise<{ success: true }> => {
  await acceptUserTerms(user.id, CURRENT_TERMS_VERSION);
  return { success: true };
});
