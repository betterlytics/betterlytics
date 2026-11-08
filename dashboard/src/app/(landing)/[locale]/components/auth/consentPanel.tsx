'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { useTranslations } from 'next-intl';
import type { DashboardRole } from '@prisma/client';
import { allowMcpConsentAction, denyMcpConsentAction } from '@/app/actions/auth/mcpConsent.action';
import { DomainFavicon } from '@/components/domain/DomainFavicon';
import { authClient } from '@/lib/auth-client';
import { MCP_CONSENT_REQUEST_INVALID } from '@/constants/auth';
import type { McpConsentRequest } from '@/services/auth/mcpConsent.service';
import { Corners } from '@/landing/components/ui/frame';
import frame from '@/landing/components/ui/frame.module.css';
import { InkFrame } from '@/landing/components/ui/inkFrame';
import { cn } from '@/landing/lib/cn';
import { PanelLink } from './authPanel';
import { Alert } from './fields';
import { Spinner } from './icons';
import form from './authForm.module.css';
import styles from './consent.module.css';

const SEARCH_FROM_DASHBOARDS = 8;
const MULTI_PART_SUFFIXES = new Set(['co.uk', 'org.uk', 'ac.uk', 'com.au', 'co.nz', 'co.jp', 'com.br', 'co.za']);

const ICONS = {
  triangle: 'M7.13 2.5a1 1 0 0 1 1.74 0l5.4 9.5a1 1 0 0 1-.87 1.5H2.6a1 1 0 0 1-.87-1.5Z M8 6.25v3 M8 11.1v.01',
  laptop: 'M4.25 3.25h7.5a1.25 1.25 0 0 1 1.25 1.25v6H3v-6a1.25 1.25 0 0 1 1.25-1.25Z M1.5 12.75h13',
  info: 'M8 1.75a6.25 6.25 0 1 1 0 12.5 6.25 6.25 0 0 1 0-12.5Z M8 7.25V11 M8 5v.01',
  search: 'M7 2.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z m3.5 8 3 3',
  history: 'M2.5 8a5.5 5.5 0 1 0 1.6-3.9 M2.25 2.5v2.25H4.5 M8 5.25V8l2 1.5',
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

function CheckMark() {
  return <Checkbox.Indicator className={styles.indicator} />;
}

type Selection = { picked: Set<string>; includeFuture: boolean };

function initialSelection(request: McpConsentRequest): Selection {
  const everyDashboard = new Set(request.dashboards.map((dashboard) => dashboard.id));
  if (!request.previous || request.previous.allDashboards) {
    return { picked: everyDashboard, includeFuture: true };
  }
  return { picked: new Set(request.previous.dashboardIds), includeFuture: false };
}

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

  const [selection, setSelection] = useState<Selection>(() => initialSelection(request));
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<'allow' | 'cancel' | 'switch' | null>(null);
  const [failed, setFailed] = useState(false);

  const { picked, includeFuture } = selection;
  const total = request.dashboards.length;
  const searchable = total >= SEARCH_FROM_DASHBOARDS;
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return searchable && needle
      ? request.dashboards.filter((d) => d.domain.toLowerCase().includes(needle))
      : request.dashboards;
  }, [query, request.dashboards, searchable]);
  const visiblePicked = visible.filter((d) => picked.has(d.id)).length;
  const allPicked = picked.size === total;
  const allDashboards = allPicked && includeFuture;
  const canAllow = allDashboards || picked.size > 0;
  const busy = pending !== null;
  const warnUnverified = !request.verified;
  const warnLoopback = request.onlyLoopbackRedirects;

  const setPicked = (next: Set<string>) =>
    setSelection((current) => ({ picked: next, includeFuture: current.includeFuture && next.size === total }));

  const togglePicked = (dashboardId: string, on: boolean) => {
    const next = new Set(picked);
    if (on) next.add(dashboardId);
    else next.delete(dashboardId);
    setPicked(next);
  };

  // acts on the rows the search shows, so "search shop, select all" picks only those
  const toggleVisible = (on: boolean) => {
    const next = new Set(picked);
    for (const dashboard of visible) {
      if (on) next.add(dashboard.id);
      else next.delete(dashboard.id);
    }
    setPicked(next);
  };

  const allow = async () => {
    if (busy || !canAllow) return;
    setPending('allow');
    setFailed(false);
    const result = await allowMcpConsentAction(oauthQuery, {
      allDashboards,
      dashboardIds: allDashboards ? [] : [...picked],
    }).catch(() => null);
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
                <span className={cn(styles.tag, request.verified ? styles.tagOk : styles.tagWarn)}>
                  {request.verified ? t('facts.verified') : t('facts.unverified')}
                </span>
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
            <div id={ids.warnings} className={styles.warn} role='note'>
              {warnUnverified ? (
                <p>
                  <Icon name='triangle' />
                  {t('warnings.unverified', { client })}
                </p>
              ) : null}
              {warnLoopback ? (
                <p>
                  <Icon name='laptop' />
                  {t('warnings.loopback', { client })}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className={cn(styles.account, 'bg-hatch')}>
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

          <fieldset className={styles.section} disabled={busy}>
            <legend className={styles.sectionTitle}>{t('dashboards.title')}</legend>
            <div className={styles.group}>
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
                  picked={picked}
                  searchable={searchable}
                  query={query}
                  onQuery={setQuery}
                  selectAll={
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
                  }
                  onToggle={togglePicked}
                  roleLabel={(role) => t(`roles.${role}`)}
                  searchLabel={t('dashboards.search')}
                  noMatch={t('dashboards.noMatch')}
                />
              )}
              <label className={cn(styles.row, styles.futureRow)}>
                <Checkbox.Root
                  className={styles.checkbox}
                  checked={allDashboards}
                  disabled={!allPicked}
                  onCheckedChange={(on) => setSelection((current) => ({ ...current, includeFuture: on === true }))}
                >
                  <CheckMark />
                </Checkbox.Root>
                <span className={styles.rowMain}>
                  <span className={styles.rowTitle}>{t('dashboards.future')}</span>
                  <span className={styles.rowText}>{t('dashboards.futureHint')}</span>
                </span>
              </label>
            </div>
          </fieldset>

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
    </InkFrame>
  );
}

function DashboardList({
  dashboards,
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
    <div>
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
                checked={picked.has(dashboard.id)}
                onCheckedChange={(on) => onToggle(dashboard.id, on === true)}
              >
                <CheckMark />
              </Checkbox.Root>
              <DomainFavicon domain={dashboard.domain} size={18} className='text-muted' />
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
