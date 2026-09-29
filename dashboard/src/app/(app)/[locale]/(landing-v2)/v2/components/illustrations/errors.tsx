'use client';

import type { CSSProperties, ReactNode } from 'react';
import { AlertTriangle, Eye, MousePointerClick } from 'lucide-react';
import Image from 'next/image';
import { DK } from 'country-flag-icons/react/3x2';
import { cn } from '@/lib/utils';
import { vars } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/cssVars';

/* Illustration copy is mock product UI, kept literal on purpose. */

/**
 * A call in the stack, as the product lists it (StacktraceView): the line, then
 * `at fn (file:col)`. Frames outside the app are greyed and carry no badge.
 */
type Frame = { line: number; fn: string; file: string; col: number; lib?: boolean };
type Step = { at: string; label: string };
type Group = {
  type: string;
  message: string;
  /** The session trail up to the throw, as the product records it: the page, then the custom event fired on it. */
  trail: [page: Step, event: Step];
  thrownAt: string;
  /** Top frame first; the product shows three before "show more". */
  frames: Frame[];
};

/** Back to front: resolved, quieter, and the one firing now. */
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

/**
 * Who the firing error hit, as the product lists each occurrence's browser,
 * OS and country: Safari on macOS, in Denmark. The Apple mark is Simple Icons',
 * the one the product draws on dark.
 */
const WHO = (
  <span className='erx__who'>
    <Image src='/browser-icons/safari.svg' alt='Safari' width={13} height={13} />
    <svg viewBox='0 0 24 24' role='img' aria-label='macOS'>
      <path
        d='M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701'
        fill='currentColor'
      />
    </svg>
    <DK title='Denmark' />
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

/**
 * One error group as the product shows it: what it is and how often or whether
 * it still fires, then its session trail running down, as the product draws it
 * (SessionTrail): the page, the custom event, then the throw. The throw's row
 * doubles as the header of its stack trace (StacktraceView), whose frames hang
 * under it in one box.
 */
function Card({
  group,
  icon,
  side,
  className,
  style,
}: {
  group: Group;
  icon: ReactNode;
  side: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const [page, event] = group.trail;
  return (
    <div className={cn('erx__card', className)} style={style}>
      <div className='erx__hd'>
        <span className='erx__ic'>{icon}</span>
        <span className='erx__tx'>
          <b>{group.type}</b>
          <span>{group.message}</span>
        </span>
        <span className='erx__n'>{side}</span>
      </div>

      <div className='erx__tl'>
        <div className='erx__step erx__step--pv' style={vars({ '--i': 0 })}>
          <s>{page.at}</s>
          <i>
            <Eye aria-hidden />
          </i>
          <span>{page.label}</span>
        </div>
        <div className='erx__step erx__step--ev' style={vars({ '--i': 1 })}>
          <s>{event.at}</s>
          <i>
            <MousePointerClick aria-hidden />
          </i>
          <span>{event.label}</span>
        </div>

        <div className='erx__box' style={vars({ '--i': 2 })}>
          <div className='erx__step erx__step--er'>
            <s>{group.thrownAt}</s>
            <i>
              <AlertTriangle aria-hidden />
            </i>
            <span>
              <b>{group.type}</b> {group.message}
            </span>
          </div>
          <ol className='erx__tr'>
            {group.frames.map((f) => (
              <li key={f.fn} className={cn(f.lib && 'lib')}>
                <s>{f.line}</s>
                <span>
                  at <b>{f.fn}</b> ({f.file}:{f.col})
                </span>
                {!f.lib && <i>in app</i>}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/**
 * Three error groups stacked on a diagonal, the one firing now in front: a
 * quieter one and a resolved one behind it, whole cards though mostly covered.
 * Still once it has landed; the only motion is the entrance.
 */
export function Errors() {
  return (
    <div className='erx'>
      <div className='erx__stk'>
        <Card
          group={RESOLVED}
          icon={CHECK_ICON}
          className='erx__card--back ok'
          style={vars({ '--k': 2, '--d': '.05s' })}
          side={
            <>
              <span>Resolved</span>
              <small>in v2.14.0</small>
            </>
          }
        />
        <Card
          group={QUIETER}
          icon={WARN_ICON}
          className='erx__card--back'
          style={vars({ '--k': 1, '--d': '.15s' })}
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
          icon={WARN_ICON}
          className='erx__card--front'
          style={vars({ '--k': 0, '--d': '.25s' })}
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
