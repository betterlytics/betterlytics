import {
  ArrowDownToLine,
  ArrowUp,
  AtSign,
  Bell,
  ChevronDown,
  ChevronRight,
  Clock,
  Ellipsis,
  FolderOpen,
  GitBranch,
  GitPullRequest,
  House,
  Library,
  Mic,
  PanelRight,
  Plus,
  Search,
  ShieldCheck,
  SquarePen,
  SquareStack,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BrandMark } from '@/landing/components/ui/brandMark';
import { cn } from '@/landing/lib/cn';
import styles from './codexScene.module.css';

const RAIL = [House, SquareStack, Clock, Library, AtSign, Ellipsis];

const PROJECT_CHATS = ['deploy', 'pricing', 'retry'] as const;
const RECENTS = ['deploy', 'pricing', 'retry', 'recap', 'checkout'] as const;

/* Tool names stay literal, as the app prints them. */
const CALLS = [
  { tool: 'betterlytics.list_monitors', result: 'monitors' },
  { tool: 'betterlytics.list_monitor_incidents', result: 'incidents' },
  { tool: 'betterlytics.list_errors', result: 'errors' },
  { tool: 'betterlytics.query', result: 'traffic' },
] as const;

export function CodexScene() {
  const t = useTranslations('landing.mcpServer.window.codex');
  return (
    <div className={styles.app}>
      <nav className={styles.rail} aria-hidden>
        {RAIL.map((Icon, i) => (
          <span key={i} className={cn(styles.railButton, i === 0 && styles.railActive)}>
            <Icon className='size-4' />
          </span>
        ))}
        <i className={styles.railRule} />
        <span className={styles.railButton}>
          <GitPullRequest className='size-4' />
        </span>
        <span className={styles.railBottom}>
          <span className={styles.download}>
            <ArrowDownToLine className='size-3.5' />
          </span>
          <span className={styles.avatar}>A</span>
        </span>
      </nav>

      <aside className={styles.sidebar} aria-hidden>
        <div className={styles.sideHead}>
          <span className={styles.appName}>
            Codex
            <ChevronDown className='size-3.5 opacity-70' />
          </span>
          <span className={styles.sideActions}>
            <Bell className='size-3.5' />
            <Search className='size-3.5' />
          </span>
        </div>
        <p className={styles.newChat}>
          <SquarePen className='size-3.5' />
          {t('newChat')}
        </p>
        <p className={styles.label}>{t('projects')}</p>
        <p className={styles.project}>
          <FolderOpen className='size-3.5' />
          acme-shop
        </p>
        <ul className={styles.projectChats}>
          {PROJECT_CHATS.map((chat, i) => (
            <li key={chat} data-active={i === 0 || undefined}>
              {t(`chats.${chat}`)}
            </li>
          ))}
          <li className={styles.more}>{t('showMore')}</li>
        </ul>
        <p className={styles.label}>{t('recents')}</p>
        <ul className={styles.recents}>
          {RECENTS.map((chat) => (
            <li key={chat}>{t(`chats.${chat}`)}</li>
          ))}
        </ul>
      </aside>

      <section className={styles.main}>
        <div className={styles.topbar} aria-hidden>
          <PanelRight className='size-4' />
        </div>

        <div className={styles.thread}>
          <p className={styles.user}>{t('question')}</p>
          <p className={styles.text}>{t('say')}</p>
          <ul className={styles.calls}>
            {CALLS.map(({ tool, result }) => (
              <li key={tool} className={styles.call}>
                <span className={styles.callHead}>
                  <BrandMark className={styles.callMark} />
                  <span className={styles.called}>{t('called')}</span>
                  <span className={styles.tool}>{tool}</span>
                  <ChevronRight className={styles.callChevron} aria-hidden />
                </span>
                <span className={styles.result}>{t(result)}</span>
              </li>
            ))}
          </ul>
          <p className={styles.text}>{t('answer')}</p>
          <p className={styles.worked} aria-hidden>
            {t('worked')}
          </p>
        </div>

        <div className={styles.composer} aria-hidden>
          <div className={styles.context}>
            <span className={styles.contextItem}>
              <FolderOpen className='size-3.5' />
              acme-shop
            </span>
            <span className={styles.contextItem}>
              <GitBranch className='size-3.5' />
              main
            </span>
          </div>
          <div className={styles.input}>
            <p className={styles.placeholder}>{t('placeholder')}</p>
            <div className={styles.inputRow}>
              <Plus className={styles.inputIcon} />
              <span className={styles.approve}>
                <ShieldCheck className='size-3.5' />
                {t('approve')}
              </span>
              <span className={styles.model}>
                <b>6 Luna</b> {t('effort')}
                <ChevronDown className='size-3.5 opacity-70' />
              </span>
              <Mic className={styles.inputIcon} />
              <span className={styles.send}>
                <ArrowUp className='size-4' strokeWidth={2.5} />
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
