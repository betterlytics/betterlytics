'use client';

import {
  Fragment,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
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
      'list_dashboards',
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

/** Signups, pricing and deploy are also the hero's three sessions. */
const QUESTIONS = [
  { key: 'morning', tools: ['query', 'list_errors', 'list_monitors', 'list_status_pages'] },
  { key: 'launch', tools: ['query', 'query_sessions', 'list_monitors'] },
  { key: 'signups', tools: ['query', 'list_monitor_incidents', 'list_errors'] },
  { key: 'pricing', tools: ['list_errors', 'get_error'] },
  { key: 'deploy', tools: ['list_monitors', 'list_monitor_incidents', 'list_errors', 'query'] },
  { key: 'outage', tools: ['list_monitor_incidents', 'query', 'list_incident_suggestions'] },
] as const satisfies readonly { key: string; tools: readonly Tool[] }[];

type Choice = Tool | (typeof QUESTIONS)[number]['key'];

const GROUP_OF = Object.fromEntries(GROUPS.flatMap((group, g) => group.tools.map((tool) => [tool, g]))) as Record<
  Tool,
  number
>;

const isTool = (choice: Choice): choice is Tool => choice in GROUP_OF;

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
      const trunk = s.left + 22;
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
  const [choice, setChoice] = useState<Choice>('query');
  const container = useRef<HTMLDivElement>(null);
  const agent = useRef<HTMLDivElement>(null);
  const server = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const geometry = useGeometry(container, agent, server, cards);
  const seen = useInView(container, 'draw');
  const cue = useInView(agent, 'read');
  const menuId = useId();
  const pointerPick = useRef(false);
  const [picked, setPicked] = useState(false);
  const pick = (next: Choice) => {
    setChoice(next);
    setPicked(true);
  };

  const tools: readonly Tool[] = isTool(choice)
    ? [choice]
    : QUESTIONS.find((entry) => entry.key === choice)!.tools;
  const lit = [...new Set(tools.map((tool) => GROUP_OF[tool]))].sort((a, b) => a - b);
  const ask = isTool(choice) ? t(`asks.${choice}`) : t(`questions.${choice}`);
  const sections = [
    {
      key: 'featured',
      label: t('featured'),
      items: QUESTIONS.map((entry) => ({ value: entry.key as Choice, text: t(`questions.${entry.key}`) })),
    },
    ...GROUPS.map((group) => ({
      key: group.key,
      label: t(`groups.${group.key}`),
      items: group.tools.map((tool) => ({ value: tool as Choice, text: t(`asks.${tool}`) })),
    })),
  ];

  const svgProps = geometry && {
    width: geometry.width,
    height: geometry.height,
    viewBox: `0 0 ${geometry.width} ${geometry.height}`,
    'aria-hidden': true,
  };

  return (
    <div ref={container} className={styles.diagram} data-seen={seen || undefined}>
      {svgProps && (
        <svg className={styles.wires} {...svgProps}>
          {geometry.wires.map((wire, i) => (
            <path key={i} d={wire.d} pathLength={1} className={styles.wire} />
          ))}
          {geometry.wires.map((wire, i) => {
            const order = wire.group === null ? 0 : lit.indexOf(wire.group);
            return (
              <path
                key={`lit-${i}`}
                d={wire.d}
                pathLength={1}
                className={styles.litWire}
                data-lit={order >= 0 || undefined}
                style={{ '--order': Math.max(order, 0) } as CSSProperties}
              />
            );
          })}
        </svg>
      )}
      {svgProps && (
        <svg className={styles.nodes} {...svgProps}>
          {geometry.ends.map((end, i) => (
            <rect key={i} x={end.x - 3.5} y={end.y - 3.5} width={7} height={7} rx={1.5} className={styles.node} />
          ))}
        </svg>
      )}

      <div ref={agent} className={cn(styles.card, styles.agent)} data-cue={cue || undefined}>
        <div className={styles.clients} aria-label={t('agentBody')} role='img'>
          {SETUP_CLIENTS.map((client) => (
            <PathIcon key={client.name} icon={client.icon} className='size-3.5' />
          ))}
        </div>
        <p className={cn(styles.cardTitle, styles.agentTitle)}>{t('agent')}</p>
        <CopyButton text={ask} label={t('copy')} done={t('copied')} iconOnly className={styles.copy} />
        <DropdownMenu.Root modal={false}>
          <DropdownMenu.Trigger className={styles.question}>
            <span className={styles.prompt} aria-hidden>
              &gt;
            </span>
            <span key={ask} className={styles.ask}>
              <span className='sr-only'>{t('pick')}: </span>
              {ask}
            </span>
            <ChevronDown className={styles.chevron} aria-hidden />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className={styles.menu}
              align='start'
              sideOffset={6}
              collisionPadding={16}
              onCloseAutoFocus={(event) => {
                /* refocusing the trigger after a mouse pick makes Chrome draw the keyboard focus ring */
                if (pointerPick.current) event.preventDefault();
                pointerPick.current = false;
              }}
            >
              {sections.map((section, s) => (
                <Fragment key={section.key}>
                  {s > 0 && <DropdownMenu.Separator className={styles.menuRule} />}
                  <DropdownMenu.Label id={`${menuId}-${section.key}`} className={styles.menuLabel}>
                    {section.label}
                  </DropdownMenu.Label>
                  <DropdownMenu.RadioGroup
                    aria-labelledby={`${menuId}-${section.key}`}
                    value={choice}
                    onValueChange={(value) => pick(value as Choice)}
                  >
                    {section.items.map((item) => (
                      <DropdownMenu.RadioItem
                        key={item.value}
                        value={item.value}
                        className={styles.menuItem}
                        onPointerUp={() => {
                          pointerPick.current = true;
                        }}
                      >
                        {item.text}
                        <DropdownMenu.ItemIndicator className={styles.menuCheck}>
                          <Check className='size-3.5' aria-hidden />
                        </DropdownMenu.ItemIndicator>
                      </DropdownMenu.RadioItem>
                    ))}
                  </DropdownMenu.RadioGroup>
                </Fragment>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        {/* empty until a pick, or a screen reader hears the question twice */}
        <p className='sr-only' aria-live='polite'>
          {picked && ask}
        </p>
        {/* the menu only renders while open, so search engines get its questions from this copy */}
        <div hidden>
          {sections.map((section) => (
            <Fragment key={section.key}>
              <p>{section.label}</p>
              <ul>
                {section.items.map((item) => (
                  <li key={item.value}>{item.text}</li>
                ))}
              </ul>
            </Fragment>
          ))}
        </div>
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
            data-lit={lit.includes(g) || undefined}
          >
            <p className={styles.groupTitle}>{t(`groups.${entry.key}`)}</p>
            <ul className={styles.tools}>
              {entry.tools.map((tool) => (
                <li key={tool}>
                  <button
                    type='button'
                    className={styles.tool}
                    aria-pressed={tools.includes(tool)}
                    onClick={() => pick(tool)}
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
  );
}
