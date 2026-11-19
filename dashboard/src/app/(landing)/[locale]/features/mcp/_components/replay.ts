import { vars } from '@/landing/lib/cssVars';
import styles from './replay.module.css';

export const replayIn = styles.in;
export const at = (seconds: number) => vars({ '--at': `${seconds}s` });
