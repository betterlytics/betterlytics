import type { ReactNode } from 'react';
import {
  ArrowUp,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  FileText,
  Infinity as InfinityIcon,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import styles from './cursorScene.module.css';

/* Mock source, deliberately untranslated. Line 142 is the agent's fix. */
const FIRST_LINE = 134;
const ADDED = 142;
const SOURCE = `  store.set('plans', plans);
  renderPlans(plans);
}

export function selectPlan(id) {
  const selected = store.get('plans')?.find((plan) => plan.id === id) ?? null;
  highlight(id);

  if (!selected) return;
  setPlan(selected.plan);
}

export function initPricing() {
  for (const card of document.querySelectorAll('[data-plan]')) {
    card.addEventListener('click', () => selectPlan(card.dataset.plan));
  }
  loadPlans();
}`;

const TOKEN =
  /('[^']*')|\b(export|async|function|const|await|return|new|if|for|of|null)\b|(\b\d+\b)|([A-Za-z_$][\w$]*)(?=\()|\.([A-Za-z_$][\w$]*)/g;

function highlight(line: string) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of line.matchAll(TOKEN)) {
    const [whole, string, keyword, number, call, property] = match;
    if (match.index > last) out.push(line.slice(last, match.index));
    if (property) {
      out.push('.');
      out.push(
        <span key={match.index} className={styles.property}>
          {property}
        </span>,
      );
    } else {
      const kind = string ? styles.string : keyword ? styles.keyword : number ? styles.number : styles.call;
      out.push(
        <span key={match.index} className={kind}>
          {string ?? keyword ?? number ?? call}
        </span>,
      );
    }
    last = match.index + whole.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

const AGENTS = [
  { key: 'fix', time: 'now', diff: [1, 0] },
  { key: 'retry', time: '12m', diff: [14, 2] },
  { key: 'alerts', time: '1h', diff: [6, 6] },
  { key: 'recap', time: '3h', diff: null },
] as const;

const code = (chunks: ReactNode) => <code className={styles.inlineCode}>{chunks}</code>;

function Step({ verb, object }: { verb: string; object: string }) {
  return (
    <p className={styles.step}>
      {verb} <span className={styles.stepObject}>{object}</span>
    </p>
  );
}

export function CursorScene() {
  const t = useTranslations('landing.mcpServer.window.cursor');
  const lines = SOURCE.split('\n');
  return (
    <div className={styles.app}>
      <aside className={styles.agents} aria-hidden>
        <p className={styles.groupLabel}>
          {t('review')} <span className={styles.count}>{AGENTS.length}</span>
        </p>
        <ul className={styles.agentList}>
          {AGENTS.map(({ key, time, diff }, i) => (
            <li key={key} className={styles.agent} data-active={i === 0 || undefined}>
              <CircleCheck className={styles.agentIcon} />
              <span className={styles.agentText}>
                <span className={styles.agentTitle}>{t(`agents.${key}.title`)}</span>
                <span className={styles.agentSub}>
                  {diff && (
                    <>
                      <span className={styles.added}>+{diff[0]}</span>{' '}
                      <span className={styles.removed}>−{diff[1]}</span> ·{' '}
                    </>
                  )}
                  {t(`agents.${key}.sub`)}
                </span>
              </span>
              <span className={styles.agentTime}>{time}</span>
            </li>
          ))}
        </ul>
      </aside>

      <section className={styles.chat}>
        <p className={styles.chatTitle} aria-hidden>
          {t('agents.fix.title')}
        </p>
        <div className={styles.messages}>
          <p className={styles.userMsg}>{t('question')}</p>
          <div className={styles.steps}>
            <Step verb={t('thought')} object='3s' />
            <Step verb={t('called')} object='list_errors' />
            <Step verb={t('called')} object='get_error' />
            <Step verb={t('read')} object='pricing.js' />
          </div>
          <p className={styles.fileChip}>
            <FileText className='size-3.5' aria-hidden />
            pricing.js <span className={styles.added}>+1</span>
          </p>
          <p className={styles.agentReply}>{t.rich('answer', { c: code })}</p>
          <p className={styles.step}>{t('worked')}</p>
        </div>
        <div className={styles.composer} aria-hidden>
          <p className={styles.placeholder}>{t('placeholder')}</p>
          <div className={styles.composerRow}>
            <span className={styles.chip}>
              <InfinityIcon className='size-3.5' />
              {t('mode')}
              <ChevronDown className='size-3' />
            </span>
            <span className={styles.model}>
              Opus 5.5
              <ChevronDown className='size-3' />
            </span>
            <span className={styles.send}>
              <ArrowUp className='size-3.5' strokeWidth={2.5} />
            </span>
          </div>
        </div>
      </section>

      <section className={styles.review} aria-hidden>
        <div className={styles.tabs}>
          <span className={styles.tab} data-active>
            pricing.js
            <X className='size-3 opacity-60' />
          </span>
          <span className={styles.tab}>plan-card.js</span>
        </div>
        <div className={styles.reviewBar}>
          <span className={styles.crumbs}>
            src <ChevronRight className='size-3' /> js <ChevronRight className='size-3' /> pricing.js
          </span>
          <span className={styles.reviewActions}>
            <span className={styles.undo}>{t('undo')}</span>
            <span className={styles.keep}>{t('keep')}</span>
          </span>
        </div>
        <pre className={styles.code}>
          {lines.map((line, i) => {
            const number = FIRST_LINE + i;
            return (
              <span key={number} className={styles.line} data-added={number === ADDED || undefined}>
                <span className={styles.gutter}>{number}</span>
                <span className={styles.text}>{highlight(line)}</span>
              </span>
            );
          })}
        </pre>
      </section>
    </div>
  );
}
