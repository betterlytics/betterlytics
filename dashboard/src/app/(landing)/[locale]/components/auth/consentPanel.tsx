'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Switch from '@radix-ui/react-switch';
import { useTranslations } from 'next-intl';
import type { DashboardRole } from '@prisma/client';
import { allowMcpConsentAction, denyMcpConsentAction } from '@/app/actions/auth/mcpConsent.action';
import { authClient } from '@/lib/auth-client';
import type { McpConsentRequest } from '@/services/auth/mcpConsent.service';
import { Corners } from '@/landing/components/ui/frame';
import frame from '@/landing/components/ui/frame.module.css';
import { BrandMark } from '@/landing/components/ui/brandMark';
import { InkFrame } from '@/landing/components/ui/inkFrame';
import { cn } from '@/landing/lib/cn';
import { PanelLink } from './authPanel';
import { Alert } from './fields';
import { Spinner } from './icons';
import form from './authForm.module.css';
import styles from './consent.module.css';

// From 8 dashboards a search field helps; fewer fit at a glance
const SEARCH_FROM = 8;
const MULTI_PART_SUFFIXES = new Set(['co.uk', 'org.uk', 'ac.uk', 'com.au', 'co.nz', 'co.jp', 'com.br', 'co.za']);

const ICONS = {
  shield: 'M8 1.75 2.75 3.9v3.7c0 3.2 2.2 5.9 5.25 7 3.05-1.1 5.25-3.8 5.25-7V3.9L8 1.75Z M5.75 8l1.6 1.6 3-3.1',
  triangle: 'M7.13 2.5a1 1 0 0 1 1.74 0l5.4 9.5a1 1 0 0 1-.87 1.5H2.6a1 1 0 0 1-.87-1.5Z M8 6.25v3 M8 11.1v.01',
  laptop: 'M4.25 3.25h7.5a1.25 1.25 0 0 1 1.25 1.25v6H3v-6a1.25 1.25 0 0 1 1.25-1.25Z M1.5 12.75h13',
  x: 'm4.25 4.25 7.5 7.5M11.75 4.25l-7.5 7.5',
  info: 'M8 1.75a6.25 6.25 0 1 1 0 12.5 6.25 6.25 0 0 1 0-12.5Z M8 7.25V11 M8 5v.01',
  search: 'M7 2.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z m3.5 8 3 3',
  history: 'M2.5 8a5.5 5.5 0 1 0 1.6-3.9 M2.25 2.5v2.25H4.5 M8 5.25V8l2 1.5',
  app: 'M4 2.75h8a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6.5a2 2 0 0 1 2-2Z M2 5.75h12',
  swap: 'M2.75 5.5h10.5M10.5 2.75l2.75 2.75-2.75 2.75M13.25 10.5H2.75M5.5 7.75 2.75 10.5l2.75 2.75',
} as const;

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg
      viewBox='0 0 16 16'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

/** The subdomain part and the registrable domain, which stays visible when a long host is cut short. */
function splitHost(host: string): [string, string] {
  const parts = host.split('.');
  const keep = parts.length > 2 && MULTI_PART_SUFFIXES.has(parts.slice(-2).join('.')) ? 3 : 2;
  if (parts.length <= keep) return ['', host];
  return [`${parts.slice(0, -keep).join('.')}.`, parts.slice(-keep).join('.')];
}

function SiteTile({ host }: { host: string }) {
  const base = splitHost(host)[1];
  let hue = 0;
  for (const char of base) hue = (hue * 31 + char.charCodeAt(0)) % 360;
  return (
    <span className={styles.site} style={{ '--hue': hue } as CSSProperties} aria-hidden>
      {base[0]?.toUpperCase()}
    </span>
  );
}

function CheckMark() {
  return <Checkbox.Indicator className={styles.indicator} />;
}

type Selection = { allDashboards: boolean; picked: Set<string> };

