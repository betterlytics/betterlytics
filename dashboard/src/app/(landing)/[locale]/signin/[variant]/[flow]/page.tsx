import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { SupportedLanguages } from '@/constants/i18n';
import { getEnabledOAuthProviders } from '@/lib/auth';
import { BrandMarkDefs } from '@/landing/components/ui/brandMark';
import { getSignInCopy } from '@/landing/signin/_auth/copy';
import { labHrefs } from '@/landing/signin/_auth/hrefs';
import type { FlowPreview, FlowProps } from '@/landing/signin/_auth/types';
import { LabSwitcher } from '@/landing/signin/_lab/labSwitcher';
import { HorizonShell } from '@/landing/signin/_variants/horizon';
import { HorizonForgot } from '@/landing/signin/_variants/horizonForgot';
import { HorizonSignUp } from '@/landing/signin/_variants/horizonSignUp';

type Props = {
  params: Promise<{ locale: SupportedLanguages; variant: string; flow: string }>;
  searchParams: Promise<{ state?: string; oauth?: string }>;
};

/* The directions that have their own sign-up and reset pages so far. */
const FLOWS = { orbit: ['signup', 'forgot-password'], dawn: ['signup', 'forgot-password'] } as Record<string, string[]>;

export const metadata: Metadata = { robots: { index: false, follow: false } };

function toPreview(state?: string): FlowPreview {
  return state === 'error' || state === 'loading' || state === 'sent' ? state : null;
}

/** Design lab: a direction's sign-up and password-reset pages, wired to the real actions. */
export default async function SignInLabFlowPage({ params, searchParams }: Props) {
  const { locale, variant, flow } = await params;
  setRequestLocale(locale);
  if (!FLOWS[variant]?.includes(flow)) notFound();

  const query = await searchParams;
  const props: FlowProps = {
    copy: await getSignInCopy({}),
    providers: query.oauth === 'off' ? { google: false, github: false } : getEnabledOAuthProviders(),
    preview: toPreview(query.state),
    hrefs: labHrefs(variant),
  };
  const key = [flow, query.state, query.oauth].join(':');

  return (
    <>
      <BrandMarkDefs />
      <HorizonShell copy={props.copy} tone='volt' stars={variant === 'orbit'} shader={variant === 'dawn' ? 'planet' : undefined}>
        {flow === 'signup' ? <HorizonSignUp key={key} {...props} /> : <HorizonForgot key={key} {...props} />}
      </HorizonShell>
      <LabSwitcher current={variant === 'dawn' ? 'dawn' : 'orbit'} />
    </>
  );
}
