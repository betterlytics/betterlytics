'use client';

import { useCallback, useId, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { BrandMark } from '@/landing/components/ui/brandMark';
import { PathIcon } from '@/landing/components/ui/pathIcon';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';
import { SETUP_CLIENTS } from './clients';
import { CopyButton } from './copyButton';
import styles from './toolMap.module.css';

const GROUPS = [
  {
    key: 'analytics',
    tools: [
      'describe',
      'query',
      'query_sessions',
      'user_journeys',
      'funnel_preview',
      'list_funnels',
      'list_global_properties',
    ],
  },
  { key: 'errors', tools: ['list_errors', 'get_error'] },
  { key: 'uptime', tools: ['list_monitors', 'list_monitor_incidents'] },
  { key: 'status', tools: ['list_status_pages', 'list_incident_suggestions'] },
] as const;

type Tool = (typeof GROUPS)[number]['tools'][number];

const RANGE = ['timeRange', 'timezone'];

/** Input names from each tool's schema in src/mcp; `timeRange` also takes `startDate` and `endDate`. */
const INPUTS: Record<Tool, string[]> = {
  describe: [],
  query: ['metrics', 'dimensions', 'filters', 'granularity', 'orderBy', 'order', 'limit', ...RANGE],
  query_sessions: ['metrics', 'dimensions', 'filters', 'granularity', 'orderBy', 'order', 'limit', ...RANGE],
  user_journeys: ['filters', 'maxSteps', 'limit', ...RANGE],
  funnel_preview: ['steps', 'isStrict', ...RANGE],
  list_funnels: RANGE,
  list_global_properties: ['key', ...RANGE],
  list_errors: ['filters', 'search', 'fingerprint', 'limit', ...RANGE],
  get_error: ['fingerprint', 'occurrenceOffset', 'includeBreadcrumbs'],
  list_monitors: RANGE,
  list_monitor_incidents: ['monitorId', 'state', 'limit', ...RANGE],
  list_status_pages: ['statusPageId'],
  list_incident_suggestions: ['statusPageId'],
};

const GROUP_OF = Object.fromEntries(GROUPS.flatMap((group, g) => group.tools.map((tool) => [tool, g]))) as Record<
  Tool,
  number
>;

type Wire = { d: string; group: number | null };
type Geometry = { width: number; height: number; wires: Wire[]; ends: { x: number; y: number }[] };

/** Rounded elbow from a vertical trunk into a card's left edge. */
function elbow(x1: number, y1: number, x2: number, y2: number, r = 10) {
  if (y2 - y1 < r * 2) return `M${x1},${y1} V${y2} H${x2}`;
  return `M${x1},${y1} V${y2 - r} Q${x1},${y2} ${x1 + r},${y2} H${x2}`;
}

function useGeometry(
  container: RefObject<HTMLDivElement | null>,
  agent: RefObject<HTMLDivElement | null>,
  server: RefObject<HTMLDivElement | null>,
  cards: RefObject<(HTMLDivElement | null)[]>,
) {
  const [geometry, setGeometry] = useState<Geometry | null>(null);

  const measure = useCallback(() => {
    const box = container.current?.getBoundingClientRect();
    const a = agent.current?.getBoundingClientRect();
    const s = server.current?.getBoundingClientRect();
    if (!box || !a || !s) return;
    const at = (x: number, y: number) => ({ x: Math.round(x - box.left) + 0.5, y: Math.round(y - box.top) + 0.5 });
    const rects = cards.current.map((card) => card?.getBoundingClientRect()).filter((r): r is DOMRect => !!r);
    const wires: Wire[] = [];
    const ends: { x: number; y: number }[] = [];

    if (s.left > a.right) {
      const from = at(a.right, a.top + a.height / 2);
      const to = at(s.left, s.top + s.height / 2);
      wires.push({ d: `M${from.x},${from.y} H${to.x}`, group: null });
      ends.push(from, to);
      const out = at(s.right, s.top + s.height / 2);
      ends.push(out);
      rects.forEach((r, g) => {
        const end = at(r.left, r.top + Math.min(r.height / 2, 30));
        const dx = (end.x - out.x) * 0.55;
        wires.push({
          d: `M${out.x},${out.y} C${out.x + dx},${out.y} ${end.x - dx},${end.y} ${end.x},${end.y}`,
          group: g,
        });
        ends.push(end);
      });
    } else {
      const trunk = at(s.left + 22, 0).x;
      const from = at(trunk, a.bottom);
      const to = at(trunk, s.top);
      wires.push({ d: `M${from.x},${from.y} V${to.y}`, group: null });
      ends.push(from, to);
      const out = at(trunk, s.bottom);
      ends.push(out);
      rects.forEach((r, g) => {
        const end = at(r.left, r.top + 26);
        wires.push({ d: elbow(out.x, out.y, end.x, end.y), group: g });
        ends.push(end);
      });
    }
    setGeometry({ width: box.width, height: box.height, wires, ends });
  }, [container, agent, server, cards]);

  useLayoutEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    for (const el of [container.current, agent.current, server.current, ...cards.current]) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [measure, container, agent, server, cards]);

  return geometry;
}

