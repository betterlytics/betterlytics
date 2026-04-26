/**
 * Backfill historical engagement events from existing pageview/scroll_depth rows.
 *
 * For each historical pageview, synthesize an `engagement` row carrying:
 *   - duration_seconds = gap to the next pageview in the same session,
 *     capped at the 1800 s session-idle timeout (0 for tail pageviews per Q13).
 *   - scroll_depth_percentage / scroll_depth_pixels = session-max from any
 *     legacy `scroll_depth` rows for that (site_id, session_id, url).
 *
 * Backfilled rows are tagged via global_properties: `_backfilled = '1'`. This
 * lets the script detect already-completed months (resume after Ctrl-C) and
 * lets ops delete the backfill set if needed.
 *
 * Idempotency: per-month state is persisted to `.backfill-engagement-state.json`.
 * Re-running with the same range skips months already marked complete. Use
 * `--force` to ignore the state file and reprocess everything in range.
 *
 * CLI:
 *   tsx scripts/backfill_engagement_events.ts \
 *     [--start YYYYMM] [--end YYYYMM] [--force] [--dry-run]
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

const STATE_FILE = path.resolve(process.cwd(), '.backfill-engagement-state.json');
const BACKFILL_MARKER_KEY = '_backfilled';
const BACKFILL_MARKER_VALUE = '1';

interface State {
  startedAt: string;
  completedMonths: string[]; // YYYYMM strings
  lastChunk?: {
    yyyymm: string;
    durationMs: number;
    rowsInserted: number | null;
  };
}

interface Args {
  startYYYYMM: string | null;
  endYYYYMM: string | null;
  force: boolean;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { startYYYYMM: null, endYYYYMM: null, force: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--start') args.startYYYYMM = argv[++i];
    else if (a === '--end') args.endYYYYMM = argv[++i];
    else if (a === '--force') args.force = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--help' || a === '-h') {
      console.log(
        'Usage: tsx scripts/backfill_engagement_events.ts [--start YYYYMM] [--end YYYYMM] [--force] [--dry-run]',
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

/**
 * Find the YYYYMM range present in the events table when the user did not
 * explicitly pass --start/--end. Uses min/max(timestamp) for the existing
 * pageview rows (the only thing the backfill reads).
 */
