import { featurePage } from '@/landing/components/feature/featurePage';
import { VitalsPage } from './vitalsPage';

const page = featurePage('vitals', '/features/core-web-vitals', VitalsPage);

export const revalidate = 86400;
export const generateMetadata = page.generateMetadata;
export default page.Page;
