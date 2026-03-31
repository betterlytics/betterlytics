import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import { createHash } from 'crypto';
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from 'fs';
import { execSync } from 'child_process';

config({ path: resolve(process.cwd(), '../.env') });

const args = process.argv.slice(2);

function getFlag(name: string, fallback: number): number {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? parseFloat(arg.split('=')[1]) : fallback;
}

function getStringFlag(name: string, fallback: string): string {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : fallback;
}

const firstArg = args[0];
if (firstArg === '--help' || firstArg === '-h') {
  console.log(`
Usage: npx tsx scripts/benchmark.ts [site-id] [options]

Options:
  --days=N             Days back from today (default: 90)
  --granularity=S      'hour' or 'day' (default: day)
  --runs=N             Runs per query (default: 3)
  --timezone=S         Timezone (default: Europe/Amsterdam)
  --save=NAME          Save results with a label (default: timestamp)
  --compare=NAME       Compare against a previous run (name or 'latest')
  --list               List all saved benchmark results

Example:
  npx tsx scripts/benchmark.ts my-site-id --days=90 --runs=5
  npx tsx scripts/benchmark.ts my-site-id --save=before-optimization
  npx tsx scripts/benchmark.ts my-site-id --compare=before-optimization
`);
  process.exit(0);
}

const BENCHMARKS_DIR = resolve(fileURLToPath(import.meta.url), '..', 'benchmarks');

type BenchmarkResult = {
  name: string;
  avg: number;
  min: number;
  max: number;
  resultPreview: string;
  hash: string;
};

type BenchmarkSnapshot = {
  label: string;
  timestamp: string;
  config: { siteId: string; days: number; granularity: string; runsPerQuery: number };
  results: BenchmarkResult[];
  totalAvg: number;
};

function ensureBenchmarksDir() {
  mkdirSync(BENCHMARKS_DIR, { recursive: true });
}

function saveSnapshot(snapshot: BenchmarkSnapshot) {
  ensureBenchmarksDir();
  const filename = `${snapshot.label}.json`;
  writeFileSync(resolve(BENCHMARKS_DIR, filename), JSON.stringify(snapshot, null, 2));
  console.log(`Saved to scripts/benchmarks/${filename}`);
}

function loadSnapshot(name: string): BenchmarkSnapshot {
  if (name === 'latest') {
    ensureBenchmarksDir();
    const files = readdirSync(BENCHMARKS_DIR)
      .filter((f) => f.endsWith('.json'))
      .sort();
    if (files.length === 0) throw new Error('No saved benchmarks found');
    name = files[files.length - 1].replace('.json', '');
  }
  const filepath = resolve(BENCHMARKS_DIR, `${name}.json`);
  return JSON.parse(readFileSync(filepath, 'utf-8'));
}

