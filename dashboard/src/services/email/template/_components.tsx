import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import { sharedEmailEnv } from '@/lib/env/shared.env';
import type { ReactNode } from 'react';

type LayoutProps = {
  preview: string;
  children: ReactNode;
  signature?: ReactNode | null;
  footer?: ReactNode | null;
};

export function EmailLayout({ preview, children, signature, footer }: LayoutProps) {
  const resolvedSignature = signature === undefined ? <EmailSignature /> : signature;
  const resolvedFooter = footer === undefined ? <EmailFooter /> : footer;

  return (
    <Tailwind>
      <Html lang="en">
        <Head />
        <Preview>{preview}</Preview>
        <Body className="m-0 bg-slate-50 px-5 py-10 font-sans text-slate-800">
          <Container className="mx-auto max-w-[600px]">
            <Section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 sm:p-10">
              <EmailHeader />
              {children}
              {resolvedSignature}
            </Section>
            {resolvedFooter}
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

export function EmailHeader() {
  return (
    <Section className="mb-8 border-b border-slate-200 pb-5">
      <Row>
        <Column className="w-12 pr-3 align-middle">
          <Img
            src="https://betterlytics.io/betterlytics-logo-dark-simple-96x96-q75.png"
            alt="Betterlytics"
            width={48}
            height={48}
            className="block"
          />
        </Column>
        <Column className="align-middle">
          <Text className="m-0 text-xl font-semibold text-slate-800">Betterlytics</Text>
        </Column>
      </Row>
    </Section>
  );
}

export function EmailFooter() {
  return (
    <Section className="mt-8 p-5 text-center">
      <Text className="m-0 text-xs leading-relaxed text-slate-400">
        Powered by{' '}
        <Link href="https://betterlytics.io" className="text-slate-400 underline">
          Betterlytics
        </Link>
        <br />
        You're receiving this email because you have an account on this analytics platform.
      </Text>
    </Section>
  );
}

export function EmailSignature() {
  if (!sharedEmailEnv.isCloud) return null;
  return (
    <Section className="mt-10 pt-8">
      <Hr className="mb-5 border-slate-200" />
      <Text className="m-0 mb-5 text-base font-medium text-slate-500">
        Best regards,
        <br />
        <strong className="text-slate-700">The Betterlytics Team</strong>
      </Text>
      <Section>
        <Link href="https://betterlytics.io" className="mr-4 font-medium text-blue-600 no-underline">
          Website
        </Link>
        <Link href="mailto:support@betterlytics.io" className="mr-4 font-medium text-blue-600 no-underline">
          Support
        </Link>
        <Link href="https://betterlytics.io/docs" className="font-medium text-blue-600 no-underline">
          Documentation
        </Link>
      </Section>
    </Section>
  );
}

export type ButtonVariant = 'primary' | 'success' | 'danger' | 'warning';

const buttonVariantClass: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white',
  success: 'bg-green-600 text-white',
  danger: 'bg-red-600 text-white',
  warning: 'bg-amber-500 text-white',
};

export function EmailButton({
  href,
  variant = 'primary',
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  children: ReactNode;
}) {
  return (
    <Section className="my-8 text-center">
      <Button
        href={href}
        className={`${buttonVariantClass[variant]} rounded-lg px-7 py-3.5 text-base font-semibold no-underline`}
      >
        {children}
      </Button>
    </Section>
  );
}

export type InfoBoxVariant = 'info' | 'success' | 'warning' | 'error';

const infoBoxClass: Record<InfoBoxVariant, string> = {
  info: 'bg-blue-50 border-blue-600',
  success: 'bg-green-50 border-green-600',
  warning: 'bg-amber-50 border-amber-500',
  error: 'bg-red-50 border-red-600',
};

const infoBoxHeadingClass: Record<InfoBoxVariant, string> = {
  info: 'text-blue-700',
  success: 'text-green-700',
  warning: 'text-amber-600',
  error: 'text-red-600',
};

export function InfoBox({
  variant = 'info',
  title,
  children,
}: {
  variant?: InfoBoxVariant;
  title?: string;
  children: ReactNode;
}) {
  return (
    <Section className={`${infoBoxClass[variant]} my-6 rounded-r-lg border-l-4 p-5`}>
      {title && (
        <Heading
          as="h3"
          className={`${infoBoxHeadingClass[variant]} m-0 mb-2.5 text-lg font-semibold`}
        >
          {title}
        </Heading>
      )}
      {children}
    </Section>
  );
}

export function ContentSection({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <Section className={`my-5 rounded-lg border border-slate-200 bg-slate-50 p-6 ${className}`.trim()}>
      {children}
    </Section>
  );
}

export function H1({ children }: { children: ReactNode }) {
  return (
    <Heading as="h1" className="m-0 mb-5 text-3xl font-bold leading-tight text-slate-800">
      {children}
    </Heading>
  );
}

export function H2({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <Heading as="h2" className={`mt-8 mb-4 text-[22px] font-semibold text-slate-700 ${className}`.trim()}>
      {children}
    </Heading>
  );
}

export function P({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <Text className={`my-4 text-base leading-relaxed text-slate-600 ${className}`.trim()}>{children}</Text>;
}

export function PrimaryLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`font-medium text-blue-600 no-underline ${className}`.trim()}>
      {children}
    </Link>
  );
}
