import type { EmailData } from '@/services/email/types';
import { EmailLayout, Greeting, H1, P, PrimaryLink, renderEmailTemplate } from './_components';

const CAMPAIGN = 'two_factor_enabled';

export interface TwoFactorEnabledEmailData extends EmailData {
  userName: string | null;
}

export function TwoFactorEnabledEmail({ userName }: TwoFactorEnabledEmailData) {
  return (
    <EmailLayout
      preview='Two-factor authentication is now enabled on your Betterlytics account'
      campaign={CAMPAIGN}
    >
      <H1>Two-factor authentication enabled</H1>

      <Greeting userName={userName} />

      <P>
        Two-factor authentication (2FA) is now active on your Betterlytics account. From now on, you'll need a
        code from your authenticator app each time you sign in.
      </P>

      <P>
        If you didn't enable 2FA, your account may be compromised — contact us immediately at{' '}
        <PrimaryLink href='mailto:support@betterlytics.io'>support@betterlytics.io</PrimaryLink>.
      </P>
    </EmailLayout>
  );
}

TwoFactorEnabledEmail.PreviewProps = {
  to: 'user@example.com',
  userName: 'John Doe',
} satisfies TwoFactorEnabledEmailData;

export default TwoFactorEnabledEmail;

export const createTwoFactorEnabledEmailTemplate = (data: TwoFactorEnabledEmailData) =>
  renderEmailTemplate(TwoFactorEnabledEmail, data, 'Two-factor authentication enabled');