function listSnapshots() {
  ensureBenchmarksDir();
  const files = readdirSync(BENCHMARKS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();
  if (files.length === 0) {
    console.log('No saved benchmarks found.');
    return;
  }
  console.log('Saved benchmarks:');
  for (const file of files) {
    const snap: BenchmarkSnapshot = JSON.parse(readFileSync(resolve(BENCHMARKS_DIR, file), 'utf-8'));
    const passed = snap.results.filter((r) => r.avg >= 0).length;
    const failed = snap.results.length - passed;
    console.log(
      `  ${snap.label.padEnd(30)} ${snap.timestamp}  ${passed} passed${failed > 0 ? `, ${failed} failed` : ''}  total: ${formatMs(snap.totalAvg)}`,
    );
  }
}

function printComparison(current: BenchmarkResult[], baseline: BenchmarkSnapshot) {
  console.log('');
  console.log(`Comparison against "${baseline.label}" (${baseline.timestamp})`);
  console.log('═'.repeat(100));

  const baselineMap = new Map(baseline.results.map((r) => [r.name, r]));
  const nameWidth = Math.max(...current.map((r) => r.name.length));

  let faster = 0;
  let slower = 0;
  let hashMismatches = 0;

  for (const curr of current) {
    if (curr.avg < 0) continue;
    const base = baselineMap.get(curr.name);
    if (!base || base.avg < 0) {
      console.log(`  ${curr.name.padEnd(nameWidth)}  ${formatMs(curr.avg).padStart(8)}  (new)`);
      continue;
    }

    const diffMs = curr.avg - base.avg;
    const diffPct = ((diffMs / base.avg) * 100).toFixed(1);
    const sign = diffMs <= 0 ? '' : '+';
    const indicator = diffMs <= -base.avg * 0.05 ? '✓' : diffMs >= base.avg * 0.05 ? '✗' : '~';
    const hashChanged = curr.hash !== base.hash;

    if (diffMs <= -base.avg * 0.05) faster++;
    if (diffMs >= base.avg * 0.05) slower++;
    if (hashChanged) hashMismatches++;

    const hashNote = hashChanged ? `  HASH CHANGED (${base.hash} → ${curr.hash})` : '';
    console.log(
      `  ${indicator} ${curr.name.padEnd(nameWidth)}  ${formatMs(base.avg).padStart(8)} → ${formatMs(curr.avg).padStart(8)}  ${sign}${diffPct}%${hashNote}`,
    );
  }

  const removedQueries = baseline.results.filter((b) => b.avg >= 0 && !current.find((c) => c.name === b.name));
  for (const removed of removedQueries) {
    console.log(`  - ${removed.name.padEnd(nameWidth)}  ${formatMs(removed.avg).padStart(8)}  (removed)`);
  }

  const currentTotal = current.filter((r) => r.avg >= 0).reduce((sum, r) => sum + r.avg, 0);
  const totalDiff = currentTotal - baseline.totalAvg;
  const totalDiffPct = ((totalDiff / baseline.totalAvg) * 100).toFixed(1);
  const totalSign = totalDiff <= 0 ? '' : '+';

  console.log('─'.repeat(100));
  console.log(
    `  Total: ${formatMs(baseline.totalAvg)} → ${formatMs(currentTotal)}  (${totalSign}${totalDiffPct}%)`,
  );
  console.log(`  ${faster} faster, ${slower} slower, ${hashMismatches} hash change(s)`);
}

if (args.includes('--list')) {
  listSnapshots();
  process.exit(0);
}

type BenchmarkEntry = {
  name: string;
  fn: () => Promise<unknown>;
};

function hashResult(data: unknown): string {
  const json = JSON.stringify(data, (_key, value) =>
    typeof value === 'number' && !Number.isInteger(value) ? Math.round(value * 1e6) / 1e6 : value,
  );
  return createHash('sha256').update(json).digest('hex').slice(0, 8);
}

async function runBenchmark(
  entry: BenchmarkEntry,
  runs: number,
): Promise<{ avg: number; min: number; max: number; resultPreview: string; hash: string }> {
  const times: number[] = [];
  let resultPreview = '';
  let hash = '';

  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    const result = await entry.fn();
    const elapsed = performance.now() - start;
    times.push(elapsed);

    if (i === 0) {
      hash = hashResult(result);
      if (Array.isArray(result)) {
        resultPreview = `${result.length} rows`;
      } else if (typeof result === 'number') {
        resultPreview = `${result}`;
      } else if (typeof result === 'boolean') {
        resultPreview = `${result}`;
      } else {
        resultPreview = typeof result;
      }
    }
  }

  return {
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    resultPreview,
    hash,
  };
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms.toFixed(0)}ms`;
}

async function main() {
  const SITE_ID = firstArg && !firstArg.startsWith('--') ? firstArg : 'seed-benchmark-site';
  const DAYS = getFlag('days', 90);
  const END_DATE = new Date();
  const START_DATE = new Date(END_DATE.getTime() - DAYS * 86_400_000);
  const TIMEZONE = getStringFlag('timezone', 'Europe/Amsterdam');
  const GRANULARITY = getStringFlag('granularity', 'day') as 'hour' | 'day';
  const RUNS_PER_QUERY = getFlag('runs', 3);

  const siteQuery = {
    siteId: SITE_ID,
    startDate: START_DATE,
    endDate: END_DATE,
    startDateTime: START_DATE.toISOString().replace('T', ' ').slice(0, 19),
    endDateTime: END_DATE.toISOString().replace('T', ' ').slice(0, 19),
    granularity: GRANULARITY,
    queryFilters: [],
    timezone: TIMEZONE,
    userJourney: { numberOfSteps: 3, numberOfJourneys: 50 },
  };

  const { getUniqueVisitors, getTotalUniqueVisitors, getSessionMetrics, getSessionRangeMetrics } = await import(
    '@/repositories/clickhouse/visitors.repository'
  );
  const {
    getTotalPageViews,
    getTopPages,
    getTopEntryPages,
    getTopExitPages,
    getPageMetrics,
    getDailyAverageTimeOnPage,
    getDailyBounceRate,
  } = await import('@/repositories/clickhouse/pages.repository');
  const {
    getDeviceTypeBreakdown,
    getBrowserBreakdown,
    getBrowserRollup,
    getOperatingSystemBreakdown,
    getOperatingSystemRollup,
    getDeviceUsageTrend,
  } = await import('@/repositories/clickhouse/devices.repository');
  const { getVisitorsByCountry, getVisitorsBySubdivision, getVisitorsByCity } = await import(
    '@/repositories/clickhouse/geography.repository'
  );
  const { getReferrerDistribution, getReferrerUrlRollup, getTopChannels, getDailyReferralSessions } = await import(
    '@/repositories/clickhouse/referrers.repository'
  );
  const { getCustomEventsOverview, getTotalEventCount } = await import(
    '@/repositories/clickhouse/events.repository'
  );
  const { getCampaignPerformanceData, getCampaignCount } = await import(
    '@/repositories/clickhouse/campaign.repository'
  );
  const { getOutboundLinksAnalytics, getDailyOutboundClicks, getOutboundLinksDistribution } = await import(
    '@/repositories/clickhouse/outboundLinks.repository'
  );
  const { getCoreWebVitalsP75, getAllCoreWebVitalPercentilesSeries } = await import(
    '@/repositories/clickhouse/webVitals.repository'
  );
  const { getWeeklyHeatmap } = await import('@/repositories/clickhouse/weeklyHeatmap.repository');
  const { getUserJourneyTransitions } = await import('@/repositories/clickhouse/userJourney.repository');
  const { getSessionReplays } = await import('@/repositories/clickhouse/sessionReplays.repository');
  const { getTotalPageviewsCount, getTopPagesWithPageviews } = await import(
    '@/repositories/clickhouse/reports.repository'
  );

  const benchmarks: BenchmarkEntry[] = [
    { name: 'getUniqueVisitors', fn: () => getUniqueVisitors(siteQuery) },
    { name: 'getTotalUniqueVisitors', fn: () => getTotalUniqueVisitors(siteQuery) },
    { name: 'getSessionMetrics', fn: () => getSessionMetrics(siteQuery) },
    { name: 'getSessionRangeMetrics', fn: () => getSessionRangeMetrics(siteQuery) },
    { name: 'getTotalPageViews', fn: () => getTotalPageViews(siteQuery) },
    { name: 'getTopPages', fn: () => getTopPages(siteQuery, 10) },
    { name: 'getTopEntryPages', fn: () => getTopEntryPages(siteQuery, 10) },
    { name: 'getTopExitPages', fn: () => getTopExitPages(siteQuery, 10) },
    { name: 'getPageMetrics', fn: () => getPageMetrics(siteQuery) },
    { name: 'getDailyAverageTimeOnPage', fn: () => getDailyAverageTimeOnPage(siteQuery) },
    { name: 'getDailyBounceRate', fn: () => getDailyBounceRate(siteQuery) },
    { name: 'getDeviceTypeBreakdown', fn: () => getDeviceTypeBreakdown(siteQuery) },
    { name: 'getBrowserBreakdown', fn: () => getBrowserBreakdown(siteQuery) },
    { name: 'getBrowserRollup', fn: () => getBrowserRollup(siteQuery) },
    { name: 'getOperatingSystemBreakdown', fn: () => getOperatingSystemBreakdown(siteQuery) },
    { name: 'getOperatingSystemRollup', fn: () => getOperatingSystemRollup(siteQuery) },
    { name: 'getDeviceUsageTrend', fn: () => getDeviceUsageTrend(siteQuery) },
    { name: 'getVisitorsByCountry', fn: () => getVisitorsByCountry(siteQuery) },
    { name: 'getVisitorsBySubdivision', fn: () => getVisitorsBySubdivision(siteQuery) },
    { name: 'getVisitorsByCity', fn: () => getVisitorsByCity(siteQuery) },
    { name: 'getReferrerDistribution', fn: () => getReferrerDistribution(siteQuery) },
    { name: 'getReferrerUrlRollup', fn: () => getReferrerUrlRollup(siteQuery, 10) },
    { name: 'getTopChannels', fn: () => getTopChannels(siteQuery, 10) },
    { name: 'getDailyReferralSessions', fn: () => getDailyReferralSessions(siteQuery) },
    { name: 'getCustomEventsOverview', fn: () => getCustomEventsOverview(siteQuery) },
    { name: 'getTotalEventCount', fn: () => getTotalEventCount(siteQuery) },
    { name: 'getCampaignPerformanceData', fn: () => getCampaignPerformanceData(siteQuery) },
    { name: 'getCampaignCount', fn: () => getCampaignCount(siteQuery) },
    { name: 'getOutboundLinksAnalytics', fn: () => getOutboundLinksAnalytics(siteQuery) },
    { name: 'getDailyOutboundClicks', fn: () => getDailyOutboundClicks(siteQuery) },
    { name: 'getOutboundLinksDistribution', fn: () => getOutboundLinksDistribution(siteQuery) },
    { name: 'getCoreWebVitalsP75', fn: () => getCoreWebVitalsP75(siteQuery) },
    { name: 'getAllCoreWebVitalPercentilesSeries', fn: () => getAllCoreWebVitalPercentilesSeries(siteQuery) },
    { name: 'getWeeklyHeatmap (pageviews)', fn: () => getWeeklyHeatmap(siteQuery, 'pageviews') },
    { name: 'getUserJourneyTransitions', fn: () => getUserJourneyTransitions(siteQuery) },
    { name: 'getSessionReplays', fn: () => getSessionReplays(siteQuery, 50, 0) },
    { name: 'getTotalPageviewsCount', fn: () => getTotalPageviewsCount(siteQuery) },
    { name: 'getTopPagesWithPageviews', fn: () => getTopPagesWithPageviews(siteQuery, 10) },
  ];

  process.stdout.write('Optimizing ClickHouse tables...');
  try {
    const tables = ['analytics.events', 'analytics.session_replays', 'analytics.session_stats', 'analytics.page_session_stats'];
    for (const table of tables) {
      execSync(`docker exec clickhouse clickhouse-client --query "OPTIMIZE TABLE ${table} FINAL"`, {
        timeout: 120_000,
      });
    }
    console.log(' done');
  } catch {
    console.log(' skipped (could not reach ClickHouse via Docker)');
  }

  console.log('');
  console.log('ClickHouse Repository Benchmark');
  console.log('===============================');
  console.log(`Site ID:     ${SITE_ID}`);
  console.log(`Date range:  ${START_DATE.toISOString().slice(0, 10)} → ${END_DATE.toISOString().slice(0, 10)}`);
  console.log(`Granularity: ${GRANULARITY}`);
  console.log(`Runs/query:  ${RUNS_PER_QUERY}`);
  console.log(`ClickHouse:  ${process.env.CLICKHOUSE_URL}`);
  console.log('');

  const results: BenchmarkResult[] = [];

  for (const entry of benchmarks) {
    process.stdout.write(`  ${entry.name}...`);
    try {
      const result = await runBenchmark(entry, RUNS_PER_QUERY);
      results.push({ name: entry.name, ...result });
      console.log(
        ` ${formatMs(result.avg)} avg (${formatMs(result.min)}-${formatMs(result.max)}) [${result.resultPreview}] #${result.hash}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(` ERROR: ${message.slice(0, 120)}`);
      results.push({ name: entry.name, avg: -1, min: -1, max: -1, resultPreview: 'FAILED', hash: '--------' });
    }
  }

  console.log('');
  console.log('Summary (sorted by avg time, slowest first)');
  console.log('─'.repeat(80));

  const sorted = results.filter((r) => r.avg >= 0).sort((a, b) => b.avg - a.avg);
  const nameWidth = Math.max(...sorted.map((r) => r.name.length));

  for (const r of sorted) {
    const bar = '█'.repeat(Math.max(1, Math.ceil(r.avg / (sorted[0].avg / 30))));
    console.log(`  ${r.name.padEnd(nameWidth)}  ${formatMs(r.avg).padStart(8)}  #${r.hash}  ${bar}`);
  }

  const failed = results.filter((r) => r.avg < 0);
  if (failed.length > 0) {
    console.log('');
    console.log(`${failed.length} query(ies) failed: ${failed.map((r) => r.name).join(', ')}`);
  }

  const totalAvg = sorted.reduce((sum, r) => sum + r.avg, 0);
  console.log('');
  console.log(`Total (sequential): ${formatMs(totalAvg)}`);

  const saveLabel = getStringFlag('save', new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19));
  const snapshot: BenchmarkSnapshot = {
    label: saveLabel,
    timestamp: new Date().toISOString(),
    config: { siteId: SITE_ID, days: DAYS, granularity: GRANULARITY, runsPerQuery: RUNS_PER_QUERY },
    results,
    totalAvg,
  };
  saveSnapshot(snapshot);

  const compareName = getStringFlag('compare', '');
  if (compareName) {
    const baseline = loadSnapshot(compareName);
    printComparison(results, baseline);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
