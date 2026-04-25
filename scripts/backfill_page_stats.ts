/**
 * Backfill `analytics.page_stats` from `analytics.events`.
 *
 * Run AFTER `scripts/backfill_engagement_events.ts` completes — the MV's
 * scroll/duration values come from `engagement` rows, so historical scroll
 * and duration numbers depend on the engagement-event backfill landing first.
 *
 * Idempotency: re-inserting partial aggregates into an AggregatingMergeTree
 * is safe — ClickHouse merges them on the (site_id, hour, path, attrs) PK at
 * background-merge / read-time. Per-month state is persisted to
 * `.backfill-page-stats-state.json` so a Ctrl-C and restart skips months that
 * already completed.
 *
 * CLI:
 *   tsx scripts/backfill_page_stats.ts \
 *     [--start YYYYMM] [--end YYYYMM] [--force] [--dry-run] [--optimize]
 *
 * Flags:
 *   --force     ignore the state file and re-insert every month in range
 *   --dry-run   print the actions but do not run any INSERT
 *   --optimize  run `OPTIMIZE TABLE analytics.page_stats FINAL` after the
 *               last chunk (otherwise rely on background merges)
 *
 * Env (matches scripts/run-migration.js):
 *   CLICKHOUSE_URL, CLICKHOUSE_DB, CLICKHOUSE_USER, CLICKHOUSE_PASSWORD
 */

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config();
}

import { createClient, type ClickHouseClient } from '@clickhouse/client';
import * as fs from 'node:fs';
import * as path from 'node:path';

const STATE_FILE = path.resolve(process.cwd(), '.backfill-page-stats-state.json');

interface State {
  startedAt: string;
  completedMonths: string[]; // YYYYMM strings
  lastChunk?: {
    yyyymm: string;
    durationMs: number;
    rowsInsertedBefore: number | null;
    rowsInsertedAfter: number | null;
  };
}

interface Args {
  startYYYYMM: string | null;
  endYYYYMM: string | null;
  force: boolean;
  dryRun: boolean;
  optimize: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    startYYYYMM: null,
    endYYYYMM: null,
    force: false,
    dryRun: false,
    optimize: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--start') args.startYYYYMM = argv[++i];
    else if (a === '--end') args.endYYYYMM = argv[++i];
    else if (a === '--force') args.force = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--optimize') args.optimize = true;
    else if (a === '--help' || a === '-h') {
      console.log(
        'Usage: tsx scripts/backfill_page_stats.ts [--start YYYYMM] [--end YYYYMM] [--force] [--dry-run] [--optimize]',
      );
      process.exit(0);
    }
  }
  if (args.startYYYYMM && !/^\d{6}$/.test(args.startYYYYMM)) {
    throw new Error(`--start must be YYYYMM, got "${args.startYYYYMM}"`);
  }
  if (args.endYYYYMM && !/^\d{6}$/.test(args.endYYYYMM)) {
    throw new Error(`--end must be YYYYMM, got "${args.endYYYYMM}"`);
  }
  return args;
}

function loadState(): State {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      startedAt: parsed.startedAt ?? new Date().toISOString(),
      completedMonths: Array.isArray(parsed.completedMonths) ? parsed.completedMonths : [],
      lastChunk: parsed.lastChunk,
    };
  } catch {
    return { startedAt: new Date().toISOString(), completedMonths: [] };
  }
}

function saveState(state: State): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function buildClient(): ClickHouseClient {
  const url = process.env.CLICKHOUSE_URL;
  const username = process.env.CLICKHOUSE_USER;
  const password = process.env.CLICKHOUSE_PASSWORD;
  const database = process.env.CLICKHOUSE_DB;
  if (!url || !database) {
    throw new Error('CLICKHOUSE_URL and CLICKHOUSE_DB must be set');
  }
  return createClient({
    url,
    username,
    password,
    database,
    request_timeout: 0,
    clickhouse_settings: {
      max_execution_time: 0,
      send_progress_in_http_headers: 1,
      http_headers_progress_interval_ms: 30000,
    },
  });
}

async function detectRange(client: ClickHouseClient): Promise<{ start: string; end: string } | null> {
  const rs = await client.query({
    query:
      "SELECT toString(toYYYYMM(min(timestamp))) AS minM, toString(toYYYYMM(max(timestamp))) AS maxM FROM analytics.events WHERE event_type IN ('pageview', 'engagement')",
    format: 'JSONEachRow',
  });
  const rows = (await rs.json()) as Array<{ minM: string; maxM: string }>;
  if (rows.length === 0) return null;
  const { minM, maxM } = rows[0];
  if (!minM || !maxM || minM === '0' || maxM === '0') return null;
  return { start: minM, end: maxM };
}

function* iterateMonths(startYYYYMM: string, endYYYYMM: string): Generator<string> {
  let y = Number(startYYYYMM.slice(0, 4));
  let m = Number(startYYYYMM.slice(4, 6));
  const endY = Number(endYYYYMM.slice(0, 4));
  const endM = Number(endYYYYMM.slice(4, 6));
  while (y < endY || (y === endY && m <= endM)) {
    yield `${y.toString().padStart(4, '0')}${m.toString().padStart(2, '0')}`;
    m++;
    if (m === 13) {
      m = 1;
      y++;
    }
  }
}

function monthBounds(yyyymm: string): { chunkStart: string; chunkEnd: string } {
  const y = Number(yyyymm.slice(0, 4));
  const m = Number(yyyymm.slice(4, 6));
  const chunkStart = `${y}-${m.toString().padStart(2, '0')}-01 00:00:00`;
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  const chunkEnd = `${ny}-${nm.toString().padStart(2, '0')}-01 00:00:00`;
  return { chunkStart, chunkEnd };
}

