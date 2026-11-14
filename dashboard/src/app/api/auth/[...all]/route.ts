import { toNextJsHandler } from 'better-auth/next-js';
import { handleAuthRequest } from '@/mcp/auth/auth-handler';

export const { GET, POST } = toNextJsHandler(handleAuthRequest);
