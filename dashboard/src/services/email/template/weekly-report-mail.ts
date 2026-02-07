import { getEmailHeader, emailStyles, emailColors, reportStyles, createDataTable } from './email-components';
import { EmailData } from '@/services/email/mail.service';
import { ReportData } from '@/services/reports/report-data.service';
import { formatDuration } from '@/utils/dateFormatters';
import { format } from 'date-fns';
import escapeHtml from 'escape-html';

export interface EmailReportData extends EmailData {
  reportData: ReportData;
  dashboardUrl: string;
}

function formatChange(change: number | null): string {
  if (change === null) return '—';
  if (change === 0) return 'No change';
  const sign = change > 0 ? '+' : '';
  return `${sign}${change}%`;
}

function getTrendIcon(change: number | null): string {
  if (change === null) return '';
  if (change > 0) return '↑';
  if (change < 0) return '↓';
  return '→';
}

function getTrendColor(change: number | null): string {
  if (change === null) return emailColors.neutral;
  if (change > 0) return emailColors.positive;
  if (change < 0) return emailColors.negative;
  return emailColors.neutral;
}

export function getReportEmailFooter(): string {
  return `
        </div>
      </div>
    </body>
    </html>
  `;
}

function createMetricCard(label: string, value: string, change: number | null): string {
  const trendIcon = getTrendIcon(change);
  const trendColor = getTrendColor(change);
  const changeText = change === null ? '—' : `${trendIcon} ${Math.abs(change)}%`;

  return `
    <td style="${reportStyles.metricCard}">
      <div style="${reportStyles.metricLabel}">${label}</div>
      <div style="${reportStyles.metricValue}">${value}</div>
      <div style="${reportStyles.metricChange} color: ${trendColor};">
        ${changeText}
      </div>
    </td>
  `;
}

function createTopPagesTable(topPages: ReportData['topPages']): string {
  const columns = [
    { header: '#', align: 'left' as const },
    { header: 'Page', align: 'left' as const },
    { header: 'Views', align: 'right' as const },
  ];

  const rows = topPages.map((page, index) => ({
    cells: [`${index + 1}.`, escapeHtml(page.path), page.pageviews.toLocaleString()],
  }));

  return createDataTable(columns, rows, 'No page data available for this period.');
}

function createTopSourcesTable(topSources: ReportData['topSources']): string {
  const columns = [
    { header: '#', align: 'left' as const },
    { header: 'Source', align: 'left' as const },
    { header: 'Visits', align: 'right' as const },
  ];

  const rows = topSources.map((source, index) => ({
    cells: [`${index + 1}.`, escapeHtml(source.source || 'Direct'), source.visits.toLocaleString()],
  }));

  return createDataTable(columns, rows, 'No traffic source data available for this period.');
}

function createSecondaryMetric(label: string, value: string): string {
  return `
    <span style="color: ${emailColors.textMuted}; font-size: 14px;">${label}:</span>
    <span style="font-weight: 600; margin-left: 8px; color: ${emailColors.textPrimary};">${value}</span>
  `;
}

function createReportSignature(): string {
  return `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
        If you were not expecting this report, please contact 
        <a href="mailto:support@betterlytics.io" style="color: #2563eb; text-decoration: none;">support@betterlytics.io</a>.
      </p>
    </div>
  `;
}

function createReportTextSignature(): string {
  return `If you were not expecting this report, please contact support@betterlytics.io.`;
}

function wrapReportEmailContent(content: string): string {
  return getEmailHeader() + content + getReportEmailFooter();
}