/**
 * The §6.2.3 backfill INSERT, parameterized on the monthly window. Half-open
 * interval [chunkStart, chunkEnd) so months don't overlap.
 */
function buildInsertSql(): string {
  return `
    INSERT INTO analytics.page_stats (
        site_id, hour, path, device_type, browser, os, country_code,
        visitors_state, pageviews_state,
        scroll_depth_sum, scroll_depth_count,
        duration_sum, duration_count
    )
    SELECT
        site_id,
        toStartOfHour(timestamp) AS hour,
        url AS path,
        device_type, browser, os, country_code,
        uniqStateIf(session_id, event_type = 'pageview'),
        countIf(event_type = 'pageview'),
        sumIf(toFloat64(assumeNotNull(scroll_depth_percentage)),
              scroll_depth_percentage IS NOT NULL AND event_type = 'engagement'),
        countIf(scroll_depth_percentage IS NOT NULL AND event_type = 'engagement'),
        toUInt64(sumIf(duration_seconds, event_type = 'engagement' AND duration_seconds > 0)),
        toUInt64(countIf(event_type = 'engagement' AND duration_seconds > 0))
    FROM analytics.events
    WHERE event_type IN ('pageview', 'engagement')
      AND timestamp >= {chunk_start:DateTime}
      AND timestamp <  {chunk_end:DateTime}
    GROUP BY site_id, hour, path, device_type, browser, os, country_code
  `;
}

async function partitionRowCount(
  client: ClickHouseClient,
  yyyymm: string,
): Promise<number> {
  const rs = await client.query({
    query: `
      SELECT count() AS c
      FROM analytics.page_stats
      WHERE toYYYYMM(hour) = {yyyymm:UInt32}
    `,
    query_params: { yyyymm: Number(yyyymm) },
    format: 'JSONEachRow',
  });
  const rows = (await rs.json()) as Array<{ c: string | number }>;
  return rows.length === 0 ? 0 : Number(rows[0].c);
}

async function processMonth(
  client: ClickHouseClient,
  yyyymm: string,
  args: Args,
  state: State,
): Promise<void> {
  const { chunkStart, chunkEnd } = monthBounds(yyyymm);

  if (!args.force && state.completedMonths.includes(yyyymm)) {
    console.log(`[${yyyymm}] skip — completed per state file`);
    return;
  }

  const before = await partitionRowCount(client, yyyymm);
  if (!args.force && before > 0) {
    console.log(
      `[${yyyymm}] skip — partition already has ${before} rows ` +
        `(use --force to re-insert; AggregatingMergeTree merges duplicates)`,
    );
    state.completedMonths.push(yyyymm);
    saveState(state);
    return;
  }

  const sql = buildInsertSql();
  if (args.dryRun) {
    console.log(`[${yyyymm}] dry-run — would run INSERT for ${chunkStart} .. ${chunkEnd}`);
    return;
  }

  console.log(`[${yyyymm}] running INSERT (${chunkStart} .. ${chunkEnd})...`);
  const t0 = Date.now();
  await client.command({
    query: sql,
    query_params: {
      chunk_start: chunkStart,
      chunk_end: chunkEnd,
    },
  });
  const durationMs = Date.now() - t0;
  const after = await partitionRowCount(client, yyyymm);
  console.log(
    `[${yyyymm}] done in ${(durationMs / 1000).toFixed(1)}s ` +
      `(${before} → ${after} rows in partition)`,
  );

  state.completedMonths.push(yyyymm);
  state.lastChunk = {
    yyyymm,
    durationMs,
    rowsInsertedBefore: before,
    rowsInsertedAfter: after,
  };
  saveState(state);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const state = loadState();
  const client = buildClient();

  let startYYYYMM = args.startYYYYMM;
  let endYYYYMM = args.endYYYYMM;
  if (!startYYYYMM || !endYYYYMM) {
    const detected = await detectRange(client);
    if (!detected) {
      console.log('No pageview/engagement events found — nothing to backfill.');
      await client.close();
      return;
    }
    startYYYYMM = startYYYYMM ?? detected.start;
    endYYYYMM = endYYYYMM ?? detected.end;
    console.log(`Auto-detected range: ${startYYYYMM} .. ${endYYYYMM}`);
  }

  if (startYYYYMM > endYYYYMM) {
    throw new Error(`--start (${startYYYYMM}) must be <= --end (${endYYYYMM})`);
  }

  console.log(
    `Backfill page_stats: ${startYYYYMM} .. ${endYYYYMM} ` +
      `(force=${args.force}, dryRun=${args.dryRun}, optimize=${args.optimize})`,
  );

  const overall = Date.now();
  let processed = 0;
  for (const yyyymm of iterateMonths(startYYYYMM, endYYYYMM)) {
    try {
      await processMonth(client, yyyymm, args, state);
      processed++;
    } catch (err) {
      console.error(`[${yyyymm}] FAILED:`, err instanceof Error ? err.message : err);
      console.error('Re-run the same command to resume from this month.');
      await client.close();
      process.exit(1);
    }
  }

  if (args.optimize && !args.dryRun) {
    console.log('Running OPTIMIZE TABLE analytics.page_stats FINAL...');
    const t0 = Date.now();
    await client.command({ query: 'OPTIMIZE TABLE analytics.page_stats FINAL' });
    console.log(`OPTIMIZE finished in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }

  console.log(
    `\nProcessed ${processed} month(s) in ${((Date.now() - overall) / 1000).toFixed(1)}s. ` +
      `State: ${STATE_FILE}`,
  );
  await client.close();
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
