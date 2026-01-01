'server-only';

import { getTranslations } from 'next-intl/server';
import { requireCapability } from '../capabilityAccess';

export type TranslationFn = Awaited<ReturnType<typeof getTranslations<'validation'>>>;

export abstract class CapabilityValidator {
  protected checks: Array<{ condition: boolean; message: string }> = [];

  protected addCheck(condition: boolean, message: string): this {
    this.checks.push({ condition, message });
    return this;
  }

  validate(): void {
    for (const { condition, message } of this.checks) {
      requireCapability(condition, message);
    }
  }
}
