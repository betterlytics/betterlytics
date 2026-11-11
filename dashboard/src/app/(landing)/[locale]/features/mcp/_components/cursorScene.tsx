import { useState, type ReactNode } from 'react';
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
import { cn } from '@/landing/lib/cn';
import styles from './cursorScene.module.css';
import { at, replayIn } from './replay';

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

/* Tool calls stay literal, one argument per line, as the client prints them. */
const STEPS = [
  { verb: 'thought', object: '3s' },
  { verb: 'called', object: 'list_errors', args: ['filters: [url = "/pricing"]', 'timeRange: "7d"'] },
  { verb: 'called', object: 'get_error', args: ['fingerprint: "a91f2c…e07"', 'includeBreadcrumbs: true'] },
  { verb: 'read', object: 'pricing.js' },
] as const;

/** Replay cues in seconds; the steps tick in 350ms apart from `steps`. */
const CUE = { user: 0.2, steps: 0.6, file: 2.05, fix: 2.1, reply: 2.35, worked: 2.75 };

const code = (chunks: ReactNode) => <code className={styles.inlineCode}>{chunks}</code>;

function Step({
  verb,
  object,
  args,
  cue,
}: {
  verb: string;
  object: string;
  args?: readonly string[];
  cue: number;
}) {
  const [open, setOpen] = useState(false);
  // the client's own UI labels stay English in every locale
  const label = (
    <>
      <span lang='en'>{verb}</span> <span className={styles.stepObject}>{object}</span>
    </>
  );
  if (!args) {
    return (
      <p className={cn(styles.step, replayIn)} style={at(cue)}>
        {label}
      </p>
    );
  }
  return (
    <div className={replayIn} style={at(cue)}>
      <button
        type='button'
        className={cn(styles.step, styles.stepButton)}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
        <ChevronRight className={styles.stepChevron} aria-hidden />
      </button>
      {open && <p className={styles.stepArgs}>{args.join('\n')}</p>}
    </div>
  );
}

export function CursorScene() {
  const t = useTranslations('landing.mcpServer.window.cursor');
  const tWindow = useTranslations('landing.mcpServer.window');
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
          <p className={cn(styles.userMsg, replayIn)} style={at(CUE.user)}>
            <span className='sr-only'>{tWindow('you')}: </span>
            {t('question')}
          </p>
          <p className='sr-only'>Cursor:</p>
          <div className={styles.steps}>
            {STEPS.map((step, i) => (
              <Step
                key={step.object}
                verb={t(step.verb)}
                object={step.object}
                args={'args' in step ? step.args : undefined}
                cue={CUE.steps + i * 0.35}
              />
            ))}
          </div>
          <p className={cn(styles.fileChip, replayIn)} style={at(CUE.file)}>
            <FileText className='size-3.5' aria-hidden />
            pricing.js <span className={styles.added}>+1</span>
          </p>
          <p className={cn(styles.agentReply, replayIn)} style={at(CUE.reply)}>
            {t.rich('answer', { c: code })}
          </p>
          <p className={cn(styles.step, replayIn)} style={at(CUE.worked)} lang='en'>
            {t('worked')}
          </p>
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
          <span className={cn(styles.reviewActions, replayIn)} style={at(CUE.fix)}>
            <span className={styles.undo}>{t('undo')}</span>
            <span className={styles.keep}>{t('keep')}</span>
          </span>
        </div>
        <pre className={styles.code}>
          {lines.map((line, i) => {
            const number = FIRST_LINE + i;
            return (
              <span
                key={number}
                className={styles.line}
                data-added={number === ADDED || undefined}
                style={number === ADDED ? at(CUE.fix) : undefined}
              >
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
