import { featurePage } from '@/landing/components/feature/featurePage';
import { ErrorsPage } from './errorsPage';

const page = featurePage('errors', '/features/error-tracking', ErrorsPage);

export const revalidate = 86400;
export const generateMetadata = page.generateMetadata;
export default page.Page;
