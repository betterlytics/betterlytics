import {
  Briefcase,
  ChevronDown,
  ChevronRight,
  Clock,
  FolderClosed,
  Mic,
  Plus,
  Search,
  Settings,
  Shapes,
  SquarePen,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BrandMark } from '@/landing/components/ui/brandMark';
import { PathIcon } from '@/landing/components/ui/pathIcon';
import { cn } from '@/landing/lib/cn';
import { MCP_CLIENT_ICONS } from '@/landing/lib/icons';
import styles from './chatScene.module.css';
import { at, replayIn } from './replay';

/* Hourly is the finest the MCP returns, so the 19-minute outage lands as 164 failed signups on the 14:00 bar. */
const HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18];
const SIGNUPS = [431, 468, 492, 517, 343, 524, 498, 476, 452];
const OUTAGE = 4;
const FAILED = 164;
const TICKS = [0, 200, 400, 600];
const SCALE = 600;

const share = (value: number) => `${(value / SCALE) * 100}%`;

const CALLS = [
  {
    tool: 'query',
    args: [
      'metrics: ["custom_events"]',
      'filters: [custom_event_name = "signup"]',
      'timeRange: "yesterday"',
      'granularity: "hour"',
    ],
  },
  { tool: 'list_monitor_incidents', args: ['timeRange: "yesterday"'] },
  { tool: 'list_errors', args: ['filters: [url = "/signup"]', 'timeRange: "yesterday"'] },
] as const;

const CUE = {
  user: 0.2,
  tools: 0.6,
  call: 0.75,
  lead: 1.9,
  chart: 2.15,
  bars: 2.25,
  failed: 2.9,
  points: 3.05,
  close: 3.55,
};

const CLAUDE = MCP_CLIENT_ICONS.find((entry) => entry.name === 'Claude')!.icon;

const CHATS = ['drop', 'recap', 'pricing', 'friday'] as const;

const NAV = [
  { key: 'newChat', icon: Plus },
  { key: 'search', icon: Search },
  { key: 'projects', icon: FolderClosed },
  { key: 'artifacts', icon: Shapes },
  { key: 'scheduled', icon: Clock },
  { key: 'customize', icon: Briefcase },
] as const;

