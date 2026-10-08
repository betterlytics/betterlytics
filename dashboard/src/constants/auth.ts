/** Our sign-up gate's refusal. An OAuth sign-up gets it back on /signin as `?error=`, its spaces as underscores. */
export const SIGNUP_DISABLED_MESSAGE = 'Registration is disabled on this instance';

/** Where sign-in goes when nothing asked for somewhere else. */
export const SIGN_IN_REDIRECT_DEFAULT = '/dashboards';
