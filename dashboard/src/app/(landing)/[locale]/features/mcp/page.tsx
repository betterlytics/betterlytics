import { featurePage } from '@/landing/components/feature/featurePage';
import { McpServerPage } from './mcpServerPage';

const page = featurePage('mcpServer', '/features/mcp', McpServerPage);

export const revalidate = 86400;
export const generateMetadata = page.generateMetadata;
export default page.Page;
