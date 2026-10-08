/** Where the auth pages link to each other. */
export type AuthHrefs = { signIn: string; signUp: string; forgotPassword: string };

export const APP_HREFS: AuthHrefs = { signIn: '/signin', signUp: '/signup', forgotPassword: '/forgot-password' };

/** Lab-only: a direction with its own sign-up and reset pages links between them instead of the app's. */
export const labHrefs = (variant: string): AuthHrefs => ({
  signIn: `/signin/${variant}`,
  signUp: `/signin/${variant}/signup`,
  forgotPassword: `/signin/${variant}/forgot-password`,
});
