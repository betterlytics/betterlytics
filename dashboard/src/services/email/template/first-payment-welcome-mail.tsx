import { Column, Row, Section, Text } from '@react-email/components';
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
} from './_components';

export interface FirstPaymentWelcomeEmailData extends EmailData {
  userName: string;
  planName: string;
  monthlyEventLimit: string;
  dashboardUrl: string;
  billingAmount: string;
  newFeatures: { title: string; description: string }[];
}

export function FirstPaymentWelcomeEmail({
  userName,
  planName,
  monthlyEventLimit,
  dashboardUrl,
  billingAmount,
  newFeatures,
}: FirstPaymentWelcomeEmailData) {
  return (
    <EmailLayout preview={`Welcome to the ${planName} plan — your premium features are active`}>
      <H1>Welcome to the {planName} plan!</H1>

      <P>
        Hi <strong>{userName}</strong>,
      </P>

      <P>
        Thank you for upgrading to Betterlytics {planName}! Your payment has been processed successfully, and all
        premium features are now active on your account.
      </P>

      <InfoBox variant="success" title="Your Account is Now Upgraded">
        <UpgradeRow label="Plan" value={planName} border />
        <UpgradeRow label="Monthly Events" value={monthlyEventLimit} border />
        <UpgradeRow label="Billing" value={billingAmount} />
      </InfoBox>

      <EmailButton href={dashboardUrl}>Access Your Dashboard</EmailButton>

      <ContentSection>
        <H2 className="mt-0">What's New for You</H2>
        {newFeatures.map((feature, index) => (
          <Row key={feature.title} className="my-4">
            <Column className="w-8 pr-3 align-top">
              <Section className="h-6 w-6 rounded-full bg-blue-600 text-center text-xs font-bold text-white leading-6">
                {index + 1}
              </Section>
            </Column>
            <Column className="align-top">
              <Text className="m-0 text-base font-semibold text-slate-800">{feature.title}</Text>
              <Text className="m-0 text-sm text-slate-500">{feature.description}</Text>
            </Column>
          </Row>
        ))}
      </ContentSection>

      <ContentSection>
        <H2 className="mt-0">Need Help?</H2>
        <P className="text-slate-600">
          Our team is here to help you make the most of your analytics. Check out our documentation or reach out
          directly:
        </P>
        <P className="my-2">
          <PrimaryLink href="https://betterlytics.io/docs">Documentation</PrimaryLink>
        </P>
        <P className="my-2">
          <PrimaryLink href="mailto:support@betterlytics.io">Support</PrimaryLink>
        </P>
      </ContentSection>

      <P>
        We're excited to see how the {planName} plan helps you gain better insights into your website performance!
      </P>

      <P>Welcome to the team!</P>
    </EmailLayout>
  );
}

function UpgradeRow({ label, value, border }: { label: string; value: string; border?: boolean }) {
  return (
    <Row className={`py-2 ${border ? 'border-b border-slate-200' : ''}`.trim()}>
      <Column className="text-slate-600">
        <strong>{label}:</strong>
      </Column>
      <Column className="text-right text-slate-600">{value}</Column>
    </Row>
  );
}

FirstPaymentWelcomeEmail.PreviewProps = {
  to: 'user@example.com',
  userName: 'John Doe',
  planName: 'Pro',
  monthlyEventLimit: '100K',
  dashboardUrl: 'https://betterlytics.io/dashboards',
  billingAmount: '$19/month',
  newFeatures: [
    {
      title: 'Higher Event Limits',
      description: 'Track up to 100K events per month with no data loss concerns.',
    },
    {
      title: 'Longer Data Retention',
      description:
        'Your data will be retained for 3+ years, giving you more time to analyze, compare and gain insights over time.',
    },
    {
      title: 'Up to 50 sites',
      description: 'Track up to 50 websites with your Pro plan.',
    },
  ],
} satisfies FirstPaymentWelcomeEmailData;

export default FirstPaymentWelcomeEmail;

export const createFirstPaymentWelcomeEmailTemplate = (data: FirstPaymentWelcomeEmailData) =>
  renderEmailTemplate(
    FirstPaymentWelcomeEmail,
    data,
    `Welcome to the ${data.planName} plan! Your premium features are now active`,
  );

