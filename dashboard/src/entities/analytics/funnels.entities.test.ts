import { describe, it, expect } from 'vitest';
import { CreateFunnelSchema } from '@/entities/analytics/funnels.entities';

const DASHBOARD_ID = 'cjld2cyuq0000t3rmniod1foy';

type RawFilter = { column: string; operator: string; values: string[] };

function buildFunnel(steps: { name: string; filters: RawFilter[] }[]) {
  return { name: 'Signup', dashboardId: DASHBOARD_ID, isStrict: false, funnelSteps: steps };
}

function step(name: string, values: string[]): { name: string; filters: RawFilter[] } {
  return { name, filters: [{ column: 'url', operator: '=', values }] };
}

describe('CreateFunnelSchema empty-value handling', () => {
  it('rejects a step whose only filter has no values', () => {
    const result = CreateFunnelSchema.safeParse(buildFunnel([step('A', []), step('B', [])]));
    expect(result.success).toBe(false);
  });

  it('rejects a step whose only filter value is the empty string', () => {
    const result = CreateFunnelSchema.safeParse(buildFunnel([step('A', ['']), step('B', [''])]));
    expect(result.success).toBe(false);
  });

  it('strips empty values but keeps the real ones within a filter', () => {
    const result = CreateFunnelSchema.safeParse(buildFunnel([step('A', ['/a', '']), step('B', ['/b'])]));
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.funnelSteps[0].filters[0].values).toEqual(['/a']);
  });

  it('drops an empty filter when another filter in the same step is usable', () => {
    const result = CreateFunnelSchema.safeParse(
      buildFunnel([
        {
          name: 'A',
          filters: [
            { column: 'url', operator: '=', values: ['/a'] },
            { column: 'url', operator: '=', values: [] },
          ],
        },
        step('B', ['/b']),
      ]),
    );
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.funnelSteps[0].filters).toHaveLength(1);
  });

  it('preserves a whitespace-only value, which can be a real matchable data value', () => {
    const result = CreateFunnelSchema.safeParse(buildFunnel([step('A', [' ']), step('B', ['/b'])]));
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.funnelSteps[0].filters[0].values).toEqual([' ']);
  });
});
