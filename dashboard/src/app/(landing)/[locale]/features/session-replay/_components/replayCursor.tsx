'use client';

import { type Dispatch, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { LiftSwap } from '@/landing/components/ui/liftSwap';
import { IDS } from '@/landing/lib/ids';
import { maskText } from './checkoutMock';
import styles from './replayCursor.module.css';

type Pill = 'input' | 'drag' | 'click' | 'selection' | 'pageview' | 'paused';
type Box = { left: number; top: number; right: number; bottom: number; width: number; height: number };
type Point = { x: number; y: number };
type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type Actor = {
  el: HTMLElement;
  pointer: SVGSVGElement;
  ripples: HTMLElement;
  marks: HTMLElement;
  pos: Point;
  offset: Point;
  angle: number;
  aim: number;
  moving: boolean;
  bend: number;
  /** px/ms, unequal so the two drift in and out of step */
  speed: number;
  ripple: number;
  say: Dispatch<Pill | null>;
};

/** the landing lg breakpoint, below which the CSS hides the layer */
const WIDE = '(width >= 56.25rem)';
const ZONE = ['#privacy', '#controls', '#setup'];
/** the drawn arrow points up and to the left */
const NATURAL = (-3 * Math.PI) / 4;
const FACING: Record<Corner, number> = {
  'top-left': Math.PI / 4,
  'top-right': (3 * Math.PI) / 4,
  'bottom-left': -Math.PI / 4,
  'bottom-right': NATURAL,
};
/** radians from the tip to the pill at rest: below, a little right */
const PILL_BEARING = 1.27;
const REPEL_PX = 100;
const CHAR_MS = 45;
const TYPE_MS = 230;
const CODE_TYPE_MS = 140;
const POSTCODE = '1620';
/** keyed by the quote each snippet's /admin/** string opens with */
const URL_ADDED: Record<string, { typed: string; suffix: string }> = {
  '"': { typed: ',/billing/**', suffix: '"' },
  "'": { typed: ", '/billing/**'", suffix: '' },
};
const SAMPLES = [5, 20];
const ROUTES = 3;

const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
const linear = (k: number) => k;
const turn = (from: number, to: number) => {
  let d = to - from;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
};

class Aborted extends Error {}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new Aborted());
    const onAbort = () => {
      clearTimeout(id);
      reject(new Aborted());
    };
    const id = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function tween(ms: number, signal: AbortSignal, frame: Dispatch<number>, ease = easeInOut) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new Aborted());
    const start = performance.now();
    let raf = 0;
    const onAbort = () => {
      cancelAnimationFrame(raf);
      reject(new Aborted());
    };
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / ms);
      frame(ease(k));
      if (k < 1) {
        raf = requestAnimationFrame(step);
      } else {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }
    };
    raf = requestAnimationFrame(step);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

const textIn = (el: Element | null) =>
  Array.from(el?.childNodes ?? []).find((node): node is Text => node instanceof Text && !!node.data.trim());

