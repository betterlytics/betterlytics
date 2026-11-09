import { createAuthClient } from 'better-auth/react';
import { twoFactorClient, inferAdditionalFields } from 'better-auth/client/plugins';
import { oauthProviderClient } from '@better-auth/oauth-provider/client';
import type { auth } from '@/lib/better-auth';

export const authClient = createAuthClient({
  // oauthProviderClient carries a signed MCP authorization request from the page URL into sign-in, so signing in
  // continues it; pages without one are unaffected
  plugins: [twoFactorClient(), inferAdditionalFields<typeof auth>(), oauthProviderClient()],
});
