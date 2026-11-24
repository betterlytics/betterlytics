'use client';

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { DashboardRole } from '@prisma/client';
import { allowMcpConsentAction, denyMcpConsentAction } from '@/app/actions/auth/mcpConsent.action';
import { DomainFavicon } from '@/components/domain/DomainFavicon';
import { Avatar } from '@/components/ui/avatar';
import { GravatarImage } from '@/components/ui/gravatar-image';
import { useDashboardGrantPicker } from '@/hooks/use-dashboard-grant-picker';
import { authClient } from '@/lib/auth-client';
import { MCP_CONSENT_REQUEST_INVALID } from '@/constants/auth';
import type { McpConsentRequest } from '@/services/auth/mcpConsent.service';
import { Corners } from '@/landing/components/ui/frame';
import frame from '@/landing/components/ui/frame.module.css';
import { InkFrame } from '@/landing/components/ui/inkFrame';
import { FINE_LINK } from '@/landing/components/ui/text';
import { cn } from '@/landing/lib/cn';
import { PanelLink } from './authPanel';
import { ClientBadge, ConsentIcon as Icon } from './clientBadge';
import { Alert } from './fields';
import { Spinner } from './icons';
import form from './authForm.module.css';
import styles from './consent.module.css';

const MULTI_PART_SUFFIXES = new Set(['co.uk', 'org.uk', 'ac.uk', 'com.au', 'co.nz', 'co.jp', 'com.br', 'co.za']);

/** Answered or expired since the page loaded: a reload shows the page's invalid-request state instead. */
function isAnswered(error: { [key: string]: unknown }): boolean {
  if (error.code !== MCP_CONSENT_REQUEST_INVALID) return false;
  window.location.reload();
  return true;
}

/** The subdomain part and the registrable domain, which stays visible when a long host is cut short. */
function splitHost(host: string): [string, string] {
  const parts = host.split('.');
  const keep = parts.length > 2 && MULTI_PART_SUFFIXES.has(parts.slice(-2).join('.')) ? 3 : 2;
  if (parts.length <= keep) return ['', host];
  return [`${parts.slice(0, -keep).join('.')}.`, parts.slice(-keep).join('.')];
}

const subscribeNever = () => () => {};

// DomainFavicon reveals its image on onLoad, which a server-rendered image can fire before hydration
function Favicon({ domain, size }: { domain: string | null; size: number }) {
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  return <DomainFavicon domain={hydrated ? domain : null} size={size} className='text-muted' />;
}

function CheckMark() {
  return <Checkbox.Indicator className={styles.indicator} />;
}

