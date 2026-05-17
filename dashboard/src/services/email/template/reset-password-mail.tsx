import { Link } from '@react-email/components';
import { sharedEmailEnv } from '@/lib/env/shared.env';
import type { EmailData } from '@/services/email/types';
import {
  ContentSection,
  EmailButton,
  EmailLayout,
  H1,
  H2,
  InfoBox,
  P,
  PrimaryLink,
  renderEmailTemplate,
  withEmailUtm,
} from './_components';

const CAMPAIGN = 'reset_password';

export interface ResetPasswordEmailData extends EmailData {
  userName?: string | null;
  resetUrl: string;
  expirationTime: string;
}

export function ResetPasswordEmail({ userName, resetUrl, expirationTime }: ResetPasswordEmailData) {
  return (
    <EmailLayout preview='Reset your Betterlytics password' campaign={CAMPAIGN}>
      <H1>Reset Your Password</H1>

      <P>
        {userName ? (
          <>
            Hi <strong>{userName}</strong>,
          </>
        ) : (
          <>Hi,</>
        )}
      </P>

      <P>
        We received a request to reset your password for your Betterlytics account. If you made this request, click
        the button below to reset your password.
      </P>

      <EmailButton href={withEmailUtm(resetUrl, CAMPAIGN, 'primary_cta')}>Reset Password</EmailButton>

      <InfoBox variant='warning' title='Security Notice'>
        <P className='m-0 text-sm'>
          This password reset link will expire in <strong>{expirationTime}</strong> for security reasons.
        </P>
        <P className='m-0 mt-2 text-sm'>
          If you didn't request this password reset, you can safely ignore this email. Your password will remain
          unchanged.
        </P>
      </InfoBox>

      <ContentSection>
        <H2 className='mt-0'>Having Trouble?</H2>
        <P>If the button above doesn't work, you can copy and paste this link into your browser:</P>
        <Link
          href={withEmailUtm(resetUrl, CAMPAIGN, 'fallback_link')}
          className='font-mono text-sm break-all text-blue-600 no-underline'
        >
          {resetUrl}
        </Link>
        {sharedEmailEnv.isCloud && (
          <>
            <P>If you continue to have problems, contact our support team:</P>
            <PrimaryLink href='mailto:support@betterlytics.io'>support@betterlytics.io</PrimaryLink>
          </>
        )}
      </ContentSection>

      <P>If you need a new reset link after it expires, you can request another one from the login page.</P>
    </EmailLayout>
  );
}

ResetPasswordEmail.PreviewProps = {
  to: 'user@example.com',
  userName: 'John Doe',
  resetUrl: 'https://betterlytics.io/reset-password?token=abc123xyz',
  expirationTime: '30 minutes',
} satisfies ResetPasswordEmailData;

export default ResetPasswordEmail;

export const createResetPasswordEmailTemplate = (data: ResetPasswordEmailData) =>
  renderEmailTemplate(ResetPasswordEmail, data, 'Reset Your Betterlytics Password');
