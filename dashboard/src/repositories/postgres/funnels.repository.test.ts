import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createFunnel,
  getFunnelById,
  getFunnelsByDashboardId,
  updateFunnel,
} from '@/repositories/postgres/funnels.repository';

const prismaMock = vi.hoisted(() => ({
  funnel: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/postgres', () => ({
  default: prismaMock,
}));

const DASHBOARD_ID = 'cldashboard0000000000000';
const FUNNEL_ID = 'clfunnel00000000000000000';

function step(name: string) {
  return { name, filters: [{ column: 'url' as const, operator: '=' as const, values: [`/${name}`] }] };
}

function positionsOf(steps: { name: string; position: number }[]) {
  return steps.map(({ name, position }) => [name, position]);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createFunnel', () => {
  it('stores each step with its index in the submitted order', async () => {
    prismaMock.funnel.create.mockResolvedValue({ id: FUNNEL_ID });

    await createFunnel({
      name: 'Checkout',
      dashboardId: DASHBOARD_ID,
      isStrict: true,
      funnelSteps: [step('landing'), step('cart'), step('payment')],
    });

    const { create } = prismaMock.funnel.create.mock.calls[0][0].data.funnelSteps;
    expect(positionsOf(create)).toEqual([
      ['landing', 0],
      ['cart', 1],
      ['payment', 2],
    ]);
  });
});

describe('updateFunnel', () => {
  it('renumbers the positions when an edit reorders the steps', async () => {
    prismaMock.funnel.update.mockResolvedValue({ id: FUNNEL_ID });

    await updateFunnel(DASHBOARD_ID, {
      id: FUNNEL_ID,
      name: 'Checkout',
      dashboardId: DASHBOARD_ID,
      isStrict: true,
      funnelSteps: [step('cart'), step('landing'), step('payment')],
    });

    const { create } = prismaMock.funnel.update.mock.calls[0][0].data.funnelSteps;
    expect(positionsOf(create)).toEqual([
      ['cart', 0],
      ['landing', 1],
      ['payment', 2],
    ]);
  });
});

describe('reading funnels', () => {
  const orderedSteps = expect.objectContaining({ orderBy: { position: 'asc' } });

  it('asks for the steps of a single funnel in stored order', async () => {
    prismaMock.funnel.findFirst.mockResolvedValue({
      id: FUNNEL_ID,
      name: 'Checkout',
      dashboardId: DASHBOARD_ID,
      isStrict: true,
      funnelSteps: [],
    });

    await getFunnelById(DASHBOARD_ID, FUNNEL_ID);

    expect(prismaMock.funnel.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ include: { funnelSteps: orderedSteps } }),
    );
  });

  it('asks for the steps of every dashboard funnel in stored order', async () => {
    prismaMock.funnel.findMany.mockResolvedValue([]);

    await getFunnelsByDashboardId(DASHBOARD_ID);

    expect(prismaMock.funnel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ include: { funnelSteps: orderedSteps } }),
    );
  });
});
