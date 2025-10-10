'use client';

import { useState, useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export const PLAYBACK_SPEEDS = [2, 1.75, 1.5, 1.25, 1, 0.75, 0.5, 0.25] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

export function PlaybackSpeedDropdown({
  speed,
  onChange,
}: {
  speed: PlaybackSpeed;
  onChange: (speed: PlaybackSpeed) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const expandContainerVariant: Variants = {
    open: { clipPath: 'circle(1000px at 50% 50%)', transition: { type: 'spring', stiffness: 20, restDelta: 2 } },
    closed: {
      clipPath: 'circle(30px at 50% 50%)',
      transition: { type: 'spring', stiffness: 400, damping: 40, delay: 0.1 },
    },
  };

  const staggerItemsVariant: Variants = {
    open: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
    closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
  };

  const slideInItemsVariant: Variants = {
    open: { y: 0, opacity: 1 },
    closed: { y: 20, opacity: 0 },
  };

  return (
    <DropdownMenu modal={false} onOpenChange={(open) => setIsOpen(open)}>
      <DropdownMenuTrigger className='bg-secondary cursor-pointer rounded-md px-2 py-1 text-sm'>
        Speed: x{speed}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        asChild
        align='start'
        side='top'
        usePortal={false}
        className='w-auto min-w-0 overflow-hidden rounded-md p-1'
      >
        <motion.div
          ref={containerRef}
          initial='closed'
          animate={isOpen ? 'open' : 'closed'}
          variants={expandContainerVariant}
          className='bg-secondary rounded-md p-2'
        >
          <motion.ul variants={staggerItemsVariant} className='flex flex-col gap-1'>
            {PLAYBACK_SPEEDS.map((s) => (
              <motion.li
                key={s}
                variants={slideInItemsVariant}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
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
