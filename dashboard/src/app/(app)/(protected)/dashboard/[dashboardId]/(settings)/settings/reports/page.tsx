import ReportsSettings from './ReportsSettings';
import { isFeatureEnabled } from '@/lib/feature-flags';

export default function ReportsSettingsPage() {
  const emailsEnabled = isFeatureEnabled('enableEmails');
  return <ReportsSettings emailsEnabled={emailsEnabled} />;
}
