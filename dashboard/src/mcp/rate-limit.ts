import { createSlidingWindowLimiter } from '@/lib/rate-limit';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

export const checkRateLimit = createSlidingWindowLimiter(WINDOW_MS, MAX_REQUESTS);
