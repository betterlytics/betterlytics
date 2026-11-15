'server-only';

import { getTranslations } from 'next-intl/server';
import { MonitoringCapabilities } from '../capabilities';
import { CapabilityValidator, LazyValue, TranslationFn } from './base.validator';

class MonitoringCapabilityValidator extends CapabilityValidator {
  constructor(
    private readonly caps: MonitoringCapabilities,
    t: TranslationFn,
  ) {
    super(t);
  }

  monitorLimit(currentCount: LazyValue<number>): this {
    this.addCheck(
      async () => {
        const count = await this.resolveLazy(currentCount);
        return count < this.caps.maxMonitors;
      },
      this.upgradeMessage('capabilities.monitorLimit', (c) => c.monitoring.maxMonitors > this.caps.maxMonitors),
    );
    return this;
  }

  minInterval(intervalSeconds: number): this {
    this.addCheck(
      intervalSeconds >= this.caps.minIntervalSeconds,
      this.upgradeMessage('capabilities.minInterval', (c) => c.monitoring.minIntervalSeconds <= intervalSeconds),
    );
    return this;
  }

  httpMethod(method: string | undefined): this {
    if (method !== undefined && method !== 'HEAD') {
      this.addCheck(
        this.caps.httpMethodConfigurable,
        this.upgradeMessage('capabilities.httpMethod', (c) => c.monitoring.httpMethodConfigurable),
      );
    }
    return this;
  }

  statusCodes(codes: (string | number)[] | undefined): this {
    if (codes !== undefined) {
      const isDefault = codes.length === 1 && codes[0] === '2xx';
      if (!isDefault) {
        this.addCheck(
          this.caps.customStatusCodes,
          this.upgradeMessage('capabilities.statusCodes', (c) => c.monitoring.customStatusCodes),
        );
      }
    }
    return this;
  }

  customHeaders(headers: { key: string; value: string }[] | null | undefined): this {
    if (headers != null) {
      const hasCustomHeaders = headers.some((h) => h.key.trim() !== '' || h.value.trim() !== '');
      if (hasCustomHeaders) {
        this.addCheck(
          this.caps.customHeaders,
          this.upgradeMessage('capabilities.customHeaders', (c) => c.monitoring.customHeaders),
        );
      }
    }
    return this;
  }

  expectedKeyword(keyword: string | null | undefined, httpMethod: string | undefined): this {
    if (keyword != null && keyword.trim() !== '' && httpMethod === 'GET') {
      this.addCheck(
        this.caps.keywordValidation,
        this.upgradeMessage('capabilities.keywordValidation', (c) => c.monitoring.keywordValidation),
      );
    }
    return this;
  }
}

export async function monitoringValidator(caps: MonitoringCapabilities): Promise<MonitoringCapabilityValidator> {
  const t = await getTranslations('validation');
  return new MonitoringCapabilityValidator(caps, t);
}
