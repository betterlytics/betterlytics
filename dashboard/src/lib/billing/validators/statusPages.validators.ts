'server-only';

import { getTranslations } from 'next-intl/server';
import { StatusPagesCapabilities } from '../capabilities';
import { CapabilityValidator, LazyValue, TranslationFn } from './base.validator';

class StatusPageCapabilityValidator extends CapabilityValidator {
  constructor(
    private readonly caps: StatusPagesCapabilities,
    private readonly t: TranslationFn,
  ) {
    super();
  }

  statusPageLimit(currentCount: LazyValue<number>): this {
    this.addCheck(async () => {
      const count = await this.resolveLazy(currentCount);
      return count < this.caps.maxStatusPages;
    }, this.t('capabilities.statusPageLimit'));
    return this;
  }

  customDomain(value: string | null | undefined): this {
    if (value != null && value.trim() !== '') {
      this.addCheck(this.caps.customDomain, this.t('capabilities.statusPageCustomDomain'));
    }
    return this;
  }

  removeBranding(hideBranding: boolean | undefined): this {
    if (hideBranding === true) {
      this.addCheck(this.caps.removeBranding, this.t('capabilities.statusPageBranding'));
    }
    return this;
  }
}

export async function statusPageValidator(
  caps: StatusPagesCapabilities,
): Promise<StatusPageCapabilityValidator> {
  const t = await getTranslations('validation');
  return new StatusPageCapabilityValidator(caps, t);
}
