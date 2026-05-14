import { Hr, Link, Section, Text } from '@react-email/components';
import { format } from 'date-fns';
import type { ReactNode } from 'react';
import type { EmailData } from '@/services/email/types';
import { ReportData } from '@/services/reports/report-data.service';
import { formatDuration } from '@/utils/dateFormatters';
import { EmailLayout, H1, H2, P, renderEmailTemplate } from './_components';

export interface EmailReportData extends EmailData {
  reportData: ReportData;
  dashboardUrl: string;
}

function reviveReportDates(data: EmailReportData): EmailReportData {
  const { period, comparisonPeriod } = data.reportData;
  return {
    ...data,
    reportData: {
      ...data.reportData,
      period: { start: new Date(period.start), end: new Date(period.end) },
      comparisonPeriod: { start: new Date(comparisonPeriod.start), end: new Date(comparisonPeriod.end) },
    },
  };
}

function truncate(s: string, max = 40): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function getTrend(change: number | null): { icon: string; color: string; text: string } {
  if (change === null) return { icon: '', color: 'text-slate-500', text: '—' };
  if (change > 0) return { icon: '↑', color: 'text-green-600', text: `↑ ${Math.abs(change)}%` };
  if (change < 0) return { icon: '↓', color: 'text-red-600', text: `↓ ${Math.abs(change)}%` };
  return { icon: '→', color: 'text-slate-500', text: '→ 0%' };
}

function ReportSignature() {
  return (
    <Section className='mt-10 pt-5'>
      <Hr className='mb-5 border-slate-200' />
      <Text className='m-0 text-[13px] leading-relaxed text-slate-400'>
        If you were not expecting this report, please contact{' '}
        <Link href='mailto:support@betterlytics.io' className='text-blue-600 no-underline'>
          support@betterlytics.io
        </Link>
        .
      </Text>
    </Section>
  );
}

function MetricCard({ label, value, change }: { label: string; value: string; change: number | null }) {
  const trend = getTrend(change);
  return (
    <td className='block w-full pb-2 sm:table-cell sm:w-1/3 sm:px-1 sm:pb-0 sm:align-top'>
      <Section className='rounded-lg bg-slate-50 p-3 text-center'>
        <Text className='m-0 text-xs text-slate-500'>{label}</Text>
        <Text className='m-0 text-2xl font-bold text-slate-800'>{value}</Text>
        <Text className={`m-0 text-xs font-medium ${trend.color}`}>{trend.text}</Text>
      </Section>
    </td>
  );
}

