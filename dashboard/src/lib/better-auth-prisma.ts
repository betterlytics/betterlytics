import { Prisma } from '@prisma/client';
import prisma from '@/lib/postgres';

// The OAuth plugins' optional list fields, stored as Json (see the schema). The plugins write null to them, which
// Prisma only takes for a Json column as DbNull.
const NULLABLE_LIST_FIELDS: Record<string, readonly string[]> = {
  OauthClient: [
    'scopes',
    'clientCredentialsScopes',
    'contacts',
    'postLogoutRedirectUris',
    'grantTypes',
    'responseTypes',
  ],
  OauthResource: ['allowedScopes'],
  OauthRefreshToken: ['resources', 'requestedUserInfoClaims'],
  OauthAccessToken: ['resources', 'requestedUserInfoClaims'],
  OauthConsent: ['resources', 'requestedUserInfoClaims'],
};

function withDbNull(data: unknown, fields: readonly string[]): unknown {
  if (Array.isArray(data)) return data.map((row) => withDbNull(row, fields));
  if (!data || typeof data !== 'object') return data;
  const row = { ...(data as Record<string, unknown>) };
  for (const field of fields) {
    if (row[field] === null) row[field] = Prisma.DbNull;
  }
  return row;
}

/** The Prisma client better-auth's adapter writes through. */
export const authPrisma = prisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, args, query }) {
        const fields = NULLABLE_LIST_FIELDS[model];
        if (!fields || !args || typeof args !== 'object') return query(args);
        const next = { ...(args as Record<string, unknown>) };
        for (const key of ['data', 'create', 'update'] as const) {
          if (key in next) next[key] = withDbNull(next[key], fields);
        }
        return query(next as typeof args);
      },
    },
  },
});