async function detectRange(client: ClickHouseClient): Promise<{ start: string; end: string } | null> {
  const rs = await client.query({
    query:
      "SELECT toString(toYYYYMM(min(timestamp))) AS minM, toString(toYYYYMM(max(timestamp))) AS maxM FROM analytics.events WHERE event_type = 'pageview'",
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
 * The §6.1.4 backfill SQL with the `_backfilled = '1'` marker baked into
 * global_properties_keys / global_properties_values, parameterized on the
 * monthly chunk window. Half-open interval [chunkStart, chunkEnd) so months
 * don't double-count their boundaries.
 */
function buildInsertSql(): string {
  return `
    INSERT INTO analytics.events (
        site_id, visitor_id, session_id, domain, url,
        device_type, country_code, subdivision_code, city,
        timestamp, date,
        browser, browser_version, os, os_version,
        referrer_source, referrer_source_name, referrer_search_term, referrer_url,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        event_type, custom_event_name, custom_event_json, outbound_link_url,
        cwv_cls, cwv_lcp, cwv_inp, cwv_fcp, cwv_ttfb,
        scroll_depth_percentage, scroll_depth_pixels,
        error_exceptions, error_type, error_message, error_fingerprint,
        session_created_at, global_properties_keys, global_properties_values,
        duration_seconds
    )
    SELECT
        pv.site_id, pv.visitor_id, pv.session_id, pv.domain, pv.url,
        pv.device_type, pv.country_code, pv.subdivision_code, pv.city,
        pv.timestamp + INTERVAL 1 SECOND AS timestamp,
        toDate(pv.timestamp + INTERVAL 1 SECOND) AS date,
        pv.browser, pv.browser_version, pv.os, pv.os_version,
        pv.referrer_source, pv.referrer_source_name, pv.referrer_search_term, pv.referrer_url,
        pv.utm_source, pv.utm_medium, pv.utm_campaign, pv.utm_term, pv.utm_content,
        'engagement' AS event_type,
        '' AS custom_event_name, '' AS custom_event_json, '' AS outbound_link_url,
        NULL, NULL, NULL, NULL, NULL,
        sd.scroll_depth_percentage,
        sd.scroll_depth_pixels,
        '' AS error_exceptions, '' AS error_type, '' AS error_message, '' AS error_fingerprint,
        pv.session_created_at,
        ['${BACKFILL_MARKER_KEY}'] AS global_properties_keys,
        ['${BACKFILL_MARKER_VALUE}'] AS global_properties_values,
        pv.computed_duration_seconds AS duration_seconds
    FROM (
        SELECT
            site_id, visitor_id, session_id, domain, url,
            device_type, country_code, subdivision_code, city,
            timestamp,
            browser, browser_version, os, os_version,
            referrer_source, referrer_source_name, referrer_search_term, referrer_url,
            utm_source, utm_medium, utm_campaign, utm_term, utm_content,
            session_created_at,
            if(
                next_ts > timestamp
                    AND dateDiff('second', timestamp, next_ts) <= 1800,
                toUInt32(dateDiff('second', timestamp, next_ts)),
                0
            ) AS computed_duration_seconds
        FROM (
            SELECT *,
                leadInFrame(timestamp) OVER (
                    PARTITION BY site_id, session_id
                    ORDER BY timestamp
                    ROWS BETWEEN CURRENT ROW AND 1 FOLLOWING
                ) AS next_ts
            FROM analytics.events
            WHERE event_type = 'pageview'
              AND timestamp >= {chunk_start:DateTime}
              AND timestamp <  {chunk_end:DateTime}
        )
    ) pv
    LEFT JOIN (
        SELECT site_id, session_id, url,
               max(scroll_depth_percentage) AS scroll_depth_percentage,
               max(scroll_depth_pixels)     AS scroll_depth_pixels
        FROM analytics.events
        WHERE event_type = 'scroll_depth'
          AND timestamp >= {chunk_start:DateTime}
          AND timestamp <  {chunk_end:DateTime}
        GROUP BY site_id, session_id, url
    ) sd USING (site_id, session_id, url)
  `;
}

/**
 * Returns the count of already-backfilled engagement rows in the chunk.
 * Used to skip months that already completed even if the state file is gone.
 */
async function existingBackfillCount(
  client: ClickHouseClient,
  chunkStart: string,
  chunkEnd: string,
): Promise<number> {
  const rs = await client.query({
    query: `
      SELECT count() AS c
      FROM analytics.events
      WHERE event_type = 'engagement'
        AND timestamp >= {chunk_start:DateTime}
        AND timestamp <  {chunk_end:DateTime}
        AND has(global_properties_keys, {marker_key:String})
    `,
    query_params: {
      chunk_start: chunkStart,
      chunk_end: chunkEnd,
      marker_key: BACKFILL_MARKER_KEY,
    },
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

  if (!args.force) {
    if (state.completedMonths.includes(yyyymm)) {
      console.log(`[${yyyymm}] skip — completed per state file`);
      return;
    }
    const existing = await existingBackfillCount(client, chunkStart, chunkEnd);
    if (existing > 0) {
      console.log(
        `[${yyyymm}] skip — found ${existing} already-backfilled rows (use --force to re-insert)`,
      );
      state.completedMonths.push(yyyymm);
      saveState(state);
      return;
    }
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

  const inserted = await existingBackfillCount(client, chunkStart, chunkEnd);
  console.log(
    `[${yyyymm}] done in ${(durationMs / 1000).toFixed(1)}s (${inserted} backfilled rows present)`,
  );

  state.completedMonths.push(yyyymm);
  state.lastChunk = { yyyymm, durationMs, rowsInserted: inserted };
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
      console.log('No pageview events found — nothing to backfill.');
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
    `Backfill engagement events: ${startYYYYMM} .. ${endYYYYMM} (force=${args.force}, dryRun=${args.dryRun})`,
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