export function ToolMap() {
  const t = useTranslations('landing.mcpServer.tools');
  const [selected, setSelected] = useState<Tool>('query');
  const container = useRef<HTMLDivElement>(null);
  const agent = useRef<HTMLDivElement>(null);
  const server = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const geometry = useGeometry(container, agent, server, cards);
  const seen = useInView(container, 'read');
  const detailId = useId();
  const group = GROUP_OF[selected];

  const select = (tool: Tool) => {
    if (tool === selected) return;
    setSelected(tool);
  };

  const svgProps = geometry && {
    width: geometry.width,
    height: geometry.height,
    viewBox: `0 0 ${geometry.width} ${geometry.height}`,
    'aria-hidden': true,
  };
  const ask = t(`items.${selected}.ask`);

  return (
    <div className={styles.map}>
      <div ref={container} className={styles.diagram} data-seen={seen || undefined}>
        {svgProps && (
          <svg className={styles.wires} {...svgProps}>
            {geometry.wires.map((wire, i) => (
              <path key={i} d={wire.d} pathLength={1} className={styles.wire} />
            ))}
            {geometry.wires.map((wire, i) => (
              <path
                key={`lit-${i}`}
                d={wire.d}
                pathLength={1}
                className={styles.litWire}
                data-lit={wire.group === null || wire.group === group || undefined}
              />
            ))}
          </svg>
        )}
        {svgProps && (
          <svg className={styles.nodes} {...svgProps}>
            {geometry.ends.map((end, i) => (
              <rect
                key={i}
                x={end.x - 3.5}
                y={end.y - 3.5}
                width={7}
                height={7}
                rx={1.5}
                className={styles.node}
              />
            ))}
          </svg>
        )}

        <div ref={agent} className={cn(styles.card, styles.agent)}>
          <div className={styles.clients} aria-label={t('agentBody')} role='img'>
            {SETUP_CLIENTS.map((client) => (
              <PathIcon key={client.name} icon={client.icon} className='size-3.5' />
            ))}
          </div>
          <p className={cn(styles.cardTitle, styles.agentTitle)}>{t('agent')}</p>
          <p key={selected} className={styles.question}>
            <span className={styles.prompt} aria-hidden>
              &gt;
            </span>
            {ask}
          </p>
          <CopyButton text={ask} label={t('copy')} done={t('copied')} iconOnly className={styles.copy} />
        </div>

        <div ref={server} className={cn(styles.card, styles.server)}>
          <BrandMark className={styles.serverMark} />
          <p className={styles.cardTitle}>{t('server')}</p>
          <p className={styles.endpoint}>betterlytics.io/api/mcp</p>
        </div>

        <div className={styles.groups}>
          {GROUPS.map((entry, g) => (
            <div
              key={entry.key}
              ref={(el) => {
                cards.current[g] = el;
              }}
              className={styles.group}
              data-lit={g === group || undefined}
            >
              <p className={styles.groupTitle}>{t(`groups.${entry.key}`)}</p>
              <ul className={styles.tools}>
                {entry.tools.map((tool) => (
                  <li key={tool}>
                    <button
                      type='button'
                      className={styles.tool}
                      aria-pressed={tool === selected}
                      aria-controls={detailId}
                      onClick={() => select(tool)}
                    >
                      {tool}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div id={detailId} className={styles.detail} aria-live='polite'>
        <div className={styles.detailMain}>
          <p className={styles.detailName}>
            <span>{selected}</span>
            <span className={styles.detailGroup}>{t(`groups.${GROUPS[group].key}`)}</span>
          </p>
          <p className={styles.detailBody}>{t(`items.${selected}.body`)}</p>
        </div>
        <div className={styles.inputs}>
          <p className={styles.inputsLabel}>{t('inputs')}</p>
          {INPUTS[selected].length > 0 ? (
            <p className={styles.inputList}>
              {INPUTS[selected].map((input) => (
                <code key={input}>{input}</code>
              ))}
            </p>
          ) : (
            <p className={styles.noInputs}>{t('noInputs')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
