'use server';

import { withUserAuth } from '@/auth/auth-actions';
import { setChangelogVersionSeen } from '@/repositories/postgres/user';
import { WhatsNewVersionSchema } from '@/entities/whats-new';

export const markWhatsNewSeenAction = withUserAuth(async (user, version: unknown) => {
  const normalizedVersion = WhatsNewVersionSchema.parse(version);
  const alreadySeenVersion = user.changelogVersionSeen ?? 'v0';

  if (normalizedVersion === alreadySeenVersion) {
    return;
  }

  await setChangelogVersionSeen(user.id, normalizedVersion);
});
