import { describe, expect, it } from 'vitest';
import { PlanIdSchema } from '@/entities/billing/billing.entities';

describe('PlanIdSchema', () => {
  it('reads a renamed plan id as its successor', () => {
    expect(PlanIdSchema.parse('professional')).toBe('business');
  });

  it('accepts current ids and rejects unknown ones', () => {
    expect(PlanIdSchema.parse('growth')).toBe('growth');
    expect(PlanIdSchema.safeParse('pro').success).toBe(false);
  });
});
