import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findInvitationByEmail } from '@/repositories/postgres/invitation.repository';

const prismaMock = vi.hoisted(() => ({
  dashboardInvitation: {
    findFirst: vi.fn(),
  },
}));

vi.mock('@/lib/postgres', () => ({
  default: prismaMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('findInvitationByEmail', () => {
  it('only matches pending invitations that have not expired', async () => {
    prismaMock.dashboardInvitation.findFirst.mockResolvedValue(null);

    await findInvitationByEmail('dash-1', 'Invitee@Example.com');

    expect(prismaMock.dashboardInvitation.findFirst).toHaveBeenCalledWith({
      where: {
        dashboardId: 'dash-1',
        email: 'invitee@example.com',
        status: 'pending',
        expiresAt: { gt: expect.any(Date) },
      },
    });
  });

  it('returns null when only an expired invitation exists', async () => {
    prismaMock.dashboardInvitation.findFirst.mockResolvedValue(null);

    expect(await findInvitationByEmail('dash-1', 'invitee@example.com')).toBeNull();
  });
});
