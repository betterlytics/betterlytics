'server-only';

import { getTranslations } from 'next-intl/server';
import { requireCapability } from '../capabilityAccess';

export type TranslationFn = Awaited<ReturnType<typeof getTranslations<'validation'>>>;

export type LazyValue<T> = T | (() => T | Promise<T>);

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

  protected addCheck(condition: LazyValue<boolean>, message: string): this {
    this.checks.push({ condition, message });
    return this;
  }

  async validate(): Promise<void> {
    for (const { condition, message } of this.checks) {
      const result = await resolveLazy(condition);
      requireCapability(result, message);
    }
  }
}
