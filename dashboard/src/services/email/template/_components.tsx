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
import { render } from '@react-email/render';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { sharedEmailEnv } from '@/lib/env/shared.env';
import { cn } from '@/lib/utils';
import type { EmailTemplate } from '@/services/email/types';

export async function renderEmailTemplate<P extends object>(
  Component: ComponentType<P>,
  props: P,
  subject: string,
): Promise<EmailTemplate> {
  const el = createElement(Component, props);
  const [html, text] = await Promise.all([render(el), render(el, { plainText: true })]);
  return { subject, html, text };
}

/**
 * Append UTM parameters to an outbound email link so clicks are attributable
 * to the email in our analytics. mailto: links and unparseable URLs pass through.
 */
export function withEmailUtm(url: string, campaign: string, content?: string): string {
  if (!sharedEmailEnv.isCloud) return url;
  if (url.startsWith('mailto:')) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('utm_source', 'betterlytics');
    u.searchParams.set('utm_medium', 'email');
    u.searchParams.set('utm_campaign', campaign);
    if (content) u.searchParams.set('utm_content', content);
    return u.toString();
  } catch {
    return url;
  }
}

type LayoutProps = {
  preview: string;
  campaign: string;
  children: ReactNode;
  signature?: ReactNode | null;
  footer?: ReactNode | null;
};

export function EmailLayout({ preview, campaign, children, signature, footer }: LayoutProps) {
  const resolvedSignature = signature === undefined ? <EmailSignature campaign={campaign} /> : signature;
  const resolvedFooter = footer === undefined ? <EmailFooter campaign={campaign} /> : footer;

  return (
    <Tailwind>
      <Html lang='en'>
        <Head />
        <Preview>{preview}</Preview>
        <Body className='m-0 bg-slate-50 px-5 py-10 font-sans text-slate-800'>
          <Container className='mx-auto max-w-[600px]'>
            <Section className='mb-8 rounded-xl border border-slate-200 bg-white p-6 sm:p-10'>
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
    <Section className='mb-8 border-b border-slate-200 pb-5'>
      <Row>
        <Column className='w-12 pr-3 align-middle'>
          <Img
            src='https://betterlytics.io/betterlytics-logo-dark-simple-96x96-q75.png'
            alt='Betterlytics'
            width={48}
            height={48}
            className='block'
          />
        </Column>
        <Column className='align-middle'>
          <Text className='m-0 text-xl font-semibold text-slate-800'>Betterlytics</Text>
        </Column>
      </Row>
    </Section>
  );
}

export function EmailFooter({ campaign }: { campaign: string }) {
  return (
    <Section className='mt-8 p-5 text-center'>
      <Text className='m-0 text-xs leading-relaxed text-slate-400'>
        Powered by{' '}
        <Link
          href={withEmailUtm('https://betterlytics.io', campaign, 'footer_powered_by')}
          className='text-slate-400 underline'
        >
          Betterlytics
        </Link>
        <br />
        You're receiving this email because you have an account on this analytics platform.
      </Text>
    </Section>
  );
}

export function EmailSignature({ campaign }: { campaign: string }) {
  if (!sharedEmailEnv.isCloud) return null;
  return (
    <Section className='mt-10 pt-8'>
      <Hr className='mb-5 border-slate-200' />
      <Text className='m-0 mb-5 text-base font-medium text-slate-500'>
        Best regards,
        <br />
        <strong className='text-slate-700'>The Betterlytics Team</strong>
      </Text>
      <Section>
        <Link
          href={withEmailUtm('https://betterlytics.io', campaign, 'signature_website')}
          className='mr-4 font-medium text-blue-600 no-underline'
        >
          Website
        </Link>
        <Link href='mailto:support@betterlytics.io' className='mr-4 font-medium text-blue-600 no-underline'>
          Support
        </Link>
        <Link
          href={withEmailUtm('https://betterlytics.io/docs', campaign, 'signature_docs')}
          className='font-medium text-blue-600 no-underline'
        >
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
    <Section className='my-8 text-center'>
      <Button
        href={href}
        className={cn(buttonVariantClass[variant], 'rounded-lg px-7 py-3.5 text-base font-semibold no-underline')}
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
    <Section className={cn(infoBoxClass[variant], 'my-6 rounded-r-lg border-l-4 p-5')}>
      {title && (
        <Heading as='h3' className={cn(infoBoxHeadingClass[variant], 'm-0 mb-2.5 text-lg font-semibold')}>
          {title}
        </Heading>
      )}
      {children}
    </Section>
  );
}

export function ContentSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Section className={cn('my-5 rounded-lg border border-slate-200 bg-slate-50 p-6', className)}>
      {children}
    </Section>
  );
}

export function H1({ children }: { children: ReactNode }) {
  return (
    <Heading as='h1' className='m-0 mb-5 text-3xl leading-tight font-bold text-slate-800'>
      {children}
    </Heading>
  );
}

export function H2({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Heading as='h2' className={cn('mt-8 mb-4 text-[22px] font-semibold text-slate-700', className)}>
      {children}
    </Heading>
  );
}

export function P({ children, className }: { children: ReactNode; className?: string }) {
  return <Text className={cn('my-4 text-base leading-relaxed text-slate-600', className)}>{children}</Text>;
}

export function PrimaryLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn('font-medium text-blue-600 no-underline', className)}>
      {children}
    </Link>
  );
}

export function Greeting({ userName, className }: { userName?: string | null; className?: string }) {
  return (
    <P className={className}>
      {userName ? (
        <>
          Hi <strong>{userName}</strong>,
        </>
      ) : (
        <>Hi,</>
      )}
    </P>
  );
}
