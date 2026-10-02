import type { CSSProperties, ReactNode } from 'react';
import { AlertTriangle, Eye, MousePointerClick, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { COPY } from '@/landing/content/copy';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import styles from './errors.module.css';
import type { IllustrationProps } from './types';
import { FLAGS } from './flags';

/* Illustration copy is mock product UI, kept literal on purpose. */

type Frame = { line: number; fn: string; file: string; col: number; lib?: boolean };
type Step = { at: string; label: string };
type Group = {
  type: string;
  message: string;
  trail: [page: Step, event: Step];
  thrownAt: string;
  /** Top frame first; three, as the product shows before "show more". */
  frames: Frame[];
};

const RESOLVED: Group = {
  type: 'TypeError',
  message: 'Failed to fetch',
  trail: [
    { at: '09:41:05', label: '/contact' },
    { at: '09:41:52', label: 'contact_submitted' },
  ],
  thrownAt: '09:41:53',
  frames: [
    { line: 31, fn: 'sendMessage', file: 'contact.ts', col: 9 },
    { line: 24, fn: 'onSubmit', file: 'ContactForm.tsx', col: 5 },
    { line: 4164, fn: 'dispatchEvent', file: 'react-dom.js', col: 14, lib: true },
  ],
};
const QUIETER: Group = {
  type: 'ReferenceError',
  message: 'stripe is not defined',
  trail: [
    { at: '08:58:10', label: '/checkout' },
    { at: '08:58:44', label: 'pay_clicked' },
  ],
  thrownAt: '08:58:45',
  frames: [
    { line: 87, fn: 'mountCardForm', file: 'checkout.ts', col: 16 },
    { line: 52, fn: 'onPayClick', file: 'checkout.ts', col: 3 },
    { line: 4164, fn: 'dispatchEvent', file: 'react-dom.js', col: 14, lib: true },
  ],
};
const FIRING: Group = {
  type: 'TypeError',
  message: "Cannot read properties of null (reading 'plan')",
  trail: [
    { at: '12:04:02', label: '/pricing' },
    { at: '12:04:18', label: 'plan_selected' },
  ],
  thrownAt: '12:04:19',
  frames: [
    { line: 142, fn: 'selectPlan', file: 'pricing.tsx', col: 19 },
    { line: 61, fn: 'onClick', file: 'PlanCard.tsx', col: 7 },
    { line: 4164, fn: 'callCallback', file: 'react-dom.js', col: 14, lib: true },
  ],
};

/** The Apple mark is Simple Icons', as the product draws it on dark. */
const WHO = (
  <span className='inline-flex h-[15px] items-center gap-1.5 text-fg'>
    <Image src='/browser-icons/safari.svg' alt='Safari' width={13} height={13} />
    {/* larger box and a half-pixel lift so the Apple mark optically matches Safari's round logo */}
    <svg className='-my-px size-[15px] -translate-y-[0.5px]' viewBox='0 0 24 24' role='img' aria-label='macOS'>
      <path
        d='M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701'
        fill='currentColor'
      />
    </svg>
    {/* 3:2 at 9px tall, to weigh the same as the logos */}
    <FLAGS.DK className='h-[9px] w-[13.5px] rounded-[1.5px] ring-1 ring-white/8' title='Denmark' />
  </span>
);

const WARN_ICON = (
  <svg viewBox='0 0 20 20' fill='none' aria-hidden>
    <path
      d='M8.6 3.4 2.5 14a1.6 1.6 0 0 0 1.4 2.4h12.2a1.6 1.6 0 0 0 1.4-2.4L11.4 3.4a1.6 1.6 0 0 0-2.8 0Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinejoin='round'
    />
    <path d='M10 7.6v3.6' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' />
    <circle cx='10' cy='13.6' r='0.95' fill='currentColor' />
  </svg>
);

const CHECK_ICON = (
  <svg viewBox='0 0 20 20' fill='none' aria-hidden>
    <path
      d='m5.5 10.4 3 3 6-6.6'
      stroke='currentColor'
      strokeWidth='1.7'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

function TrailStep({
  kind,
  at,
  icon: Icon,
  style,
  children,
}: {
  kind: 'page' | 'event' | 'thrown';
  at: string;
  icon: LucideIcon;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className={cn(styles.step, styles[kind])} style={style}>
      <time className='text-micro font-normal text-muted tabular-nums'>
        {at.slice(0, 5)}
        <span className='max-sm:hidden'>{at.slice(5)}</span>
      </time>
      <span className={styles.glyph}>
        <Icon aria-hidden />
      </span>
      <span className='truncate'>{children}</span>
    </div>
  );
}

/** Mirrors the product's SessionTrail and StacktraceView. */
function Card({
  group,
  depth,
  resolved = false,
  side,
  className,
}: {
  group: Group;
  /** 0 is the front card. */
  depth: number;
  resolved?: boolean;
  side: ReactNode;
  className?: string;
}) {
  const [page, event] = group.trail;
  return (
    <div
      className={cn(styles.card, depth === 0 ? styles.front : styles.back, className)}
      data-resolved={resolved || undefined}
      style={vars({ '--depth': depth })}
    >
      <div className='grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-[13px] px-[18px] pt-[15px] pb-3.5'>
        <span className={styles.icon}>{resolved ? CHECK_ICON : WARN_ICON}</span>
        <span className='min-w-0'>
          <b className={styles.type}>{group.type}</b>
          <span className='block truncate text-[13.5px] tracking-[-0.15px] text-fg'>{group.message}</span>
        </span>
        <span className={styles.side}>{side}</span>
      </div>

      <div className={styles.trail}>
        <TrailStep kind='page' at={page.at} icon={Eye} style={vars({ '--stagger': 0 })}>
          {page.label}
        </TrailStep>
        <TrailStep kind='event' at={event.at} icon={MousePointerClick} style={vars({ '--stagger': 1 })}>
          {event.label}
        </TrailStep>

        <div className='overflow-hidden rounded-lg border border-fg/8' style={vars({ '--stagger': 2 })}>
          <TrailStep kind='thrown' at={group.thrownAt} icon={AlertTriangle}>
            <b>{group.type}</b> {group.message}
          </TrailStep>
          <ol className='font-mono text-[11.5px] leading-normal'>
            {group.frames.map((frame) => (
              <li key={frame.fn} className={styles.frame} data-lib={frame.lib || undefined}>
                <span className='tabular-nums opacity-60'>{frame.line}</span>
                <span className={styles.call}>
                  at <b className={styles.fn}>{frame.fn}</b> ({frame.file}:{frame.col})
                </span>
                {!frame.lib && (
                  <span className='rounded-[5px] border border-fg/10 bg-fg/6 px-[7px] py-px font-sans text-[10px]'>
                    in app
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export function Errors({ entered }: IllustrationProps) {
  return (
    <div
      className={cn(styles.root, 'absolute inset-0 grid place-items-center')}
      data-in={entered || undefined}
      role='img'
      aria-label={COPY.illustrations.errors}
    >
      <div className={styles.stack} aria-hidden>
        <Card
          group={RESOLVED}
          depth={2}
          resolved
          side={
            <>
              <span>Resolved</span>
              <small>in v2.14.0</small>
            </>
          }
        />
        <Card
          group={QUIETER}
          depth={1}
          className={styles.quieter}
          side={
            <>
              <span>
                84<small>events</small>
              </span>
              <small>3h ago</small>
            </>
          }
        />
        <Card
          group={FIRING}
          depth={0}
          side={
            <>
              <span>
                1,206<small>events</small>
              </span>
              {WHO}
            </>
          }
        />
      </div>
    </div>
  );
}
