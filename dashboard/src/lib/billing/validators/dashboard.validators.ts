'server-only';

import { getTranslations } from 'next-intl/server';
import { DashboardCapabilities } from '../capabilities';
import { CapabilityValidator, LazyValue, TranslationFn } from './base.validator';

class DashboardCapabilityValidator extends CapabilityValidator {
  constructor(
    private readonly caps: DashboardCapabilities,
    private readonly t: TranslationFn,
  ) {
    super();
  }

  dashboardLimit(currentCount: LazyValue<number>): this {
    this.addCheck(async () => {
      const count = await this.resolveLazy(currentCount);
      return count < this.caps.maxDashboards;
    }, this.t('capabilities.dashboardLimit'));
    return this;
  }
}

export async function dashboardValidator(caps: DashboardCapabilities): Promise<DashboardCapabilityValidator> {
  const t = await getTranslations('validation');
  return new DashboardCapabilityValidator(caps, t);
}
