import { describe, it, expect, vi, beforeEach } from 'vitest';
import { revalidatePath, revalidateTag } from 'next/cache';
import { revalidateStatusPagePaths } from './status-page-revalidation';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const paths = () => vi.mocked(revalidatePath).mock.calls.map(([path]) => path);
const tags = () => vi.mocked(revalidateTag).mock.calls.map(([tag]) => tag);

describe('revalidateStatusPagePaths', () => {
  beforeEach(() => {
    vi.mocked(revalidatePath).mockClear();
    vi.mocked(revalidateTag).mockClear();
  });

  it('refreshes the slug and custom domain of a page', () => {
    revalidateStatusPagePaths('d1', { slug: 'acme', customDomain: 'status.acme.com' });

    expect(paths()).toEqual(['/dashboard/d1/status-pages', '/status/acme', '/status/domain/status.acme.com']);
    expect(tags()).toEqual(['status-page-domain:status.acme.com']);
  });

  it('refreshes the old domain and slug when they change', () => {
    revalidateStatusPagePaths(
      'd1',
      { slug: 'acme-new', customDomain: 'status.new.com' },
      { slug: 'acme', customDomain: 'status.old.com' },
    );

    expect(paths()).toEqual([
      '/dashboard/d1/status-pages',
      '/status/acme-new',
      '/status/domain/status.new.com',
      '/status/acme',
      '/status/domain/status.old.com',
    ]);
    expect(tags()).toEqual(['status-page-domain:status.new.com', 'status-page-domain:status.old.com']);
  });

  it('refreshes the old domain when the domain is cleared, once per path', () => {
    revalidateStatusPagePaths(
      'd1',
      { slug: 'acme', customDomain: null },
      { slug: 'acme', customDomain: 'status.acme.com' },
    );

    expect(paths()).toEqual(['/dashboard/d1/status-pages', '/status/acme', '/status/domain/status.acme.com']);
    expect(tags()).toEqual(['status-page-domain:status.acme.com']);
  });

  it('only refreshes the dashboard list when no page was found', () => {
    revalidateStatusPagePaths('d1', null, undefined);

    expect(paths()).toEqual(['/dashboard/d1/status-pages']);
    expect(tags()).toEqual([]);
  });
});
