'server-only';

import { getTranslations } from 'next-intl/server';
import { MonitoringCapabilities } from '../capabilities';
import { CapabilityValidator, LazyValue, TranslationFn } from './base.validator';

class MonitoringCapabilityValidator extends CapabilityValidator {
  constructor(
    private readonly caps: MonitoringCapabilities,
    private readonly t: TranslationFn,
  ) {
    super();
  }

  monitorLimit(currentCount: LazyValue<number>): this {
    this.addCheck(async () => {
      const count = await this.resolveLazy(currentCount);
      return count < this.caps.maxMonitors;
    }, this.t('capabilities.monitorLimit'));
    return this;
  }

  minInterval(intervalSeconds: number): this {
    this.addCheck(intervalSeconds >= this.caps.minIntervalSeconds, this.t('capabilities.minInterval'));
    return this;
  }

  httpMethod(method: string | undefined): this {
    if (method !== undefined && method !== 'HEAD') {
      this.addCheck(this.caps.httpMethodConfigurable, this.t('capabilities.httpMethod'));
    }
    return this;
  }

  statusCodes(codes: (string | number)[] | undefined): this {
    if (codes !== undefined) {
      const isDefault = codes.length === 1 && codes[0] === '2xx';
      if (!isDefault) {
        this.addCheck(this.caps.customStatusCodes, this.t('capabilities.statusCodes'));
      }
    }
    return this;
  }

  customHeaders(headers: { key: string; value: string }[] | null | undefined): this {
    if (headers != null) {
      const hasCustomHeaders = headers.some((h) => h.key.trim() !== '' || h.value.trim() !== '');
      if (hasCustomHeaders) {
        this.addCheck(this.caps.customHeaders, this.t('capabilities.customHeaders'));
      }
    }
    return this;
  }
}

export async function monitoringValidator(caps: MonitoringCapabilities): Promise<MonitoringCapabilityValidator> {
  const t = await getTranslations('validation');
  return new MonitoringCapabilityValidator(caps, t);
}
