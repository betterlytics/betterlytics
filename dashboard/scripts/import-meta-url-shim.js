// The worker bundle is CommonJS, where import.meta.url is undefined; @vercel/otel needs it for createRequire
import { pathToFileURL } from 'node:url';

export const importMetaUrl = pathToFileURL(__filename).href;
