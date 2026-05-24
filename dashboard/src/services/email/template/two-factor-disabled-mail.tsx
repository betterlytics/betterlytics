import type { EmailData } from '@/services/email/types';
import { EmailLayout, Greeting, H1, P, PrimaryLink, renderEmailTemplate } from './_components';

const CAMPAIGN = 'two_factor_disabled';

export interface TwoFactorDisabledEmailData extends EmailData {
  userName: string | null;
}

export function TwoFactorDisabledEmail({ userName }: TwoFactorDisabledEmailData) {
  return (
    <EmailLayout
      preview='Two-factor authentication has been disabled on your Betterlytics account'
      campaign={CAMPAIGN}
    >
      <H1>Two-factor authentication disabled</H1>

      <Greeting userName={userName} />

      <P>
        Two-factor authentication (2FA) was just disabled on your Betterlytics account. Your account is now
        protected by password only.
      </P>

      <P>
        If this wasn't you, re-enable 2FA immediately, reset your password, and contact us at{' '}
        <PrimaryLink href='mailto:support@betterlytics.io'>support@betterlytics.io</PrimaryLink>.
      </P>
    </EmailLayout>
  );
}

TwoFactorDisabledEmail.PreviewProps = {
  to: 'user@example.com',
  userName: 'John Doe',
} satisfies TwoFactorDisabledEmailData;

export default TwoFactorDisabledEmail;

export const createTwoFactorDisabledEmailTemplate = (data: TwoFactorDisabledEmailData) =>
  renderEmailTemplate(TwoFactorDisabledEmail, data, 'Two-factor authentication disabled');
