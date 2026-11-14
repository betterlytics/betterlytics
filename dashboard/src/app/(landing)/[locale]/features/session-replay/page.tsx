import { featurePage } from '@/landing/components/feature/featurePage';
import { ReplayPage } from './replayPage';

const page = featurePage('replay', '/features/session-replay', ReplayPage);

export const revalidate = 86400;
export const generateMetadata = page.generateMetadata;
export default page.Page;
