'use server';

import { withUserAuth } from '@/auth/auth-actions';
import { UserException } from '@/lib/exceptions';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getTelemetryStatus } from '@/services/system/telemetry.service';

export const getTelemetryStatusAction = withUserAuth(async (user) => {
  if (isFeatureEnabled('isCloud') || user.role !== 'admin') {
    throw new UserException('Only the instance admin can view telemetry settings');
  }
  return getTelemetryStatus();
});
