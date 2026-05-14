import { Link } from '@react-email/components';
import { render } from '@react-email/render';
import { sharedEmailEnv } from '@/lib/env/shared.env';
import type { EmailData, EmailTemplate } from '@/services/email/types';
import {
  ContentSection,
  EmailButton,
  EmailLayout,
  H1,
  H2,
  InfoBox,
  P,
  PrimaryLink,
} from './_components';

export interface ResetPasswordEmailData extends EmailData {
  userName: string;
  resetUrl: string;
  expirationTime: string;
}

export function ResetPasswordEmail({ userName, resetUrl, expirationTime }: ResetPasswordEmailData) {
  return (
    <EmailLayout preview="Reset your Betterlytics password">
      <H1>Reset Your Password</H1>

      <P>
        Hi <strong>{userName}</strong>,
      </P>

      <P>
        We received a request to reset your password for your Betterlytics account. If you made this request, click
        the button below to reset your password.
      </P>

      <EmailButton href={resetUrl}>Reset Password</EmailButton>

      <InfoBox variant="warning" title="Security Notice">
        <P className="m-0 text-sm">
          This password reset link will expire in <strong>{expirationTime}</strong> for security reasons.
        </P>
        <P className="m-0 mt-2 text-sm">
          If you didn't request this password reset, you can safely ignore this email. Your password will remain
          unchanged.
        </P>
      </InfoBox>

      <ContentSection>
        <H2 className="mt-0">Having Trouble?</H2>
        <P>If the button above doesn't work, you can copy and paste this link into your browser:</P>
        <Link href={resetUrl} className="font-mono text-sm break-all text-blue-600 no-underline">
          {resetUrl}
        </Link>
        {sharedEmailEnv.isCloud && (
          <>
            <P>If you continue to have problems, contact our support team:</P>
            <PrimaryLink href="mailto:support@betterlytics.io">support@betterlytics.io</PrimaryLink>
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

export async function createResetPasswordEmailTemplate(data: ResetPasswordEmailData): Promise<EmailTemplate> {
  const el = <ResetPasswordEmail {...data} />;
  const [html, text] = await Promise.all([render(el), render(el, { plainText: true })]);
  return { subject: 'Reset Your Betterlytics Password', html, text };
}

export async function getResetPasswordEmailPreview(data?: Partial<ResetPasswordEmailData>): Promise<string> {
  return render(<ResetPasswordEmail {...{ ...ResetPasswordEmail.PreviewProps, ...data }} />);
}