function SignupChart() {
  const t = useTranslations('landing.mcpServer.window.chat.chart');
  return (
    <figure className={cn(styles.chart, replayIn)} style={at(CUE.chart)}>
      <figcaption className={styles.legend}>
        <span className='sr-only'>{t('summary')}</span>
        <span className={styles.key} aria-hidden>
          <i className={styles.swatch} />
          {t('signups')}
        </span>
        <span className={styles.key} aria-hidden>
          <i className={cn(styles.swatch, styles.failedSwatch)} />
          {t('failed')}
        </span>
      </figcaption>
      <div className={styles.plot} aria-hidden>
        {TICKS.map((tick) => (
          <span key={tick} className={styles.gridline} style={{ bottom: share(tick) }}>
            <span className={styles.tick}>{tick}</span>
          </span>
        ))}
        <ol className={styles.columns}>
          {SIGNUPS.map((value, i) => {
            const failed = i === OUTAGE ? FAILED : 0;
            return (
              <li
                key={HOURS[i]}
                className={styles.column}
                data-edge={i === 0 ? 'start' : i === SIGNUPS.length - 1 ? 'end' : undefined}
              >
                {failed > 0 && (
                  <span className={styles.failedBar} style={{ height: share(failed), ...at(CUE.failed) }} />
                )}
                <span className={styles.bar} style={{ height: share(value), ...at(CUE.bars + i * 0.04) }} />
                <span className={styles.tip} style={{ bottom: share(value + failed) }}>
                  <b>{`${HOURS[i]}:00`}</b>
                  <span className={styles.tipRow}>
                    <i className={styles.swatch} />
                    {t('tipSignups', { count: value })}
                  </span>
                  {failed > 0 && (
                    <span className={styles.tipRow}>
                      <i className={cn(styles.swatch, styles.failedSwatch)} />
                      {t('tipFailed', { count: failed })}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <ol className={styles.hours} aria-hidden>
        {HOURS.map((hour) => (
          <li key={hour}>{`${hour}:00`}</li>
        ))}
      </ol>
    </figure>
  );
}

export function ChatScene() {
  const t = useTranslations('landing.mcpServer.window.chat');
  const tWindow = useTranslations('landing.mcpServer.window');
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.app}>
      <aside className={styles.sidebar} aria-hidden>
        <div className={styles.sideTop}>
          <PathIcon icon={CLAUDE} className={styles.logo} />
          <span className={styles.wordmark}>Claude</span>
        </div>
        <ul className={styles.nav}>
          {NAV.map(({ key, icon: Icon }) => (
            <li key={key}>
              <Icon className={styles.navIcon} />
              {t(`nav.${key}`)}
            </li>
          ))}
        </ul>
        <p className={styles.recents}>
          {t('recents')}
          <ChevronDown className='size-3' />
        </p>
        <ul className={styles.chats}>
          {CHATS.map((chat, i) => (
            <li key={chat} data-active={i === 0 || undefined}>
              {t(`chats.${chat}`)}
            </li>
          ))}
          <li className={styles.viewAll}>{t('viewAll')}</li>
        </ul>
        <div className={styles.account}>
          <span className={styles.avatar}>A</span>
          <span className={styles.accountName}>Acme</span>
          <span className={styles.accountPlan}>· {t('plan')}</span>
          <ChevronDown className='size-3 opacity-60' />
          <Settings className={styles.cog} />
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <span className={styles.title}>
            {t('chats.drop')}
            <ChevronDown className='size-3.5 opacity-60' aria-hidden />
          </span>
          <SquarePen className={styles.headerIcon} aria-hidden />
        </header>

        <div className={styles.thread}>
          <p className={cn(styles.user, replayIn)} style={at(CUE.user)}>
            <span className='sr-only'>{tWindow('you')}: </span>
            {t('question')}
          </p>

          <p className='sr-only'>Claude:</p>
          <div className={cn(styles.toolUse, replayIn)} style={at(CUE.tools)}>
            <button
              type='button'
              className={styles.toolHead}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              <span className={styles.toolMark}>
                <BrandMark className='size-3' />
              </span>
              {/* the client's own UI labels stay English in every locale */}
              <span className={styles.toolLabel} lang='en'>
                {t('tools')}
              </span>
              <span className={styles.toolNames}>
                {CALLS.map(({ tool }, i) => (
                  <span key={tool} className={replayIn} style={at(CUE.call + i * 0.35)}>
                    {i > 0 && ' · '}
                    {tool}
                  </span>
                ))}
              </span>
              <ChevronRight className={styles.toolChevron} aria-hidden />
            </button>
            {open && (
              <ol className={styles.calls}>
                {CALLS.map(({ tool, args }) => (
                  <li key={tool}>
                    <span className={styles.callName}>{tool}</span>
                    <span className={styles.callArgs}>{args.join('\n')}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className={styles.answer}>
            <p className={replayIn} style={at(CUE.lead)}>
              {t('lead')}
            </p>
            <SignupChart />
            <ul className={styles.points}>
              {(['a', 'b', 'c'] as const).map((point, i) => (
                <li key={point} className={replayIn} style={at(CUE.points + i * 0.15)}>
                  {t(`points.${point}`)}
                </li>
              ))}
            </ul>
            <p className={cn(styles.close, replayIn)} style={at(CUE.close)}>
              {t('close')}
            </p>
          </div>
        </div>

        <div className={styles.composerWrap} aria-hidden>
          <div className={styles.composer}>
            <p className={styles.placeholder}>{t('reply')}</p>
            <div className={styles.composerRow}>
              <Plus className={styles.composerIcon} />
              <span className={styles.connector}>
                <BrandMark className='size-3' />
                {t('connector')}
              </span>
              <Mic className={styles.mic} />
            </div>
          </div>
          <p className={styles.model}>
            <b>{t('model')}</b> {t('effort')}
          </p>
        </div>
      </div>
    </div>
  );
}
