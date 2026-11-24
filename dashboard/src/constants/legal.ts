export const CURRENT_TERMS_VERSION = 1;

/** Whether the user has yet to accept the current terms: never, or an older version. They bind on cloud only. */
export function hasPendingTerms(user: { termsAcceptedAt?: Date | null; termsAcceptedVersion?: number | null }) {
  return !user.termsAcceptedAt || user.termsAcceptedVersion !== CURRENT_TERMS_VERSION;
}
