import { getMcpTokensAction } from '@/app/actions/dashboard/mcpToken.action';
import { getTranslations } from 'next-intl/server';
import { env } from '@/lib/env';
import SettingsPageHeader from '@/components/settings/SettingsPageHeader';
import SettingsSection from '@/components/settings/SettingsSection';
import { McpTokenManager } from './McpTokenManager';

interface McpPageProps {
  params: Promise<{
    dashboardId: string;
  }>;
}

export default async function MCPSettingsPage({ params }: McpPageProps) {
  const { dashboardId } = await params;
  const tokens = await getMcpTokensAction(dashboardId);
  const t = await getTranslations('mcp');
  const tSidebar = await getTranslations('dashboard.settings.sidebar');

  return (
    <div>
      <SettingsPageHeader title={tSidebar('mcp')} />
      <div className='space-y-12'>
        <SettingsSection title={t('settings.title')} description={t('settings.description')}>
          <McpTokenManager
            dashboardId={dashboardId}
            tokens={tokens}
            endpointUrl={`${env.PUBLIC_BASE_URL}/api/mcp`}
          />
        </SettingsSection>
      </div>
    </div>
  );
}
