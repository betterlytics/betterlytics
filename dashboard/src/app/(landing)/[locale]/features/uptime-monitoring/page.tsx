import { featurePage } from '@/landing/components/feature/featurePage';
import { UptimePage } from './uptimePage';

const page = featurePage('uptime', '/features/uptime-monitoring', UptimePage);

export const revalidate = 86400;
export const generateMetadata = page.generateMetadata;
export default page.Page;
