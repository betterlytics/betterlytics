import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';
import { fetchStatusPageEditorDataAction } from '@/app/actions/analytics/statusPage.actions';
import { env } from '@/lib/env';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { StatusPageEditor } from './StatusPageEditor';

type StatusPageEditorParams = {
  params: Promise<{ dashboardId: string; statusPageId: string }>;
};

export default async function StatusPageEditorPage({ params }: StatusPageEditorParams) {
  if (!isFeatureEnabled('enablePublicStatusPages')) {
    notFound();
  }

  const { dashboardId, statusPageId } = await params;
  const editorData = await fetchStatusPageEditorDataAction(dashboardId, statusPageId);
  if (!editorData) {
    notFound();
  }

  const previewMessages = (await getMessages({ locale: 'en' })).publicStatusPage as Record<string, unknown>;

  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <StatusPageEditor
        dashboardId={dashboardId}
        statusPage={editorData.statusPage}
        monitors={editorData.monitors}
        publicBaseUrl={env.PUBLIC_BASE_URL}
        dashboardDomain={editorData.dashboardDomain}
        previewPayload={editorData.previewPayload}
        previewMessages={previewMessages}
      />
    </div>
  );
}
