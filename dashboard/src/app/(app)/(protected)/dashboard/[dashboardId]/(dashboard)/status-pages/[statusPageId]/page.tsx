import { notFound } from 'next/navigation';
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

  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <StatusPageEditor
        dashboardId={dashboardId}
        statusPage={editorData.statusPage}
        publicBaseUrl={env.PUBLIC_BASE_URL}
        dashboardDomain={editorData.dashboardDomain}
      />
    </div>
  );
}
