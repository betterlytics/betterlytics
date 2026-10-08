import type { SignInCopy } from './copy';
import type { AuthHrefs } from './hrefs';

export type Method = 'email' | 'google' | 'github';
export type OAuthProvider = Exclude<Method, 'email'>;
export type Providers = Record<OAuthProvider, boolean>;

/** Lab-only: pins the page in a state that is hard to reach by hand. */
export type PreviewState = 'error' | 'otp' | 'loading' | null;

export type VariantProps = {
  copy: SignInCopy;
  providers: Providers;
  registration: boolean;
  forgotPassword: boolean;
  preview: PreviewState;
  /** Defaults to the app's routes. */
  hrefs?: AuthHrefs;
};

/** Lab-only states for the sign-up and reset pages. */
export type FlowPreview = 'error' | 'loading' | 'sent' | null;

export type FlowProps = {
  copy: SignInCopy;
  providers: Providers;
  preview: FlowPreview;
  hrefs: AuthHrefs;
};
