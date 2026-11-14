'server-only';

import { getTranslations } from 'next-intl/server';
import { StatusPagesCapabilities } from '../capabilities';
import { CapabilityValidator, LazyValue, TranslationFn } from './base.validator';

class StatusPageCapabilityValidator extends CapabilityValidator {
  constructor(
    private readonly caps: StatusPagesCapabilities,
    t: TranslationFn,
  ) {
    super(t);
  }

  statusPageLimit(currentCount: LazyValue<number>): this {
    this.addCheck(
      async () => {
        const count = await this.resolveLazy(currentCount);
        return count < this.caps.maxStatusPages;
      },
      this.upgradeMessage(
        'capabilities.statusPageLimit',
        (c) => c.statusPages.maxStatusPages > this.caps.maxStatusPages,
      ),
    );
    return this;
  }

  customDomain(value: string | null | undefined): this {
    if (value != null && value.trim() !== '') {
      this.addCheck(
        this.caps.customDomain,
        this.upgradeMessage('capabilities.statusPageCustomDomain', (c) => c.statusPages.customDomain),
      );
    }
    return this;
  }

  removeBranding(hideBranding: boolean | undefined): this {
    if (hideBranding === true) {
      this.addCheck(
        this.caps.removeBranding,
        this.upgradeMessage('capabilities.statusPageBranding', (c) => c.statusPages.removeBranding),
      );
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
