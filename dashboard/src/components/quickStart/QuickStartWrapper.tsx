import { getQuickStartProgressAction } from '@/app/actions/dashboard/quickStart.action';
import { QuickStartProvider } from './QuickStartContext';
import { QuickStartCard } from './QuickStartCard';

type QuickStartWrapperProps = {
  dashboardId: string;
  children: React.ReactNode;
};

export async function QuickStartWrapper({ dashboardId, children }: QuickStartWrapperProps) {
  try {
    const progress = await getQuickStartProgressAction(dashboardId);

    if (progress.percentage === 100) {
      return <>{children}</>;
    }

    return (
      <QuickStartProvider dashboardId={dashboardId} initialProgress={progress}>
        {children}
        <QuickStartCard dashboardId={dashboardId} />
      </QuickStartProvider>
    );
  } catch (error) {
    console.error('Failed to load quick start progress:', error);
    return <>{children}</>;
  }
}
