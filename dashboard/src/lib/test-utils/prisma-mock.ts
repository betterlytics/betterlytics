import { vi } from 'vitest';

/**
 * Creates a mock Prisma client for testing
 * This allows us to test database interactions without a real database
 */
export function createMockPrismaClient() {
  const mockSession = {
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  };

  const mockUser = {
    create: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  };

  const mockAccount = {
    create: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
  };

  return {
    session: mockSession,
    user: mockUser,
    account: mockAccount,
    $transaction: vi.fn((callback) => callback({
      session: mockSession,
      user: mockUser,
      account: mockAccount,
    })),
  };
}

export type MockPrismaClient = ReturnType<typeof createMockPrismaClient>;
