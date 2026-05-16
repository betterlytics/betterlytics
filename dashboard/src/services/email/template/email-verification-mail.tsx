import { Link, Section, Text } from '@react-email/components';
import { sharedEmailEnv } from '@/lib/env/shared.env';
import type { EmailData } from '@/services/email/types';
import {
  EmailButton,
  EmailLayout,
  H1,
  InfoBox,
  P,
  PrimaryLink,
  renderEmailTemplate,
  withEmailUtm,
} from './_components';

const CAMPAIGN = 'email_verification';

export interface EmailVerificationData extends EmailData {
  userName: string;
  verificationUrl: string;
}

type Resource = { text: string; url: string; description: string };

function getResources(): Resource[] {
  return [
    {
      text: 'Installation Guide',
      url: 'https://betterlytics.io/docs/installation',
      description: 'Add tracking to your website in minutes',
    },
    {
      text: 'Dashboard Overview',
      url: 'https://betterlytics.io/docs/dashboard',
      description: 'Make the most of your analytics data',
    },
    {
      text: 'Pricing Plans',
      url: `${sharedEmailEnv.publicBaseUrl}/billing`,
      description: 'Explore features and upgrade options',
    },
  ];
}

export function EmailVerificationEmail({ userName, verificationUrl }: EmailVerificationData) {
  const resources = getResources();

  return (
    <EmailLayout preview='Verify your Betterlytics email address' campaign={CAMPAIGN}>
      <H1>Verify Your Email Address</H1>

      <P>
        Hi <strong>{userName}</strong>,
      </P>

      <P>
        Welcome to Betterlytics! To complete your registration, please verify your email address by clicking the
        button below.
      </P>

      <EmailButton href={withEmailUtm(verificationUrl, CAMPAIGN, 'primary_cta')}>Verify Email Address</EmailButton>

      <InfoBox variant='info' title='Security Notice'>
        <P className='m-0 text-sm'>
          This verification link will expire in <strong>24 hours</strong> for your security. If you didn't create
          an account with Betterlytics, you can safely ignore this email.
        </P>
      </InfoBox>

      <Section className='my-5 rounded-lg border border-slate-200 bg-slate-50 p-6'>
        <Text className='m-0 mb-2 text-[22px] font-semibold text-slate-700'>What's Next?</Text>
        <P>Check out these helpful guides to get started:</P>
        <ul className='my-5 list-disc pl-5'>
          {resources.map((r) => (
            <li key={r.url} className='my-2 text-slate-600'>
              <PrimaryLink href={withEmailUtm(r.url, CAMPAIGN)}>{r.text}</PrimaryLink>
              <span className='text-slate-600'> - {r.description}</span>
            </li>
          ))}
        </ul>
      </Section>

      <P>If the button above doesn't work, you can copy and paste this link into your browser:</P>
      <Link
        href={withEmailUtm(verificationUrl, CAMPAIGN, 'fallback_link')}
        className='block rounded bg-slate-100 p-2.5 font-mono text-sm break-all text-slate-600 no-underline'
      >
        {verificationUrl}
      </Link>

      <P>
        If you have any questions or need assistance, don't hesitate to reach out to our support team at{' '}
        <PrimaryLink href='mailto:support@betterlytics.io'>support@betterlytics.io</PrimaryLink>.
      </P>
    </EmailLayout>
  );
}

EmailVerificationEmail.PreviewProps = {
  to: 'user@example.com',
  userName: 'John Doe',
  verificationUrl: 'https://betterlytics.io/verify-email?token=sample-token-123',
} satisfies EmailVerificationData;

export default EmailVerificationEmail;

export const createEmailVerificationTemplate = (data: EmailVerificationData) =>
  renderEmailTemplate(EmailVerificationEmail, data, 'Verify your email address for Betterlytics');
