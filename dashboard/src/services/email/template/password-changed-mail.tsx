import { sharedEmailEnv } from '@/lib/env/shared.env';
import type { EmailData } from '@/services/email/types';
import {
  EmailButton,
  EmailLayout,
  Greeting,
  H1,
  P,
  renderEmailTemplate,
  SupportLine,
  withEmailUtm,
} from './_components';

const CAMPAIGN = 'password_changed';

export interface PasswordChangedEmailData extends EmailData {
  userName: string | null;
  resetPasswordUrl: string;
}

export function PasswordChangedEmail({ userName, resetPasswordUrl }: PasswordChangedEmailData) {
  return (
    <EmailLayout preview='Your Betterlytics password was just changed' campaign={CAMPAIGN}>
      <H1>Your password was changed</H1>

      <Greeting userName={userName} />

      <P>Your Betterlytics account password was just changed.</P>

      <P>
        If this was you, no further action is needed. If you didn't make this change, your account may be
        compromised — reset your password immediately and{' '}
        {sharedEmailEnv.isCloud ? 'let us know' : 'let your administrator know'}.
      </P>

      <EmailButton href={withEmailUtm(resetPasswordUrl, CAMPAIGN, 'primary_cta')}>Reset password</EmailButton>

      <SupportLine />
    </EmailLayout>
  );
}

PasswordChangedEmail.PreviewProps = {
  to: 'user@example.com',
  userName: 'John Doe',
  resetPasswordUrl: 'https://betterlytics.io/forgot-password',
} satisfies PasswordChangedEmailData;

export default PasswordChangedEmail;

export const createPasswordChangedEmailTemplate = (data: PasswordChangedEmailData) =>
  renderEmailTemplate(PasswordChangedEmail, data, 'Your Betterlytics password was changed');
