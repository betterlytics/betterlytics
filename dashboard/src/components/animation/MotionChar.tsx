import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

export type Dir = 'up' | 'down' | 'none';

type MotionCharProps = {
  char: string;
  dir: Dir;
  y: number;
  punchy: boolean;
  presenceMode: 'wait' | 'sync';
  initialOnMount: boolean;
  enterTransition: any;
  exitTransition: any;
  className?: string;
};

const MotionCharComponent = function MotionCharComponent({
  char,
  dir,
  y,
  punchy,
  presenceMode,
  initialOnMount,
  enterTransition,
  exitTransition,
  className,
}: MotionCharProps) {
  return (
    <span
      className={cn(
        className,
        'relative inline-block h-[1em] w-[1ch] text-center align-baseline tabular-nums select-none',
      )}
    >
      <AnimatePresence mode={presenceMode} initial={false}>
        <motion.span
          key={char}
          initial={
            initialOnMount ? { opacity: 0.001, y: dir === 'down' ? -y : y, scale: punchy ? 0.96 : 1 } : false
          }
          animate={{ opacity: 1, y: 0, scale: 1, transition: enterTransition }}
          exit={{ opacity: 0, y: dir === 'down' ? y : -y, scale: punchy ? 0.96 : 1, transition: exitTransition }}
          className='absolute inset-0 transform-gpu will-change-transform'
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

const MotionChar = React.memo(MotionCharComponent);
MotionChar.displayName = 'MotionChar';
export default MotionChar;