export function ConsentPanel({
  request,
  oauthQuery,
  email,
  gravatar,
  requireTerms,
}: {
  request: McpConsentRequest;
  oauthQuery: string;
  email: string;
  gravatar: boolean;
  /** Cloud, for an account that hasn't accepted the current terms, as after a Google or GitHub sign-up. */
  requireTerms: boolean;
}) {
  const t = useTranslations('public.auth.consent');
  const tRegister = useTranslations('public.auth.register');
  const id = useId();
  const ids = {
    unverified: `${id}-unverified`,
    loopback: `${id}-loopback`,
    error: `${id}-error`,
    hint: `${id}-hint`,
    dashboards: `${id}-dashboards`,
    terms: `${id}-terms`,
    termsLabel: `${id}-terms-label`,
  };
  const client = request.clientName;

  const {
    allDashboards,
    setAllDashboards,
    picked,
    togglePicked,
    toggleVisible,
    selectAllState,
    query,
    setQuery,
    total,
    searchable,
    visible,
    selectAllPicks,
    isUnavailable,
    canSave: canAllow,
    selection,
  } = useDashboardGrantPicker(request.dashboards, request.previous);
  const [pending, setPending] = useState<'allow' | 'cancel' | 'switch' | null>(null);
  const [failed, setFailed] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const busy = pending !== null;
  const warnUnverified = !request.verified;
  const warnLoopback = request.onlyLoopbackRedirects;
  const termsPending = requireTerms && !acceptedTerms;
  // onboarding's add-site step, which comes back here through the authorization, so the new site is listed
  const addSiteHref = `/onboarding?${new URLSearchParams({ connect: request.authorizeUrl })}`;

  const allow = async () => {
    if (busy || !canAllow || termsPending) return;
    setPending('allow');
    setFailed(false);
    const result = await allowMcpConsentAction(oauthQuery, selection, requireTerms && acceptedTerms).catch(
      () => null,
    );
    if (result?.success) {
      window.location.assign(result.data.url);
      return;
    }
    if (result && isAnswered(result.error)) return;
    setPending(null);
    setFailed(true);
  };

  const cancel = async () => {
    if (busy) return;
    setPending('cancel');
    const result = await denyMcpConsentAction(oauthQuery).catch(() => null);
    if (result?.success) {
      window.location.assign(result.data.url);
      return;
    }
    if (result && isAnswered(result.error)) return;
    setPending(null);
    setFailed(true);
  };

  const switchAccount = async () => {
    if (busy) return;
    setPending('switch');
    try {
      await authClient.signOut();
    } finally {
      window.location.assign(request.authorizeUrl);
    }
  };

  return (
    <InkFrame className={cn(frame.panel, styles.panel)}>
      <Corners persistent />
      <i className={cn(styles.guide, styles.guideX, styles.atTop)} aria-hidden />
      <i className={cn(styles.guide, styles.guideX, styles.atBottom)} aria-hidden />
      <i className={cn(styles.guide, styles.guideY, styles.atStart)} aria-hidden />
      <i className={cn(styles.guide, styles.guideY, styles.atEnd)} aria-hidden />

      <div className={styles.grid}>
        <div className={styles.trust}>
          <h1 className={styles.title}>{t('title', { client })}</h1>
          <p className={styles.lede}>{t('lede', { client })}</p>

          <dl className={styles.facts}>
            <div>
              <dt>{t('facts.app')}</dt>
              <dd>
                {client}
                <ClientBadge verified={request.verified} />
              </dd>
            </div>
            {request.identityHost ? (
              <div>
                <dt>{t('facts.identity')}</dt>
                <dd>
                  <span className={styles.mono}>{request.identityHost}</span>
                </dd>
              </div>
            ) : null}
            <div>
              <dt>{t('facts.returnsTo')}</dt>
              <dd>
                <span className={styles.mono}>{request.redirectHost}</span>
              </dd>
            </div>
          </dl>

          {warnUnverified || warnLoopback ? (
            <div className={styles.warn} role='note'>
              {warnUnverified ? (
                <p id={ids.unverified}>
                  <Icon name='triangle' />
                  {t('warnings.unverified', { client })}
                </p>
              ) : null}
              {warnLoopback ? (
                <p id={ids.loopback}>
                  <Icon name='alert' />
                  {t('warnings.loopback', { client })}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className={cn(styles.account, 'bg-hatch')}>
          <Avatar className={styles.avatar} aria-hidden>
            <User />
            {gravatar ? <GravatarImage email={email} alt='' className='absolute inset-0' /> : null}
          </Avatar>
          <span className={styles.who}>
            <span>{t('signedInAs')}</span>
            <b title={email}>{email}</b>
          </span>
          <button type='button' className={styles.textLink} onClick={switchAccount} disabled={busy}>
            {t('switchAccount')}
          </button>
        </div>

        <div className={styles.choose}>
          {request.previous ? (
            <div className={styles.info} role='note'>
              <Icon name='history' />
              <div>
                <p className={styles.infoTitle}>{t('reconnect.title', { client })}</p>
                <p className={styles.infoBody}>{t('reconnect.body')}</p>
              </div>
            </div>
          ) : null}

          <fieldset className={styles.section} disabled={busy}>
            <legend className={styles.sectionTitle}>{t('permissions.title', { client })}</legend>
            <div className={styles.group}>
              <div className={styles.row}>
                <Checkbox.Root
                  className={styles.checkbox}
                  checked
                  disabled
                  aria-label={t('permissions.read')}
                >
                  <CheckMark />
                </Checkbox.Root>
                <div className={styles.rowMain}>
                  <p className={styles.rowTitle}>{t('permissions.read')}</p>
                  <p className={styles.rowText}>{t('permissions.readDescription')}</p>
                </div>
              </div>
              <p className={styles.noteRow}>
                <Icon name='info' />
                {t('permissions.roleNote')}
              </p>
            </div>
          </fieldset>

          <fieldset className={styles.section} disabled={busy} aria-labelledby={ids.dashboards}>
            <legend className={styles.sectionHead}>
              <span id={ids.dashboards} className={styles.sectionTitle}>
                {t('dashboards.title')}
              </span>
              <span className={styles.segmented} role='radiogroup' aria-labelledby={ids.dashboards}>
                {[true, false].map((all) => (
                  <label key={String(all)}>
                    <input
                      type='radio'
                      name={`${id}-scope`}
                      checked={allDashboards === all}
                      // with no dashboards there is nothing to select
                      disabled={!all && total === 0}
                      onChange={() => setAllDashboards(all)}
                    />
                    {all ? t('dashboards.modeAll') : t('dashboards.modeSelected')}
                  </label>
                ))}
              </span>
            </legend>
            <div className={styles.group}>
              {total === 0 ? (
                <p className={styles.noteRow}>
                  <Icon name='info' />
                  <span>
                    {t.rich('dashboards.empty', {
                      link: (chunks) => <PanelLink href={addSiteHref}>{chunks}</PanelLink>,
                    })}
                  </span>
                </p>
              ) : (
                <DashboardList
                  dashboards={visible}
                  allDashboards={allDashboards}
                  picked={picked}
                  searchable={searchable}
                  query={query}
                  onQuery={setQuery}
                  selectAll={
                    <div className={styles.toolbar}>
                      <label className={styles.selectAll}>
                        <Checkbox.Root
                          className={styles.checkbox}
                          checked={selectAllState}
                          disabled={allDashboards || visible.length === 0}
                          onCheckedChange={() => toggleVisible(selectAllPicks)}
                        >
                          <CheckMark />
                        </Checkbox.Root>
                        {t('dashboards.selectAll')}
                      </label>
                      <span className={styles.count} id={ids.hint} aria-live='polite'>
                        {allDashboards
                          ? t('dashboards.allHint')
                          : picked.size === 0
                            ? t('dashboards.pickOne')
                            : t.rich('dashboards.selected', {
                                selected: picked.size,
                                total,
                                b: (chunks) => <b>{chunks}</b>,
                              })}
                      </span>
                    </div>
                  }
                  onToggle={togglePicked}
                  isUnavailable={isUnavailable}
                  aiAccessOffLabel={t('dashboards.aiAccessOff')}
                  roleLabel={(role) => t(`roles.${role}`)}
                  searchLabel={t('dashboards.search')}
                  noMatch={t('dashboards.noMatch')}
                />
              )}
            </div>
          </fieldset>

          {requireTerms ? (
            <div className={form.check}>
              <input
                id={ids.terms}
                type='checkbox'
                name='acceptedTerms'
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                disabled={busy}
                aria-required
              />
              {/* the policies open in a new tab, so the request isn't left behind */}
              <label id={ids.termsLabel} htmlFor={ids.terms}>
                {tRegister.rich('termsAgree', {
                  terms: (chunks) => (
                    <Link className={FINE_LINK} href='/terms' target='_blank' rel='noopener noreferrer'>
                      {chunks}
                    </Link>
                  ),
                  privacy: (chunks) => (
                    <Link className={FINE_LINK} href='/privacy' target='_blank' rel='noopener noreferrer'>
                      {chunks}
                    </Link>
                  ),
                })}
              </label>
            </div>
          ) : null}

          {failed ? <Alert id={ids.error}>{t('saveError')}</Alert> : null}
        </div>

        <div className={styles.actions}>
          <button type='button' className={form.secondary} onClick={cancel} disabled={busy}>
            {t('cancel')}
          </button>
          <button
            type='button'
            className={form.primary}
            onClick={allow}
            disabled={busy || !canAllow || termsPending}
            aria-busy={pending === 'allow' || undefined}
            aria-describedby={
              [
                warnUnverified ? ids.unverified : null,
                warnLoopback ? ids.loopback : null,
                canAllow ? null : ids.hint,
                termsPending ? ids.termsLabel : null,
              ]
                .filter(Boolean)
                .join(' ') || undefined
            }
          >
            {pending === 'allow' ? <Spinner className={form.spin} /> : null}
            {pending === 'allow' ? t('connecting') : t('connect')}
          </button>
        </div>
      </div>
    </InkFrame>
  );
}

function DashboardList({
  dashboards,
  allDashboards,
  picked,
  searchable,
  query,
  onQuery,
  selectAll,
  onToggle,
  isUnavailable,
  aiAccessOffLabel,
  roleLabel,
  searchLabel,
  noMatch,
}: {
  dashboards: McpConsentRequest['dashboards'];
  allDashboards: boolean;
  picked: Set<string>;
  searchable: boolean;
  query: string;
  onQuery: (query: string) => void;
  selectAll: ReactNode;
  onToggle: (dashboardId: string, on: boolean) => void;
  isUnavailable: (dashboardId: string) => boolean;
  aiAccessOffLabel: string;
  roleLabel: (role: DashboardRole) => string;
  searchLabel: string;
  noMatch: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (el) setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 1);
  }, []);
  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, dashboards.length]);

  return (
    <div className={cn(allDashboards && styles.locked)}>
      {searchable ? (
        <div className={cn(styles.toolbar, styles.searchBar)}>
          <label className={styles.search}>
            <Icon name='search' />
            <input
              type='search'
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder={searchLabel}
              aria-label={searchLabel}
            />
          </label>
        </div>
      ) : null}
      {selectAll}
      <div ref={scrollRef} className={cn(styles.scroll, more && styles.scrollMore)} onScroll={measure}>
        {dashboards.length === 0 ? <p className={styles.empty}>{noMatch}</p> : null}
        {dashboards.map((dashboard) => {
          const [sub, base] = splitHost(dashboard.domain);
          const unavailable = isUnavailable(dashboard.id);
          return (
            <label key={dashboard.id} className={cn(styles.dashRow, unavailable && styles.dashRowUnavailable)}>
              <Checkbox.Root
                className={styles.checkbox}
                checked={allDashboards || picked.has(dashboard.id)}
                disabled={allDashboards || unavailable}
                onCheckedChange={(on) => onToggle(dashboard.id, on === true)}
              >
                <CheckMark />
              </Checkbox.Root>
              <Favicon domain={dashboard.domain} size={18} />
              <span className={styles.dashText}>
                <span className={styles.domain} title={dashboard.domain}>
                  <span>{sub}</span>
                  <span>{base}</span>
                </span>
                {!dashboard.aiAccessEnabled ? <span className={styles.dashNote}>{aiAccessOffLabel}</span> : null}
              </span>
              <span className={cn(styles.tag, dashboard.role === 'owner' && styles.tagStrong)}>
                {roleLabel(dashboard.role)}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
