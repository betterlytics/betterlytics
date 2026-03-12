#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");

const args = process.argv.slice(2);

if (!args[0] || args[0].startsWith("--")) {
  console.error(
    "Usage: node benchmark-queries.js <site_id> [--runs=5] [--compare=previous.json] [--output=results.json]",
  );
  process.exit(1);
}

const SITE_ID = args[0];

function getFlag(name, fallback) {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=").slice(1).join("=") : fallback;
}

const RUNS = parseInt(getFlag("runs", "5"));
const COMPARE_FILE = getFlag("compare", "");
const OUTPUT_FILE = getFlag(
  "output",
  `benchmark-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
);
const TIMEZONE = "UTC";

function runQuery(sql) {
  return execSync("docker exec -i clickhouse clickhouse-client", {
    input: sql,
    encoding: "utf-8",
    timeout: 120_000,
  }).trim();
}

function runQueryTimed(sql) {
  const start = performance.now();
  runQuery(sql + "\nFORMAT Null");
  return performance.now() - start;
}

function dropCaches() {
  runQuery("SYSTEM DROP MARK CACHE");
  runQuery("SYSTEM DROP UNCOMPRESSED CACHE");
  runQuery("SYSTEM DROP COMPILED EXPRESSION CACHE");
  runQuery("SYSTEM DROP QUERY CACHE");
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const totalEvents = runQuery(
  `SELECT count() FROM analytics.events WHERE site_id = '${SITE_ID}'`,
);

if (totalEvents === "0") {
  console.error(`No events found for site_id '${SITE_ID}'`);
  process.exit(1);
}

const dateRange = runQuery(
  `SELECT min(timestamp), max(timestamp) FROM analytics.events WHERE site_id = '${SITE_ID}'`,
);
const [START, END] = dateRange.split("\t");

const queries = [
  {
    name: "Pageview count (time series)",
    sql: `
      SELECT
        toStartOfInterval(timestamp, INTERVAL 1 DAY, '${TIMEZONE}') as date,
        count() as views
      FROM analytics.events
      WHERE site_id = '${SITE_ID}'
        AND event_type = 'pageview'
        AND timestamp BETWEEN '${START}' AND '${END}'
      GROUP BY date
      ORDER BY date ASC
    `,
  },
  {
    name: "Unique visitors (time series)",
    sql: `
      SELECT toTimezone(toDateTime64(date, 0), 'UTC') as date, q.* EXCEPT (date) FROM (
        WITH first_visitor_appearances AS (
          SELECT
            visitor_id,
            min(timestamp) as custom_date
          FROM analytics.events
          WHERE site_id = '${SITE_ID}'
            AND timestamp BETWEEN '${START}' AND '${END}'
          GROUP BY visitor_id
        )
        SELECT
          toStartOfInterval(custom_date, INTERVAL 1 DAY, '${TIMEZONE}') as date,
          uniq(visitor_id) as unique_visitors
        FROM first_visitor_appearances
        GROUP BY date
        ORDER BY date ASC
        LIMIT 10080
      ) q
    `,
  },
  {
    name: "Session metrics (bounce rate, duration)",
    sql: `
      SELECT toTimezone(toDateTime64(date, 0), 'UTC') as date, q.* EXCEPT (date) FROM (
        SELECT
          toStartOfInterval(min_ts, INTERVAL 1 DAY, '${TIMEZONE}') as date,
          count() as sessions,
          countIf(page_count = 1) as bounced,
          avg(duration_seconds) as avg_duration
        FROM (
          SELECT
            session_id,
            min(timestamp) as min_ts,
            max(timestamp) as max_ts,
            dateDiff('second', min(timestamp), max(timestamp)) as duration_seconds,
            count() as page_count
          FROM analytics.events
          WHERE site_id = '${SITE_ID}'
            AND event_type = 'pageview'
            AND timestamp BETWEEN '${START}' AND '${END}'
          GROUP BY session_id
        )
        GROUP BY date
        ORDER BY date ASC
        LIMIT 10080
      ) q
    `,
  },
  {
    name: "Top pages by visitors",
    sql: `
      SELECT
        url,
        uniq(session_id) as visitors,
        count() as pageviews
      FROM analytics.events
      WHERE site_id = '${SITE_ID}'
        AND event_type = 'pageview'
        AND timestamp BETWEEN '${START}' AND '${END}'
      GROUP BY url
      ORDER BY visitors DESC
      LIMIT 50
    `,
  },
  {
    name: "Custom events overview",
    sql: `
      SELECT
        custom_event_name,
        count() as total,
        uniq(visitor_id) as unique_visitors,
        max(timestamp) as last_seen
      FROM analytics.events
      WHERE site_id = '${SITE_ID}'
        AND event_type = 'custom'
        AND timestamp BETWEEN '${START}' AND '${END}'
      GROUP BY custom_event_name
      ORDER BY total DESC
    `,
  },
  {
    name: "Referrer breakdown",
    sql: `
      SELECT
        referrer_source,
        uniq(session_id) as visits
      FROM analytics.events
      WHERE site_id = '${SITE_ID}'
        AND event_type = 'pageview'
        AND referrer_source != 'internal'
        AND timestamp BETWEEN '${START}' AND '${END}'
      GROUP BY referrer_source
      ORDER BY visits DESC
    `,
  },
  {
    name: "Country breakdown",
    sql: `
      SELECT
        country_code,
        uniq(visitor_id) as visitors
      FROM analytics.events
      WHERE site_id = '${SITE_ID}'
        AND country_code IS NOT NULL AND country_code != ''
        AND timestamp BETWEEN '${START}' AND '${END}'
      GROUP BY country_code
      ORDER BY visitors DESC
      LIMIT 50
    `,
  },
  {
    name: "Campaign performance",
    sql: `
      SELECT
        utm_campaign,
        COUNT(DISTINCT visitor_id) as visitors,
        COUNT(DISTINCT session_id) as sessions,
        count() as pageviews
      FROM analytics.events
      WHERE site_id = '${SITE_ID}'
        AND event_type = 'pageview'
        AND utm_campaign != ''
        AND timestamp BETWEEN '${START}' AND '${END}'
      GROUP BY utm_campaign
      ORDER BY visitors DESC
    `,
  },
  {
    name: "Filtered: URL /docs/% (time series)",
    sql: `
      SELECT toTimezone(toDateTime64(date, 0), 'UTC') as date, q.* EXCEPT (date) FROM (
        SELECT
          toStartOfInterval(timestamp, INTERVAL 1 DAY, '${TIMEZONE}') as date,
          count() as views,
          uniq(visitor_id) as visitors
        FROM analytics.events
        WHERE site_id = '${SITE_ID}'
          AND event_type = 'pageview'
          AND timestamp BETWEEN '${START}' AND '${END}'
          AND arrayExists(pattern -> url ILIKE pattern, ['%/docs/%'])
        GROUP BY date
        ORDER BY date ASC
        LIMIT 10080
      ) q
    `,
  },
  {
    name: "Filtered: device + URL /blog/%",
    sql: `
      SELECT toTimezone(toDateTime64(date, 0), 'UTC') as date, q.* EXCEPT (date) FROM (
        SELECT
          toStartOfInterval(timestamp, INTERVAL 1 DAY, '${TIMEZONE}') as date,
          count() as views,
          uniq(visitor_id) as visitors
        FROM analytics.events
        WHERE site_id = '${SITE_ID}'
          AND event_type = 'pageview'
          AND timestamp BETWEEN '${START}' AND '${END}'
          AND arrayExists(pattern -> url ILIKE pattern, ['%/blog/%'])
          AND arrayExists(pattern -> device_type ILIKE pattern, ['mobile'])
        GROUP BY date
        ORDER BY date ASC
        LIMIT 10080
      ) q
    `,
  },
];

console.log(`Benchmarking ${queries.length} queries x ${RUNS} runs`);
console.log(`Site: ${SITE_ID} (${totalEvents} events)`);
console.log(`Date range: ${START} to ${END}`);
console.log(`Dropping caches between each run\n`);

const results = {};

for (const query of queries) {
  const timings = [];
  process.stdout.write(`  ${query.name} ... `);

  for (let i = 0; i < RUNS; i++) {
    dropCaches();
    const elapsed = runQueryTimed(query.sql);
    timings.push(Math.round(elapsed * 100) / 100);
  }

  const med = median(timings);
  const min = Math.min(...timings);
  const max = Math.max(...timings);

  results[query.name] = { timings, min, median: med, max };

  console.log(
    `median ${med.toFixed(1)}ms  (min: ${min.toFixed(1)}, max: ${max.toFixed(1)})`,
  );
}

const output = {
  timestamp: new Date().toISOString(),
  site_id: SITE_ID,
  event_count: parseInt(totalEvents),
  date_range: { start: START, end: END },
  runs: RUNS,
  results,
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
console.log(`\nResults saved to ${OUTPUT_FILE}`);

if (COMPARE_FILE) {
  const previous = JSON.parse(fs.readFileSync(COMPARE_FILE, "utf-8"));
  printComparison(previous, output);
}

function printComparison(before, after) {
  const NAME_W = 42;
  const COL_W = 14;

  console.log(`\n${"=".repeat(NAME_W + COL_W * 3)}`);
  console.log("COMPARISON");
  console.log(
    `  Before: ${before.timestamp} (${before.event_count.toLocaleString()} events)`,
  );
  console.log(
    `  After:  ${after.timestamp} (${after.event_count.toLocaleString()} events)`,
  );
  console.log(`${"=".repeat(NAME_W + COL_W * 3)}\n`);

  console.log(
    "Query".padEnd(NAME_W) +
      "Before".padStart(COL_W) +
      "After".padStart(COL_W) +
      "Change".padStart(COL_W),
  );
  console.log("-".repeat(NAME_W + COL_W * 3));

  let totalBefore = 0;
  let totalAfter = 0;

  for (const name of Object.keys(after.results)) {
    const b = before.results[name];
    const a = after.results[name];

    if (!b) {
      console.log(
        name.substring(0, NAME_W).padEnd(NAME_W) +
          "N/A".padStart(COL_W) +
          `${a.median.toFixed(1)}ms`.padStart(COL_W) +
          "".padStart(COL_W),
      );
      continue;
    }

    totalBefore += b.median;
    totalAfter += a.median;

    const pct = ((a.median - b.median) / b.median) * 100;
    const sign = pct > 0 ? "+" : "";
    const indicator = pct < -5 ? " FASTER" : pct > 5 ? " SLOWER" : "";

    console.log(
      name.substring(0, NAME_W).padEnd(NAME_W) +
        `${b.median.toFixed(1)}ms`.padStart(COL_W) +
        `${a.median.toFixed(1)}ms`.padStart(COL_W) +
        `${sign}${pct.toFixed(1)}%${indicator}`.padStart(COL_W),
    );
  }

  console.log("-".repeat(NAME_W + COL_W * 3));

  const totalPct = ((totalAfter - totalBefore) / totalBefore) * 100;
  const totalSign = totalPct > 0 ? "+" : "";

  console.log(
    "TOTAL (sum of medians)".padEnd(NAME_W) +
      `${totalBefore.toFixed(1)}ms`.padStart(COL_W) +
      `${totalAfter.toFixed(1)}ms`.padStart(COL_W) +
      `${totalSign}${totalPct.toFixed(1)}%`.padStart(COL_W),
  );
}
