import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockJson, mockQuery, mockCreateClient } = vi.hoisted(() => {
  const mockJson = vi.fn();
  const mockQuery = vi.fn().mockResolvedValue({ json: mockJson });
  const mockCreateClient = vi.fn().mockReturnValue({ query: mockQuery });
  return { mockJson, mockQuery, mockCreateClient };
});

vi.mock('@clickhouse/client', () => ({
  createClient: mockCreateClient,
}));

vi.mock('./env', () => ({
  env: {
    CLICKHOUSE_URL: 'http://localhost:8123',
    CLICKHOUSE_DASHBOARD_USER: 'default',
    CLICKHOUSE_DASHBOARD_PASSWORD: '',
    ENABLE_MONITORING: false,
  },
}));

vi.mock('@/observability/clickhouse-instrumented', () => ({
  instrumentClickHouse: (client: unknown) => client,
}));

import { createClickHouseAdapter } from './clickhouse';

describe('ClickHouse adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockJson.mockResolvedValue([{ count: 1 }]);
  });

  it('maps query(sql, { params }) to new client query()', async () => {
    const adapter = createClickHouseAdapter({
      url: 'http://localhost:8123',
      username: 'user',
      password: 'pass',
    });

    const result = await adapter
      .query('SELECT count() FROM events WHERE site_id = {site_id:String}', {
        params: { site_id: 'abc123' },
      })
      .toPromise();

    expect(mockQuery).toHaveBeenCalledWith({
      query: 'SELECT count() FROM events WHERE site_id = {site_id:String}',
      query_params: { site_id: 'abc123' },
      format: 'JSONEachRow',
    });
    expect(result).toEqual([{ count: 1 }]);
  });

  it('forwards explicit format parameter', async () => {
    const adapter = createClickHouseAdapter({
      url: 'http://localhost:8123',
      username: 'user',
      password: 'pass',
    });

    await adapter
      .query('SELECT 1', {
        params: {},
        format: 'JSONEachRow',
      })
      .toPromise();

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'JSONEachRow' }),
    );
  });

  it('defaults to JSONEachRow format and empty params when none provided', async () => {
    const adapter = createClickHouseAdapter({
      url: 'http://localhost:8123',
      username: 'user',
      password: 'pass',
    });

    await adapter.query('SELECT 1').toPromise();

    expect(mockQuery).toHaveBeenCalledWith({
      query: 'SELECT 1',
      query_params: {},
      format: 'JSONEachRow',
    });
  });

  it('propagates errors from the new client', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

    const adapter = createClickHouseAdapter({
      url: 'http://localhost:8123',
      username: 'user',
      password: 'pass',
    });

    await expect(adapter.query('SELECT 1').toPromise()).rejects.toThrow('Connection refused');
  });

  it('propagates errors from resultSet.json()', async () => {
    mockJson.mockRejectedValueOnce(new Error('Malformed response'));

    const adapter = createClickHouseAdapter({
      url: 'http://localhost:8123',
      username: 'user',
      password: 'pass',
    });

    await expect(
      adapter.query('SELECT 1', { params: {}, format: 'JSONEachRow' }).toPromise(),
    ).rejects.toThrow('Malformed response');
  });
});
