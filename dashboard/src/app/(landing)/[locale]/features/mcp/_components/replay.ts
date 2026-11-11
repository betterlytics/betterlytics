import { vars } from '@/landing/lib/cssVars';
import styles from './replay.module.css';

/** Entrance class for a line of a scene's replay. */
export const replayIn = styles.in;

/** When a line enters, in seconds from the scene's start. */
export const at = (seconds: number) => vars({ '--at': `${seconds}s` });
