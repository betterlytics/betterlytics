import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getDashboardAIInsights } from '@/app/actions/aiInsights';

import { remark } from 'remark';
import html from 'remark-html';

type AIInsightsPageParams = {
  params: Promise<{ dashboardId: string }>;
};

export default async function AIInsightsPage({ params }: AIInsightsPageParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  const { dashboardId } = await params;

  const aiInsightsPromise = await getDashboardAIInsights(dashboardId);

  const processedContent = await remark().use(html).process(aiInsightsPromise);
  const content = processedContent.toString();

  return <div className='container space-y-6 p-6' dangerouslySetInnerHTML={{ __html: content }}></div>;
}
