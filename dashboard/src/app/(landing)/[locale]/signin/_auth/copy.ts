import 'server-only';
import { getTranslations } from 'next-intl/server';

/** Lab-only strings the message catalogue doesn't have yet; English until a direction is picked. */
const LAB_COPY = {
  welcomeBack: 'Welcome back',
  emailExample: 'you@company.com',
  forgotShort: 'Forgot?',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  continueWithEmail: 'Continue with email',
  verify: 'Verify',
  back: 'Back',
  newHere: 'New to Betterlytics?',
  createAccount: 'Create an account',
  signUp: 'Sign up',
  terms: 'Terms',
  privacy: 'Privacy',
  status: 'Status',
  docs: 'Docs',
  legalLead: 'By continuing, you agree to our',
  and: 'and',
  selfHosted: 'Ask your administrator for an account.',
  signInEyebrow: 'Sign in',
  voltLede: 'Sign in to see what your visitors did while you were away.',
  voltTitle: 'Your visitors, wherever they are.',
  voltTitleMuted: 'Counted without cookies.',
  whatsNew: 'What’s new',
  blueprintLede: 'One account for analytics, session replay, errors and uptime.',
  horizonTitle: 'Sign in to Betterlytics',
  backToSite: 'betterlytics.io',
  meridianLede: 'Sign in to your dashboard.',
  meridianCaption: 'Every visit is processed in the EU',
  signUpTitle: 'Create your account',
  signUpLede: 'Free to start, no card needed',
  createAccountSubmit: 'Create account',
  creatingAccount: 'Creating account…',
  passwordRules: 'Your password needs',
  ruleLength: '8+ characters',
  ruleLower: 'One lowercase',
  ruleUpper: 'One uppercase',
  termsLong: 'Terms of Service',
  privacyLong: 'Privacy Policy',
  haveAccount: 'Already have an account?',
  signInLink: 'Sign in',
  forgotTitle: 'Reset your password',
  forgotLede: 'We’ll email you a link',
  sendLink: 'Send reset link',
  sendingLink: 'Sending…',
  sentTitle: 'Check your inbox',
  sentBody: 'If an account exists for {email}, a reset link is on its way. It works for one hour.',
  differentEmail: 'Use a different email',
  backToSignIn: 'Back to sign in',
} as const;

export async function getSignInCopy({ error, registration }: { error?: string; registration?: string }) {
  const t = await getTranslations('public.auth.signin');
  const tOnboarding = await getTranslations('onboarding');
  const tAccount = await getTranslations('onboarding.account.form');
  const tForgot = await getTranslations('public.auth.forgotPassword');

  const pageError = !error
    ? null
    : error === 'CredentialsSignin'
      ? t('errors.CredentialsSignin')
      : error === 'OAuthAccountNotLinked'
        ? t('errors.OAuthAccountNotLinked')
        : t('errors.default');

  return {
    ...LAB_COPY,
    title: t('title'),
    subtitle: t('subtitle'),
    emailLabel: t('form.emailLabel'),
    passwordLabel: t('form.passwordLabel'),
    forgotPassword: t('form.forgotPassword'),
    submit: t('form.submitButton'),
    submitting: t('form.submitting'),
    or: t('form.orDivider'),
    google: t('form.continueWithGoogle'),
    github: t('form.continueWithGithub'),
    errors: {
      invalidOtp: t('form.errors.invalidOtp'),
      invalidCredentials: t('form.errors.invalidCredentials'),
      generic: t('form.errors.generic'),
    },
    twoFactor: {
      title: t('form.twoFactor.title'),
      description: t('form.twoFactor.description'),
    },
    signUpErrors: {
      generic: tAccount('signUpError'),
      checkInput: tAccount('checkInput'),
      signInAfter: tAccount('registrationSuccessfulButSignInFailed'),
    },
    forgotErrors: {
      failed: tForgot('errorMessage'),
      invalidEmail: tForgot('errorMessageInvalidEmail'),
    },
    noAccount: t('cta.noAccount'),
    createOne: t('cta.createOne'),
    pageError,
    notice: registration === 'disabled' ? tOnboarding('registrationDisabled') : null,
  };
}

export type SignInCopy = Awaited<ReturnType<typeof getSignInCopy>>;
