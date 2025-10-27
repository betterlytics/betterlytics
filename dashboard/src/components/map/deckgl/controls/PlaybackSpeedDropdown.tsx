'use client';

import { useState, useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from 'next-intl';
import { MotionText } from '@/components/animation/MotionText';
import { cn } from '@/lib/utils';

export const PLAYBACK_SPEEDS = [2, 1.75, 1.5, 1.25, 1, 0.75, 0.5, 0.25] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

export function PlaybackSpeedDropdown({
  speed,
  onChange,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  speed: PlaybackSpeed;
  onChange: (speed: PlaybackSpeed) => void;
  open?: boolean; // (optional controlled)
  onOpenChange?: (open: boolean) => void; // (optional controlled)
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [blockHover, setBlockHover] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const unblockRef = useRef<number | null>(null);

  const t = useTranslations('components.geography.playback.speed');

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen! : uncontrolledOpen;

  const handleOpenChange = (open: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(open);
    } else {
      setUncontrolledOpen(open);
    }

    if (unblockRef.current) {
      clearTimeout(unblockRef.current);
      unblockRef.current = null;
    }
    if (open) {
      setBlockHover(true);
      unblockRef.current = window.setTimeout(() => setBlockHover(false), 750);
    } else {
      setBlockHover(false);
    }
  };

  const expandContainerVariant: Variants = {
    open: { clipPath: 'circle(1000px at 50% 50%)', transition: { type: 'spring', stiffness: 20, restDelta: 2 } },
    closed: {
      clipPath: 'circle(30px at 50% 50%)',
      transition: { type: 'spring', stiffness: 400, damping: 40, delay: 0.05 },
    },
  };

  const staggerItemsVariant: Variants = {
    open: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
    closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
  };

  const slideInItemsVariant: Variants = {
    open: { y: 0, opacity: 1 },
    closed: { y: 20, opacity: 0 },
  };

  return (
    <DropdownMenu modal={false} open={isOpen} onOpenChange={handleOpenChange}>
      <motion.div whileTap={{ scale: 0.9 }} transition={{ type: 'spring', stiffness: 400, damping: 40 }}>
        <DropdownMenuTrigger
          title={t('tooltip')}
          className={cn(
            'flex flex-col px-3 py-1.5 text-sm',
            'bg-secondary hover:bg-accent cursor-pointer rounded-md',
            'border-border border shadow-sm',
          )}
        >
          <span className='font-mono text-xs font-light'>{t('label')}</span>
          <MotionText text={`x${speed}`} className='mx-auto gap-0 font-medium' />
        </DropdownMenuTrigger>
      </motion.div>

      <DropdownMenuContent
        asChild
        align='center'
        side='top'
        usePortal={false}
        className='w-auto min-w-0 overflow-hidden rounded-md p-1'
      >
        <motion.div
          ref={containerRef}
          initial='closed'
          animate={isOpen ? 'open' : 'closed'}
          variants={expandContainerVariant}
          className='bg-secondary relative rounded-md p-2'
          onAnimationComplete={() => {
            if (isOpen) setBlockHover(false);
          }}
        >
          {blockHover && (
            <div
              className='absolute inset-0 z-10'
              style={{ pointerEvents: 'auto', background: 'transparent' }}
              aria-hidden
            />
          )}

          <motion.ul variants={staggerItemsVariant} className='flex flex-col gap-1'>
            {PLAYBACK_SPEEDS.map((s) => (
              <motion.li
                key={s}
                variants={slideInItemsVariant}
                whileHover={{ scale: 1.125 }}
                whileTap={{ scale: 0.95 }}
                className='px-1'
              >
                <DropdownMenuItem onClick={() => onChange(s)} className='cursor-pointer rounded px-3 py-1'>
                  x{s}
                </DropdownMenuItem>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