export function ConsentPanel({
  request,
  oauthQuery,
  email,
}: {
  request: McpConsentRequest;
  oauthQuery: string;
  email: string;
}) {
  const t = useTranslations('public.auth.consent');
  const id = useId();
  const ids = { warnings: `${id}-warnings`, error: `${id}-error`, hint: `${id}-hint` };
  const client = request.clientName;

  // a first connect reads every dashboard; a reconnect starts from what the current grant still covers
  const [selection, setSelection] = useState<Selection>(() => ({
    allDashboards: request.previous?.allDashboards ?? true,
    picked: new Set(request.previous && !request.previous.allDashboards ? request.previous.dashboardIds : []),
  }));
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<'allow' | 'cancel' | 'switch' | null>(null);
  const [failed, setFailed] = useState(false);

  const { allDashboards, picked } = selection;
  const total = request.dashboards.length;
  const searchable = total >= SEARCH_FROM && !allDashboards;
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return searchable && needle
      ? request.dashboards.filter((d) => d.domain.toLowerCase().includes(needle))
      : request.dashboards;
  }, [query, request.dashboards, searchable]);
  const visiblePicked = visible.filter((d) => picked.has(d.id)).length;
  const canAllow = allDashboards || picked.size > 0;
  const busy = pending !== null;
  const warnUnverified = !request.verified;
  const warnLoopback = request.onlyLoopbackRedirects;

  const togglePicked = (dashboardId: string, on: boolean) =>
    setSelection((current) => {
      const next = new Set(current.picked);
      if (on) next.add(dashboardId);
      else next.delete(dashboardId);
      return { ...current, picked: next };
    });

  // acts on the rows the search shows, so "search shop, select all" picks only those
  const toggleVisible = (on: boolean) =>
    setSelection((current) => {
      const next = new Set(current.picked);
      for (const dashboard of visible) {
        if (on) next.add(dashboard.id);
        else next.delete(dashboard.id);
      }
      return { ...current, picked: next };
    });

  const allow = async () => {
    if (busy || !canAllow) return;
    setPending('allow');
    setFailed(false);
    try {
      const result = await allowMcpConsentAction(oauthQuery, {
        allDashboards,
        dashboardIds: allDashboards ? [] : [...picked],
      });
      if (result.success) {
        window.location.assign(result.data.url);
        return;
      }
    } catch {
      // shown below
    }
    setPending(null);
    setFailed(true);
  };

  const cancel = async () => {
    if (busy) return;
    setPending('cancel');
    try {
      const result = await denyMcpConsentAction(oauthQuery);
      if (result.success) {
        window.location.assign(result.data.url);
        return;
      }
    } catch {
      // shown below
    }
    setPending(null);
    setFailed(true);
  };

  const switchAccount = async () => {
    if (busy) return;
    setPending('switch');
    try {
      await authClient.signOut();
    } finally {
      // the request again, now signed out: through sign-in and back here
      window.location.assign(request.authorizeUrl);
    }
  };

  const never = (className: string) => (
    <div className={cn(styles.never, className)}>
      <p className={styles.neverTitle}>{t('never.title')}</p>
      <ul>
        <li>
          <Icon name='x' />
          {t('never.secrets')}
        </li>
        <li>
          <Icon name='x' />
          {t('never.delete')}
        </li>
        <li>
          <Icon name='x' />
          {t('never.role')}
        </li>
      </ul>
    </div>
  );

  const mono = (chunks: ReactNode) => <span className={styles.mono}>{chunks}</span>;

  return (
    <InkFrame className={cn(frame.panel, styles.panel)}>
      <Corners persistent />
      <i className={cn(styles.guide, styles.guideX, styles.atTop)} aria-hidden />
      <i className={cn(styles.guide, styles.guideX, styles.atBottom)} aria-hidden />
      <i className={cn(styles.guide, styles.guideY, styles.atStart)} aria-hidden />
      <i className={cn(styles.guide, styles.guideY, styles.atEnd)} aria-hidden />
      <i className={cn(styles.guide, styles.guideY, styles.atSplit)} aria-hidden />

      <div className={styles.grid}>
        <div className={cn(styles.trust, 'bg-hatch')}>
          <h1 className={styles.title}>{t('title', { client })}</h1>
          <div className={styles.connect} aria-hidden>
            {request.logoUrl ? (
              <span className={styles.tile}>
                {/* the CIMD document's own logo; its host vouches for the client */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={request.logoUrl} alt='' referrerPolicy='no-referrer' />
              </span>
            ) : (
              <span className={cn(styles.tile, styles.tileUnknown)}>
                <Icon name='app' />
              </span>
            )}
            <span className={styles.wire}>
              <i />
              <span className={styles.knot}>
                <Icon name='swap' />
              </span>
              <i />
            </span>
            <span className={styles.tile}>
              <BrandMark />
            </span>
          </div>
          <p className={styles.eyebrow}>{t('eyebrow')}</p>
          <p className={styles.lede}>{t('lede', { client })}</p>

          <dl className={styles.facts}>
            <div>
              <dt>{t('facts.app')}</dt>
              <dd>
                {client}
                {request.verified ? (
                  <span className={cn(styles.tag, styles.tagOk)}>
                    <Icon name='shield' />
                    {t('facts.verified')}
                  </span>
                ) : (
                  <span className={cn(styles.tag, styles.tagWarn)}>
                    <Icon name='triangle' />
                    {t('facts.unverified')}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt>{t('facts.identity')}</dt>
              <dd>
                {request.identityHost ? (
                  <span className={styles.mono}>{request.identityHost}</span>
                ) : (
                  <span className={styles.selfNamed}>{t('facts.selfNamed')}</span>
                )}
              </dd>
            </div>
            <div>
              <dt>{t('facts.returnsTo')}</dt>
              <dd>
                <span className={styles.mono}>{request.redirectHost}</span>
                {request.redirectIsLoopback ? (
                  <span className={cn(styles.tag, styles.tagWarn)}>
                    <Icon name='laptop' />
                    {t('facts.thisDevice')}
                  </span>
                ) : null}
              </dd>
            </div>
          </dl>

          {warnUnverified || warnLoopback ? (
            <div id={ids.warnings} className={cn(styles.callout, styles.warn)} role='note'>
              {warnUnverified ? (
                <div className={styles.calloutItem}>
                  <Icon name='triangle' />
                  <div>
                    <p className={styles.calloutTitle}>{t('warnings.unverifiedTitle')}</p>
                    <p className={styles.calloutBody}>{t('warnings.unverifiedBody', { client })}</p>
                  </div>
                </div>
              ) : null}
              {warnLoopback ? (
                <div className={styles.calloutItem}>
                  <Icon name='laptop' />
                  <div>
                    <p className={styles.calloutTitle}>{t('warnings.loopbackTitle')}</p>
                    <p className={styles.calloutBody}>
                      {t.rich('warnings.loopbackBody', { client, host: request.redirectHost, mono })}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {never(styles.neverDesktop)}

          <div className={styles.accountSpacer} />
          <div className={styles.account}>
            <span className={styles.avatar} aria-hidden>
              {email[0]?.toUpperCase()}
            </span>
            <span className={styles.who}>
              <span>{t('signedInAs')}</span>
              <b title={email}>{email}</b>
            </span>
            <button type='button' className={styles.textLink} onClick={switchAccount} disabled={busy}>
              {t('switchAccount')}
            </button>
          </div>
        </div>

        <div className={styles.choose}>
          {request.previous ? (
            <div className={cn(styles.callout, styles.info)} role='note'>
              <div className={styles.calloutItem}>
                <Icon name='history' />
                <div>
                  <p className={styles.calloutTitle}>{t('reconnect.title', { client })}</p>
                  <p className={styles.calloutBody}>{t('reconnect.body')}</p>
                </div>
              </div>
            </div>
          ) : null}

          <fieldset className={styles.section} disabled={busy}>
            <legend className={styles.sectionHead}>
              <span className={styles.sectionTitle}>{t('permissions.title', { client })}</span>
            </legend>
            <div className={styles.group}>
              <div className={styles.row}>
                <Checkbox.Root
                  className={styles.checkbox}
                  checked
                  disabled
                  aria-disabled
                  aria-required
                  aria-label={`${t('permissions.read')}, ${t('permissions.required')}`}
                >
                  <CheckMark />
                </Checkbox.Root>
                <div className={styles.rowMain}>
                  <p className={styles.rowTitle}>
                    {t('permissions.read')}
                    <span className={cn(styles.tag, styles.tagSolid)}>{t('permissions.required')}</span>
                  </p>
                  <p className={styles.rowText}>{t('permissions.readDescription')}</p>
                </div>
              </div>
              <p className={styles.noteRow}>
                <Icon name='info' />
                {t('permissions.roleNote')}
              </p>
            </div>
          </fieldset>

          <fieldset className={styles.section} disabled={busy}>
            <legend className={styles.sectionHead}>
              <span className={styles.sectionTitle}>{t('dashboards.title')}</span>
              {allDashboards ? (
                <span className={styles.sectionAside}>{t('dashboards.included', { count: total })}</span>
              ) : null}
            </legend>
            <div className={styles.group}>
              <label className={cn(styles.row, styles.allRow)}>
                <span className={styles.rowMain}>
                  <span className={styles.rowTitle}>{t('dashboards.all')}</span>
                  <span className={styles.rowText}>{t('dashboards.allDescription')}</span>
                </span>
                <Switch.Root
                  className={styles.switch}
                  checked={allDashboards}
                  onCheckedChange={(on) => setSelection((current) => ({ ...current, allDashboards: on }))}
                >
                  <Switch.Thumb className={styles.thumb} />
                </Switch.Root>
              </label>

              {total === 0 ? (
                <p className={styles.noteRow}>
                  <Icon name='info' />
                  <span>
                    {t.rich('dashboards.empty', {
                      link: (chunks) => <PanelLink href='/dashboards'>{chunks}</PanelLink>,
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
                    allDashboards ? null : (
                      <div className={styles.toolbar}>
                        <label className={styles.selectAll}>
                          <Checkbox.Root
                            className={styles.checkbox}
                            checked={
                              visiblePicked === 0
                                ? false
                                : visiblePicked === visible.length
                                  ? true
                                  : 'indeterminate'
                            }
                            disabled={visible.length === 0}
                            onCheckedChange={() => toggleVisible(visiblePicked < visible.length)}
                          >
                            <CheckMark />
                          </Checkbox.Root>
                          {t('dashboards.selectAll')}
                        </label>
                        <span className={styles.count} id={ids.hint} aria-live='polite'>
                          {picked.size === 0
                            ? t('dashboards.pickOne')
                            : t.rich('dashboards.selected', {
                                selected: picked.size,
                                total,
                                b: (chunks) => <b>{chunks}</b>,
                              })}
                        </span>
                      </div>
                    )
                  }
                  onToggle={togglePicked}
                  roleLabel={(role) => t(`roles.${role}`)}
                  searchLabel={t('dashboards.search')}
                  noMatch={t('dashboards.noMatch')}
                />
              )}
            </div>
          </fieldset>

          {failed ? <Alert id={ids.error}>{t('saveError')}</Alert> : null}

          <div className={styles.actions}>
            <p className={styles.fine}>
              {request.redirectIsLoopback
                ? t('returnToDevice', { client })
                : t.rich('returnTo', { host: request.redirectHost, mono })}
            </p>
            <div className={styles.buttons}>
              <button type='button' className={form.secondary} onClick={cancel} disabled={busy}>
                {t('cancel')}
              </button>
              <button
                type='button'
                className={form.primary}
                onClick={allow}
                disabled={busy || !canAllow}
                aria-busy={pending === 'allow' || undefined}
                aria-describedby={
                  [warnUnverified || warnLoopback ? ids.warnings : null, canAllow ? null : ids.hint]
                    .filter(Boolean)
                    .join(' ') || undefined
                }
              >
                {pending === 'allow' ? <Spinner className={form.spin} /> : null}
                {pending === 'allow' ? t('allowing') : t('allow')}
              </button>
            </div>
          </div>

          {never(styles.neverMobile)}
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
  roleLabel: (role: DashboardRole) => string;
  searchLabel: string;
  noMatch: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);

  // the bottom fade shows only while there is more to scroll to
  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (el) setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 1);
  }, []);
  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, dashboards.length, allDashboards]);

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
          return (
            <label key={dashboard.id} className={styles.dashRow}>
              <Checkbox.Root
                className={styles.checkbox}
                checked={allDashboards || picked.has(dashboard.id)}
                disabled={allDashboards}
                onCheckedChange={(on) => onToggle(dashboard.id, on === true)}
              >
                <CheckMark />
              </Checkbox.Root>
              <SiteTile host={dashboard.domain} />
              <span className={styles.domain} title={dashboard.domain}>
                <span>{sub}</span>
                <span>{base}</span>
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
