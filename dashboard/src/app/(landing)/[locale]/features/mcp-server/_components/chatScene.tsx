import {
  Briefcase,
  ChevronDown,
  ChevronRight,
  Clock,
  FolderClosed,
  Mic,
  PanelLeft,
  Plus,
  Search,
  Settings,
  Shapes,
  SquarePen,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BrandMark } from '@/landing/components/ui/brandMark';
import styles from './chatScene.module.css';

/* Mock data, deliberately untranslated: signups per hour from 10:00, with the outage in the 14:00 bar. */
const HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18];
const SIGNUPS = [22, 19, 23, 20, 3, 19, 22, 18, 21];
const OUTAGE = 4;
const CHART = { width: 520, height: 132, top: 30, bar: 30, gap: 26, max: 25 };

const CHATS = ['drop', 'recap', 'pricing', 'friday'] as const;

const NAV = [
  { key: 'newChat', icon: Plus },
  { key: 'search', icon: Search },
  { key: 'projects', icon: FolderClosed },
  { key: 'artifacts', icon: Shapes },
  { key: 'scheduled', icon: Clock },
  { key: 'customize', icon: Briefcase },
] as const;

function SignupChart({ outage }: { outage: string }) {
  const { width, height, top, bar, gap, max } = CHART;
  const left = (width - HOURS.length * bar - (HOURS.length - 1) * gap) / 2;
  const x = (i: number) => left + i * (bar + gap);
  const base = height - 20;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg} aria-hidden>
      <rect x={x(OUTAGE) - 9} y={top - 6} width={bar + 18} height={base - top + 6} className={styles.outageBand} />
      <text x={x(OUTAGE) + bar / 2} y={top - 12} textAnchor='middle' className={styles.outageLabel}>
        {outage}
      </text>
      {SIGNUPS.map((value, i) => {
        const h = Math.max(2, (value / max) * (base - top));
        return (
          <rect
            key={HOURS[i]}
            x={x(i)}
            y={base - h}
            width={bar}
            height={h}
            rx={3}
            className={i === OUTAGE ? styles.dipBar : styles.bar}
          />
        );
      })}
      <line x1={left - 10} x2={width - left + 10} y1={base + 0.5} y2={base + 0.5} className={styles.axis} />
      {HOURS.map((hour, i) => (
        <text key={hour} x={x(i) + bar / 2} y={height - 4} textAnchor='middle' className={styles.tick}>
          {`${hour}:00`}
        </text>
      ))}
    </svg>
  );
}

export function ChatScene() {
  const t = useTranslations('landing.mcpServer.window.chat');
  return (
    <div className={styles.app}>
      <aside className={styles.sidebar} aria-hidden>
        <div className={styles.sideTop}>
          <PanelLeft className={styles.sideIcon} />
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
          <p className={styles.user}>{t('question')}</p>

          <div className={styles.toolUse}>
            <span className={styles.toolMark}>
              <BrandMark className='size-3' />
            </span>
            <span className={styles.toolLabel}>{t('tools')}</span>
            <span className={styles.toolNames}>query · list_monitor_incidents · list_errors</span>
            <ChevronRight className={styles.toolChevron} aria-hidden />
          </div>

          <div className={styles.answer}>
            <p>{t('lead')}</p>
            <figure className={styles.chart}>
              <figcaption className={styles.chartTitle}>{t('chartTitle')}</figcaption>
              <SignupChart outage={t('outage')} />
            </figure>
            <ul className={styles.points}>
              <li>{t('points.a')}</li>
              <li>{t('points.b')}</li>
              <li>{t('points.c')}</li>
            </ul>
            <p>{t('close')}</p>
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
