'use server';

import { headers } from 'next/headers';
import { withUserAuth } from '@/auth/auth-actions';
import { McpGrantSelectionSchema, type McpGrantSelection } from '@/entities/dashboard/mcpOAuth.entities';
import { UserException } from '@/lib/exceptions';
import { isMcpOAuthEnabled } from '@/mcp/auth/oauth';
import { allowMcpConsent, denyMcpConsent } from '@/services/auth/mcpConsent.service';

function requireMcpOAuth() {
  if (!isMcpOAuthEnabled()) throw new UserException('This connection request is no longer valid');
}

export const allowMcpConsentAction = withUserAuth(
  async (user, oauthQuery: string, selection: McpGrantSelection): Promise<{ url: string }> => {
    requireMcpOAuth();
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
