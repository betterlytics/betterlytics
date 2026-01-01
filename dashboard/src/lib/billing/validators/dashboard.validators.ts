'server-only';

import { getTranslations } from 'next-intl/server';
import { DashboardCapabilities } from '../capabilities';
import { CapabilityValidator, TranslationFn } from './base.validator';

class DashboardCapabilityValidator extends CapabilityValidator {
  constructor(
    private readonly caps: DashboardCapabilities,
    private readonly t: TranslationFn,
  ) {
    super();
  }

  dashboardLimit(currentCount: number): this {
    this.addCheck(currentCount < this.caps.maxDashboards, this.t('capabilities.dashboardLimit'));
    return this;
  }
}

export async function dashboardValidator(caps: DashboardCapabilities): Promise<DashboardCapabilityValidator> {
  const t = await getTranslations('validation');
  return new DashboardCapabilityValidator(caps, t);
}
