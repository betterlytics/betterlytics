export type JobDefinition = {
  name: string;
  schedule?: string;
  retryLimit: number;
  retryBackoff: boolean;
  expireInSeconds: number;
  deadLetter?: string;
  policy?: 'standard' | 'short' | 'singleton' | 'stately' | 'exclusive' | 'key_strict_fifo';
};

export type Job<TData = unknown> = JobDefinition & {
  runOnStart: boolean;
  handler: (data: TData) => Promise<void>;
};
