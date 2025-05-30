import { getDashboardSettingsAction } from '@/app/actions/settings';
import { getDictionaryOrDefault } from '@/dictionaries/dictionaries';

export async function getDictionaryByDashboardId(dashboardId: string) {
  const { language } = await getDashboardSettingsAction(dashboardId);
  return getDictionaryOrDefault(language);
}
