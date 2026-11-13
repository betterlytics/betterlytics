import { featurePage } from '@/landing/components/feature/featurePage';
import { AnalyticsPage } from './analyticsPage';

const page = featurePage('analytics', '/features/web-analytics', AnalyticsPage);

export const revalidate = 86400;
export const generateMetadata = page.generateMetadata;
export default page.Page;