function ReportTable({
  columns,
  rows,
  emptyMessage,
}: {
  columns: { header: string; align?: 'left' | 'right' }[];
  rows: { cells: ReactNode[] }[];
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return <P className='text-slate-500 italic'>{emptyMessage}</P>;
  }
  return (
    <table className='w-full border-collapse'>
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th
              key={i}
              className={`border-b-2 border-slate-200 py-2 text-xs font-semibold text-slate-500 ${
                col.align === 'right' ? 'text-right' : 'text-left'
              }`}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.cells.map((cell, j) => {
              const align = columns[j]?.align === 'right' ? 'text-right' : 'text-left';
              const colorClass =
                j === 0 ? 'text-slate-500' : j === 1 ? 'text-slate-800 font-medium' : 'text-slate-600';
              const wrap = j === 1 ? 'break-words' : '';
              return (
                <td key={j} className={`border-b border-slate-200 py-2 ${colorClass} ${align} ${wrap}`.trim()}>
                  {cell}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function WeeklyReportEmail(rawData: EmailReportData) {
  const data = reviveReportDates(rawData);
  const { reportData } = data;
  const periodLabel = reportData.periodType === 'weekly' ? 'Weekly' : 'Monthly';
  const dateRange = `${format(reportData.period.start, 'MMM d')} – ${format(
    reportData.period.end,
    'MMM d, yyyy',
  )}`;

  return (
    <EmailLayout
      preview={`${periodLabel} report for ${reportData.domain} — ${dateRange}`}
      campaign="weekly_report"
      signature={<ReportSignature />}
      footer={null}
    >
      <H1>{periodLabel} Analytics Report</H1>

      <P className='text-slate-600'>
        Here's your {periodLabel.toLowerCase()} analytics summary for{' '}
        <Link href={`https://${reportData.domain}`} className='font-semibold text-blue-600 no-underline'>
          {reportData.domain}
        </Link>
      </P>

      <P className='mb-6 text-sm text-slate-500'>{dateRange}</P>

      <Section className='my-5 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-6'>
        <H2 className='mt-0'>Key Metrics</H2>
        <table cellPadding={0} cellSpacing={0} border={0} className='w-full'>
          <tbody>
            <tr className='block sm:table-row'>
              <MetricCard
                label='Visitors'
                value={reportData.metrics.visitors.toLocaleString()}
                change={reportData.metrics.visitorChange}
              />
              <MetricCard
                label='Page Views'
                value={reportData.metrics.pageViews.toLocaleString()}
                change={reportData.metrics.pageViewChange}
              />
              <MetricCard
                label='Sessions'
                value={reportData.metrics.sessions.toLocaleString()}
                change={reportData.metrics.sessionChange}
              />
            </tr>
          </tbody>
        </table>

        <table cellPadding={0} cellSpacing={0} border={0} className='mt-4 w-full'>
          <tbody>
            <tr className='block sm:table-row'>
              <td className='block w-full pb-1 sm:table-cell sm:w-1/2 sm:pr-3 sm:pb-0 sm:align-top'>
                <span className='text-sm text-slate-500'>Bounce Rate:</span>
                <span className='ml-2 font-semibold text-slate-800'>{reportData.metrics.bounceRate}%</span>
              </td>
              <td className='block w-full sm:table-cell sm:w-1/2 sm:pl-3 sm:align-top'>
                <span className='text-sm text-slate-500'>Avg. Visit Duration:</span>
                <span className='ml-2 font-semibold text-slate-800'>
                  {formatDuration(reportData.metrics.avgVisitDuration)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section className='my-5 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-6'>
        <H2 className='mt-0'>Top Pages</H2>
        <ReportTable
          columns={[
            { header: '#', align: 'left' },
            { header: 'Page', align: 'left' },
            { header: 'Views', align: 'right' },
          ]}
          rows={reportData.topPages.map((page, i) => ({
            cells: [`${i + 1}.`, truncate(page.path), page.pageviews.toLocaleString()],
          }))}
          emptyMessage='No page data available for this period.'
        />
      </Section>

      <Section className='my-5 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-6'>
        <H2 className='mt-0'>Top Traffic Sources</H2>
        <ReportTable
          columns={[
            { header: '#', align: 'left' },
            { header: 'Source', align: 'left' },
            { header: 'Visits', align: 'right' },
          ]}
          rows={reportData.topSources.map((source, i) => ({
            cells: [`${i + 1}.`, truncate(source.source || 'Direct'), source.visits.toLocaleString()],
          }))}
          emptyMessage='No traffic source data available for this period.'
        />
      </Section>
    </EmailLayout>
  );
}

const _now = new Date();
const _weekAgo = new Date(_now.getTime() - 7 * 24 * 60 * 60 * 1000);
const _twoWeeksAgo = new Date(_now.getTime() - 14 * 24 * 60 * 60 * 1000);

WeeklyReportEmail.PreviewProps = {
  to: 'user@example.com',
  dashboardUrl: 'https://betterlytics.io/dashboard/example',
  reportData: {
    dashboardId: 'example',
    siteId: 'example',
    domain: 'example.com',
    periodType: 'weekly',
    period: { start: _weekAgo, end: _now },
    comparisonPeriod: { start: _twoWeeksAgo, end: _weekAgo },
    metrics: {
      visitors: 1234,
      visitorChange: 12,
      pageViews: 5678,
      pageViewChange: -5,
      sessions: 987,
      sessionChange: 8,
      bounceRate: 42,
      avgVisitDuration: 185,
    },
    topPages: [
      { path: '/', pageviews: 1500 },
      { path: '/about', pageviews: 890 },
      { path: '/products', pageviews: 654 },
      { path: '/blog/getting-started', pageviews: 432 },
      { path: '/contact', pageviews: 321 },
    ],
    topSources: [
      { source: 'Google', visits: 456 },
      { source: 'Twitter', visits: 234 },
      { source: 'Direct', visits: 189 },
      { source: 'LinkedIn', visits: 145 },
      { source: 'GitHub', visits: 98 },
    ],
  },
} satisfies EmailReportData;

export default WeeklyReportEmail;

export const createReportEmailTemplate = (data: EmailReportData) => {
  const safe = reviveReportDates(data);
  const period = safe.reportData.periodType === 'weekly' ? 'Weekly' : 'Monthly';
  const range = `${format(safe.reportData.period.start, 'MMM d')} – ${format(safe.reportData.period.end, 'MMM d, yyyy')}`;
  return renderEmailTemplate(WeeklyReportEmail, safe, `${period} Report: ${safe.reportData.domain} (${range})`);
};

