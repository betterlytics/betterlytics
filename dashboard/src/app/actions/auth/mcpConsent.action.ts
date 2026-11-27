'use server';

import { headers } from 'next/headers';
import { withUserAuth } from '@/auth/auth-actions';
import { McpGrantSelectionSchema, type McpGrantSelection } from '@/entities/dashboard/mcpOAuth.entities';
import { CURRENT_TERMS_VERSION, hasPendingTerms } from '@/constants/legal';
import { UserException } from '@/lib/exceptions';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { isMcpOAuthEnabled } from '@/mcp/auth/oauth';
import { acceptUserTerms } from '@/services/auth/user.service';
import { allowMcpConsent, denyMcpConsent } from '@/services/auth/mcpConsent.service';

function requireMcpOAuth() {
  if (!isMcpOAuthEnabled()) throw new UserException('This connection request is no longer valid');
}

export const allowMcpConsentAction = withUserAuth(
  async (
    user,
    oauthQuery: string,
    selection: McpGrantSelection,
    acceptedTerms?: boolean,
  ): Promise<{ url: string }> => {
    requireMcpOAuth();
    // an account made with Google or GitHub on the way here hasn't seen the terms
    if (isFeatureEnabled('isCloud') && hasPendingTerms(user)) {
      if (acceptedTerms !== true) throw new UserException('Terms of service must be accepted');
      await acceptUserTerms(user.id, CURRENT_TERMS_VERSION);
    }
    // a copy: the provider sets headers on the request it is handed
    const url = await allowMcpConsent(
      user.id,
      oauthQuery,
      McpGrantSelectionSchema.parse(selection),
      new Headers(await headers()),
    );
    return { url };
  },
);

export const denyMcpConsentAction = withUserAuth(async (_user, oauthQuery: string): Promise<{ url: string }> => {
  requireMcpOAuth();
  return { url: await denyMcpConsent(oauthQuery, new Headers(await headers())) };
});
