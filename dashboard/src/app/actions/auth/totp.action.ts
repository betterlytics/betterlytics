'use server';

import { withUserAuth } from '@/auth/auth-actions';
import * as TotpService from '@/services/auth/totp.service';
import type { User } from '@/entities/auth/session.entities';

export const setupTotpAction = withUserAuth(async (user: User): Promise<string> => {
  return await TotpService.setupTotp(user.id);
});

export const enableTotpAction = withUserAuth(async (user: User, totp: string): Promise<void> => {
  return await TotpService.enableTotp(user.id, totp);
});

export const disableTotpAction = withUserAuth(async (user: User, totp: string): Promise<void> => {
  return await TotpService.disableTotp(user.id, totp);
});
