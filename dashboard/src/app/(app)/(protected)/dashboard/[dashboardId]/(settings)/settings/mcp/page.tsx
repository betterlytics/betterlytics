import { getDashboardMcpTokensAction } from '@/app/actions/dashboard/mcpToken.action';
import { getDashboardSettingsAction } from '@/app/actions/dashboard/dashboardSettings.action';
import { getTranslations } from 'next-intl/server';
import { env } from '@/lib/env';
import SettingsPageHeader from '@/components/settings/SettingsPageHeader';
import SettingsSection from '@/components/settings/SettingsSection';
import { AiAccessSetting } from './AiAccessSetting';
import { McpConnectInfo } from './McpConnectInfo';
import { McpAccessList } from './McpAccessList';

interface McpPageProps {
  params: Promise<{
    dashboardId: string;
  }>;
}

export default async function MCPSettingsPage({ params }: McpPageProps) {
  const { dashboardId } = await params;
  const [view, settings] = await Promise.all([
    getDashboardMcpTokensAction(dashboardId),
    getDashboardSettingsAction(dashboardId),
  ]);
  const t = await getTranslations('mcp');
  const tSidebar = await getTranslations('dashboard.settings.sidebar');

  const now = new Date();
  const access = view.canManage
    ? {
        connections: view.connections.length,
        // an expired token reads nothing already
        tokens: view.tokens.filter((token) => token.expiresAt === null || token.expiresAt > now).length,
      }
    : null;

  return (
    <div>
      <SettingsPageHeader title={tSidebar('mcp')} />
      <div className='space-y-12'>
        <SettingsSection title={t('connect.title')} description={t('connect.description')}>
          <McpConnectInfo endpointUrl={`${env.PUBLIC_BASE_URL}/api/mcp`} />
        </SettingsSection>
        <SettingsSection title={t('aiAccess.title')}>
          <AiAccessSetting dashboardId={dashboardId} initialEnabled={settings.aiAccessEnabled} access={access} />
        </SettingsSection>
        {view.canManage && (
          <SettingsSection
            title={t('access.title')}
            description={settings.aiAccessEnabled ? t('access.description') : t('access.descriptionOff')}
          >
            <McpAccessList dashboardId={dashboardId} connections={view.connections} tokens={view.tokens} />
          </SettingsSection>
        )}
      </div>
    </div>
  );
}
