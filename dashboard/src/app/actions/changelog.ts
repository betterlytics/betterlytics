'use server';

import { withUserAuth } from '@/auth/auth-actions';
import { setChangelogVersionSeen } from '@/repositories/postgres/user';
import { ChangelogVersionSchema } from '@/entities/changelog';

export const markChangelogSeenAction = withUserAuth(async (user, version: unknown) => {
  const normalizedVersion = ChangelogVersionSchema.parse(version);
  const alreadySeenVersion = user.changelogVersionSeen ?? 'v0';

  if (normalizedVersion === alreadySeenVersion) {
    return;
  }

  await setChangelogVersionSeen(user.id, normalizedVersion);
});
