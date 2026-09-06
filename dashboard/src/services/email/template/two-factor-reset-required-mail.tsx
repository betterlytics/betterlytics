import type { EmailData } from '@/services/email/types';
import {
  EmailButton,
  EmailLayout,
  Greeting,
  H1,
  P,
  PrimaryLink,
  renderEmailTemplate,
  withEmailUtm,
} from './_components';

const CAMPAIGN = 'two_factor_reset_required';

export interface TwoFactorResetRequiredEmailData extends EmailData {
  userName: string | null;
  signInUrl: string;
}

export function TwoFactorResetRequiredEmail({ userName, signInUrl }: TwoFactorResetRequiredEmailData) {
  return (
    <EmailLayout
      preview='Please re-enable two-factor authentication on your Betterlytics account'
      campaign={CAMPAIGN}
    >
      <H1>Action needed: re-enable two-factor authentication</H1>

      <Greeting userName={userName} />

      <P>
        We&apos;ve upgraded the authentication system behind Betterlytics. Unfortunately, the new system verifies
        authenticator codes differently, and your two-factor authentication (2FA) enrollment could not be carried
        over, so we had to turn 2FA off on your account.
      </P>

      <P>
        This change was made by us as part of the upgrade. It is not a sign of suspicious activity, and nothing
        else about your account has changed. Your password still works as usual.
      </P>

      <P>
        To protect your account with 2FA again, sign in, open <strong>Settings &rarr; Security</strong> from your
        avatar menu, and enable two-factor authentication. Your authenticator app will get a new QR code, and you
        can delete the old Betterlytics entry, as it no longer produces valid codes.
      </P>

      <EmailButton href={withEmailUtm(signInUrl, CAMPAIGN, 'primary_cta')}>Sign in and re-enable 2FA</EmailButton>

      <P className='text-sm text-slate-500'>
        Questions? Reply to this email or write to{' '}
        <PrimaryLink href='mailto:support@betterlytics.io'>support@betterlytics.io</PrimaryLink>.
      </P>
    </EmailLayout>
  );
}

TwoFactorResetRequiredEmail.PreviewProps = {
  to: 'user@example.com',
  userName: 'John Doe',
  signInUrl: 'https://betterlytics.io/signin',
} satisfies TwoFactorResetRequiredEmailData;

export default TwoFactorResetRequiredEmail;

export const createTwoFactorResetRequiredEmailTemplate = (data: TwoFactorResetRequiredEmailData) =>
  renderEmailTemplate(TwoFactorResetRequiredEmail, data, 'Re-enable two-factor authentication on your account');