export function generateReportEmailContent(data: EmailReportData): string {
  const { reportData } = data;
  const periodLabel = reportData.periodType === 'weekly' ? 'Weekly' : 'Monthly';
  const dateRange = `${format(reportData.period.start, 'MMM d')} – ${format(reportData.period.end, 'MMM d, yyyy')}`;

  const content = `
    <h1>${periodLabel} Analytics Report</h1>
    
    <p style="${emailStyles.mutedText}">
      Here's your ${periodLabel.toLowerCase()} analytics summary for <a href="https://${escapeHtml(reportData.domain)}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${escapeHtml(reportData.domain)}</a>
    </p>
    
    <p style="font-size: 14px; color: ${emailColors.textMuted}; margin-bottom: 24px;">
      ${dateRange}
    </p>

    <div class="content-section">
      <h2 style="margin-top: 0;">Key Metrics</h2>
      <table style="width: 100%; border-collapse: separate; border-spacing: 8px;">
        <tr>
          ${createMetricCard('Visitors', reportData.metrics.visitors.toLocaleString(), reportData.metrics.visitorChange)}
          ${createMetricCard('Page Views', reportData.metrics.pageViews.toLocaleString(), reportData.metrics.pageViewChange)}
          ${createMetricCard('Sessions', reportData.metrics.sessions.toLocaleString(), reportData.metrics.sessionChange)}
        </tr>
      </table>
      
      <table style="width: 100%; margin-top: 16px;">
        <tr>
          <td style="width: 50%; vertical-align: top; padding-right: 12px;">
            ${createSecondaryMetric('Bounce Rate', `${reportData.metrics.bounceRate}%`)}
          </td>
          <td style="width: 50%; vertical-align: top; padding-left: 12px;">
            ${createSecondaryMetric('Avg. Visit Duration', formatDuration(reportData.metrics.avgVisitDuration))}
          </td>
        </tr>
      </table>
    </div>

    <div class="content-section">
      <h2 style="margin-top: 0;">Top Pages</h2>
      ${createTopPagesTable(reportData.topPages)}
    </div>

    <div class="content-section">
      <h2 style="margin-top: 0;">Top Traffic Sources</h2>
      ${createTopSourcesTable(reportData.topSources)}
    </div>

    ${createReportSignature()}
  `;

  return content;
}

export function generateReportEmailText(data: EmailReportData): string {
  const { reportData } = data;
  const periodLabel = reportData.periodType === 'weekly' ? 'Weekly' : 'Monthly';
  const dateRange = `${format(reportData.period.start, 'MMM d')} – ${format(reportData.period.end, 'MMM d, yyyy')}`;

  const topPagesText = reportData.topPages
    .map((page, i) => `${i + 1}. ${page.path} - ${page.pageviews.toLocaleString()} views`)
    .join('\n');

  const topSourcesText = reportData.topSources
    .map((source, i) => `${i + 1}. ${source.source || 'Direct'} - ${source.visits.toLocaleString()} visits`)
    .join('\n');

  const content = `
${periodLabel} Analytics Report for ${reportData.domain}
${dateRange}

KEY METRICS
-----------
Visitors: ${reportData.metrics.visitors.toLocaleString()} (${formatChange(reportData.metrics.visitorChange)})
Page Views: ${reportData.metrics.pageViews.toLocaleString()} (${formatChange(reportData.metrics.pageViewChange)})
Sessions: ${reportData.metrics.sessions.toLocaleString()} (${formatChange(reportData.metrics.sessionChange)})
Bounce Rate: ${reportData.metrics.bounceRate}%
Avg. Visit Duration: ${formatDuration(reportData.metrics.avgVisitDuration)}

TOP PAGES
---------
${topPagesText || 'No page data available'}

TOP TRAFFIC SOURCES
-------------------
${topSourcesText || 'No source data available'}

---
${createReportTextSignature()}`.trim();

  return content;
}

export function createReportEmailTemplate(data: EmailReportData) {
  const periodLabel = data.reportData.periodType === 'weekly' ? 'Weekly' : 'Monthly';
  const dateRange = `${format(data.reportData.period.start, 'MMM d')} – ${format(data.reportData.period.end, 'MMM d, yyyy')}`;

  return {
    subject: `${periodLabel} Report: ${data.reportData.domain} (${dateRange})`,
    html: wrapReportEmailContent(generateReportEmailContent(data)),
    text: generateReportEmailText(data),
  };
}

export function getReportEmailPreview(data?: Partial<EmailReportData>): string {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const sampleData: EmailReportData = {
    to: 'user@example.com',
    dashboardUrl: 'https://betterlytics.io/dashboard/example',
    reportData: {
      dashboardId: 'example',
      siteId: 'example',
      domain: 'example.com',
      periodType: 'weekly',
      period: { start: weekAgo, end: now },
      comparisonPeriod: { start: twoWeeksAgo, end: weekAgo },
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
        { path: '/pricing', pageviews: 287 },
        { path: '/features', pageviews: 243 },
        { path: '/docs/api', pageviews: 198 },
        { path: '/blog/analytics-tips', pageviews: 156 },
        { path: '/login', pageviews: 134 },
      ],
      topSources: [
        { source: 'Google', visits: 456 },
        { source: 'Twitter', visits: 234 },
        { source: 'Direct', visits: 189 },
        { source: 'LinkedIn', visits: 145 },
        { source: 'GitHub', visits: 98 },
        { source: 'Facebook', visits: 87 },
        { source: 'Hacker News', visits: 76 },
        { source: 'Reddit', visits: 65 },
        { source: 'Product Hunt', visits: 54 },
        { source: 'Dev.to', visits: 43 },
      ],
    },
    ...data,
  };

  return createReportEmailTemplate(sampleData).html;
}
