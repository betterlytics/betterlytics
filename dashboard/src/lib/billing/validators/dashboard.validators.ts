'server-only';

import { getTranslations } from 'next-intl/server';
import { DashboardCapabilities } from '../capabilities';
import { CapabilityValidator, LazyValue, TranslationFn } from './base.validator';

class DashboardCapabilityValidator extends CapabilityValidator {
  constructor(
    private readonly caps: DashboardCapabilities,
    t: TranslationFn,
  ) {
    super(t);
  }

  dashboardLimit(currentCount: LazyValue<number>): this {
    this.addCheck(
      async () => {
        const count = await this.resolveLazy(currentCount);
        return count < this.caps.maxDashboards;
      },
      this.upgradeMessage('capabilities.dashboardLimit', (c) => c.dashboards.maxDashboards > this.caps.maxDashboards),
    );
    return this;
  }
}

export async function dashboardValidator(caps: DashboardCapabilities): Promise<DashboardCapabilityValidator> {
  const t = await getTranslations('validation');
  return new DashboardCapabilityValidator(caps, t);
}
