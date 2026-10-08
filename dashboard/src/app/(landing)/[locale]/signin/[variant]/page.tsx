import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { SupportedLanguages } from '@/constants/i18n';
import { getChangelogEntriesForLocale } from '@/content/changelog';
import { getEnabledOAuthProviders } from '@/lib/auth';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { BrandMarkDefs } from '@/landing/components/ui/brandMark';
import { getSignInCopy } from '@/landing/signin/_auth/copy';
import { labHrefs } from '@/landing/signin/_auth/hrefs';
import type { PreviewState, VariantProps } from '@/landing/signin/_auth/types';
import { LabSwitcher } from '@/landing/signin/_lab/labSwitcher';
import { isVariantSlug } from '@/landing/signin/_lab/variants';
import { AtlasVariant } from '@/landing/signin/_variants/atlas';
import { HorizonVariant } from '@/landing/signin/_variants/horizon';
import { LineworkVariant } from '@/landing/signin/_variants/linework';
import { MeridianVariant } from '@/landing/signin/_variants/meridian';
import { VoltVariant } from '@/landing/signin/_variants/volt';

type Props = {
  params: Promise<{ locale: SupportedLanguages; variant: string }>;
  searchParams: Promise<{ error?: string; registration?: string; state?: string; signup?: string; oauth?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public.auth.signin.seo' });
  return { title: t('title'), robots: { index: false, follow: false } };
}

function toPreview(state?: string): PreviewState {
  return state === 'error' || state === 'otp' || state === 'loading' ? state : null;
}

/** Design lab: each direction is a whole page, with the real sign-in wired in. Not linked from anywhere. */
export default async function SignInLabPage({ params, searchParams }: Props) {
  const { locale, variant } = await params;
  setRequestLocale(locale);
  if (!isVariantSlug(variant)) notFound();

  const query = await searchParams;
  const props: VariantProps = {
    copy: await getSignInCopy({ error: query.error, registration: query.registration }),
    providers: query.oauth === 'off' ? { google: false, github: false } : getEnabledOAuthProviders(),
    registration: query.signup === 'off' ? false : isFeatureEnabled('enableRegistration'),
    forgotPassword: isFeatureEnabled('enableEmails'),
    preview: toPreview(query.state),
  };
  // a pinned state is read once by the form's initial state, so a new one needs a fresh mount
  const key = [variant, query.state, query.signup, query.oauth].join(':');

  const latest = [...getChangelogEntriesForLocale(locale)].sort((a, b) => b.releasedAt.localeCompare(a.releasedAt))[0];

  return (
    <>
      <BrandMarkDefs />
      {variant === 'volt' || variant === 'eclipse' || variant === 'corona' ? (
        <VoltVariant
          key={key}
          {...props}
          latest={latest && { version: latest.version, title: latest.title }}
          scene={variant === 'eclipse' ? 'space' : variant === 'corona' ? 'shader' : 'card'}
        />
      ) : null}
      {variant === 'linework' ? <LineworkVariant key={key} {...props} /> : null}
      {variant === 'horizon' ? <HorizonVariant key={key} {...props} /> : null}
      {variant === 'aurora' ? <HorizonVariant key={key} {...props} tone='volt' /> : null}
      {variant === 'orbit' ? (
        <HorizonVariant key={key} {...props} tone='volt' stars hrefs={labHrefs('orbit')} />
      ) : null}
      {variant === 'dawn' ? (
        <HorizonVariant key={key} {...props} tone='volt' shader='planet' hrefs={labHrefs('dawn')} />
      ) : null}
      {variant === 'afterglow' ? <HorizonVariant key={key} {...props} tone='volt' shader='glow' /> : null}
      {variant === 'still' ? <HorizonVariant key={key} {...props} tone='none' /> : null}
      {variant === 'meridian' ? <MeridianVariant key={key} {...props} /> : null}
      {variant === 'atlas' ? <AtlasVariant key={key} {...props} /> : null}
      <LabSwitcher current={variant} />
    </>
  );
}