export function ReplayCursor() {
  const t = useTranslations('landing.replay.cursor');
  const reduce = useReducedMotion();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [wide, setWide] = useState(false);
  const [pills, setPills] = useState<(Pill | null)[]>([null, null]);
  const cursorEls = useRef<(HTMLDivElement | null)[]>([]);
  const pointerEls = useRef<(SVGSVGElement | null)[]>([]);
  const rippleEls = useRef<(HTMLSpanElement | null)[]>([]);
  const markEls = useRef<(HTMLDivElement | null)[]>([]);
  const typedRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const haloRef = useRef<HTMLSpanElement>(null);

  useEffect(() => setHost(document.getElementById(IDS.main)), []);

  useEffect(() => {
    const query = window.matchMedia(WIDE);
    const onChange = () => setWide(query.matches);
    onChange();
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const typed = typedRef.current;
    const caret = caretRef.current;
    const halo = haloRef.current;
    const parts = [0, 1].map((i) => ({
      el: cursorEls.current[i],
      pointer: pointerEls.current[i],
      ripples: rippleEls.current[i],
      marks: markEls.current[i],
    }));
    if (!host || reduce || !wide || !typed || !caret || !halo) return;
    if (parts.some((part) => !part.el || !part.pointer || !part.ripples || !part.marks)) return;

    const find = (selector: string) => host.querySelector<HTMLElement>(selector);
    const actors: Actor[] = parts.map((part, i) => ({
      el: part.el!,
      pointer: part.pointer!,
      ripples: part.ripples!,
      marks: part.marks!,
      pos: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
      angle: NATURAL,
      aim: NATURAL,
      moving: false,
      bend: 1,
      speed: i === 0 ? 0.5 : 0.42,
      ripple: 0,
      say: (pill) =>
        setPills((current) => {
          const next = [...current];
          next[i] = pill;
          return next;
        }),
    }));
    const [owner, shopper] = actors;
    const controller = new AbortController();
    const { signal } = controller;

    const box = (target: Element | Range): Box => {
      const r = target.getBoundingClientRect();
      const o = host.getBoundingClientRect();
      return {
        left: r.left - o.left,
        top: r.top - o.top,
        right: r.right - o.left,
        bottom: r.bottom - o.top,
        width: r.width,
        height: r.height,
      };
    };
    const place = (target: HTMLElement, b: Pick<Box, 'left' | 'top'> & Partial<Box>) => {
      target.style.left = `${b.left}px`;
      target.style.top = `${b.top}px`;
      if (b.width !== undefined) target.style.width = `${b.width}px`;
      if (b.height !== undefined) target.style.height = `${b.height}px`;
    };
    const lastChar = (node: Text, from = 1) => {
      const r = document.createRange();
      r.setStart(node, Math.max(0, node.length - from));
      r.setEnd(node, node.length - from + 1);
      return box(r);
    };

    let raf = 0;
    const tick = () => {
      for (const [me, other] of [
        [owner, shopper],
        [shopper, owner],
      ]) {
        const dx = me.pos.x - other.pos.x;
        const dy = me.pos.y - other.pos.y;
        const d = Math.hypot(dx, dy);
        let px = 0;
        let py = 0;
        if (other.el.dataset.on !== undefined && d < REPEL_PX && d > 0.1) {
          const push = ((REPEL_PX - d) / REPEL_PX) ** 2 * REPEL_PX * 0.5;
          px = (dx / d) * push;
          py = (dy / d) * push;
        }
        me.offset.x += (px - me.offset.x) * 0.12;
        me.offset.y += (py - me.offset.y) * 0.12;
        const x = me.pos.x + me.offset.x;
        me.el.style.transform = `translate3d(${x}px, ${me.pos.y + me.offset.y}px, 0)`;

        me.angle += turn(me.angle, me.aim) * (me.moving ? 0.16 : 0.1);
        me.pointer.style.rotate = `${me.angle - NATURAL}rad`;
        const pill = me.el.querySelector<HTMLElement>('[data-pill]');
        if (pill) {
          const bearing = PILL_BEARING + me.angle - NATURAL;
          const cos = Math.cos(bearing);
          const sin = Math.sin(bearing);
          const w = pill.offsetWidth;
          const h = pill.offsetHeight;
          const reach = 26 + (Math.abs(cos) * w) / 2 + (Math.abs(sin) * h) / 2;
          const ox = Math.min(cos * reach, host.clientWidth - 8 - x - w / 2);
          pill.style.transform = `translate(${ox}px, ${sin * reach}px) translate(-50%, -50%)`;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const onScreen = new Set<Element>();
    let waiters: (() => void)[] = [];
    const gate = () =>
      onScreen.size
        ? Promise.resolve()
        : new Promise<void>((resolve, reject) => {
            const onAbort = () => reject(new Aborted());
            waiters.push(() => {
              signal.removeEventListener('abort', onAbort);
              resolve();
            });
            signal.addEventListener('abort', onAbort, { once: true });
          });
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      if (onScreen.size) {
        waiters.forEach((resolve) => resolve());
        waiters = [];
        if (!raf) raf = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    for (const selector of ZONE) {
      const section = find(selector);
      if (section) observer.observe(section);
    }

    const glide = (actor: Actor, x: number, y: number, near?: () => void) => {
      const from = actor.pos;
      const dx = x - from.x;
      const dy = y - from.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 1) {
        near?.();
        return Promise.resolve();
      }
      actor.bend = -actor.bend;
      const cx = (from.x + x) / 2 - dy * 0.12 * actor.bend;
      const cy = (from.y + y) / 2 + dx * 0.12 * actor.bend;
      const ms = Math.min(2400, Math.max(700, dist / actor.speed));
      let fired = false;
      actor.moving = true;
      return tween(ms, signal, (k) => {
        const u = 1 - k;
        actor.pos = {
          x: u * u * from.x + 2 * u * k * cx + k * k * x,
          y: u * u * from.y + 2 * u * k * cy + k * k * y,
        };
        actor.aim = Math.atan2(u * (cy - from.y) + k * (y - cy), u * (cx - from.x) + k * (x - cx));
        if (!fired && k >= 0.7) {
          fired = true;
          near?.();
        }
      }).finally(() => {
        actor.moving = false;
      });
    };
    const approach = async (actor: Actor, b: Box, corner: Corner, pill: () => Pill, inset = 6) => {
      const tip = {
        x: corner.endsWith('left') ? b.left + inset : b.right - inset,
        y: corner.startsWith('top') ? b.top + inset : b.bottom - inset,
      };
      await gate();
      await glide(actor, tip.x, tip.y, () => actor.say(pill()));
      actor.aim = FACING[corner];
      await sleep(400, signal);
    };
    const click = (actor: Actor) => {
      const ring = actor.ripples.children[actor.ripple++ % actor.ripples.children.length] as HTMLElement;
      ring.removeAttribute('data-on');
      void ring.offsetWidth;
      ring.setAttribute('data-on', '');
    };
    const typeInto = async (at: Box, chars: string, ms: number) => {
      place(typed, { left: at.left, top: at.top, height: at.height });
      typed.textContent = '';
      typed.dataset.on = '';
      for (const char of chars) {
        await sleep(ms, signal);
        typed.textContent += char;
      }
    };
    /** Painted rather than a real selection, so the reader's own selection is left alone. */
    const select = async (actor: Actor, node: Text, from: number, to: number) => {
      const range = document.createRange();
      range.setStart(node, from);
      const paint = (end: number): Point | null => {
        range.setEnd(node, end);
        const o = host.getBoundingClientRect();
        const rects = Array.from(range.getClientRects());
        Array.from(actor.marks.children).forEach((mark, i) => {
          const r = rects[i];
          place(
            mark as HTMLElement,
            r
              ? { left: r.left - o.left, top: r.top - o.top, width: r.width, height: r.height }
              : { left: 0, top: 0, width: 0 },
          );
        });
        const last = rects.at(-1);
        return last ? { x: last.right - o.left, y: last.top - o.top - 1 } : null;
      };
      const firstRange = document.createRange();
      firstRange.setStart(node, from);
      firstRange.setEnd(node, from + 1);
      await approach(actor, box(firstRange), 'top-right', () => 'selection', -1);
      actor.marks.dataset.on = '';
      await tween(
        (to - from) * CHAR_MS,
        signal,
        (k) => {
          const end = paint(from + 1 + Math.round(k * (to - from - 1)));
          if (end) actor.pos = end;
        },
        linear,
      );
    };

    const runOwner = async () => {
      const card = find('#controls [data-cursor-sample]');
      const knob = card?.querySelector('[data-cursor-knob]');
      const track = knob?.parentElement;
      const value = card?.querySelector('[data-cursor-sample-value]');
      const dots = Array.from(card?.querySelectorAll<HTMLElement>('[data-rank]') ?? []);
      const row = find('#controls [data-cursor-path="/checkout"]');
      const pill = row?.querySelector('b');
      const onLabel = find('#controls [data-cursor-path]:not([data-off]) b')?.textContent;
      const offLabel = find('#controls [data-cursor-path][data-off] b')?.textContent;
      const edits = Array.from(host.querySelectorAll('#setup code span')).flatMap((token) => {
        const text = token.textContent ?? '';
        const spec = /^["']\/admin/.test(text) ? URL_ADDED[text[0]] : undefined;
        if (!spec) return [];
        // an earlier run may have left the path added
        const added = text.endsWith(spec.typed + spec.suffix) ? spec.typed : '';
        return [{ ...spec, token, base: text.slice(0, text.length - spec.suffix.length - added.length), added }];
      });
      const consent = textIn(find('#setup [data-cursor-consent]'));
      if (
        !card ||
        !knob ||
        !track ||
        !value ||
        !row ||
        !pill ||
        !onLabel ||
        !offLabel ||
        !edits.length ||
        !consent
      )
        return;

      const setSample = (v: number) => {
        card.style.setProperty('--sample', String(v));
        value.textContent = `${Math.round(v)}%`;
        const lit = Math.round((v / 100) * dots.length);
        for (const dot of dots) dot.toggleAttribute('data-lit', Number(dot.dataset.rank) < lit);
      };
      const setCode = (edit: (typeof edits)[number], next: string) => {
        edit.added = next;
        edit.token.textContent = `${edit.base}${next}${edit.suffix}`;
        const text = edit.token.firstChild;
        if (!(text instanceof Text) || text.length < 2) return;
        const typedEnd = lastChar(text, edit.suffix.length + 1);
        place(caret, { left: typedEnd.right, top: typedEnd.top, height: typedEnd.height });
        const end = lastChar(text);
        owner.pos = { x: end.right, y: end.top };
      };

      await gate();
      await sleep(1200, signal);
      const first = box(track);
      owner.pos = { x: first.right + 60, y: first.bottom + 80 };
      owner.el.dataset.on = '';

      for (;;) {
        const from = parseFloat(card.style.getPropertyValue('--sample')) || SAMPLES[0];
        const to = from < SAMPLES[1] ? SAMPLES[1] : SAMPLES[0];
        await approach(owner, box(knob), 'top-right', () => 'drag');
        const b = box(track);
        const xAt = (v: number) => b.left + (v / 100) * b.width;
        const grip = owner.pos.y;
        await tween(1400, signal, (k) => {
          const v = from + (to - from) * k;
          setSample(v);
          owner.pos = { x: xAt(v), y: grip };
        });
        await sleep(2400, signal);

        await approach(owner, box(pill), 'top-right', () => 'click');
        click(owner);
        const off = !row.hasAttribute('data-off');
        row.toggleAttribute('data-off', off);
        pill.textContent = off ? offLabel : onLabel;
        await sleep(2400, signal);

        // the consent snippet has no path to add
        const edit = edits.find(({ token }) => token.closest('code[data-active]'));
        if (edit) {
          const text = edit.token.firstChild;
          if (text instanceof Text) await approach(owner, lastChar(text), 'top-right', () => 'input', 0);
          click(owner);
          setCode(edit, edit.added);
          caret.dataset.on = '';
          const target = edit.added ? '' : edit.typed;
          try {
            while (edit.added !== target && edit.token.closest('code[data-active]')) {
              await sleep(edit.added.length < target.length ? CODE_TYPE_MS : 70, signal);
              setCode(edit, target ? target.slice(0, edit.added.length + 1) : edit.added.slice(0, -1));
            }
          } finally {
            // never leave the copyable snippet half-typed
            setCode(edit, target);
          }
          delete caret.dataset.on;
          await sleep(2400, signal);
        }

        const sentence = consent.data.indexOf('.') + 1 || consent.data.length;
        await select(owner, consent, 0, sentence);
        await sleep(2600, signal);
        delete owner.marks.dataset.on;
      }
    };

    const runShopper = async () => {
      const postcode = find('#privacy [data-cursor-target="postcode"]');
      const pay = find('#privacy [data-cursor-target="pay"]');
      const row = find('#controls [data-cursor-path="/checkout"]');
      const promise = textIn(find('#privacy [data-cursor-promise]'));
      const url = find('#controls [data-cursor-url]');
      const routeText = url?.querySelector('[data-cursor-route]');
      const views = Array.from(host.querySelectorAll<HTMLElement>('#controls [data-cursor-view]'));
      if (!postcode || !pay || !row || !promise || !url || !routeText) return;
      let route = Number(url.dataset.route ?? 0);

      await gate();
      await sleep(4200, signal);
      const first = box(postcode);
      shopper.pos = { x: first.right + 80, y: first.bottom + 70 };
      shopper.el.dataset.on = '';

      for (;;) {
        const f = box(postcode);
        await approach(shopper, f, 'top-left', () => 'input');
        click(shopper);
        await typeInto({ ...f, left: f.left + 10 }, maskText(POSTCODE), TYPE_MS);
        await sleep(2600, signal);

        let paused = false;
        const p = box(pay);
        await approach(shopper, p, 'top-right', () => {
          paused = row.hasAttribute('data-off');
          return paused ? 'paused' : 'click';
        });
        delete typed.dataset.on;
        click(shopper);
        if (paused) {
          place(halo, { left: p.left - 6, top: p.top - 6, width: p.width + 12, height: p.height + 12 });
          halo.dataset.on = '';
          await sleep(3400, signal);
          delete halo.dataset.on;
        } else {
          await sleep(2400, signal);
        }

        await select(shopper, promise, 0, promise.data.trimEnd().length);
        await sleep(2600, signal);
        delete shopper.marks.dataset.on;

        await approach(shopper, box(routeText), 'top-right', () => 'pageview', 2);
        click(shopper);
        route = (route + 1) % ROUTES;
        url.dataset.route = String(route);
        views.forEach((view, i) => view.toggleAttribute('data-current', i === route));
        await sleep(2600, signal);
      }
    };

    for (const run of [runOwner, runShopper]) {
      run().catch((error) => {
        if (!(error instanceof Aborted)) throw error;
      });
    }

    return () => {
      controller.abort();
      observer.disconnect();
      cancelAnimationFrame(raf);
      for (const actor of actors) {
        delete actor.el.dataset.on;
        delete actor.marks.dataset.on;
        actor.say(null);
      }
      for (const overlay of [typed, caret, halo]) delete overlay.dataset.on;
    };
  }, [host, reduce, wide]);

  if (!host) return null;
  return createPortal(
    <div className={styles.layer} aria-hidden data-nosnippet>
      {[0, 1].map((i) => (
        <div
          key={i}
          ref={(el) => {
            markEls.current[i] = el;
          }}
          className={styles.marks}
        >
          <i />
          <i />
          <i />
          <i />
        </div>
      ))}
      <span ref={typedRef} className={styles.typed} />
      <span ref={caretRef} className={styles.caret} />
      <span ref={haloRef} className={styles.halo} />
      {[0, 1].map((i) => {
        const pill = pills[i];
        return (
          <div
            key={i}
            ref={(el) => {
              cursorEls.current[i] = el;
            }}
            className={styles.cursor}
          >
            <span
              ref={(el) => {
                rippleEls.current[i] = el;
              }}
            >
              <i className={styles.ripple} />
              <i className={styles.ripple} />
            </span>
            <svg
              ref={(el) => {
                pointerEls.current[i] = el;
              }}
              viewBox='0 0 24 24'
              className={styles.pointer}
            >
              <path d='M3.56 4.36Q3 3 4.36 3.56L18.64 9.44Q20 10 18.95 10.45L13.84 12.64Q13 13 12.64 13.84L10.45 18.95Q10 20 9.44 18.64Z' />
            </svg>
            {pill && (
              <span className={styles.tag} data-pill=''>
                <LiftSwap as='span' className='block' id={pill}>
                  {t(pill)}
                  {pill === 'paused' && (
                    <span className={styles.dots}>
                      <i>.</i>
                      <i>.</i>
                      <i>.</i>
                    </span>
                  )}
                </LiftSwap>
              </span>
            )}
          </div>
        );
      })}
    </div>,
    host,
  );
}
