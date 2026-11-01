'server-only';

import { getTranslations } from 'next-intl/server';
import { requireCapability } from '../capabilityAccess';
import type { PlanCapabilities } from '@/lib/billing/capabilities';
import { planThatUnlocks } from '@/lib/billing/catalog';

export type TranslationFn = Awaited<ReturnType<typeof getTranslations<'validation'>>>;

export type LazyValue<T> = T | (() => T | Promise<T>);

type UpgradeMessageKey =
  | 'capabilities.dashboardLimit'
  | 'capabilities.monitorLimit'
  | 'capabilities.minInterval'
  | 'capabilities.httpMethod'
  | 'capabilities.statusCodes'
  | 'capabilities.customHeaders'
  | 'capabilities.keywordValidation'
  | 'capabilities.statusPageLimit'
  | 'capabilities.statusPageCustomDomain'
  | 'capabilities.statusPageBranding';

async function resolveLazy<T>(value: LazyValue<T>): Promise<T> {
  return typeof value === 'function' ? await (value as () => T | Promise<T>)() : value;
}

type Check = {
  condition: LazyValue<boolean>;
  message: string;
};

export abstract class CapabilityValidator {
  protected checks: Check[] = [];

  protected resolveLazy = resolveLazy;

  protected constructor(protected readonly t: TranslationFn) {}

  protected addCheck(condition: LazyValue<boolean>, message: string): this {
    this.checks.push({ condition, message });
    return this;
  }

  /** Names the plan that passes `unlocks`, or says the limit is the highest we sell. */
  protected upgradeMessage(key: UpgradeMessageKey, unlocks: (capabilities: PlanCapabilities) => boolean): string {
    const plan = planThatUnlocks(unlocks);
    return plan ? this.t(key, { plan: plan.name }) : this.t('capabilities.limitReached');
  }

  async validate(): Promise<void> {
    for (const { condition, message } of this.checks) {
      const result = await resolveLazy(condition);
      requireCapability(result, message);
    }
  }
}
