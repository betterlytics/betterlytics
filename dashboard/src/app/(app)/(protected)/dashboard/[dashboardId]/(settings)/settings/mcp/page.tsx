import { getDashboardMcpTokensAction } from '@/app/actions/dashboard/mcpToken.action';
import { getTranslations } from 'next-intl/server';
import { env } from '@/lib/env';
import { isFeatureEnabled } from '@/lib/feature-flags';
import SettingsPageHeader from '@/components/settings/SettingsPageHeader';
import SettingsSection from '@/components/settings/SettingsSection';
import { McpConnectInfo } from './McpConnectInfo';
import { McpTokenManager } from './McpTokenManager';

interface McpPageProps {
  params: Promise<{
    dashboardId: string;
  }>;
}

export default async function MCPSettingsPage({ params }: McpPageProps) {
  const { dashboardId } = await params;
  const view = await getDashboardMcpTokensAction(dashboardId);
  const t = await getTranslations('mcp');
  const tSidebar = await getTranslations('dashboard.settings.sidebar');

  return (
    <div>
      <SettingsPageHeader title={tSidebar('mcp')} />
      <div className='space-y-12'>
        <SettingsSection title={t('connect.title')} description={t('connect.description')}>
          <McpConnectInfo
            endpointUrl={isFeatureEnabled('isCloud') ? undefined : `${env.PUBLIC_BASE_URL}/api/mcp`}
          />
        </SettingsSection>
        {view.canManage && (
          <SettingsSection title={t('tokens.title')} description={t('tokens.description')}>
            <McpTokenManager dashboardId={dashboardId} tokens={view.tokens} />
          </SettingsSection>
        )}
      </div>
    </div>
  );
}
